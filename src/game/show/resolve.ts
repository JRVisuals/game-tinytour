/**
 * Pure state transforms for show entry, finish, miss, and post-show shakedown.
 * Extracted from GameContext.
 */
import { payoutForBet, resolveSetlistBet } from '../betting'
import {
  activeCrew,
  applyShowVibeToCrew,
  applyVibeDeltaToActiveCrew,
  BET_LOSS_VIBE,
  BET_WIN_VIBE,
  infectRandomCrewWithWookFlu,
  venueEntryBlockedMessage,
} from '../crew/meters'
import { appendStory, storyEvent, storyPostShow } from '../crew/tourStory'
import { DEFAULT_GENRE, type GenreId } from '../generators/genre'
import { generateBand } from '../generators'
import { ensureMarket } from '../marketCache'
import { formatResourceDeltas } from '../outcome/report'
import { setOutcome } from '../outcome/state'

import { applyMissShowHustleEffects, rollMissShowHustleEvent } from '../hustle/missShowEvents'
import {
  applyShakedownEventEffects,
  rollPostShowShakedownEvent,
} from '../shakedown/events'
import { patchRunStats } from '../stats'
import { showRecapFlavor, showRecapLine } from '../travel/eventOutcomes'
import type { GameState, ShowBetResult } from '../types'
import type { OutcomeSnapshot } from '../outcome/report'

function resolveBets(
  s: GameState,
  setlist: GameState['lastSetlist'],
  recap: string,
  options?: { attendShow?: boolean },
) {
  const attendShow = options?.attendShow ?? true
  let resources = { ...s.resources }
  let crew = s.crew.map((c) => ({ ...c }))
  let recapOut = recap
  let runBetsWon = s.runBetsWon
  const betResults: ShowBetResult[] = []

  for (const bet of s.activeSetlistBets) {
    if (!attendShow || !setlist) {
      betResults.push({ songId: bet.songId, songTitle: bet.songTitle, slot: bet.slot, outcome: 'void', payout: 0 })
      continue
    }
    const hit = resolveSetlistBet(bet, setlist)
    const pay = payoutForBet(bet, hit)
    betResults.push({ songId: bet.songId, songTitle: bet.songTitle, slot: bet.slot, outcome: hit ? 'hit' : 'miss', payout: pay })
    if (hit) {
      resources = { ...resources, cash: resources.cash + pay }
      runBetsWon += 1
      crew = applyVibeDeltaToActiveCrew(crew, BET_WIN_VIBE)
    } else {
      crew = applyVibeDeltaToActiveCrew(crew, BET_LOSS_VIBE)
    }
  }

  return { resources, recapOut, runBetsWon, crew, betResults }
}

export function resolveEnterShow(s: GameState): GameState {
  const blocked = venueEntryBlockedMessage(s.crew)
  if (blocked) {
    return { ...s, crewAlert: blocked, ...setOutcome(s, blocked, undefined, 'error') }
  }
  return { ...s, phase: 'show', currentLocation: 'venue', crewAlert: null }
}

const SNEAK_SHUT_OUT_CHANCE = 35      // % chance of being turned away
const SNEAK_BUST_BASE_CHANCE = 15      // % base chance of drug search if shut out
const SNEAK_BUST_PER_DRUG = 8         // additional % per drug unit carried

const SHUT_OUT_LINES = [
  'Security clocked you at the gate. Not tonight.',
  'Too sketchy — door guy shook his head and pointed you back to the lot.',
  'Almost made it. A flashlight and a stern look sent you back.',
  'They weren\'t letting anyone through without a wristband. You tried.',
]

const BUST_LINES = [
  'Security patted you down at the gate. Found the stash. Pay up or run.',
  'Didn\'t make it past the metal detector. They found something. Pay up or run.',
  'The door guy called over a cop. Pockets were full. Pay up or run.',
]

export function resolveFinishShow(s: GameState): GameState {
  if (!s.tour) return s
  const blocked = venueEntryBlockedMessage(s.crew)
  if (blocked) {
    return { ...s, crewAlert: blocked, ...setOutcome(s, blocked, undefined, 'error') }
  }
  const stop = s.tour.stops[s.tour.currentStopIndex]
  if (!stop) return s

  const setlist = stop.plannedSetlist
  const active = activeCrew(s.crew)
  const ticketsOk = s.resources.tickets >= active.length

  // Sneak attempt risk rolls
  if (!ticketsOk) {
    const seed = Math.abs(s.rngSeed + stop.venue.length * 7)
    const shutOutRoll = seed % 100
    if (shutOutRoll < SNEAK_SHUT_OUT_CHANCE) {
      // Shut out — check for drug bust
      const drugs = s.resources.drugs ?? 0
      const bustChance = SNEAK_BUST_BASE_CHANCE + drugs * SNEAK_BUST_PER_DRUG
      const bustRoll = (seed >> 3) % 100
      if (drugs > 0 && bustRoll < bustChance) {
        const msg = BUST_LINES[(seed >> 5) % BUST_LINES.length]!
        return {
          ...s,
          marketCopChase: { fine: 45, proceeds: 0, reason: 'drug_sell' },
          ...setOutcome(s, msg, undefined, 'error'),
        }
      }
      const shutMsg = SHUT_OUT_LINES[(seed >> 2) % SHUT_OUT_LINES.length]!
      return resolveMissShow({ ...s, rngSeed: seed }, shutMsg)
    }
  }

  let recap = ticketsOk
    ? showRecapLine('made_it', s.rngSeed, { venue: stop.venue })
    : showRecapLine('sneak', s.rngSeed, { venue: stop.venue })
  const flavor = showRecapFlavor(s.rngSeed + 11)
  if (flavor) recap = `${recap} ${flavor}`

  const { resources, recapOut, runBetsWon, crew: crewAfterBets, betResults } = resolveBets(s, setlist, recap)
  let finalResources = resources
  if (ticketsOk) {
    finalResources = { ...finalResources, tickets: Math.max(0, finalResources.tickets - active.length) }
  }

  const runStats = patchRunStats(s.runStats, {
    venuesVisited: s.runStats.venuesVisited + 1,
    songsHeard: s.runStats.songsHeard + setlist.songs.length,
    showsSeen: s.runStats.showsSeen + 1,
    bandsSeen: s.runStats.bandsSeen === 0 ? 1 : s.runStats.bandsSeen,
  })
  const crew = ticketsOk ? applyShowVibeToCrew(crewAfterBets) : crewAfterBets

  return {
    ...s,
    crew,
    resources: finalResources,
    lastSetlist: setlist,
    postShowRecap: recapOut,
    lastShowBetResults: betResults,
    missShowHustleEvent: null,
    runStats,
    runBetsWon,
    tourStory: appendStory(s.tourStory, storyPostShow(s.rngSeed, stop.venue, setlist.songs.length, false)),
    activeSetlistBets: [],
    phase: 'post_show',
  }
}

export function resolveMissShow(s: GameState, overrideRecap?: string): GameState {
  if (!s.tour) return s
  const stop = s.tour.stops[s.tour.currentStopIndex]
  const seed = s.rngSeed + 37
  const hustle = rollMissShowHustleEvent(seed, s.crew)
  let recap = overrideRecap ?? showRecapLine('missed', seed, { venue: stop?.venue ?? 'the show' })
  const flavor = showRecapFlavor(seed + 19)
  if (flavor) recap = `${recap} ${flavor}`

  const { resources: afterBets, recapOut, runBetsWon, crew: crewAfterBets, betResults } = resolveBets(
    s, null, recap, { attendShow: false },
  )
  let resources = afterBets
  const resourcesBeforeHustle = { ...resources }
  if (hustle) resources = applyMissShowHustleEffects(resources, hustle.id)

  const hustleLoot = hustle ? formatResourceDeltas(resourcesBeforeHustle, resources) : ''
  const runStats = patchRunStats(s.runStats, { showsMissed: s.runStats.showsMissed + 1 })
  const hustleEvent = hustle ? { ...hustle, loot: hustleLoot || undefined } : null
  const hustleSnap: OutcomeSnapshot | undefined =
    hustle && hustleLoot ? { resourcesBefore: resourcesBeforeHustle, resourcesAfter: resources } : undefined

  return {
    ...s,
    crew: crewAfterBets,
    resources,
    rngSeed: seed,
    postShowRecap: recapOut,
    lastShowBetResults: betResults,
    runStats,
    runBetsWon,
    missShowHustleEvent: hustleEvent,
    postShowShakedownEvent: null,
    tourStory: hustle
      ? appendStory(appendStory(s.tourStory, storyPostShow(seed, stop?.venue ?? 'the show', 0, true)), storyEvent(seed + 3, hustle.title, hustle.body))
      : appendStory(s.tourStory, storyPostShow(seed, stop?.venue ?? 'the show', 0, true)),
    activeSetlistBets: [],
    lastSetlist: null,
    phase: 'post_show',
    ...(hustleSnap ? setOutcome(s, hustle!.title, hustleSnap) : {}),
  }
}

export function resolveEnterPostShowShakedown(s: GameState): GameState {
  if (!s.tour) return s
  const seed = s.rngSeed + 41
  const genre = (s.genre ?? DEFAULT_GENRE) as GenreId
  const djBand = generateBand(seed + 99, genre).name
  const rolled = rollPostShowShakedownEvent(seed, djBand)
  const resourcesBefore = { ...s.resources }
  let resources = { ...s.resources }
  if (rolled) resources = applyShakedownEventEffects(resources, rolled.id)

  const loot = rolled ? formatResourceDeltas(resourcesBefore, resources) : ''
  const event = rolled ? { ...rolled, loot: loot || undefined } : null
  const snap: OutcomeSnapshot | undefined = rolled && loot ? { resourcesBefore, resourcesAfter: resources } : undefined

  let runStats = s.runStats
  if (rolled?.id.startsWith('after_party')) {
    runStats = patchRunStats(runStats, { showsSeen: runStats.showsSeen + 1, bandsSeen: runStats.bandsSeen + 1 })
  }

  let crew = s.crew
  let crewAlert = s.crewAlert
  if (rolled?.healthDrain) {
    const drain = rolled.healthDrain
    crew = crew.map((m) => m.bailed ? m : { ...m, health: Math.max(0, m.health - drain) })
  }
  if (rolled?.crewEffect === 'wook_flu') {
    const infected = infectRandomCrewWithWookFlu(crew, seed + 13)
    crew = infected.crew
    if (infected.infectedName) {
      crewAlert = `${infected.infectedName} caught something at the after-party. Wook flu.`
    }
  }

  const next = ensureMarket({ ...s, crew, resources, rngSeed: seed }, 'post_show_shakedown', seed + 7)
  return {
    ...next,
    crew,
    crewAlert,
    runStats,
    phase: 'post_show_shakedown',
    postShowShakedownEvent: event,
    tourStory: appendStory(
      next.tourStory,
      storyEvent(seed, rolled?.title ?? 'After-show shakedown', rolled?.body ?? 'The lot exhales. Time to hustle before the highway.'),
    ),
    ...(snap ? setOutcome(s, rolled!.title, snap) : {}),
  }
}
