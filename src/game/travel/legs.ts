import { estimateMiles, legCountForDistance } from '../cities'
import type { RoadsideType, TravelLeg } from '../types'

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

const ROADSIDE_TYPES: RoadsideType[] = ['truck_stop', 'rest_area', 'farmers_market']

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Generate 1–4 legs based on pseudo-distance between cities */
export function generateTravelLegs(
  seed: number,
  origin: string,
  destination: string,
): TravelLeg[] {
  const miles = estimateMiles(origin, destination)
  const count = legCountForDistance(miles, seed)
  const milesPerLeg = Math.floor(miles / count)
  const legs: TravelLeg[] = []

  for (let i = 0; i < count; i++) {
    const hasRoadside = i > 0 && Math.abs(seed + i * 5) % 3 !== 0
    legs.push({
      id: `leg-${seed}-${i}`,
      label: pick(LEG_LABELS, seed + i * 7),
      miles: milesPerLeg + (Math.abs(seed + i * 13) % 40),
      flavor: `${pick(LEG_FLAVORS, seed + i * 11)} (${origin} → ${destination})`,
      roadside: hasRoadside ? pick(ROADSIDE_TYPES, seed + i * 17) : null,
    })
  }
  return legs
}

export const ROADSIDE_LABELS: Record<RoadsideType, string> = {
  truck_stop: 'Truck stop',
  rest_area: 'Rest area',
  farmers_market: 'Roadside farmers market',
}

export const ROADSIDE_COPY: Record<RoadsideType, string> = {
  truck_stop:
    'Neon beer signs and questionable breakfast burritos. Lot kids trade stickers by the diesel pumps.',
  rest_area:
    'Picnic tables, vending machines, and the eternal smell of sunscreen on asphalt.',
  farmers_market:
    'Local honey, kettle corn, and a guy selling tie-dye out of a Subaru.',
}
