import type { CrewCareerStats, RunStats } from './types'

export function emptyRunStats(): RunStats {
  return {
    venuesVisited: 0,
    songsHeard: 0,
    bandsSeen: 0,
    milesTraveled: 0,
    substancesConsumed: 0,
    balloonsHuffed: 0,
    foodConsumed: 0,
    beerConsumed: 0,
    showsMissed: 0,
  }
}

export function patchRunStats(run: RunStats, patch: Partial<RunStats>): RunStats {
  return { ...run, ...patch }
}

/** Block liquidating starter kits — need at least one show night first. */
export function canShuffleHome(run: RunStats): boolean {
  return run.venuesVisited + run.showsMissed >= 1
}

export function mergeRunIntoCareer(
  career: CrewCareerStats,
  run: RunStats,
  outcome: 'completed' | 'day_job' | 'shuffle',
  betsWon: number,
): CrewCareerStats {
  return {
    venuesVisited: career.venuesVisited + run.venuesVisited,
    songsHeard: career.songsHeard + run.songsHeard,
    bandsSeen: career.bandsSeen + run.bandsSeen,
    milesTraveled: career.milesTraveled + run.milesTraveled,
    substancesConsumed: career.substancesConsumed + run.substancesConsumed,
    balloonsHuffed: career.balloonsHuffed + run.balloonsHuffed,
    foodConsumed: career.foodConsumed + run.foodConsumed,
    beerConsumed: career.beerConsumed + run.beerConsumed,
    showsMissed: career.showsMissed + run.showsMissed,
    runsCompleted: career.runsCompleted + (outcome === 'completed' ? 1 : 0),
    toursCompleted: career.toursCompleted + (outcome === 'completed' ? 1 : 0),
    dayJobsTaken: career.dayJobsTaken + (outcome === 'day_job' ? 1 : 0),
    shufflesHome: career.shufflesHome + (outcome === 'shuffle' ? 1 : 0),
    betsWon: career.betsWon + betsWon,
    bestVenuesRun: Math.max(career.bestVenuesRun, run.venuesVisited),
    bestSongsRun: Math.max(career.bestSongsRun, run.songsHeard),
  }
}
