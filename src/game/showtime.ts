/** Lot-phase turn budget before gate call */
export function showtimeTurnsLabel(turns: number): string {
  if (turns <= 0) return 'Showtime — gate call'
  return `${turns} turn${turns === 1 ? '' : 's'} until showtime`
}

export function isLotTurnPhase(phase: string): boolean {
  return phase === 'shakedown' || phase === 'location'
}
