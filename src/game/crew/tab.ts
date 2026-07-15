import { crewStatusChip } from './meters'
import type { GameState } from '../types'

export function crewContextBlurb(state: GameState): string {
  if (state.crewAlert) return state.crewAlert

  const rough = state.crew.some((m) => {
    const chip = crewStatusChip(m)
    return chip.severity === 'critical' || chip.severity === 'warning'
  })
  if (rough) return 'Rough meters — expand a row and feed the squad.'

  return 'Crew meters and care — keep everyone on the bus.'
}
