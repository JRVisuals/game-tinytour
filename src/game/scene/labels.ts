import { ROADSIDE_LABELS } from '../travel/legs'
import type { GameState } from '../types'

/** Human label for Scene / Hustle tab titles */
export function playLocationLabel(state: GameState): string {
  if (state.phase === 'travel' && state.travel) {
    if (state.travel.atRoadside) {
      const leg = state.travel.legs[state.travel.currentLegIndex]
      if (leg?.roadside) return ROADSIDE_LABELS[leg.roadside]
      return 'Roadside'
    }
    if (state.travel.pendingEvent) return 'Road event'
    return 'The road'
  }
  if (state.phase === 'post_show') return 'Post-show'
  if (state.phase === 'post_show_shakedown') return 'Post-show lot'
  if (state.phase === 'show') return 'The show'
  if (state.phase === 'shakedown' || state.currentLocation === 'shakedown') return 'Shakedown'
  if (state.currentLocation === 'venue') return 'Venue gates'
  if (state.currentLocation === 'park') return 'Park'
  if (state.currentLocation === 'hotel') return 'Hotel'
  if (state.currentLocation === 'friends_house') return "Friend's house"
  return 'Lot'
}

export function sceneTabTitle(state: GameState): string {
  return `Scene: ${playLocationLabel(state)}`
}
