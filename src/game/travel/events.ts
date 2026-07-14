import type { TravelEvent } from '../types'

const SOLO_EVENTS: Omit<TravelEvent, 'id'>[] = [
  {
    title: 'Miracle ticket',
    body: 'A kind stranger presses a miracle into your hand. “Someone didn’t show. Don’t ask.”',
  },
  {
    title: 'Flat tire',
    body: 'The beater lists hard. You’re on the shoulder swapping rubber in questionable light.',
  },
  {
    title: 'Robbed',
    body: 'Someone rummaged while you slept at a rest stop. Your stash took a hit.',
  },
  {
    title: 'Hitchhiker with intel',
    body: 'A hitchhiker knows a lot about tonight’s venue. They want a beer for directions.',
  },
  {
    title: 'Wook flu',
    body: 'The crew is wrecked. Fever dreams of rail-riding unicorns. You need rest or this run is over.',
  },
]

const CHOICE_EVENTS: Omit<TravelEvent, 'id'>[] = [
  {
    title: 'Rest stop bathroom find',
    body: 'A baggie sits on the tile behind the toilet paper. Could be anything. Could be nothing.',
    choices: [
      { id: 'try_it', label: 'Try it' },
      { id: 'toss_it', label: 'Toss it — not today' },
    ],
  },
  {
    title: 'Lot rumor',
    body: 'Someone swears the band opens with a deep cut tonight. Wanna bet $20 on the opener?',
    choices: [
      { id: 'bet_yes', label: 'Bet $20' },
      { id: 'bet_no', label: 'Keep your cash' },
    ],
  },
]

function pick<T>(list: T[], n: number): T {
  return list[Math.abs(Math.floor(n)) % list.length]!
}

/** ~35% chance of an event when advancing a leg */
export function maybeRollTravelEvent(seed: number): TravelEvent | null {
  if (Math.abs(seed) % 100 > 35) return null
  const useChoice = seed % 3 === 0
  const pool = useChoice ? CHOICE_EVENTS : SOLO_EVENTS
  const template = pick(pool, seed)
  return { ...template, id: `evt-${seed}` }
}
