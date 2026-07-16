import type { Band } from '../types'
import { DEFAULT_GENRE, getGenre, type GenreId } from './genre'

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

const SCENES = [
  'northeast barn circuit',
  'west coast shed run',
  'midwest theater swing',
  'southern amphitheater stretch',
  'mountain town club crawl',
]

/** 1-3 word band name from genre pools.
 *  Structure: [intro] [adjective] noun
 *  - 1 word: just noun
 *  - 2 words: adj + noun (50%) or intro + noun (50%, intro never blank)
 *  - 3 words: intro + adj + noun (intro never blank)
 */
export function generateBand(seed: number, genre: GenreId = DEFAULT_GENRE): Band {
  const g = getGenre(genre)
  const { intros, adjectives, nouns } = g.band

  const noun = pick(nouns, seed * 7 + 3)
  const adj = pick(adjectives, seed * 13 + 5)
  // intros include "" as a valid blank entry
  const nonBlankIntros = intros.filter((i) => i !== '')
  const intro = pick(nonBlankIntros, seed * 11 + 7)

  const length = (() => {
    const r = Math.abs(seed * 17 + 2) % 10
    if (r < 3) return 1    // 30% — just noun
    if (r < 7) return 2    // 40% — intro+noun or adj+noun
    return 3               // 30% — intro+adj+noun
  })()

  let name: string
  if (length === 1) {
    name = noun
  } else if (length === 2) {
    const useIntro = Math.abs(seed * 31) % 2 === 0
    name = useIntro ? `${intro} ${noun}` : `${adj} ${noun}`
  } else {
    name = `${intro} ${adj} ${noun}`
  }

  const scene = pick(SCENES, seed * 19 + 1)
  return { name, homeScene: scene }
}
