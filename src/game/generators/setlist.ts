import type { Setlist } from '../types'

const OPENERS = [
  'Sample in a Jar',
  'Ghost',
  'First Tube',
  'Carini',
  'Bathtub Gin',
  'Free',
  'Run Like an Antelope',
  'Possum',
  'Stash',
  'Tweezer',
]

const JAMS = [
  'Type II soup',
  'ambient wash',
  'funk breakdown',
  'peak rocker',
  'page feature',
  'spacey glue',
]

const ENCORES = [
  'Character Zero',
  'Slave to the Traffic Light',
  'Waste',
  'Busy That Way',
  'Harry Hood',
  'You Enjoy Myself',
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Placeholder setlist generator — later: real catalogs + betting hooks */
export function generateSetlist(seed: number, length = 8): Setlist {
  const songs: string[] = []
  for (let i = 0; i < length - 1; i++) {
    const base = pick(OPENERS, seed + i * 5)
    const flavor = pick(JAMS, seed + i * 9)
    songs.push(i % 3 === 2 ? `${base} > ${flavor}` : base)
  }
  songs.push(`E: ${pick(ENCORES, seed * 3)}`)
  return { songs }
}
