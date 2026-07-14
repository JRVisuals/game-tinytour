import travelEventsJson from '../../content/travel-events.json'
import { songsByTier } from '../generators/songs'
import type { BandCatalog, TravelEvent, TravelEventType } from '../types'

interface EventTemplate {
  id: string
  eventType: TravelEventType
  title: string
  body: string
  weight: number
  choices?: { id: string; label: string }[]
}

const templates = travelEventsJson.events as EventTemplate[]

function pickWeighted(pool: EventTemplate[], seed: number): EventTemplate {
  const total = pool.reduce((a, e) => a + e.weight, 0)
  let roll = Math.abs(seed) % total
  for (const e of pool) {
    roll -= e.weight
    if (roll < 0) return e
  }
  return pool[0]!
}

/** ~35% chance of an event when advancing a leg */
export function maybeRollTravelEvent(
  seed: number,
  catalog?: BandCatalog,
): TravelEvent | null {
  if (Math.abs(seed) % 100 > 35) return null

  const roll = seed % 100
  if (roll < 12) {
    const t = templates.find((e) => e.id === 'pulled_over')!
    return { ...t, id: `evt-${seed}`, eventKey: t.id }
  }
  if (roll < 22 && catalog) {
    const t = templates.find((e) => e.id === 'lot_rumor')!
    const deepCuts = songsByTier(catalog, 'deep_cut')
    const rumor = deepCuts[Math.abs(seed) % deepCuts.length]!
    return {
      id: `evt-${seed}`,
      eventKey: t.id,
      title: t.title,
      body: t.body.replace('{song}', rumor.title),
      eventType: t.eventType,
      choices: t.choices,
      rumorSongId: rumor.id,
    }
  }

  const soloPool = templates.filter(
    (e) => e.eventType === 'solo' || e.eventType === 'bathroom_find',
  )
  const template = pickWeighted(soloPool, seed)
  return {
    id: `evt-${seed}`,
    eventKey: template.id,
    title: template.title,
    body: template.body,
    eventType: template.eventType,
    choices: template.choices,
  }
}

export function getEventTemplate(id: string): EventTemplate | undefined {
  return templates.find((e) => e.id === id)
}
