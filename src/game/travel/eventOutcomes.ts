import { BALANCE, COPY, pickText, pickTextWithPlural } from '../config'

type PulledOutcome = 'clean' | 'fine' | 'drugs_gone' | 'busted'

function pulledOverPoolKey(
  choiceId: string | undefined,
  outcome: PulledOutcome,
): string {
  if (outcome === 'busted') return 'busted'
  const choice = choiceId === 'lie' ? 'lie' : 'truth'
  const suffix =
    outcome === 'drugs_gone' ? 'drugs_gone' : outcome === 'fine' ? 'fine' : 'clean'
  return `${choice}_${suffix}`
}

export function balloonBuyMessage(seed: number): string {
  return pickText(COPY.travelOutcomes.consume.balloons, seed, 'Balloons — vibe up.')
}

export function wookFluResult(
  choiceId: string | undefined,
  seed: number,
  vars?: { name?: string; flare?: boolean },
): string {
  const key = choiceId === 'rest' ? 'rest' : 'push'
  if (vars?.flare && key === 'push') {
    return pickText(COPY.travelOutcomes.wook_flu.flare, seed, 'Wook flu flares.')
  }
  return pickText(
    COPY.travelOutcomes.wook_flu[key],
    seed,
    'Wook flu ran its course.',
    vars?.name ? { name: vars.name } : undefined,
  )
}

export function soloEventResult(eventKey: string, seed = 0): string {
  const pool =
    COPY.travelOutcomes.solo[eventKey] ?? COPY.travelOutcomes.solo.default
  return pickText(pool, seed, 'You dealt with it and kept rolling.')
}

export function pulledOverResult(
  choiceId: string | undefined,
  outcome: PulledOutcome,
  wasted = false,
  seed = 0,
): string {
  const branch = wasted
    ? COPY.travelOutcomes.pulled_over.wasted
    : COPY.travelOutcomes.pulled_over.sober
  const key = pulledOverPoolKey(choiceId, outcome)
  const pool = branch[key]
  const fallbacks: Record<string, string> = {
    busted: 'Cuffs. Court date. Tour over.',
    lie_drugs_gone: 'Stash gone. Fines paid.',
    lie_fine: 'Wallet lighter.',
    lie_clean: 'You lived. Barely.',
    truth_drugs_gone: 'Confiscated. Moving on.',
    truth_fine: 'Fine written.',
    truth_clean: 'Waved on.',
  }
  return pickText(pool, seed, fallbacks[key] ?? 'Pulled over. Survived.')
}

export function bathroomFindResult(
  choiceId: string | undefined,
  laced = false,
  seed = 0,
): string {
  const key = laced ? 'laced' : choiceId === 'toss_it' ? 'toss_it' : 'try_it'
  const pool = COPY.travelOutcomes.bathroom_find[key]
  const fallbacks: Record<string, string> = {
    toss_it: 'Tossed it. No regrets.',
    try_it: 'Stash +2. Wasted now.',
    laced: 'That shit was laced. You go home and rethink your life.',
  }
  return pickText(pool, seed, fallbacks[key] ?? 'Bathroom incident.')
}

export function intelTipResult(
  eventKey: 'hitchhiker_intel' | 'lot_rumor' | 'encore_whisper',
  choiceId: string | undefined,
  opts: {
    songTitle?: string
    slot?: 'opener' | 'encore' | 'anywhere' | 'closer'
    seed?: number
    missing?: 'food' | 'beer' | 'drugs'
  },
): string {
  const { songTitle, slot = 'opener', seed = 0, missing } = opts
  const copy = COPY.travelOutcomes[eventKey]
  const slotLabel =
    slot === 'encore' ? 'encore' : slot === 'anywhere' ? 'the set' : 'opener'

  if (missing) {
    const pool = copy[`no_${missing}`]
    if (pool) {
      return pickText(pool, seed, `No ${missing} to trade.`)
    }
  }
  if (choiceId === 'decline') {
    return pickText(copy.decline, seed, 'Intel passed.')
  }
  if (choiceId === 'trade_food' || choiceId === 'trade_beer' || choiceId === 'trade_drugs') {
    return pickText(
      copy[choiceId],
      seed,
      `Tip acquired: "${songTitle ?? 'a song'}" ${slotLabel}. Place your own bet when you're ready.`,
      { song: songTitle ?? 'a song', slot: slotLabel },
    )
  }
  return pickText(copy.default, seed, 'Intel unclaimed.')
}

export function consumeFeedback(
  item: 'eat' | 'drink' | 'substances' | 'rest' | 'hotel_crash',
  name: string,
  seed: number,
  vars?: Record<string, string | number>,
): string {
  const pool = COPY.travelOutcomes.consume[item]
  const fallbacks: Record<string, string> = {
    eat: `${name} ate.`,
    drink: `${name} drank a beer.`,
    substances: `${name} consumed substances.`,
    rest: 'Crew rested.',
    hotel_crash: 'Hotel crash — crew restored.',
  }
  return pickText(pool, seed, fallbacks[item], { name, ...vars })
}

export function travelFeedback(
  key: keyof (typeof COPY.travelOutcomes)['travel'],
  seed: number,
  vars: Record<string, string | number>,
): string {
  const pool = COPY.travelOutcomes.travel[key]
  const fallback = Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')
  return pickTextWithPlural(pool, seed, fallback, vars)
}

export function showRecapLine(
  key: 'made_it' | 'chaos_gate' | 'missed',
  seed: number,
  vars: Record<string, string | number>,
): string {
  const pool = COPY.travelOutcomes.show[key]
  return pickText(pool, seed, '', vars)
}

export function runEndLine(key: 'shuffle' | 'all_bailed', seed: number): string {
  return pickText(COPY.travelOutcomes.run[key], seed, 'Tour over.')
}

export function wookFluDeathMessage(): string {
  const block = COPY.travelOutcomes.run.wook_flu_death
  return `${block.title}\n${block.subtitle}`
}

export function shuffleHomeBlockedMessage(seed: number): string {
  return pickText(
    COPY.travelOutcomes.run.shuffle_blocked,
    seed,
    'Finish at least one show before you can go home.',
  )
}

export const BATHROOM_BAG_LACED_CHANCE =
  BALANCE.eventEffects.bathroom_find.try_it.lacedChancePercent
