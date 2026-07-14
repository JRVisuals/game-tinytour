import type { Band, Tour, TourStop } from '../types'

const CITIES = [
  'Burlington, VT',
  'Portland, ME',
  'Albany, NY',
  'Asbury Park, NJ',
  'Philadelphia, PA',
  'Charlottesville, VA',
  'Asheville, NC',
  'Athens, GA',
  'Nashville, TN',
  'Chicago, IL',
  'Madison, WI',
  'Minneapolis, MN',
  'Boulder, CO',
  'Salt Lake City, UT',
  'Portland, OR',
  'Seattle, WA',
  'San Francisco, CA',
  'Santa Barbara, CA',
  'Phoenix, AZ',
  'Austin, TX',
]

const VENUES = [
  'The Lot Shed',
  'Riverfront Pavilion',
  'Union Theater',
  'Warehouse 9',
  'Hillside Amphitheater',
  'Capitol Ballroom',
  'Crossroads Club',
  'State Fairgrounds',
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Placeholder tour-route generator */
export function generateTour(band: Band, seed: number, stopCount = 5): Tour {
  const starts = Math.abs(seed) % CITIES.length
  const stops: TourStop[] = []
  for (let i = 0; i < stopCount; i++) {
    const city = pick(CITIES, starts + i * 3)
    const venue = pick(VENUES, seed + i * 11)
    stops.push({
      city,
      venue,
      dayLabel: `Night ${i + 1}`,
    })
  }
  return {
    band,
    stops,
    currentStopIndex: 0,
  }
}
