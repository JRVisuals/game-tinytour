/**
 * Pure state transforms for player-initiated travel actions.
 * Extracted from GameContext.travelAction.
 */
import {
  allCrewBailed,
  applyBurnGasCruiseToCrew,
  applyHitchVibe,
  applyPushThroughToCrew,
  applyRestToCrew,
} from '../crew/meters'
import { appendStory, storyEvent } from '../crew/tourStory'
import { BALANCE } from '../config'
import { setOutcome } from '../outcome/state'
import { afterCrewTick, finalizeCrewCare, maybeEndRunIfAllBailed } from '../run/helpers'
import { arriveAtShakedownHub } from '../shakedown/arrival'
import { patchRunStats } from '../stats'
import {
  consumeFeedback,
  travelFeedback,
} from './eventOutcomes'
import { pushThroughCost } from './legs'
import { rollLegArrivalEvent } from './arrival'
import type { GameState } from '../types'
import type { OutcomeSnapshot } from '../outcome/report'

export type TravelAction =
  | 'rest'
  | 'hitch'
  | 'push_through'
  | 'burn_gas'
  | 'roadside_food'
  | 'roadside_beer'
  | 'roadside_sell_drugs'

export function resolveTravelAction(s: GameState, action: TravelAction): GameState {
  if (!s.travel) return s
  if (allCrewBailed(s.crew)) {
    return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
  }

  let resources = { ...s.resources }
  let runStats = { ...s.runStats }
  let crew = s.crew.map((c) => ({ ...c }))
  const resourcesBefore = { ...s.resources }
  const crewBefore = s.crew.map((c) => ({ ...c }))
  let rngSeed = s.rngSeed + 1
  const TA = BALANCE.travel
  let actionFlavor = 'Road action'

  switch (action) {
    case 'rest':
      crew = applyRestToCrew(crew)
      return finalizeCrewCare(
        { ...s, resources, runStats, crew, rngSeed },
        crew,
        consumeFeedback('rest', 'Crew', rngSeed),
        { resourcesBefore, resourcesAfter: resources, crewBefore, crewAfter: crew },
      )

    case 'hitch':
      runStats = patchRunStats(runStats, { milesTraveled: runStats.milesTraveled + TA.hitch.miles })
      resources = {
        ...resources,
        cash: Math.max(0, resources.cash + TA.hitch.cash),
        beer: resources.beer + (rngSeed % 100 < TA.hitch.beerChancePercent ? 1 : 0),
      }
      crew = applyHitchVibe(crew)
      actionFlavor = 'Hitch'
      break

    case 'push_through': {
      if (s.travel.pendingEvent || s.travel.atRoadside) return s
      const remaining = s.travel.legs.slice(s.travel.currentLegIndex)
      if (remaining.length === 0) return s

      const cost = pushThroughCost(s.travel, resources.hasVehicle)
      if (resources.food < cost.food) {
        return {
          ...s,
          ...setOutcome(
            s,
            travelFeedback('push_through_need_food', rngSeed, { food: cost.food, legs: cost.legs }),
            undefined,
            'error',
          ),
          crewAlert: null,
        }
      }
      if (resources.hasVehicle && resources.gas < cost.gas) {
        return {
          ...s,
          ...setOutcome(
            s,
            travelFeedback('push_through_need_gas', rngSeed, { gas: cost.gas, legs: cost.legs }),
            undefined,
            'error',
          ),
          crewAlert: null,
        }
      }

      resources = { ...resources, food: resources.food - cost.food, gas: resources.gas - cost.gas }
      runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + cost.food })

      let next: GameState = { ...s, resources, runStats, crew, rngSeed }
      for (const leg of remaining) {
        runStats = patchRunStats(next.runStats, {
          milesTraveled: next.runStats.milesTraveled + leg.miles,
        })
        crew = applyPushThroughToCrew(next.crew.map((c) => ({ ...c })))
        next = afterCrewTick({ ...next, runStats, crew, rngSeed: next.rngSeed + 9 }, crew)
        if (next.phase === 'run_recap' || allCrewBailed(next.crew)) return next
        crew = next.crew
        runStats = next.runStats
        resources = next.resources
      }

      const snap: OutcomeSnapshot = { resourcesBefore, resourcesAfter: resources, crewBefore, crewAfter: crew }
      return {
        ...arriveAtShakedownHub({ ...next, resources, runStats, crew, rngSeed: next.rngSeed }, next.rngSeed + 50),
        crewAlert: null,
        ...setOutcome(
          s,
          travelFeedback('push_through_success', next.rngSeed, { legs: cost.legs, miles: cost.miles }),
          snap,
        ),
      }
    }

    case 'burn_gas': {
      if (s.travel.pendingEvent || s.travel.atRoadside) return s
      if (!resources.hasVehicle || resources.gas <= 0) return s
      const remaining = s.travel.legs.slice(s.travel.currentLegIndex)
      if (remaining.length === 0) return s
      const bg = TA.burnGas
      if (resources.gas < bg.gas) return s

      const legsToBurn = Math.min(bg.legsMax, remaining.length)
      let milesBurned = 0
      for (let i = 0; i < legsToBurn; i++) milesBurned += remaining[i]!.miles

      resources = {
        ...resources,
        gas: resources.gas - bg.gas,
        beer: resources.beer + (rngSeed % 100 < bg.beerChancePercent ? 1 : 0),
      }
      runStats = patchRunStats(runStats, { milesTraveled: runStats.milesTraveled + milesBurned })
      crew = applyBurnGasCruiseToCrew(crew)

      const message = travelFeedback('burn_gas_success', rngSeed, { legs: legsToBurn, miles: milesBurned })
      const snap: OutcomeSnapshot = { resourcesBefore, resourcesAfter: resources, crewBefore, crewAfter: crew }
      const newIndex = s.travel.currentLegIndex + legsToBurn
      let next: GameState = {
        ...s,
        resources,
        runStats,
        crew,
        rngSeed,
        crewAlert: null,
        tourStory: appendStory(s.tourStory, storyEvent(rngSeed, 'Cruise control', message)),
      }

      if (newIndex >= s.travel.legs.length) {
        return {
          ...arriveAtShakedownHub({ ...next, resources, runStats, crew, rngSeed }, rngSeed + 50),
          ...setOutcome(s, message, snap),
        }
      }

      next = {
        ...next,
        travel: { ...s.travel, currentLegIndex: newIndex, atRoadside: false, lastEventResult: message },
      }
      return { ...rollLegArrivalEvent(next, rngSeed + 13), ...setOutcome(s, message, snap) }
    }

    case 'roadside_food': {
      const rf = TA.roadsideFood
      if (resources.cash < Math.abs(rf.cash)) return s
      resources = { ...resources, cash: resources.cash + rf.cash, food: resources.food + rf.food }
      runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
      actionFlavor = 'Roadside food'
      break
    }

    case 'roadside_beer': {
      const rb = TA.roadsideBeer
      if (resources.cash < Math.abs(rb.cash)) return s
      resources = { ...resources, cash: resources.cash + rb.cash, beer: resources.beer + rb.beer }
      runStats = patchRunStats(runStats, { beerConsumed: runStats.beerConsumed + 1 })
      actionFlavor = 'Roadside beer'
      break
    }

    case 'roadside_sell_drugs': {
      const rd = TA.roadsideSellDrugs
      if (resources.drugs <= 0) return s
      resources = { ...resources, drugs: resources.drugs + rd.drugs, cash: resources.cash + rd.cash }
      actionFlavor = 'Roadside substance sale'
      break
    }
  }

  return afterCrewTick(
    {
      ...s,
      resources,
      runStats,
      crew,
      rngSeed,
      crewAlert: null,
      ...setOutcome(s, actionFlavor, {
        resourcesBefore,
        resourcesAfter: resources,
        crewBefore,
        crewAfter: crew,
      }),
    },
    crew,
  )
}
