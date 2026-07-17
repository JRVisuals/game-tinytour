import locationEventsJson from '../../content/location-events.json'
import { BALANCE } from '../config'
import type { GameState, LocationId, Resources } from '../types'
import { appendStory, storyEvent } from '../crew/tourStory'

interface LocationEventTemplate {
  id: string
  title: string
  body: string
  weight: number
  effects: Partial<Record<keyof Resources, number>>
}

interface LocationActionDef {
  id: string
  label: string
  flavorHint?: string
  cost: Partial<Record<string, number>>
  effect: Partial<Record<string, number>>
  burnsTurn: boolean
  once: boolean
}

// Cast the JSON to a shape we can work with
const data = locationEventsJson as {
  universal: LocationEventTemplate[]
  specific: Partial<Record<LocationId, LocationEventTemplate[]>>
  actions: Partial<Record<LocationId, LocationActionDef[]>>
}

const S = BALANCE.shakedown.spotFind

export interface LocationEvent {
  id: string
  title: string
  body: string
}

export interface LocationAction {
  id: string
  label: string
  flavorHint?: string
  cost: Partial<Record<keyof Resources, number>>
  effect: Partial<Record<keyof Resources, number>>
  burnsTurn: boolean
  once: boolean
}

// Keep backward-compat alias used by GameState field name
export type SpotFindEvent = LocationEvent

function substitute(text: string, bandName: string): string {
  return text.replace(/\{bandName\}/g, bandName)
}

/** Pick from specific[location] + universal pool, weighted, using seed as RNG. */
export function rollLocationEvent(
  location: LocationId,
  seed: number,
  bandName: string,
): LocationEvent | null {
  if (location === 'venue' || location === 'shakedown') return null
  if (Math.abs(seed) % 100 >= S.chancePercent) return null

  const specific = data.specific[location] ?? []
  const pool: LocationEventTemplate[] = [...specific, ...data.universal]
  if (pool.length === 0) return null

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0)
  // Map seed into [0, totalWeight) for a deterministic weighted pick
  const pick = Math.abs(seed + 5) % totalWeight
  let acc = 0
  let chosen: LocationEventTemplate = pool[pool.length - 1]!
  for (const e of pool) {
    acc += e.weight
    if (pick < acc) {
      chosen = e
      break
    }
  }

  return {
    id: chosen.id,
    title: substitute(chosen.title, bandName),
    body: substitute(chosen.body, bandName),
  }
}

function allTemplates(): LocationEventTemplate[] {
  const specific = Object.values(data.specific).flat() as LocationEventTemplate[]
  return [...data.universal, ...specific]
}

function applyLocationEventEffects(resources: Resources, eventId: string): Resources {
  const t = allTemplates().find((e) => e.id === eventId)
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

export function applyLocationEventOnVisit(
  s: GameState,
  location: LocationId,
  seed: number,
  bandName: string,
): GameState {
  const rolled = rollLocationEvent(location, seed, bandName)
  if (!rolled) return { ...s, spotFindEvent: null }

  const resources = applyLocationEventEffects(s.resources, rolled.id)
  return {
    ...s,
    spotFindEvent: rolled,
    resources,
    tourStory: appendStory(s.tourStory, storyEvent(seed, rolled.title, rolled.body)),
  }
}

export function getLocationActions(location: LocationId): LocationAction[] {
  const defs = data.actions[location] ?? []
  return defs.map((d) => ({
    id: d.id,
    label: d.label,
    flavorHint: d.flavorHint,
    cost: d.cost as Partial<Record<keyof Resources, number>>,
    effect: d.effect as Partial<Record<keyof Resources, number>>,
    burnsTurn: d.burnsTurn ?? true,
    once: d.once ?? true,
  }))
}

/**
 * Pick one location action to surface per visit.
 * Prefers once-per-visit actions not yet used; falls back to repeatables.
 * Uses seed for determinism within a visit.
 */
export function pickLocationAction(
  location: LocationId,
  usedIds: string[],
  seed: number,
): LocationAction | null {
  const all = getLocationActions(location)
  if (all.length === 0) return null

  const available = all.filter((a) => !(a.once && usedIds.includes(a.id)))
  if (available.length === 0) return null

  return available[Math.abs(seed) % available.length]!
}

export function applyLocationActionEffects(
  resources: Resources,
  action: LocationAction,
): Resources {
  let next = { ...resources }
  // Deduct costs
  for (const [key, amount] of Object.entries(action.cost) as [keyof Resources, number][]) {
    if (key === 'hasVehicle' || typeof amount !== 'number') continue
    const cur = next[key]
    if (typeof cur === 'number') next = { ...next, [key]: Math.max(0, cur - amount) }
  }
  // Apply effects
  for (const [key, delta] of Object.entries(action.effect) as [keyof Resources, number][]) {
    if (key === 'hasVehicle' || typeof delta !== 'number') continue
    const cur = next[key]
    if (typeof cur === 'number') next = { ...next, [key]: Math.max(0, cur + delta) }
  }
  return next
}

export function canAffordAction(
  action: LocationAction,
  resources: Resources,
): boolean {
  for (const [key, amount] of Object.entries(action.cost) as [keyof Resources, number][]) {
    if (key === 'hasVehicle' || typeof amount !== 'number') continue
    const cur = resources[key]
    if (typeof cur === 'number' && cur < amount) return false
  }
  return true
}
