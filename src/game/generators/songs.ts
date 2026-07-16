import type { BandSong, BandCatalog, Setlist, SongTier } from '../types'
import { DEFAULT_GENRE, getGenre, type GenreId } from './genre'

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** Build a song title from 4 genre pools.
 *  Patterns (vary by seed):
 *  - opener closer                 ("Dark Star", "Fire Mountain")
 *  - opener middle connector closer ("Fire on the Mountain")
 *  - opener middle closer          ("Dark Star Groove")
 *  - opener > middle               ("Tweezer > Ghost")
 *  - opener middle (tease)         ("Ghost Jam (Dark Star tease)")
 */
function makeTitle(pools: GenreData['songs'], seed: number, variant = 0): string {
  const s = seed + variant * 17
  const pattern = Math.abs(s) % 6
  const op = pick(pools.openers, s)
  const mid = pick(pools.middles, s * 3 + 7)
  const con = pick(pools.connectors, s * 5 + 11)
  const cl = pick(pools.closers, s * 7 + 13)
  const op2 = pick(pools.openers, s * 11 + 19)

  switch (pattern) {
    case 0: return `${op} ${cl}`
    case 1: return `${op} ${mid} ${con} ${cl}`
    case 2: return `${op} ${mid} ${cl}`
    case 3: return `${op} > ${op2}`
    case 4: return `${op} ${mid} (${op2} tease)`
    default: return `${op} ${cl} Jam`
  }
}

type GenreData = ReturnType<typeof getGenre>

/** ~20 songs: hot / deep_cut / bust_out tiers — each title unique */
export function generateBandCatalog(bandSeed: number, genre: GenreId = DEFAULT_GENRE): BandCatalog {
  const pools = getGenre(genre).songs
  const songs: BandSong[] = []
  const usedTitles = new Set<string>()
  const tiers: SongTier[] = [
    ...Array(8).fill('hot' as SongTier),
    ...Array(10).fill('deep_cut' as SongTier),
    ...Array(2).fill('bust_out' as SongTier),
  ]

  for (let i = 0; i < 20; i++) {
    let title = ''
    for (let attempt = 0; attempt < 64; attempt++) {
      const candidate = makeTitle(pools, bandSeed + i * 19, attempt)
      if (!usedTitles.has(candidate)) {
        title = candidate
        break
      }
    }
    if (!title) title = `${pick(pools.openers, bandSeed + i * 41)} ${pick(pools.closers, bandSeed + i * 43)}`
    usedTitles.add(title)
    songs.push({ id: `song-${bandSeed}-${i}`, title, tier: tiers[i]! })
  }
  return { songs }
}

const TIER_WEIGHT: Record<SongTier, number> = {
  hot: 10,
  deep_cut: 4,
  bust_out: 1,
}

/** Pick 6 songs for a show; bust_out max once per tour unless already used */
export function generateShowSetlist(
  catalog: BandCatalog,
  seed: number,
  usedBustOuts: string[],
): { setlist: Setlist; newBustOut: string | null } {
  const picked: BandSong[] = []
  const pool = [...catalog.songs]
  let newBustOut: string | null = null

  for (let slot = 0; slot < 6; slot++) {
    const available = pool.filter((s) => {
      if (s.tier === 'bust_out' && usedBustOuts.includes(s.id)) return false
      if (picked.some((p) => p.id === s.id)) return false
      return true
    })
    if (available.length === 0) break

    const weights = available.map((s) => {
      let w = TIER_WEIGHT[s.tier]
      if (slot === 0 && s.tier === 'hot') w *= 2
      if (slot === 5 && s.tier !== 'bust_out') w *= 1.5
      if (s.tier === 'bust_out' && slot > 0) w *= 0.5
      return w
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let roll = Math.abs(seed + slot * 37) % total
    let chosen = available[0]!
    for (let i = 0; i < available.length; i++) {
      roll -= weights[i]!
      if (roll < 0) { chosen = available[i]!; break }
    }
    picked.push(chosen)
    if (chosen.tier === 'bust_out') newBustOut = chosen.id
  }

  const titles = picked.map((s) => s.title)
  if (titles.length >= 2) {
    titles[titles.length - 1] = `E: ${titles[titles.length - 1]}`
  }
  return { setlist: { songs: titles, songIds: picked.map((s) => s.id) }, newBustOut }
}

export function songsByTier(catalog: BandCatalog, tier: SongTier): BandSong[] {
  return catalog.songs.filter((s) => s.tier === tier)
}
