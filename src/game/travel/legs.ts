import type { TravelLeg } from '../types'

const LEG_LABELS = [
  'County highway',
  'Interstate merge',
  'Toll plaza crawl',
  'Rest stop belt',
  'Two-lane mountain cut',
  'Gas station forecourt',
  'Lot-adjacent back road',
  'Sunrise service road',
]

const LEG_FLAVORS = [
  'Dawn breaks over a Waffle House sign. Coffee smells like salvation.',
  'A van with too many stickers passes you doing exactly the speed limit.',
  'The radio finds a staticy live archive tape for thirty seconds.',
  'Road construction narrows everything to one nervous lane.',
  'You count seventeen tour stickers on a guardrail.',
  'Heat shimmer on asphalt. The next exit promises a grocery store.',
  'Rain on the windshield. Wipers on the one setting that never quite works.',
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Generate abstract Oregon Trail-style legs between two cities */
export function generateTravelLegs(
  seed: number,
  origin: string,
  destination: string,
  count = 4,
): TravelLeg[] {
  const legs: TravelLeg[] = []
  for (let i = 0; i < count; i++) {
    legs.push({
      id: `leg-${seed}-${i}`,
      label: pick(LEG_LABELS, seed + i * 7),
      miles: 80 + (Math.abs(seed + i * 13) % 120),
      flavor: `${pick(LEG_FLAVORS, seed + i * 11)} (${origin} → ${destination})`,
    })
  }
  return legs
}
