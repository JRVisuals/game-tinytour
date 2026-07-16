import { BALANCE } from '../config'
import type { Resources, SavedCrew, SavedCrewMember } from '../types'
import type { MemberKitId } from '../types'
import { emptyCareerStats } from './rep'
import { rollMemberKit } from './starterKit'

const E = BALANCE.crewEconomy

export function liquidateResources(resources: Resources): number {
  const L = E.liquidate
  return (
    resources.food * (L.food ?? 0) +
    resources.beer * (L.beer ?? 0) +
    resources.drugs * (L.drugs ?? 0) +
    resources.tickets * (L.tickets ?? 0) +
    resources.gas * (L.gas ?? 0) +
    resources.cash
  )
}

export function dayJobStipend(crewSize: number): number {
  return crewSize * E.dayJobStipendPerMember
}

export function canStartTour(bank: number, supplies: Pick<Resources, 'food' | 'beer'>): boolean {
  return bank > 0 && supplies.food + supplies.beer > 0
}

function applyKitToResources(
  resources: Resources,
  kitId: MemberKitId,
): Resources {
  const next = { ...resources }

  if (kitId === 'flat') {
    next.food += E.flatMemberKit.food
    next.beer += E.flatMemberKit.beer
    next.cash += E.flatMemberKit.cash
    return next
  }

  const arch = E.archetypes[kitId]
  if (!arch) return next
  if (arch.food) next.food += arch.food
  if (arch.beer) next.beer += arch.beer
  if (arch.cash) next.cash += arch.cash
  if (arch.drugs) next.drugs += arch.drugs
  if (arch.tickets) next.tickets += arch.tickets
  if (arch.gas) next.gas += arch.gas
  if (arch.vehicle) next.hasVehicle = true
  return next
}

function kitForMember(
  member: SavedCrewMember,
  index: number,
  seed: number,
): MemberKitId {
  if (index === 0) return 'flat'
  return member.kit ?? rollMemberKit(seed + index * 13)
}

/** Run-start supplies: bank cash + leader flat + member kits. */
export function buildRunResources(saved: SavedCrew, seed: number): Resources {
  let resources: Resources = {
    cash: saved.bank,
    food: E.leaderKit.food,
    beer: E.leaderKit.beer,
    drugs: 0,
    tickets: 0,
    gas: 0,
    hasVehicle: saved.hasVehicle,
  }
  resources.cash += E.leaderKit.cash

  saved.members.forEach((member, i) => {
    if (i === 0) return
    const kit = kitForMember(member, i, seed)
    resources = applyKitToResources(resources, kit)
  })

  return resources
}

export function previewRunSupplies(
  saved: SavedCrew | null,
  members: SavedCrewMember[],
  memberKits: (MemberKitId | undefined)[],
  bank: number,
  hasVehicle: boolean,
  seed: number,
): Pick<Resources, 'food' | 'beer'> {
  if (!saved && members.length === 0) {
    return { food: E.leaderKit.food, beer: E.leaderKit.beer }
  }
  const draft: SavedCrew = {
    homeCity: '',
    genre: 'mixed',
    bank,
    starterTier: 200,
    rep: 0,
    bestRep: 0,
    career: emptyCareerStats(),
    hasVehicle,
    members: members.map((m, i) => ({
      name: m.name,
      kit: i === 0 ? undefined : (memberKits[i] ?? m.kit),
    })),
  }
  const r = buildRunResources(draft, seed)
  return { food: r.food, beer: r.beer }
}
