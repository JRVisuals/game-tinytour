import travelEventsJson from '../../content/travel-events.json'
import { BALANCE } from '../config'
import {
  buildIntelTipSongId,
  intelEffect,
  setlistSongId,
  type IntelEventKey,
} from './intelTips'
import type { BandCatalog, Setlist, TravelEvent, TravelEventType } from '../types'

interface EventTemplate {
  id: string
  eventType: TravelEventType
  title: string
  body: string
  weight: number
  choices?: { id: string; label: string }[]
}

const templates = travelEventsJson.events as EventTemplate[]
const T = BALANCE.travel

const INTEL_EVENT_TYPES = new Set<TravelEventType>([
  'hitchhiker_intel',
  'lot_rumor',
  'encore_intel',
])

export interface TravelEventContext {
  catalog: BandCatalog
  plannedSetlist?: Setlist
}

function pickWeighted(pool: EventTemplate[], seed: number): EventTemplate {
  const total = pool.reduce((a, e) => a + e.weight, 0)
  let roll = Math.abs(seed) % total
  for (const e of pool) {
    roll -= e.weight
    if (roll < 0) return e
  }
  return pool[0]!
}

function canRollIntel(template: EventTemplate, ctx?: TravelEventContext): boolean {
  if (!ctx?.plannedSetlist) return false
  const setIds = ctx.plannedSetlist.songIds ?? []
  if (template.eventType === 'encore_intel') {
    return setIds.length > 0
  }
  if (template.eventType === 'hitchhiker_intel') {
    return !!setlistSongId(ctx.plannedSetlist, 'opener')
  }
  if (template.eventType === 'lot_rumor') {
    return setIds.length > 0
  }
  return false
}

function buildIntelEvent(
  template: EventTemplate,
  seed: number,
  ctx: TravelEventContext,
): TravelEvent {
  const key = template.id as IntelEventKey
  const config = intelEffect(key)
  const tipId = buildIntelTipSongId(ctx.catalog, ctx.plannedSetlist!, config, seed)

  return {
    id: `evt-${seed}`,
    eventKey: template.id,
    title: template.title,
    body: template.body,
    eventType: template.eventType,
    choices: template.choices,
    intelTipSongId: tipId,
    intelSlot: config.slot,
  }
}

function eventPool(ctx?: TravelEventContext): EventTemplate[] {
  return templates.filter((e) => {
    if (e.eventType === 'solo' || e.eventType === 'bathroom_find') return true
    if (INTEL_EVENT_TYPES.has(e.eventType)) return canRollIntel(e, ctx)
    return false
  })
}

export function maybeRollTravelEvent(
  seed: number,
  ctx?: TravelEventContext,
): TravelEvent | null {
  if (Math.abs(seed) % 100 > T.eventChancePercent) return null

  const roll = seed % 100
  if (roll < T.forcedPulledOverBelow) {
    const t = templates.find((e) => e.id === 'pulled_over')!
    return { ...t, id: `evt-${seed}`, eventKey: t.id }
  }
  if (roll < T.forcedLotRumorBelow && ctx?.plannedSetlist && ctx.catalog) {
    const t = templates.find((e) => e.id === 'lot_rumor')!
    return buildIntelEvent(t, seed, ctx)
  }

  const pool = eventPool(ctx)
  if (pool.length === 0) return null

  const template = pickWeighted(pool, seed)
  if (INTEL_EVENT_TYPES.has(template.eventType) && ctx?.plannedSetlist) {
    return buildIntelEvent(template, seed, ctx)
  }

  return {
    id: `evt-${seed}`,
    eventKey: template.id,
    title: template.title,
    body: template.body,
    eventType: template.eventType,
    choices: template.choices,
  }
}

export function getEventTemplate(id: string): EventTemplate | undefined {
  return templates.find((e) => e.id === id)
}
