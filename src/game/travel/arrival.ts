import type { GameState, TravelState } from '../types'
import { maybeRollTravelEvent, type TravelEventContext } from './events'
import { generateTravelLegs } from './legs'

export function buildTravel(origin: string, destination: string, seed: number): TravelState {
  return {
    origin,
    destination,
    legs: generateTravelLegs(seed, origin, destination),
    currentLegIndex: 0,
    pendingEvent: null,
    atRoadside: false,
    lastEventResult: null,
  }
}

export function travelEventContext(s: GameState): TravelEventContext | undefined {
  if (!s.tour) return undefined
  return {
    catalog: s.tour.catalog,
    plannedSetlist: s.tour.stops[s.tour.currentStopIndex]?.plannedSetlist,
    crew: s.crew,
  }
}

/** Roll a road event for the leg you just arrived on */
export function rollLegArrivalEvent(s: GameState, seed: number): GameState {
  if (!s.travel) return s
  const event = maybeRollTravelEvent(seed, travelEventContext(s))
  return {
    ...s,
    rngSeed: seed,
    travel: {
      ...s.travel,
      pendingEvent: event,
      lastEventResult: event ? null : s.travel.lastEventResult,
    },
  }
}

/** New travel segment — leg 0 + arrival roll */
export function beginTravelLegs(
  s: GameState,
  origin: string,
  destination: string,
  seed: number,
): GameState {
  const travel = buildTravel(origin, destination, seed)
  return rollLegArrivalEvent({ ...s, travel }, seed + 7)
}
