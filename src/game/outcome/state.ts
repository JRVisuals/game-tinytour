import { outcomeReport, type OutcomeSnapshot } from './report'
import type { GameState, OutcomeTone } from '../types'

/** Build the lastOutcome/lastOutcomeTone/lastOutcomeSeq patch for a state spread. */
export function setOutcome(
  s: GameState,
  flavor: string,
  snap?: OutcomeSnapshot,
  tone: OutcomeTone = 'default',
): Pick<GameState, 'lastOutcome' | 'lastOutcomeTone' | 'lastOutcomeSeq'> {
  return {
    lastOutcome: snap ? outcomeReport(flavor, snap) : flavor,
    lastOutcomeTone: tone,
    lastOutcomeSeq: s.lastOutcomeSeq + 1,
  }
}
