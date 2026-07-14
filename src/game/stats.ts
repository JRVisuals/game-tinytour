import type { LifetimeStats, RunStats } from './types'

export function emptyRunStats(): RunStats {
  return {
    venuesVisited: 0,
    songsHeard: 0,
    bandsSeen: 0,
    milesTraveled: 0,
    substancesConsumed: 0,
    foodConsumed: 0,
    beerConsumed: 0,
    showsMissed: 0,
  }
}

export function mergeRunIntoLifetime(
  lifetime: LifetimeStats,
  run: RunStats,
  outcome: 'completed' | 'day_job' | 'shuffle',
): LifetimeStats {
  return {
    venuesVisited: lifetime.venuesVisited + run.venuesVisited,
    songsHeard: lifetime.songsHeard + run.songsHeard,
    bandsSeen: lifetime.bandsSeen + run.bandsSeen,
    milesTraveled: lifetime.milesTraveled + run.milesTraveled,
    substancesConsumed: lifetime.substancesConsumed + run.substancesConsumed,
    foodConsumed: lifetime.foodConsumed + run.foodConsumed,
    beerConsumed: lifetime.beerConsumed + run.beerConsumed,
    showsMissed: lifetime.showsMissed + run.showsMissed,
    runsCompleted: lifetime.runsCompleted + (outcome === 'completed' ? 1 : 0),
    dayJobsTaken: lifetime.dayJobsTaken + (outcome === 'day_job' ? 1 : 0),
    shufflesHome: lifetime.shufflesHome + (outcome === 'shuffle' ? 1 : 0),
  }
}

export function patchRunStats(run: RunStats, patch: Partial<RunStats>): RunStats {
  return { ...run, ...patch }
}
