/**
 * Pure state transform for resolving travel events (pendingEvent).
 * Extracted from GameContext.applyEventEffects.
 */
import {
  applyBadEventVibeToCrew,
  applyBathroomBagTasteToCrew,
  applyPushThroughToWookFluMembers,
  applyRestToCrew,
  infectRandomCrewWithWookFlu,
} from '../crew/meters'
import { appendStory, storyEvent } from '../crew/tourStory'
import { BALANCE } from '../config'
import { outcomeReport } from '../outcome/report'
import { setOutcome } from '../outcome/state'
import { endRun } from '../run/helpers'
import {
  bathroomFindResult,
  pulledOverResult,
  soloEventResult,
  wookFluResult,
} from './eventOutcomes'
import { resolveIntelTrade, type IntelEventKey } from './intelTips'
import { resolvePulledOver } from './pulledOverResolve'
import type { GameState } from '../types'

export function applyEventEffects(
  s: GameState,
  event: NonNullable<GameState['travel']>['pendingEvent'],
  choiceId?: string,
): GameState {
  if (!event) return s
  const resourcesBefore = { ...s.resources }
  const crewBefore = s.crew.map((c) => ({ ...c }))
  let resources = { ...s.resources }
  let runStats = { ...s.runStats }
  let crew = s.crew.map((c) => ({ ...c }))
  let rngSeed = s.rngSeed + 3
  const activeSetlistBets = [...s.activeSetlistBets]
  const FX = BALANCE.eventEffects
  let resultMessage = soloEventResult(event.eventKey, rngSeed)

  switch (event.eventKey) {
    case 'miracle_ticket':
      resources = { ...resources, tickets: resources.tickets + FX.miracle_ticket.tickets }
      break
    case 'flat_tire': {
      const fx = FX.flat_tire
      resources = {
        ...resources,
        cash: Math.max(0, resources.cash + fx.cash),
        gas: resources.hasVehicle ? Math.max(0, resources.gas + fx.gas) : resources.gas,
      }
      crew = applyBadEventVibeToCrew(crew)
      break
    }
    case 'robbed': {
      const fx = FX.robbed
      resources = {
        ...resources,
        cash: Math.max(0, resources.cash + fx.cash),
        drugs: Math.max(0, resources.drugs + fx.drugs),
      }
      crew = applyBadEventVibeToCrew(crew)
      break
    }
    case 'roadside_burger':
      resources = { ...resources, food: resources.food + FX.roadside_burger.food }
      break
    case 'speeding_fine':
      resources = { ...resources, cash: Math.max(0, resources.cash + FX.speeding_fine.cash) }
      crew = applyBadEventVibeToCrew(crew)
      break
    case 'gas_station_deal': {
      const fx = FX.gas_station_deal
      resources = {
        ...resources,
        beer: resources.beer + fx.beer,
        gas: resources.hasVehicle ? resources.gas + fx.gas : resources.gas,
      }
      break
    }
    case 'van_breakdown_minor': {
      const fx = FX.van_breakdown_minor
      resources = {
        ...resources,
        cash: Math.max(0, resources.cash + fx.cash),
        gas: resources.hasVehicle ? Math.max(0, resources.gas + fx.gas) : resources.gas,
      }
      crew = applyBadEventVibeToCrew(crew)
      break
    }
    case 'hitchhiker_intel':
    case 'lot_rumor':
    case 'encore_whisper': {
      const tipSong = event.intelTipSongId
        ? s.tour?.catalog.songs.find((x) => x.id === event.intelTipSongId)
        : undefined
      const resolved = resolveIntelTrade(
        event.eventKey as IntelEventKey,
        choiceId,
        resources,
        tipSong?.title,
        event.intelSlot ?? 'opener',
        rngSeed,
      )
      resources = resolved.resources
      resultMessage = resolved.message
      break
    }
    case 'wook_flu': {
      const infected = infectRandomCrewWithWookFlu(crew, rngSeed)
      crew = infected.crew
      crew = applyBadEventVibeToCrew(crew)
      if (choiceId === 'rest') {
        crew = applyRestToCrew(crew)
        resultMessage = wookFluResult('rest', rngSeed, {
          name: infected.infectedName ?? 'the crew',
          flare: infected.flare,
        })
      } else {
        crew = applyPushThroughToWookFluMembers(crew)
        resultMessage = wookFluResult('push', rngSeed, {
          name: infected.infectedName ?? 'the crew',
          flare: infected.flare,
        })
      }
      break
    }
    case 'pulled_over': {
      const resolved = resolvePulledOver(resources, crew, choiceId, rngSeed)
      resources = resolved.resources
      if (resolved.endRun) {
        return endRun(
          { ...s, resources, runStats, crew, rngSeed },
          'day_job',
          resolved.endRun.message,
        )
      }
      resultMessage = pulledOverResult(choiceId, resolved.outcome, resolved.wasted, rngSeed)
      if (resolved.outcome !== 'clean') crew = applyBadEventVibeToCrew(crew)
      break
    }
    case 'bathroom_find':
      if (choiceId === 'try_it') {
        const bag = FX.bathroom_find.try_it
        const laced = Math.abs(rngSeed) % 100 < bag.lacedChancePercent
        if (laced) {
          return endRun(
            { ...s, resources, runStats, crew, rngSeed },
            'day_job',
            bathroomFindResult(choiceId, true, rngSeed),
          )
        }
        resources = { ...resources, drugs: resources.drugs + bag.drugs }
        crew = applyBathroomBagTasteToCrew(crew)
        resultMessage = bathroomFindResult(choiceId, false, rngSeed)
      } else {
        resultMessage = bathroomFindResult('toss_it', false, rngSeed)
      }
      break
  }

  const reported = outcomeReport(resultMessage, {
    resourcesBefore,
    resourcesAfter: resources,
    crewBefore,
    crewAfter: crew,
  })

  return {
    ...s,
    resources,
    runStats,
    crew,
    rngSeed,
    activeSetlistBets,
    ...setOutcome(s, reported),
    tourStory: appendStory(s.tourStory, storyEvent(rngSeed, event.title, reported)),
    travel: s.travel
      ? { ...s.travel, pendingEvent: null, lastEventResult: reported }
      : null,
  }
}
