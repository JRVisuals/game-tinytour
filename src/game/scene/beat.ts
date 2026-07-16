import { isClownJuiceMafia } from '../shakedown/events'
import type { GameState, SceneLotEvent } from '../types'

export interface SceneBeatView {
  title: string
  body: string
  color?: string
  loot?: string
}

const SHAKEDOWN_QUIET: SceneBeatView = {
  title: 'Quiet lot',
  body: 'Vendors packing, stragglers humming. Scout prices before showtime.',
}

const POST_SHOW_SHAKEDOWN_QUIET: SceneBeatView = {
  title: 'Quiet lot',
  body: 'Vendors packing, stragglers humming. Nothing wild — just space to trade.',
}

/** One world beat for shakedown — lot event beats spot find beats ambient quiet. Clown juice stays in Hustle. */
export function shakedownSceneBeat(state: GameState): SceneBeatView {
  const lot = state.shakedownLotEvent
  if (lot && !isClownJuiceMafia(lot)) {
    return {
      title: lot.title,
      body: lot.body,
      color: isClownJuiceMafia(lot) ? 'grape' : 'teal',
    }
  }
  if (state.spotFindEvent) {
    return {
      title: state.spotFindEvent.title,
      body: state.spotFindEvent.body,
    }
  }
  return SHAKEDOWN_QUIET
}

export function locationSceneBeat(state: GameState): SceneBeatView | null {
  if (!state.spotFindEvent) return null
  return {
    title: state.spotFindEvent.title,
    body: state.spotFindEvent.body,
  }
}

export function postShowShakedownSceneBeat(event: SceneLotEvent | null): SceneBeatView {
  if (!event) return POST_SHOW_SHAKEDOWN_QUIET
  return {
    title: event.title,
    body: event.body,
    loot: event.loot,
  }
}
