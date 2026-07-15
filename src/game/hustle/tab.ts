import type { GameState } from '../../game/types'
import { isClownJuiceMafia } from '../../game/shakedown/events'

const LOT_HUSTLE_PHASES = new Set<GameState['phase']>([
  'shakedown',
  'location',
  'show',
  'post_show_shakedown',
])

/** On the lot or at a stop — not plain highway driving */
export function isOnLot(state: GameState): boolean {
  return state.tour != null && LOT_HUSTLE_PHASES.has(state.phase)
}

/** Pulled over at a roadside with vendors */
export function isAtRoadsideHustle(state: GameState): boolean {
  return (
    state.phase === 'travel' &&
    !!state.travel?.atRoadside &&
    !!(state.currentMarket && state.currentMarketStock)
  )
}

/** Player can open Hustle tab meaningfully */
export function isHustleContext(state: GameState): boolean {
  return isOnLot(state) || isAtRoadsideHustle(state)
}

export function marketShowTickets(state: GameState): boolean {
  return (
    state.phase === 'shakedown' ||
    state.phase === 'post_show_shakedown' ||
    (state.phase === 'location' && state.currentLocation === 'venue')
  )
}

export function showSetlistBets(state: GameState): boolean {
  return (
    isOnLot(state) &&
    (state.phase === 'shakedown' || state.phase === 'location' || state.phase === 'show')
  )
}

export function hasClownJuiceMafia(state: GameState): boolean {
  return state.phase === 'shakedown' && isClownJuiceMafia(state.shakedownLotEvent)
}

export function canShowHustleMarket(state: GameState): boolean {
  if (!isHustleContext(state)) return false
  return !!(state.currentMarket && state.currentMarketStock)
}

/** Dot on Hustle tab + tab enabled */
export function hustleTabActive(state: GameState): boolean {
  if (!isHustleContext(state)) return false
  if (isAtRoadsideHustle(state)) return true
  return (
    canShowHustleMarket(state) ||
    showSetlistBets(state) ||
    hasClownJuiceMafia(state)
  )
}

export function hustleContextBlurb(state: GameState): string {
  if (!isHustleContext(state)) {
    return 'Nothing to hustle on the highway — reach the lot or pull over.'
  }
  if (state.marketFlavor) return state.marketFlavor
  if (hasClownJuiceMafia(state)) return 'Clown Juice Mafia is doing business in the lot.'
  if (state.phase === 'post_show_shakedown') return 'After-show lot — last chance to flip stash.'
  if (state.phase === 'show' && showSetlistBets(state)) {
    return 'Showtime — lock in setlist bets before doors.'
  }
  if (isAtRoadsideHustle(state)) return 'Roadside stop — quick trades before you roll.'
  if (state.currentLocation === 'venue') return 'Gate prices — tourist trap energy.'
  if (state.phase === 'shakedown') return 'Shakedown vendors — scout and flip.'
  return 'Lot hustle — buy low, sell high.'
}
