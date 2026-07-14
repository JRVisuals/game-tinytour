import { BALANCE } from './config'
import type { BetSlot, Setlist, SetlistBet } from './types'

const B = BALANCE.betting

export const BET_SLOT_SHORT: Record<BetSlot, string> = {
  anywhere: 'Anywhere',
  opener: 'Opener',
  closer: 'Closer',
  encore: 'Encore',
}

export const BET_SLOT_LABEL: Record<BetSlot, string> = {
  anywhere: 'Anywhere in set (1.5×)',
  opener: 'Opener (2×)',
  closer: 'Closer (2×)',
  encore: 'Encore (3×)',
}

export const BET_MULTIPLIER: Record<BetSlot, number> = {
  anywhere: B.multipliers.anywhere!,
  opener: B.multipliers.opener!,
  closer: B.multipliers.closer!,
  encore: B.multipliers.encore!,
}

export const MAX_ACTIVE_BETS = B.maxActiveBets
export const BET_UI_AMOUNTS = B.uiAmounts

export function resolveSetlistBet(bet: SetlistBet, setlist: Setlist): boolean {
  const ids = setlist.songIds ?? []
  const idx = ids.indexOf(bet.songId)
  if (idx < 0) return false
  switch (bet.slot) {
    case 'anywhere':
      return true
    case 'opener':
      return idx === 0
    case 'closer':
      return ids.length >= 2 && idx === ids.length - 2
    case 'encore':
      return idx === ids.length - 1
    default:
      return false
  }
}

export function payoutForBet(bet: SetlistBet, hit: boolean): number {
  if (!hit) return 0
  return Math.floor(bet.amount * BET_MULTIPLIER[bet.slot])
}
