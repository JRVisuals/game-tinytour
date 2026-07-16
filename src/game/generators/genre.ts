import genresJson from '../../content/copy/genres.json'

export type GenreId = 'dead' | 'phish' | 'goose' | 'mixed'

export const GENRE_OPTIONS: { value: GenreId; label: string }[] = genresJson.genres.map((g) => ({
  value: g.id as GenreId,
  label: g.label,
}))

export const DEFAULT_GENRE: GenreId = 'mixed'

interface GenreData {
  id: string
  label: string
  band: { intros: string[]; adjectives: string[]; nouns: string[] }
  songs: { openers: string[]; middles: string[]; connectors: string[]; closers: string[] }
}

const GENRE_MAP = new Map<string, GenreData>(
  genresJson.genres.map((g) => [g.id, g as GenreData]),
)

export function getGenre(id: GenreId): GenreData {
  return GENRE_MAP.get(id) ?? GENRE_MAP.get('mixed')!
}
