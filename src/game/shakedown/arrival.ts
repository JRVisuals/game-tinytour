import { ensureMarket } from '../marketCache'
import { applyLocationEventOnVisit } from '../location/locationEvents'
import { applyLotShakedownEventEffects, rollLotShakedownEvent } from './events'
import { appendStory, storyEvent } from '../crew/tourStory'
import { BALANCE } from '../config'
import type { GameState } from '../types'

/** Transition to the shakedown lot hub after travel or run start. */
export function arriveAtShakedownHub(s: GameState, seed: number): GameState {
  const rolled = rollLotShakedownEvent(seed + 7)
  const resources = applyLotShakedownEventEffects(s.resources, rolled)
  let next: GameState = {
    ...s,
    phase: 'shakedown',
    currentLocation: 'shakedown',
    turnsUntilShow: BALANCE.travel.turnsUntilShow,
    travel: null,
    marketCopChase: null,
    shakedownLotEvent: rolled,
    spotFindEvent: null,
    usedLocationActions: [],
    resources,
    crewAlert: null,
  }
  next = ensureMarket(next, 'shakedown', seed + 50)
  if (rolled) {
    next = {
      ...next,
      tourStory: appendStory(next.tourStory, storyEvent(seed, rolled.title, rolled.body)),
    }
  }
  return applyLocationEventOnVisit(next, 'shakedown', seed + 19, next.tour?.band.name ?? '')
}
