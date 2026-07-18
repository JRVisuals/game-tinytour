import { BALANCE, COPY } from '../config'
import { estimateMiles, legCountForDistance } from '../cities'
import type { RoadsideType, TravelLeg } from '../types'

const T = COPY.travelLegs

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

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
      label: pick(T.legLabels, seed + i * 7),
      miles: milesPerLeg + (Math.abs(seed + i * 13) % 40),
      flavor: pick(T.legFlavors, seed + i * 11),
      roadside: hasRoadside
        ? (pick(Object.keys(T.roadside), seed + i * 17) as RoadsideType)
        : null,
    })
  }
  return legs
}

export const ROADSIDE_LABELS: Record<RoadsideType, string> = {
  truck_stop: T.roadside.truck_stop.label,
  rest_area: T.roadside.rest_area.label,
  farmers_market: T.roadside.farmers_market.label,
  supermarket: T.roadside.supermarket.label,
}

export const ROADSIDE_COPY: Record<RoadsideType, string> = {
  truck_stop: T.roadside.truck_stop.copy,
  rest_area: T.roadside.rest_area.copy,
  farmers_market: T.roadside.farmers_market.copy,
  supermarket: T.roadside.supermarket.copy,
}

export function pushThroughCost(
  travel: { legs: TravelLeg[]; currentLegIndex: number },
  hasVehicle: boolean,
): { legs: number; food: number; gas: number; miles: number } {
  const remaining = travel.legs.slice(travel.currentLegIndex)
  const miles = remaining.reduce((sum, leg) => sum + leg.miles, 0)
  const pt = BALANCE.travel.pushThrough
  return {
    legs: remaining.length,
    food: remaining.length * pt.foodPerLeg,
    gas: hasVehicle ? remaining.length * pt.gasPerLeg : 0,
    miles,
  }
}
