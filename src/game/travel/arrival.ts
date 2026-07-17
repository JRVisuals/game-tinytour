import { COPY, pickText } from '../config'
import type { GameState, TravelState } from '../types'
import { maybeRollTravelEvent, type TravelEventContext } from './events'
import { generateTravelLegs } from './legs'

export function buildTravel(
  origin: string,
  destination: string,
  seed: number,
  introFlavor?: string,
): TravelState {
  return {
    origin,
    destination,
    legs: generateTravelLegs(seed, origin, destination),
    currentLegIndex: 0,
    pendingEvent: null,
    atRoadside: false,
    lastEventResult: null,
    introFlavor: introFlavor ?? null,
  }
}

export function pickIntroFlavor(seed: number): string {
  const pool = (COPY.travelLegs as { introFlavors?: string[] }).introFlavors ?? []
  return pickText(pool, seed, 'Beers in the cooler. Van loaded. Let\'s go.')
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

/** New travel segment — leg 0 + arrival roll. Pass introFlavor to skip the event on leg 0. */
export function beginTravelLegs(
  s: GameState,
  origin: string,
  destination: string,
  seed: number,
  introFlavor?: string,
): GameState {
  const travel = buildTravel(origin, destination, seed, introFlavor)
  if (introFlavor) {
    // First leg of the run — show the departure flavor, no road event yet
    return { ...s, travel }
  }
  return rollLegArrivalEvent({ ...s, travel }, seed + 7)
}
