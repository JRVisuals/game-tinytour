/** Shared city list — index used for pseudo-distance */
export const CITIES = [
  'Burlington, VT',
  'Portland, ME',
  'Albany, NY',
  'Buffalo, NY',
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
] as const

export function cityIndex(city: string): number {
  const i = CITIES.indexOf(city as (typeof CITIES)[number])
  return i >= 0 ? i : Math.abs(hashCity(city)) % CITIES.length
}

function hashCity(city: string): number {
  return city.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

/** Rough miles between cities (abstract) */
export function estimateMiles(origin: string, destination: string): number {
  const diff = Math.abs(cityIndex(origin) - cityIndex(destination))
  const wrap = Math.min(diff, CITIES.length - diff)
  return 120 + wrap * 85
}

/** 1–4 legs from distance + jitter */
export function legCountForDistance(miles: number, seed: number): number {
  const base = miles < 200 ? 1 : miles < 350 ? 2 : miles < 550 ? 3 : 4
  const jitter = (Math.abs(seed) % 100) < 25 ? 1 : 0
  return Math.min(4, Math.max(2, base + jitter - (seed % 3 === 0 && base > 1 ? 1 : 0)))
}
