import type { CrewMember, Resources } from '../types'

const RESOURCE_KEYS = ['cash', 'food', 'beer', 'drugs', 'tickets', 'gas'] as const
type ResourceKey = (typeof RESOURCE_KEYS)[number]

const LABELS: Record<ResourceKey, string> = {
  cash: 'cash',
  food: 'food',
  beer: 'beer',
  drugs: 'substances',
  tickets: 'tickets',
  gas: 'gas',
}

const METER_KEYS = ['health', 'vibe', 'hunger', 'thirst', 'stoned'] as const
type MeterKey = (typeof METER_KEYS)[number]

const METER_LABELS: Record<MeterKey, string> = {
  health: 'health',
  vibe: 'vibe',
  hunger: 'hunger',
  thirst: 'thirst',
  stoned: 'stoned',
}

export function formatResourceDeltas(before: Resources, after: Resources): string {
  const parts: string[] = []
  for (const key of RESOURCE_KEYS) {
    const delta = after[key] - before[key]
    if (delta === 0) continue
    const label = LABELS[key]
    if (key === 'cash') {
      parts.push(delta > 0 ? `+$${delta} ${label}` : `−$${Math.abs(delta)} ${label}`)
    } else {
      parts.push(`${delta > 0 ? '+' : ''}${delta} ${label}`)
    }
  }
  return parts.join(', ')
}

/** Average meter shift across active crew (by member id). */
export function formatCrewDelta(before: CrewMember[], after: CrewMember[]): string {
  const parts: string[] = []
  for (const key of METER_KEYS) {
    let total = 0
    let count = 0
    for (const a of after) {
      if (a.bailed) continue
      const b = before.find((x) => x.id === a.id)
      if (!b || b.bailed) continue
      total += a[key] - b[key]
      count++
    }
    if (count === 0 || total === 0) continue
    const avg = Math.round(total / count)
    if (avg === 0) continue
    parts.push(`${METER_LABELS[key]} ${avg > 0 ? '+' : ''}${avg}`)
  }
  return parts.length > 0 ? `crew ${parts.join(', ')}` : ''
}

export interface OutcomeSnapshot {
  resourcesBefore?: Resources
  resourcesAfter?: Resources
  crewBefore?: CrewMember[]
  crewAfter?: CrewMember[]
}

export function outcomeReport(flavor: string, snap: OutcomeSnapshot): string {
  const chunks: string[] = []
  if (snap.resourcesBefore && snap.resourcesAfter) {
    const r = formatResourceDeltas(snap.resourcesBefore, snap.resourcesAfter)
    if (r) chunks.push(r)
  }
  if (snap.crewBefore && snap.crewAfter) {
    const c = formatCrewDelta(snap.crewBefore, snap.crewAfter)
    if (c) chunks.push(c)
  }
  if (chunks.length === 0) return flavor
  return `${flavor} — ${chunks.join(' · ')}`
}
