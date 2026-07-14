import { CITIES } from '../cities'
import type { Band, Tour, TourStop } from '../types'
import { generateBandCatalog, generateShowSetlist } from './songs'

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

/** Generate tour with catalog + pre-rolled setlists per stop */
export function generateTour(band: Band, seed: number, stopCount = 5): Tour {
  const catalog = generateBandCatalog(seed)
  const usedBustOuts: string[] = []
  const starts = Math.abs(seed) % CITIES.length
  const stops: TourStop[] = []

  for (let i = 0; i < stopCount; i++) {
    const city = pick([...CITIES], starts + i * 3)
    const venue = pick(VENUES, seed + i * 11)
    const { setlist, newBustOut } = generateShowSetlist(catalog, seed + i * 53, usedBustOuts)
    if (newBustOut) usedBustOuts.push(newBustOut)
    stops.push({
      city,
      venue,
      dayLabel: `Night ${i + 1}`,
      plannedSetlist: setlist,
    })
  }

  return {
    band,
    catalog,
    stops,
    currentStopIndex: 0,
    usedBustOuts,
  }
}
