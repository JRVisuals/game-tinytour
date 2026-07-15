import type { GameState } from './types'
import { appendStory, storyLocation } from './crew/tourStory'
import type { MarketContext } from './market'

const PRE_SHOW_PHASES = new Set(['shakedown', 'location'])

export function needsVenueGates(s: GameState): boolean {
  if (!s.tour) return false
  if (s.turnsUntilShow > 0) return false
  if (!PRE_SHOW_PHASES.has(s.phase)) return false
  return !(s.phase === 'location' && s.currentLocation === 'venue')
}

export function goToVenueGates(
  s: GameState,
  applyMarket: (state: GameState, context: MarketContext, seed: number) => GameState,
): GameState {
  const seed = s.rngSeed + 501
  const venue = s.tour?.stops[s.tour.currentStopIndex]?.venue
  let next: GameState = {
    ...s,
    currentLocation: 'venue',
    phase: 'location',
    rngSeed: seed,
    crewAlert: null,
    tourStory: appendStory(
      s.tourStory,
      storyLocation(seed, 'venue', venue),
    ),
  }
  return applyMarket(next, 'venue', seed)
}
