import { ArtSlot } from './ArtSlot'
import { resolveArtScene } from '../game/art/scenes'
import type { LocationId, PhaseId } from '../game/types'

interface SceneArtProps {
  phase: PhaseId
  location?: LocationId
  compact?: boolean
}

/** Phase-aware illustration banner — one per screen via ScreenFrame */
export function SceneArt({ phase, location, compact = false }: SceneArtProps) {
  const scene = resolveArtScene(phase, location)
  const height = compact ? Math.min(scene.height, 80) : scene.height

  return (
    <ArtSlot
      label={scene.label}
      assetHint={scene.hint}
      src={scene.src}
      alt={scene.label}
      minHeight={height}
      compact={compact}
    />
  )
}
