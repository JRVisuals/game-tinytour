import missShowEventsJson from '../../content/miss-show-events.json'
import { BALANCE } from '../config'
import { maxActiveStoned, STONED_WASTED_THRESHOLD } from '../crew/meters'
import type { CrewMember, Resources } from '../types'

export interface HustleEventEffects {
  food?: number
  beer?: number
  drugs?: number
  cash?: number
  tickets?: number
  gas?: number
  cashHalfLoss?: boolean
}

interface HustleEventTemplate {
  id: string
  title: string
  body: string
  weight: number
  requiresWasted?: boolean
  effects: HustleEventEffects
}

const templates = missShowEventsJson.events as HustleEventTemplate[]

export interface MissShowHustleEvent {
  id: string
  title: string
  body: string
}

function pickWeighted(pool: HustleEventTemplate[], seed: number): HustleEventTemplate {
  const total = pool.reduce((a, e) => a + e.weight, 0)
  let roll = Math.abs(seed) % total
  for (const e of pool) {
    roll -= e.weight
    if (roll < 0) return e
  }
  return pool[0]!
}

function eligiblePool(crew: CrewMember[]): HustleEventTemplate[] {
  const wasted = maxActiveStoned(crew) >= STONED_WASTED_THRESHOLD
  return templates.filter((e) => !e.requiresWasted || wasted)
}

export function rollMissShowHustleEvent(
  seed: number,
  crew: CrewMember[],
): MissShowHustleEvent | null {
  const pool = eligiblePool(crew)
  if (pool.length === 0) return null
  if (Math.abs(seed) % 100 > BALANCE.shakedown.missShowHustleEventChancePercent) return null
  const t = pickWeighted(pool, seed)
  return { id: t.id, title: t.title, body: t.body }
}

export function applyMissShowHustleEffects(
  resources: Resources,
  eventId: string,
): Resources {
  const t = templates.find((e) => e.id === eventId)
  if (!t?.effects) return resources
  let next = { ...resources }
  const fx = t.effects

  if (fx.cashHalfLoss) {
    next = { ...next, cash: Math.floor(next.cash / 2) }
  }

  for (const key of ['food', 'beer', 'drugs', 'cash', 'tickets', 'gas'] as const) {
    const delta = fx[key]
    if (typeof delta === 'number') {
      next = { ...next, [key]: Math.max(0, next[key] + delta) }
    }
  }

  return next
}
