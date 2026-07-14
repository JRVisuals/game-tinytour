import type { BetSlot, Setlist, SetlistBet } from './types'

export const BET_SLOT_LABEL: Record<BetSlot, string> = {
  anywhere: 'Anywhere in set (1.5×)',
  opener: 'Opener (2×)',
  closer: 'Closer (2×)',
  encore: 'Encore (3×)',
}

export const BET_MULTIPLIER: Record<BetSlot, number> = {
  anywhere: 1.5,
  opener: 2,
  closer: 2,
  encore: 3,
}

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
