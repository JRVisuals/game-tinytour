import { COPY } from '../config'

export function clampRep(rep: number): number {
  return Math.max(0, Math.min(999, Math.round(rep)))
}

export function crewRepTierName(rep: number): string {
  const score = clampRep(rep)
  const tiers = COPY.crewRepTitles.tiers
  let name = tiers[0]?.name ?? 'Tour Kids'
  for (const tier of tiers) {
    if (score >= tier.min) name = tier.name
  }
  return name
}

/** e.g. "Tour Kids on the Block (153)" */
export function crewRepLabel(rep: number): string {
  const score = clampRep(rep)
  return `${crewRepTierName(score)} (${score})`
}
