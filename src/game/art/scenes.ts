import artScenesJson from '../../content/art-scenes.json'
import type { LocationId, PhaseId } from '../types'

export interface ArtSceneDef {
  label: string
  hint: string
  src: string | null
  height: number
}

const SCENES = artScenesJson.scenes as Record<string, ArtSceneDef>

export function sceneArtKey(phase: PhaseId, location?: LocationId): string {
  if (phase === 'location' && location && location !== 'shakedown') {
    return `location:${location}`
  }
  return phase
}

export function resolveArtScene(phase: PhaseId, location?: LocationId): ArtSceneDef {
  return SCENES[sceneArtKey(phase, location)] ?? SCENES.default!
}

export function resolveArtSceneById(id: string): ArtSceneDef {
  return SCENES[id] ?? SCENES.default!
}
