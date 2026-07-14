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

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

function mashTitle(seed: number): string {
  const roll = seed % 5
  const a = pick(PHISH, seed)
  const b = pick(GOOSE, seed * 3)
  const c = pick(DEAD, seed * 7)
  if (roll === 0) return `${a} > ${b}`
  if (roll === 1) return `${b} (${c} tease)`
  if (roll === 2) return `${c} Jam`
  if (roll === 3) return `${a} / ${c}`
  return `${b} into ${a}`
}

/** ~20 songs: hot / deep_cut / bust_out tiers */
export function generateBandCatalog(bandSeed: number): BandCatalog {
  const songs: BandSong[] = []
  const tiers: SongTier[] = [
    ...Array(8).fill('hot' as SongTier),
    ...Array(10).fill('deep_cut' as SongTier),
    ...Array(2).fill('bust_out' as SongTier),
  ]
  for (let i = 0; i < 20; i++) {
    songs.push({
      id: `song-${bandSeed}-${i}`,
      title: mashTitle(bandSeed + i * 19),
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
