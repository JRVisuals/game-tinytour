import { ROADSIDE_LABELS } from '../travel/legs'
import type { GameState } from '../types'

/** Short minimap hint — travel only; lot phases use dots alone */
export function tourForeshadow(state: GameState): string | null {
  const tour = state.tour
  if (!tour || state.phase !== 'travel' || !state.travel) return null

  const travel = state.travel
  const leg = travel.legs[travel.currentLegIndex]
  if (!leg) return null

  if (travel.atRoadside && leg.roadside) {
    return `Pulled over — ${ROADSIDE_LABELS[leg.roadside]}`
  }
  if (travel.pendingEvent) {
    return 'Road event ahead'
  }

  const legsLeft = travel.legs.length - travel.currentLegIndex
  if (legsLeft > 1) return `${legsLeft} legs to ${travel.destination}`
  return `Last leg to ${travel.destination}`
}
