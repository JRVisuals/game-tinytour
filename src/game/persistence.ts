import type { LifetimeStats, SavedCrew } from './types'

const STORAGE_KEY = 'ljbt_v1'

export interface PersistedData {
  savedCrew: SavedCrew | null
  lifetimeStats: LifetimeStats
}

export function emptyLifetimeStats(): LifetimeStats {
  return {
    venuesVisited: 0,
    songsHeard: 0,
    bandsSeen: 0,
    milesTraveled: 0,
    substancesConsumed: 0,
    foodConsumed: 0,
    beerConsumed: 0,
    showsMissed: 0,
    runsCompleted: 0,
    dayJobsTaken: 0,
    shufflesHome: 0,
  }
}

/** Migrate legacy single-name crew saves */
function normalizeSavedCrew(raw: unknown): SavedCrew | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.members)) {
    return raw as SavedCrew
  }
  if (typeof o.name === 'string') {
    return {
      homeCity: (o.homeCity as string) ?? 'Burlington, VT',
      favoriteBandHint: (o.favoriteBandHint as string) ?? '',
      budget: (o.budget as number) ?? 200,
      members: [{ name: o.name }],
    }
  }
  return null
}

export function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { savedCrew: null, lifetimeStats: emptyLifetimeStats() }
    }
    const parsed = JSON.parse(raw) as PersistedData
    return {
      savedCrew: normalizeSavedCrew(parsed.savedCrew),
      lifetimeStats: { ...emptyLifetimeStats(), ...parsed.lifetimeStats },
    }
  } catch {
    return { savedCrew: null, lifetimeStats: emptyLifetimeStats() }
  }
}

export function savePersisted(data: PersistedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
