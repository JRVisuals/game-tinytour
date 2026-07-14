import { BALANCE, COPY, pickText, pickTextWithPlural } from '../config'

const C = BALANCE.crewMeters

export const METER_MAX = C.meterMax
export const ROUGH_THRESHOLD = C.roughThreshold
export const BAIL_ROUGH_THRESHOLD = C.bailRoughThreshold
export const TICK_HUNGER = C.tickHunger
export const TICK_THIRST = C.tickThirst
export const EAT_HUNGER = C.eatHunger
export const EAT_STONED = C.eatStoned
export const EAT_HEALTH = C.eatHealth
export const BEER_STONED = C.beerStoned
export const BEER_THIRST = C.beerThirst
export const CONSUME_DRUGS_VIBE = C.consumeDrugsVibe
export const CONSUME_DRUGS_STONED = C.consumeDrugsStoned
export const SHOW_VIBE = C.showVibe
export const STONED_WASTED_THRESHOLD = C.stonedWastedThreshold
export const REST_HEALTH = C.restHealth
export const REST_THIRST = C.restThirst
export const REST_VIBE = C.restVibe
export const REST_STONED = C.restStoned
export const HITCH_VIBE = C.hitchVibe
export const PUSH_PENALTY = C.pushPenalty
export const WOOK_FLU_HEALTH = C.wookFluHealth
export const BATHROOM_BAG_STONED = C.bathroomBagStoned

const TIERS = C.labelTiers

function nameSeed(name: string): number {
  let h = 0
  for (const ch of name) h = (h + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

function tierLabel(
  value: number,
  labels: { high: string; mid: string; low: string; worst: string },
): string {
  if (value >= TIERS.high) return labels.high
  if (value >= TIERS.mid) return labels.mid
  if (value >= TIERS.low) return labels.low
  return labels.worst
}

export function clampMeter(n: number): number {
  return Math.max(0, Math.min(METER_MAX, Math.round(n)))
}

export function adjustMeter(value: number, delta: number): number {
  return clampMeter(value + delta)
}

export function hungerLabel(value: number): string {
  return tierLabel(value, COPY.crew.meterLabels.hunger)
}

export function thirstLabel(value: number): string {
  return tierLabel(value, COPY.crew.meterLabels.thirst)
}

export function healthLabel(value: number): string {
  return tierLabel(value, COPY.crew.meterLabels.health)
}

export function vibeLabel(value: number): string {
  return tierLabel(value, COPY.crew.meterLabels.vibe)
}

export function stonedLabel(value: number): string {
  const labels = COPY.crew.meterLabels.stoned
  if (value >= TIERS.high) return labels.high
  if (value >= STONED_WASTED_THRESHOLD && labels.midHigh) return labels.midHigh
  if (value >= 40) return labels.mid
  if (value >= 15) return labels.low
  return labels.worst
}

export function isDrivingWasted(stoned: number): boolean {
  return stoned >= STONED_WASTED_THRESHOLD
}

export function maxActiveStoned<T extends { bailed: boolean; stoned: number }>(crew: T[]): number {
  const active = activeCrew(crew)
  if (active.length === 0) return 0
  return Math.max(...active.map((c) => c.stoned))
}

export function wastedActiveCrew<T extends { bailed: boolean; stoned: number; name: string }>(
  crew: T[],
): T[] {
  return activeCrew(crew).filter((c) => isDrivingWasted(c.stoned))
}

export function canEnterVenue<T extends { bailed: boolean; stoned: number; name: string }>(
  crew: T[],
): boolean {
  return wastedActiveCrew(crew).length === 0
}

export function venueEntryBlockedMessage(
  crew: { bailed: boolean; stoned: number; name: string }[],
): string | null {
  const wasted = wastedActiveCrew(crew)
  if (wasted.length === 0) return null
  const names = wasted.map((c) => c.name).join(', ')
  return pickText(COPY.crew.venueBlocked, names.length, '', { names })
}

export function meterBarColor(value: number): string {
  if (value >= C.barColors.good) return 'teal'
  if (value >= C.barColors.warn) return 'yellow'
  return 'red'
}

export function needBarValue(satisfaction: number): number {
  return METER_MAX - satisfaction
}

export function meterNeedBarColor(need: number): string {
  if (need <= C.barColors.warn) return 'teal'
  if (need <= 50) return 'yellow'
  return 'red'
}

export function stonedBarColor(value: number): string {
  if (value >= STONED_WASTED_THRESHOLD) return 'red'
  if (value >= 40) return 'grape'
  if (value >= 15) return 'violet'
  return 'gray'
}

export function defaultMeters() {
  const d = C.defaultMeters
  return {
    hunger: d.hunger,
    thirst: d.thirst,
    health: d.health,
    vibe: d.vibe,
    stoned: d.stoned,
    roughTurns: 0,
    bailed: false,
  }
}

export type MeterSnapshot = {
  hunger: number
  thirst: number
  health: number
  vibe: number
  stoned: number
}

export function isRough(member: MeterSnapshot): boolean {
  return (
    member.hunger < ROUGH_THRESHOLD ||
    member.thirst < ROUGH_THRESHOLD ||
    member.health < ROUGH_THRESHOLD ||
    member.vibe < ROUGH_THRESHOLD
  )
}

function primaryRoughMeter(member: MeterSnapshot): keyof MeterSnapshot | null {
  if (member.hunger < ROUGH_THRESHOLD) return 'hunger'
  if (member.thirst < ROUGH_THRESHOLD) return 'thirst'
  if (member.health < ROUGH_THRESHOLD) return 'health'
  if (member.vibe < ROUGH_THRESHOLD) return 'vibe'
  return null
}

export function bailReasonMessage(member: { name: string } & MeterSnapshot): string {
  const key = primaryRoughMeter(member) ?? 'default'
  const pool = COPY.crew.bail[key] ?? COPY.crew.bail.default
  return pickText(pool, nameSeed(member.name), `${member.name} bailed.`, { name: member.name })
}

export function roughWarningMessage(
  member: { name: string; roughTurns: number } & MeterSnapshot,
): string | null {
  if (!isRough(member) || member.roughTurns < C.roughWarningMinTurns) return null
  const left = BAIL_ROUGH_THRESHOLD - member.roughTurns
  if (left <= 0) return null
  const key = primaryRoughMeter(member)
  if (!key || key === 'stoned') return null
  const pool = COPY.crew.warnings[key]
  return pickTextWithPlural(
    pool,
    nameSeed(member.name) + member.roughTurns,
    `${member.name} is in trouble.`,
    { name: member.name, left },
  )
}

export function tickCrewMeters<
  T extends MeterSnapshot & {
    roughTurns: number
    bailed: boolean
    name: string
  },
>(crew: T[]): { crew: T[]; bailMessages: string[]; warnings: string[] } {
  const bailMessages: string[] = []
  const warnings: string[] = []
  const next = crew.map((m) => {
    if (m.bailed) return m
    const member = {
      ...m,
      hunger: adjustMeter(m.hunger, -TICK_HUNGER),
      thirst: adjustMeter(m.thirst, -TICK_THIRST),
    }
    const rough = isRough(member)
    let roughTurns = rough ? member.roughTurns + 1 : 0
    let bailed = member.bailed
    const warn = roughWarningMessage({ ...member, roughTurns })
    if (warn) warnings.push(warn)
    if (roughTurns >= BAIL_ROUGH_THRESHOLD) {
      bailed = true
      bailMessages.push(bailReasonMessage(member))
      roughTurns = 0
    }
    return { ...member, roughTurns, bailed }
  })
  return { crew: next, bailMessages, warnings }
}

export function activeCrew<T extends { bailed: boolean }>(crew: T[]): T[] {
  return crew.filter((c) => !c.bailed)
}

export function allCrewBailed<T extends { bailed: boolean }>(crew: T[]): boolean {
  return crew.length > 0 && crew.every((c) => c.bailed)
}

export function collectCrewWarnings<
  T extends {
    name: string
    bailed: boolean
    roughTurns: number
  } & MeterSnapshot,
>(crew: T[]): string[] {
  const warnings: string[] = []
  for (const m of crew) {
    if (m.bailed) continue
    const warn = roughWarningMessage(m)
    if (warn) warnings.push(warn)
  }
  return warnings
}

type CrewMeterFields = {
  bailed: boolean
  roughTurns: number
} & MeterSnapshot

export function applyEatToMember<T extends CrewMeterFields>(m: T): T {
  if (m.bailed) return m
  return {
    ...m,
    hunger: adjustMeter(m.hunger, EAT_HUNGER),
    stoned: adjustMeter(m.stoned, EAT_STONED),
    health: adjustMeter(m.health, EAT_HEALTH),
    roughTurns: 0,
  }
}

export function applyDrinkToMember<T extends CrewMeterFields>(m: T): T {
  if (m.bailed) return m
  return {
    ...m,
    thirst: adjustMeter(m.thirst, BEER_THIRST),
    stoned: adjustMeter(m.stoned, BEER_STONED),
    roughTurns: 0,
  }
}

export function applyBathroomBagTasteToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          stoned: Math.max(m.stoned, BATHROOM_BAG_STONED),
          roughTurns: 0,
        },
  )
}

export function applySubstancesToMember<T extends CrewMeterFields>(m: T): T {
  if (m.bailed) return m
  return {
    ...m,
    vibe: adjustMeter(m.vibe, CONSUME_DRUGS_VIBE),
    stoned: adjustMeter(m.stoned, CONSUME_DRUGS_STONED),
    roughTurns: 0,
  }
}

export function applyShowVibeToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          vibe: adjustMeter(m.vibe, SHOW_VIBE),
          roughTurns: 0,
        },
  )
}

export function applyEatToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) => applyEatToMember(m))
}

export function applyDrinkToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) => applyDrinkToMember(m))
}

export function applyRestToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          health: adjustMeter(m.health, REST_HEALTH),
          thirst: adjustMeter(m.thirst, REST_THIRST),
          vibe: adjustMeter(m.vibe, REST_VIBE),
          stoned: adjustMeter(m.stoned, REST_STONED),
          roughTurns: 0,
        },
  )
}

export function applyHotelCrashToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          hunger: METER_MAX,
          thirst: METER_MAX,
          health: METER_MAX,
          vibe: METER_MAX,
          stoned: 0,
          roughTurns: 0,
        },
  )
}

export function applyBurnGasCruiseToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  const vibe = BALANCE.travel.burnGas.vibe
  return crew.map((m) =>
    m.bailed ? m : { ...m, vibe: adjustMeter(m.vibe, vibe) },
  )
}

export function applyPushThroughToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          health: adjustMeter(m.health, -PUSH_PENALTY),
          hunger: adjustMeter(m.hunger, -PUSH_PENALTY),
          thirst: adjustMeter(m.thirst, -PUSH_PENALTY),
          vibe: adjustMeter(m.vibe, -PUSH_PENALTY),
        },
  )
}

export function applyHitchVibe<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed ? m : { ...m, vibe: adjustMeter(m.vibe, HITCH_VIBE) },
  )
}

export function applyWookFluToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed ? m : { ...m, health: Math.min(m.health, WOOK_FLU_HEALTH) },
  )
}

export function crewAllWookFlu<T extends CrewMeterFields>(crew: T[]): boolean {
  return (
    activeCrew(crew).length > 0 &&
    activeCrew(crew).every((c) => c.health < ROUGH_THRESHOLD)
  )
}
