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
  return resources.cash >= C.dealPrice || resources.beer > 0
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

/** Beer trade first (no punch); otherwise cash deal with optional punch. */
export function resolveClownJuiceDeal(
  resources: Resources,
  seed: number,
): ClownJuiceDealResolution | null {
  if (resources.beer > 0 && rollClownJuiceBeerDeal(seed)) {
    return { kind: 'beer', punched: false }
  }
  if (resources.cash >= C.dealPrice) {
    return { kind: 'cash', punched: rollClownJuicePunch(seed + 9) }
  }
  return null
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
    return pickText(pool.deal_beer, seed, 'One beer, three balloons. No knuckles.')
  }
  if (opts?.punched) {
    return pickText(pool.deal_punched, seed, 'Deal went sideways — fist to mouth.')
  }
  return pickText(pool.deal, seed, 'Three for ten. Crew is floating.')
}
