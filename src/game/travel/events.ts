import type { BandCatalog, TravelEvent } from '../types'
import { songsByTier } from '../generators/songs'

const SOLO_EVENTS: Omit<TravelEvent, 'id'>[] = [
  {
    title: 'Miracle ticket',
    body: 'A kind stranger presses a miracle into your hand. “Someone didn’t show. Don’t ask questions.”',
    eventType: 'solo',
  },
  {
    title: 'Flat tire',
    body: 'The beater lists hard. You’re on the shoulder swapping rubber in light you wouldn’t describe as legal.',
    eventType: 'solo',
  },
  {
    title: 'Robbed',
    body: 'Someone rummaged while you slept at a rest stop. Your stash took a hit. The universe offers no receipt.',
    eventType: 'solo',
  },
  {
    title: 'Hitchhiker with intel',
    body: 'A hitchhiker knows too much about tonight’s venue. They want a beer for directions that might be real.',
    eventType: 'solo',
  },
  {
    title: 'Wook flu',
    body: 'The crew is wrecked. Fever dreams of rail-riding unicorns. Rest now or HR gets your application.',
    eventType: 'solo',
  },
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** ~35% chance of an event when advancing a leg */
export function maybeRollTravelEvent(
  seed: number,
  catalog?: BandCatalog,
): TravelEvent | null {
  if (Math.abs(seed) % 100 > 35) return null

  const roll = seed % 10
  if (roll === 0) {
    return {
      id: `evt-${seed}`,
      title: 'Pulled over',
      body: 'Blue lights. The officer asks how many are in the vehicle and whether you know why you were weaving. Your crew goes quiet in that specific way.',
      eventType: 'pulled_over',
      choices: [
        { id: 'truth', label: 'Tell the truth' },
        { id: 'lie', label: 'Lie through your teeth' },
      ],
    }
  }

  if (roll <= 2 && catalog) {
    const deepCuts = songsByTier(catalog, 'deep_cut')
    const rumor = pick(deepCuts, seed)
    return {
      id: `evt-${seed}`,
      title: 'Lot rumor',
      body: `Someone swears ${rumor.title} opens tonight — a deep cut, they say. Bet $20 it hits the set?`,
      eventType: 'lot_rumor',
      rumorSongId: rumor.id,
      choices: [
        { id: 'bet_yes', label: 'Bet $20 on it' },
        { id: 'bet_no', label: 'Keep your cash' },
      ],
    }
  }

  if (roll === 3) {
    return {
      id: `evt-${seed}`,
      title: 'Rest stop bathroom find',
      body: 'A baggie sits on the tile behind the toilet paper. Could be anything. Could be a federal case. Could be nothing.',
      eventType: 'bathroom_find',
      choices: [
        { id: 'try_it', label: 'Try it' },
        { id: 'toss_it', label: 'Toss it — not today' },
      ],
    }
  }

  const template = pick(SOLO_EVENTS, seed)
  return { ...template, id: `evt-${seed}` }
}
