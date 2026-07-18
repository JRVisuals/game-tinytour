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

function getDrugTier(drugs: number) {
  const tiers = BALANCE.pulledOver.drugRiskTiers
  // Walk tiers descending by minDrugs to find the highest matching tier
  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tiers[i]!
    if (drugs >= t.minDrugs && (t.maxDrugs == null || drugs <= t.maxDrugs)) {
      return t
    }
  }
  return null // no drugs
}

export function resolvePulledOver(
  resources: Resources,
  crew: CrewMember[],
  choiceId: string | undefined,
  rngSeed: number,
): PulledOverResolution {
  const PO = BALANCE.pulledOver
  const lying = choiceId === 'lie'
  const wasted = isDrivingWasted(maxActiveStoned(crew))
  const drugTier = getDrugTier(resources.drugs)
  const hasDrugs = resources.drugs > 0

  // Apply drug quantity risk malus — more drugs = lower effective roll = worse outcomes
  const rollMalus = drugTier?.rollMalus ?? 0
  const rawRoll = Math.abs(rngSeed) % PO.rollMod
  const roll = Math.max(0, rawRoll - rollMalus)

  // Dealing tier: always loses drugs, much higher bust chance
  const isDealing = drugTier?.alwaysDrugsGone === true

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
  const bust = (msg: string) => ({
    resources: next,
    outcome: 'busted' as PulledOutcome,
    wasted,
    endRun: { message: msg },
  })
  const bustMsg = (w: boolean) => pulledOverResult(choiceId, 'busted', w, rngSeed, isDealing)

  if (wasted) {
    const w = lying ? PO.wasted.lie : PO.wasted.truth
    if (w.bustBelow != null && roll < w.bustBelow) {
      return bust(bustMsg(true))
    }
    if ((isDealing || hasDrugs) && w.drugsGoneBelow != null && roll < w.drugsGoneBelow) {
      applyDrugsGone(w.drugsFine ?? 80)
    } else if (w.fine != null) {
      applyFine(w.fine)
    }
    if (lying && w.fine != null && outcome === 'clean') {
      applyFine(w.fine)
      if (hasDrugs) { next = { ...next, drugs: 0 }; outcome = 'drugs_gone' }
    }
  } else {
    const b = lying ? PO.sober.lie : PO.sober.truth
    if (lying && b.triggerBelow != null && roll < b.triggerBelow) {
      applyFine(b.fine ?? 75)
      if (hasDrugs) { next = { ...next, drugs: 0 }; outcome = 'drugs_gone' }
      if (b.bustBelow != null && roll < b.bustBelow) {
        return bust(bustMsg(false))
      }
    } else if (!lying) {
      if (isDealing) {
        // Always lose drugs when clearly dealing; bust if roll is really bad
        applyDrugsGone((b.drugsFine ?? 50) * 2)
        if (roll < 2) {
          return bust(bustMsg(false))
        }
      } else if (hasDrugs && b.drugsGoneBelow != null && roll < b.drugsGoneBelow) {
        applyDrugsGone(b.drugsFine ?? 50)
      } else if (b.fineBelow != null && roll < b.fineBelow) {
        applyFine(b.fine ?? 25)
      }
    }
  }

  return { resources: next, outcome, wasted }
}
