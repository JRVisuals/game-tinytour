import type { BandSong, BandCatalog, Setlist, SongTier } from '../types'

const PHISH = [
  'Tweezer', 'Harry Hood', 'Ghost', 'Divided Sky', 'Bathtub Gin',
  'Run Like an Antelope', 'Sample in a Jar', 'Fluffhead', 'Stash', 'Free',
]
const GOOSE = [
  'Hungersite', 'Arcadia', 'Elizabeth', 'So Ready', 'Madhuvan',
  'Turned Clouds', 'Into the Myst', 'Hot Tea', 'Your Direction', 'Butter Rum',
]
const DEAD = [
  'Scarlet Begonias', 'Fire on the Mountain', 'Dark Star', 'China Cat Sunflower',
  'Terrapin Station', 'Truckin\'', 'Ripple', 'Sugar Magnolia', 'Touch of Grey',
  'Uncle John\'s Band',
]

const ALL_SONGS = [...PHISH, ...GOOSE, ...DEAD]
const TITLE_SUFFIXES = [' (live)', ' Reprise', ' (acoustic)', ' (slow)']

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

function mashTitle(seed: number, variant = 0): string {
  const roll = (seed + variant * 17) % 5
  const a = pick(PHISH, seed + variant)
  const b = pick(GOOSE, seed * 3 + variant * 5)
  const c = pick(DEAD, seed * 7 + variant * 11)
  if (roll === 0) return `${a} > ${b}`
  if (roll === 1) return `${b} (${c} tease)`
  if (roll === 2) return `${c} Jam`
  if (roll === 3) return `${a} > ${c}`
  return `${b} > ${a}`
}

function fallbackTitle(seed: number, used: Set<string>): string {
  for (let i = 0; i < ALL_SONGS.length * (TITLE_SUFFIXES.length + 1); i++) {
    const base = pick(ALL_SONGS, seed + i * 3)
    const suffix = i < ALL_SONGS.length ? '' : TITLE_SUFFIXES[(i - ALL_SONGS.length) % TITLE_SUFFIXES.length]!
    const title = `${base}${suffix}`
    if (!used.has(title)) return title
  }
  return pick(ALL_SONGS, seed + 999)
}

/** ~20 songs: hot / deep_cut / bust_out tiers — each title appears once */
export function generateBandCatalog(bandSeed: number): BandCatalog {
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
      const candidate = mashTitle(bandSeed + i * 19, attempt)
      if (!usedTitles.has(candidate)) {
        title = candidate
        break
      }
    }
    if (!title) {
      title = fallbackTitle(bandSeed + i * 41, usedTitles)
    }
    usedTitles.add(title)
    songs.push({
      id: `song-${bandSeed}-${i}`,
      title,
      tier: tiers[i]!,
    })
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
      if (roll < 0) {
        chosen = available[i]!
        break
      }
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
