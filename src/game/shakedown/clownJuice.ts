import { BALANCE, COPY, pickText } from '../config'

const C = BALANCE.shakedown.clownJuiceMafia

export type ClownJuiceChoice = 'retail' | 'deal'

export function clownJuicePrice(choice: ClownJuiceChoice): number {
  return choice === 'retail' ? C.retailPrice : C.dealPrice
}

export function clownJuiceDoses(choice: ClownJuiceChoice): number {
  return choice === 'retail' ? 1 : C.dealDoses
}

export function rollClownJuicePunch(seed: number): boolean {
  return Math.abs(seed) % 100 < C.punchChancePercent
}

export function clownJuiceBuyMessage(choice: ClownJuiceChoice, seed: number, punched?: boolean): string {
  const pool = COPY.travelOutcomes.clown_juice
  if (choice === 'retail') {
    return pickText(pool.retail, seed, 'Balloons — mafia retail price.')
  }
  if (punched) {
    return pickText(pool.deal_punched, seed, 'Deal went sideways — fist to mouth.')
  }
  return pickText(pool.deal, seed, 'Three for ten. Crew is floating.')
}
