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
export const DRINK_HEALTH = C.drinkHealth
export const CONSUME_DRUGS_VIBE = C.consumeDrugsVibe
export const CONSUME_DRUGS_STONED = C.consumeDrugsStoned
export const CONSUME_DRUGS_HEALTH = C.consumeDrugsHealth
export const CONSUME_DRUGS_HUNGER = C.consumeDrugsHunger
export const SHOW_VIBE = C.showVibe
export const BET_WIN_VIBE = C.betWinVibe
export const BET_LOSS_VIBE = C.betLossVibe
export const BAD_EVENT_VIBE = C.badEventVibe
export const STONED_WASTED_THRESHOLD = C.stonedWastedThreshold
export const REST_HEALTH = C.restHealth
export const REST_THIRST = C.restThirst
export const REST_VIBE = C.restVibe
export const REST_STONED = C.restStoned
export const HITCH_VIBE = C.hitchVibe
export const PUSH_PENALTY = C.pushPenalty
export const WOOK_FLU_HEALTH_DAMAGE = C.wookFluHealthDamage
export const WOOK_FLU_SPREAD_CHANCE = C.wookFluSpreadChancePercent
export const NEGLECT_HUNGER_HEALTH = C.neglectHungerHealthDamage
export const NEGLECT_THIRST_HEALTH = C.neglectThirstHealthDamage
export const LOW_HEALTH_WOOK_FLU_THRESHOLD = C.lowHealthWookFluThreshold
export const WOOK_FLU_LOW_HEALTH_TICK_CHANCE = C.wookFluLowHealthTickChancePercent
export const WOOK_FLU_EVENT_WEIGHT_BONUS = C.wookFluEventWeightBonusPerLowHealth
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
    wookFlu: false,
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

export type CrewStatusSeverity = 'critical' | 'warning' | 'ok' | 'muted'

export type CrewStatusId =
  | 'bailed'
  | 'wook_flu'
  | 'bailing'
  | 'wasted'
  | 'hungry'
  | 'thirsty'
  | 'sick'
  | 'low_vibe'
  | 'ok'

export interface CrewStatusChip {
  id: CrewStatusId
  label: string
  severity: CrewStatusSeverity
}

/** Single at-a-glance status for compact crew rows */
export function crewStatusChip(member: {
  bailed: boolean
  wookFlu?: boolean
  roughTurns: number
  hunger: number
  thirst: number
  health: number
  vibe: number
  stoned: number
}): CrewStatusChip {
  if (member.bailed) {
    return { id: 'bailed', label: 'BAILED', severity: 'muted' }
  }
  if (member.wookFlu) {
    return { id: 'wook_flu', label: 'WOOK FLU', severity: 'critical' }
  }
  if (
    isRough(member) &&
    member.roughTurns >= C.roughWarningMinTurns &&
    member.roughTurns < BAIL_ROUGH_THRESHOLD
  ) {
    const left = BAIL_ROUGH_THRESHOLD - member.roughTurns
    return { id: 'bailing', label: `BAILING · ${left}t`, severity: 'critical' }
  }
  if (member.stoned >= STONED_WASTED_THRESHOLD) {
    return { id: 'wasted', label: 'WASTED', severity: 'warning' }
  }
  const rough = primaryRoughMeter(member)
  if (rough === 'hunger') return { id: 'hungry', label: 'HUNGRY', severity: 'warning' }
  if (rough === 'thirst') return { id: 'thirsty', label: 'THIRSTY', severity: 'warning' }
  if (rough === 'health') return { id: 'sick', label: 'SICK', severity: 'warning' }
  if (rough === 'vibe') return { id: 'low_vibe', label: 'LOW VIBE', severity: 'warning' }
  return { id: 'ok', label: 'OK', severity: 'ok' }
}

export function crewStatusBadgeColor(severity: CrewStatusSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'warning':
      return 'orange'
    case 'ok':
      return 'teal'
    default:
      return 'gray'
  }
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

function neglectMessage(
  member: { name: string },
  hits: ('hunger' | 'thirst')[],
  seed: number,
): string | null {
  if (hits.length === 0) return null
  const key = hits.length === 2 ? 'both' : hits[0]!
  const pool = COPY.crew.neglect[key]
  return pickText(pool, seed + nameSeed(member.name), `${member.name} needs food or drink.`, {
    name: member.name,
  })
}

function applyNeglectHealthDrain(member: MeterSnapshot): {
  health: number
  hits: ('hunger' | 'thirst')[]
} {
  let health = member.health
  const hits: ('hunger' | 'thirst')[] = []
  if (member.hunger < ROUGH_THRESHOLD) {
    health = adjustMeter(health, NEGLECT_HUNGER_HEALTH)
    hits.push('hunger')
  }
  if (member.thirst < ROUGH_THRESHOLD) {
    health = adjustMeter(health, NEGLECT_THIRST_HEALTH)
    hits.push('thirst')
  }
  return { health, hits }
}

function maybeCatchWookFluFromLowHealth<
  T extends CrewMeterFields & { wookFlu?: boolean; id: string; name: string },
>(member: T, seed: number): { member: T; message: string | null } {
  if (member.bailed || member.wookFlu || member.health >= LOW_HEALTH_WOOK_FLU_THRESHOLD) {
    return { member, message: null }
  }
  const roll = Math.abs(seed + nameSeed(member.name) * 17) % 100
  if (roll >= WOOK_FLU_LOW_HEALTH_TICK_CHANCE) {
    return { member, message: null }
  }
  const infected = infectMemberWithWookFlu(member)
  const message = pickText(
    COPY.crew.lowHealthWookFlu,
    seed + nameSeed(member.name),
    `${member.name} caught wook flu.`,
    { name: member.name },
  )
  return { member: infected, message }
}

export function tickCrewMeters<
  T extends MeterSnapshot & {
    roughTurns: number
    bailed: boolean
    id: string
    name: string
    wookFlu?: boolean
  },
>(
  crew: T[],
  rngSeed?: number,
): { crew: T[]; bailMessages: string[]; warnings: string[]; spreadMessages: string[]; neglectMessages: string[] } {
  const spreadMessages: string[] = []
  let working = crew
  if (rngSeed != null && activeCrew(working).some((c) => c.wookFlu)) {
    const spread = spreadWookFlu(working, rngSeed)
    working = spread.crew
    spreadMessages.push(...spread.messages)
  }

  const bailMessages: string[] = []
  const warnings: string[] = []
  const neglectMessages: string[] = []
  const tickSeed = rngSeed ?? 0
  const next = working.map((m, i) => {
    if (m.bailed) return m
    let member = {
      ...m,
      hunger: adjustMeter(m.hunger, -TICK_HUNGER),
      thirst: adjustMeter(m.thirst, -TICK_THIRST),
    }
    const { health, hits } = applyNeglectHealthDrain(member)
    member = { ...member, health }
    const neglect = neglectMessage(member, hits, tickSeed + i * 3)
    if (neglect) neglectMessages.push(neglect)

    const lowHealthFlu = maybeCatchWookFluFromLowHealth(member, tickSeed + i * 11)
    member = lowHealthFlu.member
    if (lowHealthFlu.message) neglectMessages.push(lowHealthFlu.message)

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
  return { crew: next, bailMessages, warnings, spreadMessages, neglectMessages }
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

export function applyVibeDeltaToActiveCrew<T extends CrewMeterFields>(crew: T[], delta: number): T[] {
  return crew.map((m) =>
    m.bailed ? m : { ...m, vibe: adjustMeter(m.vibe, delta) },
  )
}

export function applyDrinkToMember<T extends CrewMeterFields>(m: T): T {
  if (m.bailed) return m
  return {
    ...m,
    thirst: adjustMeter(m.thirst, BEER_THIRST),
    stoned: adjustMeter(m.stoned, BEER_STONED),
    health: adjustMeter(m.health, DRINK_HEALTH),
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
    health: adjustMeter(m.health, CONSUME_DRUGS_HEALTH),
    hunger: adjustMeter(m.hunger, CONSUME_DRUGS_HUNGER),
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

export function applyBalloonsToCrew<T extends CrewMeterFields>(crew: T[], doses = 1): T[] {
  const fx = BALANCE.markets.balloons
  let next = crew
  for (let i = 0; i < doses; i++) {
    next = next.map((m) =>
      m.bailed
        ? m
        : {
            ...m,
            vibe: adjustMeter(m.vibe, fx.vibe),
            health: adjustMeter(m.health, fx.health),
            roughTurns: 0,
          },
    )
  }
  return next
}

export function applyPunchToRandomCrew<
  T extends CrewMeterFields & { id: string; name: string },
>(
  crew: T[],
  healthDamage: number,
  seed: number,
): { crew: T[]; victimName: string | null } {
  const eligible = crew.filter((m) => !m.bailed)
  if (eligible.length === 0) return { crew, victimName: null }
  const victim = eligible[Math.abs(seed + 11) % eligible.length]!
  return {
    crew: crew.map((m) =>
      m.id === victim.id
        ? { ...m, health: adjustMeter(m.health, healthDamage), roughTurns: m.roughTurns + 1 }
        : m,
    ),
    victimName: victim.name,
  }
}

export function applyEatToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) => applyEatToMember(m))
}

export function applyDrinkToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return crew.map((m) => applyDrinkToMember(m))
}

export function applyRestToCrew<T extends CrewMeterFields & { wookFlu?: boolean }>(
  crew: T[],
): T[] {
  return crew.map((m) => {
    if (m.bailed) return m
    const health = adjustMeter(m.health, REST_HEALTH)
    return {
      ...m,
      health,
      thirst: adjustMeter(m.thirst, REST_THIRST),
      vibe: adjustMeter(m.vibe, REST_VIBE),
      stoned: adjustMeter(m.stoned, REST_STONED),
      roughTurns: 0,
      wookFlu: m.wookFlu && health < TIERS.mid ? true : false,
    }
  })
}

export function applyHotelCrashToCrew<T extends CrewMeterFields & { wookFlu?: boolean }>(
  crew: T[],
): T[] {
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
          wookFlu: false,
        },
  )
}

function healHalfwayToMax(value: number): number {
  return Math.round((value + METER_MAX) / 2)
}

/** Couch crash — half hotel reset; wook flu stays */
export function applyFriendsCrashToCrew<T extends CrewMeterFields & { wookFlu?: boolean }>(
  crew: T[],
): T[] {
  return crew.map((m) =>
    m.bailed
      ? m
      : {
          ...m,
          hunger: healHalfwayToMax(m.hunger),
          thirst: healHalfwayToMax(m.thirst),
          health: healHalfwayToMax(m.health),
          vibe: healHalfwayToMax(m.vibe),
          stoned: Math.round(m.stoned / 2),
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

export function applyBadEventVibeToCrew<T extends CrewMeterFields>(crew: T[]): T[] {
  return applyVibeDeltaToActiveCrew(crew, BAD_EVENT_VIBE)
}

export function applyPushThroughToWookFluMembers<
  T extends CrewMeterFields & { wookFlu?: boolean },
>(crew: T[]): T[] {
  return crew.map((m) =>
    m.bailed || !m.wookFlu
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

export function infectMemberWithWookFlu<
  T extends CrewMeterFields & { wookFlu?: boolean },
>(m: T): T {
  if (m.bailed) return m
  return {
    ...m,
    health: adjustMeter(m.health, WOOK_FLU_HEALTH_DAMAGE),
    wookFlu: true,
  }
}

export function infectRandomCrewWithWookFlu<
  T extends CrewMeterFields & { wookFlu?: boolean; id: string; name: string },
>(
  crew: T[],
  seed: number,
): { crew: T[]; infectedName: string | null; flare: boolean } {
  const candidates = activeCrew(crew).filter((c) => !c.wookFlu)
  if (candidates.length === 0) {
    return {
      crew: crew.map((m) =>
        m.bailed || !m.wookFlu
          ? m
          : {
              ...m,
              health: adjustMeter(m.health, WOOK_FLU_HEALTH_DAMAGE),
            },
      ),
      infectedName: null,
      flare: true,
    }
  }
  const target = candidates[Math.abs(seed) % candidates.length]!
  return {
    crew: crew.map((m) => (m.id === target.id ? infectMemberWithWookFlu(m) : m)),
    infectedName: target.name,
    flare: false,
  }
}

export function spreadWookFlu<
  T extends CrewMeterFields & { wookFlu?: boolean; id: string; name: string },
>(crew: T[], seed: number): { crew: T[]; messages: string[] } {
  if (!activeCrew(crew).some((c) => c.wookFlu)) {
    return { crew, messages: [] }
  }

  const messages: string[] = []
  let next = crew
  for (const m of activeCrew(crew)) {
    if (m.wookFlu) continue
    const roll = Math.abs(seed + nameSeed(m.name) * 13) % 100
    if (roll >= WOOK_FLU_SPREAD_CHANCE) continue
    next = next.map((x) => (x.id === m.id ? infectMemberWithWookFlu(x) : x))
    messages.push(
      pickText(
        COPY.crew.wookFluSpread,
        nameSeed(m.name) + seed,
        `${m.name} caught wook flu.`,
        { name: m.name },
      ),
    )
  }
  return { crew: next, messages }
}

export function isWookFluDeath(crew: { bailed: boolean; wookFlu?: boolean }[]): boolean {
  return crew.length > 0 && crew.every((c) => c.bailed && c.wookFlu)
}
