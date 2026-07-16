import locationEventsJson from '../../content/location-events.json'
import { BALANCE } from '../config'
import type { GameState, LocationId, Resources } from '../types'
import { appendStory, storyEvent } from '../crew/tourStory'

interface SpotFindTemplate {
  id: string
  title: string
  body: string
  locations: LocationId[]
  effects: Partial<Record<keyof Resources, number>>
}

const templates = locationEventsJson.events as SpotFindTemplate[]
const S = BALANCE.shakedown.spotFind

export interface SpotFindEvent {
  id: string
  title: string
  body: string
}

export function rollSpotFindEvent(location: LocationId, seed: number): SpotFindEvent | null {
  if (location === 'venue') return null
  if (Math.abs(seed) % 100 >= S.chancePercent) return null

  const pool = templates.filter((e) => e.locations.includes(location))
  if (pool.length === 0) return null

  const t = pool[Math.abs(seed + 5) % pool.length]!
  return { id: t.id, title: t.title, body: t.body }
}

function applySpotFindEffects(resources: Resources, eventId: string): Resources {
  const t = templates.find((e) => e.id === eventId)
  if (!t?.effects) return resources
  let next = { ...resources }
  for (const [key, delta] of Object.entries(t.effects) as [keyof Resources, number][]) {
    if (key === 'hasVehicle' || typeof delta !== 'number') continue
    const cur = next[key]
    if (typeof cur === 'number') {
      next = { ...next, [key]: Math.max(0, cur + delta) }
    }
  }
  return next
}

export function spotFindCashReward(eventId: string): number {
  const t = templates.find((e) => e.id === eventId)
  return typeof t?.effects.cash === 'number' ? t.effects.cash : 0
}

export function applySpotFindOnVisit(
  s: GameState,
  location: LocationId,
  seed: number,
): GameState {
  const rolled = rollSpotFindEvent(location, seed)
  if (!rolled) return { ...s, spotFindEvent: null }

  const resources = applySpotFindEffects(s.resources, rolled.id)
  return {
    ...s,
    spotFindEvent: rolled,
    resources,
    tourStory: appendStory(s.tourStory, storyEvent(seed, rolled.title, rolled.body)),
  }
}
