import { BALANCE } from '../config'
import { mergeRunIntoCareer } from '../stats'
import type { CrewCareerStats, RunStats, SavedCrew, StarterTier } from '../types'

const E = BALANCE.crewEconomy

export function clampRep(rep: number): number {
  const cap = E.rep.cap
  return Math.max(0, Math.min(cap, Math.round(rep)))
}

export function emptyCareerStats(): CrewCareerStats {
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
    toursCompleted: 0,
    dayJobsTaken: 0,
    shufflesHome: 0,
    betsWon: 0,
    bestVenuesRun: 0,
    bestSongsRun: 0,
  }
}

export function starterRepBonus(tier: StarterTier): number {
  return E.starterTierRep[String(tier)] ?? 0
}

export function computeRunRepGain(
  run: RunStats,
  betsWon: number,
  bankAfter: number,
  tourCompleted: boolean,
): number {
  const R = E.rep
  return (
    run.venuesVisited * R.venue +
    (tourCompleted ? R.tourComplete : 0) +
    betsWon * R.betWon +
    Math.floor(bankAfter / R.bankDivisor) +
    Math.floor(run.milesTraveled / R.milesDivisor)
  )
}

export function applyRepOutcomeDelta(
  rep: number,
  outcome: 'completed' | 'day_job' | 'shuffle',
): number {
  const R = E.rep
  if (outcome === 'day_job') return Math.max(0, rep - R.dayJobPenalty)
  if (outcome === 'shuffle') return Math.max(0, rep - R.shufflePenalty)
  return rep
}

export function updateCrewRep(
  saved: SavedCrew,
  run: RunStats,
  betsWon: number,
  bankAfter: number,
  outcome: 'completed' | 'day_job' | 'shuffle',
  tourCompleted: boolean,
): SavedCrew {
  const career = mergeRunIntoCareer(saved.career, run, outcome, betsWon)
  let rep = saved.rep
  if (outcome !== 'shuffle') {
    rep += computeRunRepGain(run, betsWon, bankAfter, tourCompleted)
  }
  rep = applyRepOutcomeDelta(rep, outcome)
  const clamped = clampRep(rep)
  return {
    ...saved,
    bank: bankAfter,
    career,
    rep: clamped,
    bestRep: Math.max(saved.bestRep, clamped),
  }
}

export function createNewSavedCrew(
  partial: Pick<SavedCrew, 'homeCity' | 'favoriteBandHint' | 'bank' | 'starterTier' | 'members'>,
): SavedCrew {
  const bonus = starterRepBonus(partial.starterTier)
  return {
    ...partial,
    rep: Math.max(0, bonus),
    bestRep: Math.max(0, bonus),
    career: emptyCareerStats(),
    hasVehicle: false,
  }
}
