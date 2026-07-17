/**
 * Pure state-transform helpers for run lifecycle and crew tick.
 * Extracted from GameContext to keep it thin.
 */
import { dayJobStipend, liquidateResources } from '../crew/economy'
import { updateCrewRep } from '../crew/rep'
import {
  activeCrew,
  allCrewBailed,
  collectCrewWarnings,
  isWookFluDeath,
  tickCrewMeters,
} from '../crew/meters'
import { appendStory, storyGoHome, storyTourEnd } from '../crew/tourStory'
import { setOutcome } from '../outcome/state'
import { wookFluDeathMessage } from '../travel/eventOutcomes'
import type { CrewMember, GameState, OutcomeTone, SavedCrew } from '../types'
import type { OutcomeSnapshot } from '../outcome/report'

export type RunOutcome = 'completed' | 'day_job' | 'shuffle'

export function crewLabel(saved: SavedCrew | null, crew: CrewMember[]): string {
  if (saved?.members.length) return saved.members.map((m) => m.name).join(', ')
  return crew.map((c) => c.name).join(', ')
}

export function endRun(s: GameState, outcome: RunOutcome, message: string): GameState {
  let savedCrew = s.savedCrew
  let dayJobStipendOffer: number | null = null

  if (savedCrew) {
    if (outcome === 'day_job') {
      savedCrew = updateCrewRep(
        { ...savedCrew, hasVehicle: savedCrew.hasVehicle },
        s.runStats,
        s.runBetsWon,
        0,
        'day_job',
        false,
      )
      dayJobStipendOffer = dayJobStipend(s.crew.length)
    } else {
      const bankAfter = liquidateResources(s.resources)
      savedCrew = updateCrewRep(
        { ...savedCrew, hasVehicle: s.resources.hasVehicle || savedCrew.hasVehicle },
        s.runStats,
        s.runBetsWon,
        bankAfter,
        outcome,
        outcome === 'completed',
      )
    }
  }

  let tourStory = s.tourStory
  if (outcome === 'shuffle') {
    tourStory = appendStory(tourStory, storyGoHome(s.rngSeed))
  } else if (outcome === 'completed' && s.tour) {
    const stop = s.tour.stops[s.tour.stops.length - 1]
    tourStory = appendStory(
      tourStory,
      storyTourEnd(s.rngSeed, {
        city: stop?.city ?? 'the last town',
        venue: stop?.venue ?? 'the final room',
        band: s.tour.band.name,
        crew: crewLabel(savedCrew, s.crew),
      }),
    )
  }

  return {
    ...s,
    savedCrew,
    tourStory,
    phase: outcome === 'day_job' ? 'day_job' : 'run_recap',
    runRecapMessage: message,
    dayJobStipend: dayJobStipendOffer,
    tour: null,
    travel: null,
    currentMarket: null,
    marketContext: null,
    currentMarketStock: null,
    marketFlavor: null,
  }
}

export function afterCrewTick(s: GameState, crew: CrewMember[], extraRecap = ''): GameState {
  const tickSeed = s.rngSeed + 7
  const { crew: ticked, bailMessages, warnings, spreadMessages, neglectMessages } = tickCrewMeters(
    crew,
    tickSeed,
  )
  const alertParts = [...neglectMessages, ...spreadMessages, ...bailMessages, ...warnings]
  let next: GameState = {
    ...s,
    crew: ticked,
    rngSeed: tickSeed,
    crewAlert: alertParts.length > 0 ? alertParts.join(' ') : null,
  }
  if (bailMessages.length) {
    next = {
      ...next,
      postShowRecap: [next.postShowRecap, ...bailMessages].filter(Boolean).join(' '),
    }
  }
  if (activeCrew(ticked).length === 0 && ticked.length > 0) {
    if (isWookFluDeath(ticked)) {
      return endRun(next, 'day_job', wookFluDeathMessage())
    }
    return endRun(
      next,
      'shuffle',
      `${bailMessages.join(' ')}${extraRecap ? ` ${extraRecap}` : ''} Everyone shuffled on home.`,
    )
  }
  return next
}

export function maybeEndRunIfAllBailed(s: GameState, message: string): GameState {
  if (!allCrewBailed(s.crew)) return s
  if (isWookFluDeath(s.crew)) return endRun(s, 'day_job', wookFluDeathMessage())
  return endRun(s, 'shuffle', message)
}

export function finalizeCrewCare(
  s: GameState,
  crew: CrewMember[],
  flavor: string,
  snap?: OutcomeSnapshot,
  tone?: OutcomeTone,
): GameState {
  const warnings = collectCrewWarnings(crew)
  const next: GameState = {
    ...s,
    crew,
    crewAlert: warnings.length > 0 ? warnings.join(' ') : null,
    ...setOutcome(s, flavor, snap, tone),
  }
  return maybeEndRunIfAllBailed(next, next.crewAlert ?? 'Everyone shuffled on home.')
}
