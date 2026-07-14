import { BALANCE } from '../config'
import { isDrivingWasted, maxActiveStoned } from '../crew/meters'
import type { CrewMember, Resources } from '../types'
import { pulledOverResult } from './eventOutcomes'

type PulledOutcome = 'clean' | 'fine' | 'drugs_gone' | 'busted'

export interface PulledOverResolution {
  resources: Resources
  outcome: PulledOutcome
  wasted: boolean
  endRun?: { message: string }
}

export function resolvePulledOver(
  resources: Resources,
  crew: CrewMember[],
  choiceId: string | undefined,
  rngSeed: number,
): PulledOverResolution {
  const PO = BALANCE.pulledOver
  const lying = choiceId === 'lie'
  const hasDrugs = resources.drugs > 0
  const wasted = isDrivingWasted(maxActiveStoned(crew))
  const roll = Math.abs(rngSeed) % PO.rollMod
  let outcome: PulledOutcome = 'clean'
  let next = { ...resources }

  const applyFine = (amount: number) => {
    next = { ...next, cash: Math.max(0, next.cash - amount) }
    outcome = 'fine'
  }
  const applyDrugsGone = (fine: number) => {
    next = { ...next, drugs: 0, cash: Math.max(0, next.cash - fine) }
    outcome = 'drugs_gone'
  }

  if (wasted) {
    const w = lying ? PO.wasted.lie : PO.wasted.truth
    if (lying && w.bustBelow != null && roll < w.bustBelow) {
      return {
        resources: next,
        outcome: 'busted',
        wasted,
        endRun: { message: pulledOverResult(choiceId, 'busted', true, rngSeed) },
      }
    }
    if (!lying && w.bustBelow != null && roll < w.bustBelow) {
      return {
        resources: next,
        outcome: 'busted',
        wasted,
        endRun: { message: pulledOverResult(choiceId, 'busted', true, rngSeed) },
      }
    }
    if (hasDrugs && w.drugsGoneBelow != null && roll < w.drugsGoneBelow) {
      applyDrugsGone(w.drugsFine ?? 80)
    } else if (w.fine != null) {
      applyFine(w.fine)
    }
    if (lying && w.fine != null && outcome === 'clean') {
      applyFine(w.fine)
      if (hasDrugs) {
        next = { ...next, drugs: 0 }
        outcome = 'drugs_gone'
      }
    }
  } else {
    const b = lying ? PO.sober.lie : PO.sober.truth
    if (lying && b.triggerBelow != null && roll < b.triggerBelow) {
      applyFine(b.fine ?? 75)
      if (hasDrugs) {
        next = { ...next, drugs: 0 }
        outcome = 'drugs_gone'
      }
      if (b.bustBelow != null && roll < b.bustBelow) {
        return {
          resources: next,
          outcome: 'busted',
          wasted,
          endRun: { message: pulledOverResult(choiceId, 'busted', false, rngSeed) },
        }
      }
    } else if (!lying && hasDrugs && b.drugsGoneBelow != null && roll < b.drugsGoneBelow) {
      applyDrugsGone(b.drugsFine ?? 50)
    } else if (!lying && b.fineBelow != null && roll < b.fineBelow) {
      applyFine(b.fine ?? 25)
    }
  }

  return { resources: next, outcome, wasted }
}
