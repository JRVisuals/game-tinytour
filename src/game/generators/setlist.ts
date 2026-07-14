import type { Setlist } from '../types'

/** Fragments mashed across Goose / Phish / Grateful Dead catalogs */
const PHISH = [
  'Tweezer',
  'Harry Hood',
  'Ghost',
  'Divided Sky',
  'Bathtub Gin',
  'Run Like an Antelope',
  'Sample in a Jar',
  'Fluffhead',
  'Mike\'s Song',
  'Weekapaug Groove',
]

const GOOSE = [
  'Hungersite',
  'Arcadia',
  'Elizabeth',
  'So Ready',
  'Madhuvan',
  'Turned Clouds',
  'Into the Myst',
  'Hot Tea',
  'Your Direction',
  'Butter Rum',
]

const DEAD = [
  'Scarlet Begonias',
  'Fire on the Mountain',
  'Dark Star',
  'China Cat Sunflower',
  'Terrapin Station',
  'Truckin\'',
  'Ripple',
  'Uncle John\'s Band',
  'Sugar Magnolia',
  'Touch of Grey',
]

const CONNECTORS = ['>', '→', 'into', 'tease >', 'unfinished >', '']

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

function mashSong(seed: number): string {
  const roll = Math.abs(seed) % 10
  const a = pick(PHISH, seed)
  const b = pick(GOOSE, seed * 3 + 1)
  const c = pick(DEAD, seed * 7 + 2)
  const conn = pick(CONNECTORS, seed * 11)

  if (roll < 3) return conn ? `${a} ${conn} ${b}` : `${a} / ${b}`
  if (roll < 6) return conn ? `${b} ${conn} ${c}` : `${b} (${c} tease)`
  if (roll < 8) return `${c} > ${a} Jam`
  return `${pick(DEAD, seed)} > ${pick(PHISH, seed + 5)} > ${pick(GOOSE, seed + 9)}`
}

/** Procedural setlist — mashup names, betting hooks later */
export function generateSetlist(seed: number, length = 8): Setlist {
  const songs: string[] = []
  for (let i = 0; i < length - 1; i++) {
    songs.push(mashSong(seed + i * 17))
  }
  songs.push(`E: ${mashSong(seed * 41 + 99)}`)
  return { songs }
}
