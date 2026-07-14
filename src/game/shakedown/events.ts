import shakedownEventsJson from '../../content/shakedown-events.json'
import { BALANCE } from '../config'
import type { Resources } from '../types'

interface ShakedownEventTemplate {
  id: string
  title: string
  body: string
  weight: number
  effects: Partial<Record<keyof Resources, number>>
}

const templates = shakedownEventsJson.events as ShakedownEventTemplate[]
const S = BALANCE.shakedown

export interface PostShowShakedownEvent {
  id: string
  title: string
  body: string
}

function pickWeighted(pool: ShakedownEventTemplate[], seed: number): ShakedownEventTemplate {
  const total = pool.reduce((a, e) => a + e.weight, 0)
  let roll = Math.abs(seed) % total
  for (const e of pool) {
    roll -= e.weight
    if (roll < 0) return e
  }
  return pool[0]!
}

export function rollPostShowShakedownEvent(seed: number): PostShowShakedownEvent | null {
  if (Math.abs(seed) % 100 > S.postShowEventChancePercent) return null
  const t = pickWeighted(templates, seed)
  return { id: t.id, title: t.title, body: t.body }
}

export function applyShakedownEventEffects(
  resources: Resources,
  eventId: string,
): Resources {
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
