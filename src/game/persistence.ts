import { emptyCareerStats, starterRepBonus } from './crew/rep'
import type { CrewCareerStats, SavedCrew, StarterTier } from './types'

const STORAGE_KEY = 'ljbt_v1'

export interface PersistedData {
  savedCrew: SavedCrew | null
}

function asStarterTier(n: number): StarterTier {
  if (n === 100 || n === 200 || n === 400) return n
  return 200
}

function migrateCareer(
  raw: Record<string, unknown> | undefined,
  legacyLifetime?: Record<string, unknown>,
): CrewCareerStats {
  const base = emptyCareerStats()
  const src = { ...legacyLifetime, ...raw }
  if (!src || typeof src !== 'object') return base
  return {
    ...base,
    venuesVisited: Number(src.venuesVisited) || 0,
    songsHeard: Number(src.songsHeard) || 0,
    bandsSeen: Number(src.bandsSeen) || 0,
    milesTraveled: Number(src.milesTraveled) || 0,
    substancesConsumed: Number(src.substancesConsumed) || 0,
    foodConsumed: Number(src.foodConsumed) || 0,
    beerConsumed: Number(src.beerConsumed) || 0,
    showsMissed: Number(src.showsMissed) || 0,
    runsCompleted: Number(src.runsCompleted) || 0,
    toursCompleted: Number(src.toursCompleted) || 0,
    dayJobsTaken: Number(src.dayJobsTaken) || 0,
    shufflesHome: Number(src.shufflesHome) || 0,
    betsWon: Number(src.betsWon) || 0,
    bestVenuesRun: Number(src.bestVenuesRun) || 0,
    bestSongsRun: Number(src.bestSongsRun) || 0,
  }
}

/** Migrate legacy single-name / budget crew saves */
function normalizeSavedCrew(raw: unknown, legacyLifetime?: unknown): SavedCrew | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  let members: SavedCrew['members'] = []
  if (Array.isArray(o.members)) {
    members = (o.members as SavedCrew['members']).map((m) => ({
      name: m.name,
      kit: m.kit,
    }))
  } else if (typeof o.name === 'string') {
    members = [{ name: o.name }]
  } else {
    return null
  }

  const bank = Number(o.bank ?? o.budget) || 200
  const starterTier = asStarterTier(Number(o.starterTier ?? bank))
  const career = migrateCareer(
    o.career as Record<string, unknown> | undefined,
    legacyLifetime as Record<string, unknown> | undefined,
  )
  const rep = Number(o.rep)
  const bestRep = Number(o.bestRep)

  return {
    homeCity: (o.homeCity as string) ?? 'Burlington, VT',
    favoriteBandHint: (o.favoriteBandHint as string) ?? '',
    bank,
    starterTier,
    rep: Number.isFinite(rep) ? rep : Math.max(0, starterRepBonus(starterTier)),
    bestRep: Number.isFinite(bestRep)
      ? bestRep
      : Math.max(0, starterRepBonus(starterTier)),
    career,
    hasVehicle: Boolean(o.hasVehicle),
    members,
  }
}

export function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { savedCrew: null }
    }
    const parsed = JSON.parse(raw) as {
      savedCrew?: unknown
      lifetimeStats?: unknown
    }
    return {
      savedCrew: normalizeSavedCrew(parsed.savedCrew, parsed.lifetimeStats),
    }
  } catch {
    return { savedCrew: null }
  }
}

export function savePersisted(data: PersistedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
