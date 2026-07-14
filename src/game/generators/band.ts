import type { Band } from '../types'

const ADJECTIVES = [
  'Cosmic',
  'Sticky',
  'Electric',
  'Velvet',
  'Fuzzy',
  'Astral',
  'Greasy',
  'Midnight',
  'Floating',
  'Crooked',
]

const NOUNS = [
  'Biscuits',
  'Lotus',
  'Nectar',
  'Wagons',
  'Mushrooms',
  'Riders',
  'Ghosts',
  'Gypsies',
  'Pointers',
  'Beacons',
]

const SCENES = [
  'northeast barn circuit',
  'west coast shed run',
  'midwest theater swing',
  'southern amphitheater stretch',
  'mountain town club crawl',
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Placeholder band-name generator — swap for richer tables later */
export function generateBand(seed: number): Band {
  const adj = pick(ADJECTIVES, seed)
  const noun = pick(NOUNS, seed * 7 + 3)
  const scene = pick(SCENES, seed * 13 + 1)
  return {
    name: `The ${adj} ${noun}`,
    homeScene: scene,
  }
}
