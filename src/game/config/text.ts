/** Pick a line from a pool; seed selects variant deterministically */
export function pickText(
  pool: string[] | undefined,
  seed: number,
  fallback: string,
  vars?: Record<string, string | number>,
): string {
  const line = pool?.length ? pool[Math.abs(seed) % pool.length]! : fallback
  return formatText(line, vars)
}

export function formatText(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key]
    return val != null ? String(val) : `{${key}}`
  })
}

/** Plural helper: {s} -> '' or 's' based on count */
export function pluralS(count: number): string {
  return count === 1 ? '' : 's'
}

export function pickTextWithPlural(
  pool: string[] | undefined,
  seed: number,
  fallback: string,
  vars: Record<string, string | number>,
): string {
  const withPlural = { ...vars, s: pluralS(Number(vars.legs ?? vars.left ?? 1)) }
  return pickText(pool, seed, fallback, withPlural)
}
