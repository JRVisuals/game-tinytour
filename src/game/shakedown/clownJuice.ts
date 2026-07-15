import { BALANCE, COPY, pickText } from '../config'
import type { Resources } from '../types'

const C = BALANCE.shakedown.clownJuiceMafia

export type ClownJuiceChoice = 'retail' | 'deal'

export function clownJuicePrice(choice: ClownJuiceChoice): number {
  return choice === 'retail' ? C.retailPrice : C.dealPrice
}

export function clownJuiceDoses(choice: ClownJuiceChoice): number {
  return choice === 'retail' ? 1 : C.dealDoses
}

export function canAttemptClownJuiceDeal(resources: Resources): boolean {
  return resources.cash >= C.dealPrice
}

export function rollClownJuiceBeerDeal(seed: number): boolean {
  return Math.abs(seed) % 100 < C.beerDealChancePercent
}

export function rollClownJuicePunch(seed: number): boolean {
  return Math.abs(seed) % 100 < C.punchChancePercent
}

export type ClownJuiceDealKind = 'beer' | 'cash'

export interface ClownJuiceDealResolution {
  kind: ClownJuiceDealKind
  punched: boolean
}

/** $10 always; beer (42%) also spends one can and skips Mr NO DEALS' punch. */
export function resolveClownJuiceDeal(
  resources: Resources,
  seed: number,
): ClownJuiceDealResolution | null {
  if (resources.cash < C.dealPrice) return null
  if (resources.beer > 0 && rollClownJuiceBeerDeal(seed)) {
    return { kind: 'beer', punched: false }
  }
  return { kind: 'cash', punched: rollClownJuicePunch(seed + 9) }
}

export function clownJuiceBuyMessage(
  choice: ClownJuiceChoice,
  seed: number,
  opts?: { punched?: boolean; beerDeal?: boolean },
): string {
  const pool = COPY.travelOutcomes.clown_juice
  if (choice === 'retail') {
    return pickText(pool.retail, seed, 'Balloons — mafia retail price.')
  }
  if (opts?.beerDeal) {
    return pickText(pool.deal_beer, seed, 'Ten bucks and a beer — three balloons, no knuckles.')
  }
  if (opts?.punched) {
    return pickText(pool.deal_punched, seed, 'Deal went sideways — fist to mouth.')
  }
  return pickText(pool.deal, seed, 'Three for ten. Crew is floating.')
}
