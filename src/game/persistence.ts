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
    runsCompleted: 0,
    dayJobsTaken: 0,
  }
}

export function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { savedCrew: null, lifetimeStats: emptyLifetimeStats() }
    }
    const parsed = JSON.parse(raw) as PersistedData
    return {
      savedCrew: parsed.savedCrew ?? null,
      lifetimeStats: { ...emptyLifetimeStats(), ...parsed.lifetimeStats },
    }
  } catch {
    return { savedCrew: null, lifetimeStats: emptyLifetimeStats() }
  }
}

export function savePersisted(data: PersistedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
