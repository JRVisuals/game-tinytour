export type HungerLevel = 'full' | 'hungry' | 'starving'
export type ThirstLevel = 'full' | 'thirsty' | 'parched'
export type HealthLevel = 'healthy' | 'tired' | 'wook_flu'
export type VibeLevel = 'high' | 'chill' | 'low'

export const HUNGER_LABEL: Record<HungerLevel, string> = {
  full: 'Full',
  hungry: 'Hungry',
  starving: 'Starving',
}

export const THIRST_LABEL: Record<ThirstLevel, string> = {
  full: 'Hydrated',
  thirsty: 'Thirsty',
  parched: 'Parched',
}

export const HEALTH_LABEL: Record<HealthLevel, string> = {
  healthy: 'Healthy',
  tired: 'Tired',
  wook_flu: 'Wook flu',
}

export const VIBE_LABEL: Record<VibeLevel, string> = {
  high: 'High',
  chill: 'Chill',
  low: 'Low',
}

const HUNGER_ORDER: HungerLevel[] = ['full', 'hungry', 'starving']
const THIRST_ORDER: ThirstLevel[] = ['full', 'thirsty', 'parched']

export function defaultMeters() {
  return {
    hunger: 'full' as HungerLevel,
    thirst: 'full' as ThirstLevel,
    health: 'healthy' as HealthLevel,
    vibe: 'chill' as VibeLevel,
    roughTurns: 0,
    bailed: false,
  }
}

export function isRough(member: {
  hunger: HungerLevel
  thirst: ThirstLevel
  health: HealthLevel
  vibe: VibeLevel
}): boolean {
  return (
    member.hunger === 'starving' ||
    member.thirst === 'parched' ||
    member.health === 'wook_flu' ||
    member.vibe === 'low'
  )
}

export function worsenHunger(h: HungerLevel): HungerLevel {
  const i = HUNGER_ORDER.indexOf(h)
  return HUNGER_ORDER[Math.min(i + 1, 2)]!
}

export function improveHunger(h: HungerLevel): HungerLevel {
  const i = HUNGER_ORDER.indexOf(h)
  return HUNGER_ORDER[Math.max(i - 1, 0)]!
}

export function worsenThirst(t: ThirstLevel): ThirstLevel {
  const i = THIRST_ORDER.indexOf(t)
  return THIRST_ORDER[Math.min(i + 1, 2)]!
}

export function improveThirst(t: ThirstLevel): ThirstLevel {
  const i = THIRST_ORDER.indexOf(t)
  return THIRST_ORDER[Math.max(i - 1, 0)]!
}

export function worsenHealth(h: HealthLevel): HealthLevel {
  if (h === 'healthy') return 'tired'
  if (h === 'tired') return 'wook_flu'
  return 'wook_flu'
}

export function improveHealth(h: HealthLevel): HealthLevel {
  if (h === 'wook_flu') return 'tired'
  if (h === 'tired') return 'healthy'
  return 'healthy'
}

export function worsenVibe(v: VibeLevel): VibeLevel {
  if (v === 'high') return 'chill'
  if (v === 'chill') return 'low'
  return 'low'
}

export function improveVibe(v: VibeLevel): VibeLevel {
  if (v === 'low') return 'chill'
  if (v === 'chill') return 'high'
  return 'high'
}

/** Pass time — hunger/thirst creep; returns updated crew + bail messages */
export function tickCrewMeters<
  T extends {
    hunger: HungerLevel
    thirst: ThirstLevel
    health: HealthLevel
    vibe: VibeLevel
    roughTurns: number
    bailed: boolean
    name: string
  },
>(crew: T[]): { crew: T[]; bailMessages: string[] } {
  const bailMessages: string[] = []
  const next = crew.map((m) => {
    if (m.bailed) return m
    let member = {
      ...m,
      hunger: worsenHunger(m.hunger),
      thirst: worsenThirst(m.thirst),
    }
    const rough = isRough(member)
    let roughTurns = rough ? member.roughTurns + 1 : 0
    let bailed = member.bailed
    if (roughTurns >= 3) {
      bailed = true
      bailMessages.push(`${member.name} bailed — couldn’t hang anymore.`)
      roughTurns = 0
    }
    return { ...member, roughTurns, bailed }
  })
  return { crew: next, bailMessages }
}

export function activeCrew<T extends { bailed: boolean }>(crew: T[]): T[] {
  return crew.filter((c) => !c.bailed)
}
