import { BALANCE } from '../config'
import type { MemberKitId } from '../types'

const E = BALANCE.crewEconomy

const ARCHETYPES: MemberKitId[] = [
  'ticket_fairy',
  'driver',
  'stash',
  'cooler',
  'hustler',
]

export function rollMemberKit(seed: number): MemberKitId {
  const h = Math.abs(seed)
  if (h % 100 >= E.archetypeChance) return 'flat'
  return ARCHETYPES[h % ARCHETYPES.length]!
}

export const MEMBER_KIT_LABELS: Record<MemberKitId, string> = {
  flat: 'Flat kit (+food, +beer, +$20)',
  ticket_fairy: 'Ticket fairy (+2 tickets)',
  driver: 'Driver (vehicle + gas)',
  stash: 'Stash (+substances)',
  cooler: 'Cooler (+food & beer)',
  hustler: 'Hustler (+$40 cash)',
}
