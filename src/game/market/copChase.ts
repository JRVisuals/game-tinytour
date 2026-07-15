import { BALANCE, COPY, pickText } from '../config'
import type { Resources } from '../types'

const M = BALANCE.markets

export function rollDrugSellCopChase(seed: number): boolean {
  return Math.abs(seed) % 100 < M.drugSellCopChancePercent
}

export function rollBalloonCopChase(seed: number): boolean {
  return Math.abs(seed) % 100 < M.balloons.copChancePercent
}

export function resolveCopChase(
  resources: Resources,
  choice: 'stay' | 'run',
  fine: number,
  seed: number,
): { resources: Resources; message: string } {
  if (choice === 'stay') {
    const next = { ...resources, cash: Math.max(0, resources.cash - fine) }
    return {
      resources: next,
      message: pickText(
        COPY.travelOutcomes.market_cop_chase.stay,
        seed,
        `Paid $${fine} and walked away.`,
        { fine },
      ),
    }
  }

  const drop = M.copChase.runDrop
  let next = { ...resources }
  const lost: string[] = []

  if (next.food > 0 && Math.abs(seed + 3) % 100 < drop.foodChancePercent) {
    const n = 1 + (Math.abs(seed + 5) % drop.foodMax)
    const amount = Math.min(next.food, n)
    next = { ...next, food: next.food - amount }
    lost.push(`${amount} food`)
  }
  if (next.beer > 0 && Math.abs(seed + 7) % 100 < drop.beerChancePercent) {
    const n = 1 + (Math.abs(seed + 9) % drop.beerMax)
    const amount = Math.min(next.beer, n)
    next = { ...next, beer: next.beer - amount }
    lost.push(`${amount} beer`)
  }
  if (next.drugs > 0 && Math.abs(seed + 11) % 100 < drop.drugsChancePercent) {
    const n = 1 + (Math.abs(seed + 13) % drop.drugsMax)
    const amount = Math.min(next.drugs, n)
    next = { ...next, drugs: next.drugs - amount }
    lost.push(`${amount} substances`)
  }

  const stash = lost.length > 0 ? lost.join(', ') : 'nothing'
  return {
    resources: next,
    message: pickText(
      COPY.travelOutcomes.market_cop_chase.run,
      seed,
      lost.length > 0 ? `Ran — dropped ${stash}.` : 'Ran — kept everything.',
      { stash },
    ),
  }
}
