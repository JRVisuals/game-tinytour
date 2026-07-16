import { SceneBeatAlert } from './SceneBeatAlert'
import type { SceneBeatView } from '../game/scene/beat'

export function SceneBeatSlot({ beat }: { beat: SceneBeatView | null }) {
  if (!beat) return null
  return (
    <SceneBeatAlert
      title={beat.title}
      body={beat.body}
      color={beat.color}
      loot={beat.loot}
    />
  )
}
