import type { GameState } from '../types'
import { playLocationLabel } from './labels'

export function sceneContextBlurb(state: GameState): string {
  if (state.phase === 'travel') {
    if (state.travel?.atRoadside) return 'Pulled over — trade or get back on the road.'
    if (state.travel?.pendingEvent) return 'Road event — pick a move and keep rolling.'
    return 'Highway legs — push on, pull over, or burn gas.'
  }
  if (state.phase === 'shakedown') {
    return 'Lot hub — scout the scene, then head to venue gates.'
  }
  if (state.phase === 'location') {
    if (state.currentLocation === 'venue') {
      return 'Venue gates — last chance to flip stash or grab tickets.'
    }
    return `${playLocationLabel(state)} — wander the stop and burn a turn.`
  }
  if (state.phase === 'show') return 'Inside the venue — showtime.'
  if (state.phase === 'post_show') {
    return 'Post-show wrap — journal the night, then hit after-show shakedown.'
  }
  if (state.phase === 'post_show_shakedown') {
    return 'After-show lot — one more hustle before the next leg.'
  }
  return 'Where you are on tour — move the run forward.'
}
