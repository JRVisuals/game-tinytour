import crewNamesJson from '../../content/copy/crew-names.json'

export type CrewNameGender = 'male' | 'female' | 'neutral'

type CrewNamesData = {
  first: Record<CrewNameGender, string[]>
  last: string[]
  handle: string[]
  full: Record<CrewNameGender, string[]>
}

const NAMES = crewNamesJson as CrewNamesData

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length]!
}

export function rollCrewNameGender(seed: number): CrewNameGender {
  const r = Math.abs(seed) % 3
  return r === 0 ? 'male' : r === 1 ? 'female' : 'neutral'
}

/** One tour kid name from first / last / road-handle pools (jam-flavored). */
export function generateCrewName(seed: number, gender?: CrewNameGender): string {
  const g = gender ?? rollCrewNameGender(seed)

  if (Math.abs(seed * 7) % 4 === 0) {
    const pool = [...(NAMES.full[g] ?? []), ...(NAMES.full.neutral ?? [])]
    if (pool.length) return pick(pool, seed + 1)
  }

  const first = pick(NAMES.first[g], seed + 2)
  const last = pick(NAMES.last, seed + 3)
  const handle = pick(NAMES.handle, seed + 5)
  const pattern = Math.abs(seed * 13) % 5

  if (pattern === 0) return `${first} ${last}`
  if (pattern === 1) return `${first} ${last} ${handle}`
  if (pattern === 2) return `${first} ${handle}`
  if (pattern === 3) return handle
  return `${first} ${last}`
}

/** Unique-ish names for a crew of `count`. */
export function generateCrewNames(count: number, seed: number): string[] {
  const used = new Set<string>()
  const names: string[] = []

  for (let i = 0; i < count; i++) {
    let attempt = 0
    let name = ''
    do {
      name = generateCrewName(
        seed + i * 31 + attempt * 97,
        rollCrewNameGender(seed + i * 17 + attempt),
      )
      attempt++
    } while (used.has(name) && attempt < 24)
    used.add(name)
    names.push(name)
  }

  return names
}
