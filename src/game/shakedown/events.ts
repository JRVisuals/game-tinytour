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

const postShowTemplates = shakedownEventsJson.postShow as ShakedownEventTemplate[]
const lotTemplates = shakedownEventsJson.lot as ShakedownEventTemplate[]
const allTemplates = [...postShowTemplates, ...lotTemplates]
const S = BALANCE.shakedown

export const CLOWN_JUICE_MAFIA_ID = 'clown_juice_mafia'

export interface ShakedownLotEvent {
  id: string
  title: string
  body: string
}

export type PostShowShakedownEvent = ShakedownLotEvent

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
  const t = pickWeighted(postShowTemplates, seed)
  return { id: t.id, title: t.title, body: t.body }
}

export function rollLotShakedownEvent(seed: number): ShakedownLotEvent | null {
  if (Math.abs(seed) % 100 > S.lotEventChancePercent) return null
  const t = pickWeighted(lotTemplates, seed + 3)
  return { id: t.id, title: t.title, body: t.body }
}

export function isClownJuiceMafia(event: ShakedownLotEvent | null | undefined): boolean {
  return event?.id === CLOWN_JUICE_MAFIA_ID
}

export function applyShakedownEventEffects(
  resources: Resources,
  eventId: string,
): Resources {
  const t = allTemplates.find((e) => e.id === eventId)
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

export function applyLotShakedownEventEffects(
  resources: Resources,
  event: ShakedownLotEvent | null,
): Resources {
  if (!event) return resources
  return applyShakedownEventEffects(resources, event.id)
}
