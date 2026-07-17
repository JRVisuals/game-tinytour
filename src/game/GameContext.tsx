import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { outcomeReport, formatResourceDeltas, type OutcomeSnapshot } from './outcome/report'
import { payoutForBet, resolveSetlistBet } from './betting'
import {
  buildRunResources,
  canStartTour,
  dayJobStipend,
  liquidateResources,
} from './crew/economy'
import { createNewSavedCrew, updateCrewRep } from './crew/rep'
import { rollMemberKit } from './crew/starterKit'
import {
  appendStory,
  storyEvent,
  storyGoHome,
  storyIntro,
  storyLocation,
  storyPostShow,
  storyTourEnd,
  storyTravelStop,
} from './crew/tourStory'
import {
  activeCrew,
  allCrewBailed,
  applyBathroomBagTasteToCrew,
  applyDrinkToMember,
  applyEatToMember,
  applyFriendsCrashToCrew,
  applyHotelCrashToCrew,
  applyBadEventVibeToCrew,
  applyBurnGasCruiseToCrew,
  applyHitchVibe,
  applyPushThroughToCrew,
  applyRestToCrew,
  applyBalloonsToCrew,
  applyPunchToRandomCrew,
  applyShowVibeToCrew,
  applySubstancesToMember,
  applyVibeDeltaToActiveCrew,
  BET_LOSS_VIBE,
  BET_WIN_VIBE,
  infectRandomCrewWithWookFlu,
  applyPushThroughToWookFluMembers,
  collectCrewWarnings,
  defaultMeters,
  isWookFluDeath,
  tickCrewMeters,
  venueEntryBlockedMessage,
} from './crew/meters'
import { generateBand, generateCrewNames, generateTour } from './generators'
import { DEFAULT_GENRE, type GenreId } from './generators/genre'
import { defaultStickerId } from './crew/stickers'
import { type MarketContext } from './market'
import { resolveCopChase, rollBalloonCopChase, rollDrugSellCopChase } from './market/copChase'
import { ensureMarket, persistMarketStock } from './marketCache'
import { BALANCE } from './config'
import { MAX_ACTIVE_BETS } from './betting'
import {
  balloonBuyMessage,
  bathroomFindResult,
  consumeFeedback,
  pulledOverResult,
  runEndLine,
  shuffleHomeBlockedMessage,
  showRecapLine,
  showRecapFlavor,
  soloEventResult,
  travelFeedback,
  wookFluDeathMessage,
  wookFluResult,
} from './travel/eventOutcomes'
import { resolveIntelTrade, type IntelEventKey } from './travel/intelTips'
import { resolvePulledOver } from './travel/pulledOverResolve'
import { loadPersisted, savePersisted } from './persistence'
import { createStartingResources } from './resources'
import { emptyRunStats, patchRunStats, canShuffleHome } from './stats'
import {
  applyMissShowHustleEffects,
  rollMissShowHustleEvent,
} from './hustle/missShowEvents'
import {
  applyLotShakedownEventEffects,
  applyShakedownEventEffects,
  rollLotShakedownEvent,
  rollPostShowShakedownEvent,
} from './shakedown/events'
import {
  canAttemptClownJuiceDeal,
  clownJuiceBuyMessage,
  clownJuiceDoses,
  clownJuicePrice,
  resolveClownJuiceDeal,
  type ClownJuiceChoice,
} from './shakedown/clownJuice'
import {
  applyLocationEventOnVisit,
  getLocationActions,
  canAffordAction,
  type LocationAction,
} from './location/locationEvents'
import { goToVenueGates, needsVenueGates } from './venueGates'
import { pushThroughCost } from './travel/legs'
import {
  beginTravelLegs,
  rollLegArrivalEvent,
} from './travel/arrival'
import type {
  BetSlot,
  CrewMember,
  ShowBetResult,
  GameState,
  LocationId,
  PhaseId,
  Resources,
  SavedCrew,
  StarterTier,
  OutcomeTone,
} from './types'

type RunOutcome = 'completed' | 'day_job' | 'shuffle'

function setOutcome(
  s: GameState,
  flavor: string,
  snap?: OutcomeSnapshot,
  tone: OutcomeTone = 'default',
): Pick<GameState, 'lastOutcome' | 'lastOutcomeTone' | 'lastOutcomeSeq'> {
  return {
    lastOutcome: snap ? outcomeReport(flavor, snap) : flavor,
    lastOutcomeTone: tone,
    lastOutcomeSeq: s.lastOutcomeSeq + 1,
  }
}

type BetPhase = 'shakedown' | 'location' | 'show'

function canEditSetlistBets(phase: GameState['phase']): phase is BetPhase {
  return phase === 'shakedown' || phase === 'location' || phase === 'show'
}


interface GameContextValue {
  state: GameState
  goToTitle: () => void
  goToCrew: (startAfterSave?: boolean) => void
  goToStats: () => void
  requestStartRun: () => void
  saveCrew: () => void
  setCrewSize: (size: number) => void
  shuffleCrewNames: () => void
  resetCrew: () => void
  setCrewMemberName: (index: number, name: string) => void
  setCrewMemberSticker: (index: number, stickerId: string) => void
  setHomeCity: (city: string) => void
  setGenre: (genre: GenreId) => void
  setBudget: (budget: number) => void
  crewConsume: (memberId: string, item: 'eat' | 'drink' | 'substances') => void
  travelAction: (action: TravelAction) => void
  resolveTravelEvent: (choiceId?: string) => void
  advanceTravelLeg: () => void
  visitRoadside: () => void
  leaveRoadside: () => void
  placeSetlistBet: (songId: string, songTitle: string, amount: number, slot: BetSlot) => void
  cancelSetlistBet: (songId: string) => void
  marketBuy: (item: 'food' | 'beer' | 'drugs' | 'tickets' | 'gas') => void
  buyBalloons: () => void
  clownJuiceBalloonChoice: (choice: ClownJuiceChoice) => void
  marketSell: (item: 'food' | 'beer' | 'drugs') => void
  resolveMarketCopChase: (choice: 'stay' | 'run') => void
  shuffleOnHome: () => void
  missShow: () => void
  goToLocation: (location: LocationId) => void
  goToVenueGates: () => void
  returnToShakedown: () => void
  enterShow: () => void
  finishShow: () => void
  enterPostShowShakedown: () => void
  prepNextLeg: () => void
  finishRunRecap: () => void
  takeDayJobStipend: () => void
  adjustResources: (partial: Partial<Resources>) => void
  hotelCrash: () => void
  friendsCrash: () => void
  clearLastOutcome: () => void
  performLocationAction: (actionId: string) => void
}

export type TravelAction =
  | 'rest'
  | 'hitch'
  | 'push_through'
  | 'burn_gas'
  | 'roadside_food'
  | 'roadside_beer'
  | 'roadside_sell_drugs'

const GameContext = createContext<GameContextValue | null>(null)

function crewFromSaved(saved: SavedCrew): CrewMember[] {
  return saved.members.map((m, i) => ({
    id: `p${i + 1}`,
    name: m.name,
    stickerId: m.stickerId ?? defaultStickerId(i),
    ...defaultMeters(),
  }))
}

function buildCrewFromNames(names: string[], seed: number): CrewMember[] {
  return names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    stickerId: defaultStickerId(seed + i * 7),
    ...defaultMeters(),
  }))
}

function defaultCrew(size = 1, seed = Date.now() % 100000): CrewMember[] {
  return buildCrewFromNames(generateCrewNames(size, seed), seed)
}

function createInitialState(): GameState {
  const persisted = loadPersisted()
  const saved = persisted.savedCrew
  const tier: StarterTier = saved?.starterTier ?? 200
  return {
    phase: 'title',
    crew: saved ? crewFromSaved(saved) : defaultCrew(1),
    homeCity: saved?.homeCity ?? 'Burlington, VT',
    genre: saved?.genre ?? DEFAULT_GENRE,
    resources: createStartingResources(saved?.bank ?? tier),
    tour: null,
    travel: null,
    currentLocation: 'shakedown',
    turnsUntilShow: BALANCE.travel.turnsUntilShow,
    lastSetlist: null,
    postShowRecap: '',
    lastShowBetResults: [],
    postShowShakedownEvent: null,
    shakedownLotEvent: null,
    spotFindEvent: null,
    missShowHustleEvent: null,
    rngSeed: Date.now() % 100000,
    runStats: emptyRunStats(),
    runBetsWon: 0,
    tourStory: [],
    savedCrew: saved,
    memberKits: [],
    starterTier: saved ? null : tier,
    startRunAfterCrewSave: false,
    runRecapMessage: '',
    dayJobStipend: null,
    activeSetlistBets: [],
    currentMarket: null,
    marketContext: null,
    currentMarketStock: null,
    marketFlavor: null,
    stopMarkets: {},
    activeMarketKey: null,
    marketCopChase: null,
    crewAlert: null,
    lastOutcome: null,
    lastOutcomeTone: 'default',
    lastOutcomeSeq: 0,
  }
}

function persistCrew(savedCrew: SavedCrew | null) {
  savePersisted({ savedCrew })
}

function crewLabel(saved: SavedCrew | null, crew: CrewMember[]): string {
  if (saved?.members.length) return saved.members.map((m) => m.name).join(', ')
  return crew.map((c) => c.name).join(', ')
}

function applyMarket(
  s: GameState,
  context: MarketContext,
  seed: number,
): GameState {
  return ensureMarket(s, context, seed)
}

function arriveAtShakedownHub(
  s: GameState,
  seed: number,
): GameState {
  const rolled = rollLotShakedownEvent(seed + 7)
  const resources = applyLotShakedownEventEffects(s.resources, rolled)
  let next: GameState = {
    ...s,
    phase: 'shakedown',
    currentLocation: 'shakedown',
    turnsUntilShow: BALANCE.travel.turnsUntilShow,
    travel: null,
    marketCopChase: null,
    shakedownLotEvent: rolled,
    spotFindEvent: null,
    resources,
    crewAlert: null,
  }
  next = applyMarket(next, 'shakedown', seed + 50)
  if (rolled) {
    next = {
      ...next,
      tourStory: appendStory(
        next.tourStory,
        storyEvent(seed, rolled.title, rolled.body),
      ),
    }
  }
  return applyLocationEventOnVisit(next, 'shakedown', seed + 19, next.tour?.band.name ?? '')
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState)

  useEffect(() => {
    persistCrew(state.savedCrew)
  }, [state.savedCrew])

  useEffect(() => {
    if (!needsVenueGates(state)) return
    setState((s) => (needsVenueGates(s) ? goToVenueGates(s, applyMarket) : s))
  }, [state.phase, state.currentLocation, state.turnsUntilShow, state.tour?.currentStopIndex])

  const endRun = useCallback(
    (s: GameState, outcome: RunOutcome, message: string): GameState => {
      let savedCrew = s.savedCrew
      let dayJobStipendOffer: number | null = null

      if (savedCrew) {
        if (outcome === 'day_job') {
          savedCrew = updateCrewRep(
            { ...savedCrew, hasVehicle: savedCrew.hasVehicle },
            s.runStats,
            s.runBetsWon,
            0,
            'day_job',
            false,
          )
          dayJobStipendOffer = dayJobStipend(s.crew.length)
        } else {
          const bankAfter = liquidateResources(s.resources)
          savedCrew = updateCrewRep(
            {
              ...savedCrew,
              hasVehicle: s.resources.hasVehicle || savedCrew.hasVehicle,
            },
            s.runStats,
            s.runBetsWon,
            bankAfter,
            outcome,
            outcome === 'completed',
          )
        }
      }

      let tourStory = s.tourStory
      if (outcome === 'shuffle') {
        tourStory = appendStory(tourStory, storyGoHome(s.rngSeed))
      } else if (outcome === 'completed' && s.tour) {
        const stop = s.tour.stops[s.tour.stops.length - 1]
        tourStory = appendStory(
          tourStory,
          storyTourEnd(s.rngSeed, {
            city: stop?.city ?? 'the last town',
            venue: stop?.venue ?? 'the final room',
            band: s.tour.band.name,
            crew: crewLabel(savedCrew, s.crew),
          }),
        )
      }

      return {
        ...s,
        savedCrew,
        tourStory,
        phase: outcome === 'day_job' ? 'day_job' : 'run_recap',
        runRecapMessage: message,
        dayJobStipend: dayJobStipendOffer,
        tour: null,
        travel: null,
        currentMarket: null,
        marketContext: null,
        currentMarketStock: null,
        marketFlavor: null,
      }
    },
    [],
  )

  const afterCrewTick = useCallback(
    (s: GameState, crew: CrewMember[], extraRecap = ''): GameState => {
      const tickSeed = s.rngSeed + 7
      const { crew: ticked, bailMessages, warnings, spreadMessages, neglectMessages } = tickCrewMeters(
        crew,
        tickSeed,
      )
      const alertParts = [...neglectMessages, ...spreadMessages, ...bailMessages, ...warnings]
      let next: GameState = {
        ...s,
        crew: ticked,
        rngSeed: tickSeed,
        crewAlert: alertParts.length > 0 ? alertParts.join(' ') : null,
      }
      if (bailMessages.length) {
        next = {
          ...next,
          postShowRecap: [next.postShowRecap, ...bailMessages].filter(Boolean).join(' '),
        }
      }
      if (activeCrew(ticked).length === 0 && ticked.length > 0) {
        if (isWookFluDeath(ticked)) {
          return endRun(next, 'day_job', wookFluDeathMessage())
        }
        return endRun(
          next,
          'shuffle',
          `${bailMessages.join(' ')}${extraRecap ? ` ${extraRecap}` : ''} Everyone shuffled on home.`,
        )
      }
      return next
    },
    [endRun],
  )

  const maybeEndRunIfAllBailed = useCallback(
    (s: GameState, message: string): GameState => {
      if (!allCrewBailed(s.crew)) return s
      if (isWookFluDeath(s.crew)) {
        return endRun(s, 'day_job', wookFluDeathMessage())
      }
      return endRun(s, 'shuffle', message)
    },
    [endRun],
  )

  const finalizeCrewCare = useCallback(
    (
      s: GameState,
      crew: CrewMember[],
      flavor: string,
      snap?: OutcomeSnapshot,
    ): GameState => {
      const warnings = collectCrewWarnings(crew)
      const next: GameState = {
        ...s,
        crew,
        crewAlert: warnings.length > 0 ? warnings.join(' ') : null,
        ...setOutcome(s,flavor, snap),
      }
      return maybeEndRunIfAllBailed(next, next.crewAlert ?? 'Everyone shuffled on home.')
    },
    [maybeEndRunIfAllBailed],
  )

  const consumeCrewItem = useCallback(
    (s: GameState, memberId: string, item: 'eat' | 'drink' | 'substances'): GameState => {
      if (!s.tour) return s
      if (allCrewBailed(s.crew)) {
        return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
      }

      const member = s.crew.find((c) => c.id === memberId)
      if (!member || member.bailed) return s

      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let crew = s.crew.map((c) => ({ ...c }))
      let feedback: string

      if (item === 'eat') {
        if (resources.food <= 0) return s
        resources = { ...resources, food: resources.food - 1 }
        runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
        crew = crew.map((c) => (c.id === memberId ? applyEatToMember(c) : c))
      } else if (item === 'drink') {
        if (resources.beer <= 0) return s
        resources = { ...resources, beer: resources.beer - 1 }
        runStats = patchRunStats(runStats, { beerConsumed: runStats.beerConsumed + 1 })
        crew = crew.map((c) => (c.id === memberId ? applyDrinkToMember(c) : c))
      } else {
        if (resources.drugs <= 0) return s
        resources = { ...resources, drugs: resources.drugs - 1 }
        runStats = patchRunStats(runStats, {
          substancesConsumed: runStats.substancesConsumed + 1,
        })
        crew = crew.map((c) => (c.id === memberId ? applySubstancesToMember(c) : c))
      }
      feedback = consumeFeedback(item, member.name, s.rngSeed + 1)

      return finalizeCrewCare(
        { ...s, resources, runStats, rngSeed: s.rngSeed + 1 },
        crew,
        feedback,
        {
          resourcesBefore,
          resourcesAfter: resources,
          crewBefore,
          crewAfter: crew,
        },
      )
    },
    [endRun, finalizeCrewCare],
  )

  const crewConsume = useCallback(
    (memberId: string, item: 'eat' | 'drink' | 'substances') => {
      setState((s) => consumeCrewItem(s, memberId, item))
    },
    [consumeCrewItem],
  )

  const goToTitle = useCallback(() => {
    setState((s) => ({ ...s, phase: 'title', startRunAfterCrewSave: false }))
  }, [])

  const goToCrew = useCallback((startAfterSave = false) => {
    setState((s) => {
      if (s.savedCrew) {
        const base = {
          ...s,
          crew: crewFromSaved(s.savedCrew),
          homeCity: s.savedCrew.homeCity,
          genre: s.savedCrew.genre ?? DEFAULT_GENRE,
          resources: {
            ...createStartingResources(s.savedCrew.bank),
            hasVehicle: s.savedCrew.hasVehicle,
          },
          starterTier: null,
        }
        return { ...base, phase: 'crew' as PhaseId, startRunAfterCrewSave: startAfterSave }
      }

      const seed = Date.now() % 100000
      const size = Math.min(3, Math.max(1, s.crew.length || 1))
      const tier = s.starterTier ?? 200
      return {
        ...s,
        crew: defaultCrew(size, seed),
        rngSeed: seed,
        starterTier: tier,
        memberKits: [],
        resources: createStartingResources(tier),
        phase: 'crew' as PhaseId,
        startRunAfterCrewSave: startAfterSave,
      }
    })
  }, [])

  const goToStats = useCallback(() => {
    setState((s) => ({ ...s, phase: 'stats' }))
  }, [])

  const beginRun = useCallback((base: GameState): GameState => {
    const saved = base.savedCrew!
    const seed = base.rngSeed + 17
    const resources = buildRunResources(saved, seed)
    const crew = crewFromSaved(saved)
    const genre = (base.genre ?? DEFAULT_GENRE) as GenreId
    const band = generateBand(seed, genre)
    const tour = generateTour(band, seed + 3, BALANCE.travel.tourStops, genre)
    const stop = tour.stops[0]!
    const origin = base.homeCity
    let next: GameState = {
      ...base,
      crew,
      resources,
      rngSeed: seed,
      tour,
      runStats: emptyRunStats(),
      runBetsWon: 0,
      tourStory: [
        ...storyIntro(seed, {
          home: origin,
          band: band.name,
          destination: stop.city,
          crew: crewLabel(saved, crew),
        }),
        storyTravelStop(seed + 1, stop.city, stop.venue),
      ],
      phase: 'travel',
      turnsUntilShow: BALANCE.travel.turnsUntilShow,
      lastSetlist: null,
      postShowRecap: '',
      lastShowBetResults: [],
      postShowShakedownEvent: null,
      shakedownLotEvent: null,
      spotFindEvent: null,
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobStipend: null,
      activeSetlistBets: [],
      stopMarkets: {},
      activeMarketKey: null,
      currentMarket: null,
      marketContext: null,
      marketCopChase: null,
      lastOutcome: null,
      lastOutcomeTone: 'default',
    }
    next = beginTravelLegs(next, origin, stop.city, seed + 5)
    next = applyMarket(next, 'shakedown', seed + 99)
    return {
      ...next,
      currentMarket: null,
      currentMarketStock: null,
      marketFlavor: null,
      marketContext: null,
      activeMarketKey: null,
    }
  }, [])

  const brokeDayJobState = (s: GameState, message: string): GameState => ({
    ...s,
    phase: 'day_job',
    runRecapMessage: message,
    dayJobStipend: dayJobStipend(s.savedCrew?.members.length ?? s.crew.length),
    tour: null,
    travel: null,
    currentMarket: null,
    marketContext: null,
    currentMarketStock: null,
    marketFlavor: null,
    marketCopChase: null,
  })

  const requestStartRun = useCallback(() => {
    setState((s) => {
      if (!s.savedCrew) {
        const seed = Date.now() % 100000
        const size = Math.min(3, Math.max(1, s.crew.length || 1))
        return {
          ...s,
          crew: defaultCrew(size, seed),
          rngSeed: seed,
          phase: 'crew',
          startRunAfterCrewSave: true,
        }
      }
      const preview = buildRunResources(s.savedCrew, s.rngSeed + 17)
      if (!canStartTour(s.savedCrew.bank, preview)) {
        return brokeDayJobState(
          s,
          'Broke at the bank. Grab a day-job stipend or reset the crew before the next tour.',
        )
      }
      return beginRun({
        ...s,
        crew: crewFromSaved(s.savedCrew),
        homeCity: s.savedCrew.homeCity,
        genre: s.savedCrew.genre ?? DEFAULT_GENRE,
      })
    })
  }, [beginRun])

  const saveCrew = useCallback(() => {
    setState((s) => {
      const seed = Date.now() % 100000
      const tier = (s.starterTier ?? s.resources.cash) as StarterTier
      const members = s.crew.map((c, i) => ({
        name: c.name,
        stickerId: c.stickerId ?? defaultStickerId(i),
        kit:
          i === 0
            ? undefined
            : (s.memberKits[i] ??
              s.savedCrew?.members[i]?.kit ??
              rollMemberKit(seed + i * 19)),
      }))

      const saved: SavedCrew = s.savedCrew
        ? {
            ...s.savedCrew,
            homeCity: s.homeCity,
            genre: s.genre ?? DEFAULT_GENRE,
            members,
          }
        : createNewSavedCrew({
            homeCity: s.homeCity,
            genre: s.genre ?? DEFAULT_GENRE,
            bank: tier,
            starterTier: tier,
            members,
          })

      let next: GameState = {
        ...s,
        savedCrew: saved,
        starterTier: null,
        startRunAfterCrewSave: false,
      }

      if (s.startRunAfterCrewSave) {
        const preview = buildRunResources(saved, next.rngSeed + 17)
        if (!canStartTour(saved.bank, preview)) {
          return brokeDayJobState(
            next,
            'Need cash and supplies to tour. Pick a higher starter budget or add crew kits.',
          )
        }
        return beginRun(next)
      }
      return { ...next, phase: 'title' as PhaseId }
    })
  }, [beginRun])

  const setCrewSize = useCallback((size: number) => {
    const n = Math.min(3, Math.max(1, size))
    setState((s) => {
      const crew = [...s.crew]
      const memberKits = [...s.memberKits]
      if (crew.length < n) {
        const seed = Date.now() % 100000
        const newNames = generateCrewNames(n - crew.length, seed + crew.length * 7)
        newNames.forEach((name) => {
          crew.push({
            id: `p${crew.length + 1}`,
            name,
            stickerId: defaultStickerId(seed + crew.length * 11),
            ...defaultMeters(),
          })
          memberKits.push(rollMemberKit(seed + crew.length * 23))
        })
        return { ...s, crew, memberKits, rngSeed: seed }
      }
      while (crew.length > n) {
        crew.pop()
        memberKits.pop()
      }
      return { ...s, crew, memberKits }
    })
  }, [])

  const shuffleCrewNames = useCallback(() => {
    setState((s) => {
      const seed = Date.now() % 100000
      const names = generateCrewNames(s.crew.length, seed)
      return {
        ...s,
        crew: s.crew.map((member, i) => ({
          ...member,
          name: names[i]!,
          stickerId: defaultStickerId(seed + i * 37),
        })),
        rngSeed: seed,
      }
    })
  }, [])

  const resetCrew = useCallback(() => {
    setState((s) => {
      const seed = Date.now() % 100000
      return {
        ...s,
        crew: defaultCrew(1, seed),
        homeCity: 'Burlington, VT',
        genre: DEFAULT_GENRE,
        resources: createStartingResources(200),
        savedCrew: null,
        memberKits: [],
        starterTier: 200,
        dayJobStipend: null,
        rngSeed: seed,
      }
    })
  }, [])

  const setCrewMemberName = useCallback((index: number, name: string) => {
    setState((s) => ({
      ...s,
      crew: s.crew.map((c, i) => (i === index ? { ...c, name } : c)),
    }))
  }, [])

  const setCrewMemberSticker = useCallback((index: number, stickerId: string) => {
    setState((s) => ({
      ...s,
      crew: s.crew.map((c, i) => (i === index ? { ...c, stickerId } : c)),
    }))
  }, [])

  const setHomeCity = useCallback((city: string) => {
    setState((s) => ({ ...s, homeCity: city }))
  }, [])

  const setGenre = useCallback((genre: GenreId) => {
    setState((s) => ({ ...s, genre }))
  }, [])

  const setBudget = useCallback((budget: number) => {
    const tier = budget as StarterTier
    setState((s) => {
      if (s.savedCrew) return s
      return {
        ...s,
        starterTier: tier,
        resources: createStartingResources(tier),
      }
    })
  }, [])

  const shuffleOnHome = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      if (!canShuffleHome(s.runStats)) {
        return { ...s, crewAlert: shuffleHomeBlockedMessage(s.rngSeed) }
      }
      return endRun(s, 'shuffle', runEndLine('shuffle', s.rngSeed))
    })
  }, [endRun])

  const travelAction = useCallback(
    (action: TravelAction) => {
      setState((s) => {
        if (!s.travel) return s
        if (allCrewBailed(s.crew)) {
          return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
        }

        let resources = { ...s.resources }
        let runStats = { ...s.runStats }
        let crew = s.crew.map((c) => ({ ...c }))
        const resourcesBefore = { ...s.resources }
        const crewBefore = s.crew.map((c) => ({ ...c }))
        let rngSeed = s.rngSeed + 1

        const TA = BALANCE.travel
        let actionFlavor = 'Road action'
        switch (action) {
          case 'rest':
            crew = applyRestToCrew(crew)
            return finalizeCrewCare(
              { ...s, resources, runStats, crew, rngSeed },
              crew,
              consumeFeedback('rest', 'Crew', rngSeed),
              {
                resourcesBefore,
                resourcesAfter: resources,
                crewBefore,
                crewAfter: crew,
              },
            )
          case 'hitch':
            runStats = patchRunStats(runStats, {
              milesTraveled: runStats.milesTraveled + TA.hitch.miles,
            })
            resources = {
              ...resources,
              cash: Math.max(0, resources.cash + TA.hitch.cash),
              beer:
                resources.beer +
                (rngSeed % 100 < TA.hitch.beerChancePercent ? 1 : 0),
            }
            crew = applyHitchVibe(crew)
            actionFlavor = 'Hitch'
            break
          case 'push_through': {
            if (s.travel.pendingEvent || s.travel.atRoadside) return s
            const remaining = s.travel.legs.slice(s.travel.currentLegIndex)
            if (remaining.length === 0) return s

            const cost = pushThroughCost(s.travel, resources.hasVehicle)
            if (resources.food < cost.food) {
              return {
                ...s,
                ...setOutcome(s,
                  travelFeedback('push_through_need_food', rngSeed, {
                    food: cost.food,
                    legs: cost.legs,
                  }),
                  undefined,
                  'error',
                ),
                crewAlert: null,
              }
            }
            if (resources.hasVehicle && resources.gas < cost.gas) {
              return {
                ...s,
                ...setOutcome(s,
                  travelFeedback('push_through_need_gas', rngSeed, {
                    gas: cost.gas,
                    legs: cost.legs,
                  }),
                  undefined,
                  'error',
                ),
                crewAlert: null,
              }
            }

            resources = {
              ...resources,
              food: resources.food - cost.food,
              gas: resources.gas - cost.gas,
            }
            runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + cost.food })

            let next: GameState = { ...s, resources, runStats, crew, rngSeed }
            for (const leg of remaining) {
              runStats = patchRunStats(next.runStats, {
                milesTraveled: next.runStats.milesTraveled + leg.miles,
              })
              crew = applyPushThroughToCrew(next.crew.map((c) => ({ ...c })))
              next = afterCrewTick({ ...next, runStats, crew, rngSeed: next.rngSeed + 9 }, crew)
              if (next.phase === 'run_recap' || allCrewBailed(next.crew)) {
                return next
              }
              crew = next.crew
              runStats = next.runStats
              resources = next.resources
            }

            return {
              ...arriveAtShakedownHub(
                { ...next, resources, runStats, crew, rngSeed: next.rngSeed },
                next.rngSeed + 50,
              ),
              crewAlert: null,
              ...setOutcome(s,
                travelFeedback('push_through_success', next.rngSeed, {
                  legs: cost.legs,
                  miles: cost.miles,
                }),
                {
                  resourcesBefore,
                  resourcesAfter: resources,
                  crewBefore,
                  crewAfter: crew,
                },
              ),
            }
          }
          case 'burn_gas': {
            if (s.travel.pendingEvent || s.travel.atRoadside) return s
            if (!resources.hasVehicle || resources.gas <= 0) return s

            const remaining = s.travel.legs.slice(s.travel.currentLegIndex)
            if (remaining.length === 0) return s

            const bg = TA.burnGas
            if (resources.gas < bg.gas) return s

            const legsToBurn = Math.min(bg.legsMax, remaining.length)
            let milesBurned = 0
            for (let i = 0; i < legsToBurn; i++) {
              milesBurned += remaining[i]!.miles
            }

            resources = {
              ...resources,
              gas: resources.gas - bg.gas,
              beer:
                resources.beer +
                (rngSeed % 100 < bg.beerChancePercent ? 1 : 0),
            }
            runStats = patchRunStats(runStats, {
              milesTraveled: runStats.milesTraveled + milesBurned,
            })
            crew = applyBurnGasCruiseToCrew(crew)

            const message = travelFeedback('burn_gas_success', rngSeed, {
              legs: legsToBurn,
              miles: milesBurned,
            })
            const newIndex = s.travel.currentLegIndex + legsToBurn
            let next: GameState = {
              ...s,
              resources,
              runStats,
              crew,
              rngSeed,
              crewAlert: null,
              tourStory: appendStory(
                s.tourStory,
                storyEvent(rngSeed, 'Cruise control', message),
              ),
            }

            if (newIndex >= s.travel.legs.length) {
              return {
                ...arriveAtShakedownHub(
                  { ...next, resources, runStats, crew, rngSeed },
                  rngSeed + 50,
                ),
                ...setOutcome(s,message, {
                  resourcesBefore,
                  resourcesAfter: resources,
                  crewBefore,
                  crewAfter: crew,
                }),
              }
            }

            next = {
              ...next,
              travel: {
                ...s.travel,
                currentLegIndex: newIndex,
                atRoadside: false,
                lastEventResult: message,
              },
            }
            return {
              ...rollLegArrivalEvent(next, rngSeed + 13),
              ...setOutcome(s,message, {
                resourcesBefore,
                resourcesAfter: resources,
                crewBefore,
                crewAfter: crew,
              }),
            }
          }
          case 'roadside_food': {
            const rf = TA.roadsideFood
            if (resources.cash < Math.abs(rf.cash)) return s
            resources = {
              ...resources,
              cash: resources.cash + rf.cash,
              food: resources.food + rf.food,
            }
            runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
            actionFlavor = 'Roadside food'
            break
          }
          case 'roadside_beer': {
            const rb = TA.roadsideBeer
            if (resources.cash < Math.abs(rb.cash)) return s
            resources = {
              ...resources,
              cash: resources.cash + rb.cash,
              beer: resources.beer + rb.beer,
            }
            runStats = patchRunStats(runStats, { beerConsumed: runStats.beerConsumed + 1 })
            actionFlavor = 'Roadside beer'
            break
          }
          case 'roadside_sell_drugs': {
            const rd = TA.roadsideSellDrugs
            if (resources.drugs <= 0) return s
            resources = {
              ...resources,
              drugs: resources.drugs + rd.drugs,
              cash: resources.cash + rd.cash,
            }
            actionFlavor = 'Roadside substance sale'
            break
          }
        }

        return afterCrewTick(
          {
            ...s,
            resources,
            runStats,
            crew,
            rngSeed,
            crewAlert: null,
            ...setOutcome(s,actionFlavor, {
              resourcesBefore,
              resourcesAfter: resources,
              crewBefore,
              crewAfter: crew,
            }),
          },
          crew,
        )
      })
    },
    [afterCrewTick, endRun, finalizeCrewCare, maybeEndRunIfAllBailed],
  )

  const applyEventEffects = useCallback(
    (s: GameState, event: NonNullable<GameState['travel']>['pendingEvent'], choiceId?: string) => {
      if (!event) return s
      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let crew = s.crew.map((c) => ({ ...c }))
      let rngSeed = s.rngSeed + 3
      let activeSetlistBets = [...s.activeSetlistBets]
      const FX = BALANCE.eventEffects
      let resultMessage = soloEventResult(event.eventKey, rngSeed)

      switch (event.eventKey) {
        case 'miracle_ticket':
          resources = { ...resources, tickets: resources.tickets + FX.miracle_ticket.tickets }
          break
        case 'flat_tire': {
          const fx = FX.flat_tire
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash + fx.cash),
            gas: resources.hasVehicle ? Math.max(0, resources.gas + fx.gas) : resources.gas,
          }
          crew = applyBadEventVibeToCrew(crew)
          break
        }
        case 'robbed': {
          const fx = FX.robbed
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash + fx.cash),
            drugs: Math.max(0, resources.drugs + fx.drugs),
          }
          crew = applyBadEventVibeToCrew(crew)
          break
        }
        case 'roadside_burger':
          resources = { ...resources, food: resources.food + FX.roadside_burger.food }
          break
        case 'speeding_fine':
          resources = { ...resources, cash: Math.max(0, resources.cash + FX.speeding_fine.cash) }
          crew = applyBadEventVibeToCrew(crew)
          break
        case 'gas_station_deal': {
          const fx = FX.gas_station_deal
          resources = {
            ...resources,
            beer: resources.beer + fx.beer,
            gas: resources.hasVehicle ? resources.gas + fx.gas : resources.gas,
          }
          break
        }
        case 'van_breakdown_minor': {
          const fx = FX.van_breakdown_minor
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash + fx.cash),
            gas: resources.hasVehicle ? Math.max(0, resources.gas + fx.gas) : resources.gas,
          }
          crew = applyBadEventVibeToCrew(crew)
          break
        }
        case 'hitchhiker_intel':
        case 'lot_rumor':
        case 'encore_whisper': {
          const tipSong = event.intelTipSongId
            ? s.tour?.catalog.songs.find((x) => x.id === event.intelTipSongId)
            : undefined
          const resolved = resolveIntelTrade(
            event.eventKey as IntelEventKey,
            choiceId,
            resources,
            tipSong?.title,
            event.intelSlot ?? 'opener',
            rngSeed,
          )
          resources = resolved.resources
          resultMessage = resolved.message
          break
        }
        case 'wook_flu': {
          const infected = infectRandomCrewWithWookFlu(crew, rngSeed)
          crew = infected.crew
          crew = applyBadEventVibeToCrew(crew)
          if (choiceId === 'rest') {
            crew = applyRestToCrew(crew)
            resultMessage = wookFluResult('rest', rngSeed, {
              name: infected.infectedName ?? 'the crew',
              flare: infected.flare,
            })
          } else {
            crew = applyPushThroughToWookFluMembers(crew)
            resultMessage = wookFluResult('push', rngSeed, {
              name: infected.infectedName ?? 'the crew',
              flare: infected.flare,
            })
          }
          break
        }
        case 'pulled_over': {
          const resolved = resolvePulledOver(resources, crew, choiceId, rngSeed)
          resources = resolved.resources
          if (resolved.endRun) {
            return endRun(
              { ...s, resources, runStats, crew, rngSeed },
              'day_job',
              resolved.endRun.message,
            )
          }
          resultMessage = pulledOverResult(
            choiceId,
            resolved.outcome,
            resolved.wasted,
            rngSeed,
          )
          if (resolved.outcome !== 'clean') {
            crew = applyBadEventVibeToCrew(crew)
          }
          break
        }
        case 'bathroom_find':
          if (choiceId === 'try_it') {
            const bag = FX.bathroom_find.try_it
            const laced = Math.abs(rngSeed) % 100 < bag.lacedChancePercent
            if (laced) {
              return endRun(
                { ...s, resources, runStats, crew, rngSeed },
                'day_job',
                bathroomFindResult(choiceId, true, rngSeed),
              )
            }
            resources = { ...resources, drugs: resources.drugs + bag.drugs }
            crew = applyBathroomBagTasteToCrew(crew)
            resultMessage = bathroomFindResult(choiceId, false, rngSeed)
          } else {
            resultMessage = bathroomFindResult('toss_it', false, rngSeed)
          }
          break
      }

      const reported = outcomeReport(resultMessage, {
        resourcesBefore,
        resourcesAfter: resources,
        crewBefore,
        crewAfter: crew,
      })

      return {
        ...s,
        resources,
        runStats,
        crew,
        rngSeed,
        activeSetlistBets,
        ...setOutcome(s,reported),
        tourStory: appendStory(
          s.tourStory,
          storyEvent(rngSeed, event.title, reported),
        ),
        travel: s.travel
          ? { ...s.travel, pendingEvent: null, lastEventResult: reported }
          : null,
      }
    },
    [endRun],
  )

  const resolveTravelEvent = useCallback(
    (choiceId?: string) => {
      setState((s) => {
        const event = s.travel?.pendingEvent
        if (!event) return s
        if (event.choices && !choiceId) return s
        return applyEventEffects(s, event, choiceId)
      })
    },
    [applyEventEffects],
  )

  const advanceTravelLeg = useCallback(() => {
    setState((s) => {
      if (!s.travel || s.travel.pendingEvent || s.travel.atRoadside) return s
      if (allCrewBailed(s.crew)) {
        return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
      }
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s

      const rngSeed = s.rngSeed + 9
      const runStats = patchRunStats(s.runStats, {
        milesTraveled: s.runStats.milesTraveled + leg.miles,
      })
      let crew = s.crew.map((c) => ({ ...c }))
      let next = afterCrewTick({ ...s, rngSeed, runStats, crew }, crew)

      const nextIndex = s.travel.currentLegIndex + 1
      if (nextIndex >= s.travel.legs.length) {
        return arriveAtShakedownHub(next, rngSeed + 50)
      }

      next = {
        ...next,
        travel: {
          ...s.travel,
          currentLegIndex: nextIndex,
          pendingEvent: null,
          atRoadside: false,
          lastEventResult: null,
        },
      }
      return rollLegArrivalEvent(next, rngSeed + 11)
    })
  }, [afterCrewTick, endRun, maybeEndRunIfAllBailed])

  const visitRoadside = useCallback(() => {
    setState((s) => {
      if (!s.travel) return s
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg?.roadside) return s
      const withRoadside = {
        ...s,
        travel: { ...s.travel, atRoadside: true },
      }
      return applyMarket(withRoadside, leg.roadside, s.rngSeed + 22)
    })
  }, [])

  const leaveRoadside = useCallback(() => {
    setState((s) => {
      if (!s.travel) return s
      return {
        ...s,
        travel: { ...s.travel, atRoadside: false },
        currentMarket: null,
        currentMarketStock: null,
        marketFlavor: null,
        marketContext: null,
        activeMarketKey: null,
      }
    })
  }, [])

  const placeSetlistBet = useCallback(
    (songId: string, songTitle: string, amount: number, slot: BetSlot) => {
      setState((s) => {
        if (!canEditSetlistBets(s.phase)) return s
        if (s.resources.cash < amount || s.activeSetlistBets.length >= MAX_ACTIVE_BETS) return s
        if (s.activeSetlistBets.some((b) => b.songId === songId || b.songTitle === songTitle)) {
          return s
        }
        return {
          ...s,
          resources: { ...s.resources, cash: s.resources.cash - amount },
          activeSetlistBets: [...s.activeSetlistBets, { songId, songTitle, amount, slot }],
          ...setOutcome(s,`Bet placed — ${songTitle} (${slot})`, {
            resourcesBefore: s.resources,
            resourcesAfter: { ...s.resources, cash: s.resources.cash - amount },
          }),
        }
      })
    },
    [],
  )

  const cancelSetlistBet = useCallback((songId: string) => {
    setState((s) => {
      if (!canEditSetlistBets(s.phase)) return s
      const bet = s.activeSetlistBets.find((b) => b.songId === songId)
      if (!bet) return s

      const resourcesBefore = { ...s.resources }
      const resources = { ...s.resources, cash: s.resources.cash + bet.amount }
      return {
        ...s,
        resources,
        activeSetlistBets: s.activeSetlistBets.filter((b) => b.songId !== songId),
        ...setOutcome(s,`Bet cancelled — ${bet.songTitle}`, {
          resourcesBefore,
          resourcesAfter: resources,
        }),
      }
    })
  }, [])

  const marketBuy = useCallback((item: 'food' | 'beer' | 'drugs' | 'tickets' | 'gas') => {
    setState((s) => {
      const p = s.currentMarket
      const stock = s.currentMarketStock
      if (!p || !stock) return s
      const resourcesBefore = { ...s.resources }
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let nextStock = { ...stock }
      const labels: Record<typeof item, string> = {
        food: 'Bought food',
        beer: 'Bought beer',
        drugs: 'Bought substances',
        tickets: 'Bought ticket',
        gas: 'Filled the tank',
      }
      const gasUnits = BALANCE.markets.gasUnitsPerBuy

      if (item === 'food' && resources.cash >= p.foodBuy && nextStock.food > 0) {
        resources = { ...resources, cash: resources.cash - p.foodBuy, food: resources.food + 1 }
        nextStock.food -= 1
      } else if (item === 'beer' && resources.cash >= p.beerBuy && nextStock.beer > 0) {
        resources = { ...resources, cash: resources.cash - p.beerBuy, beer: resources.beer + 1 }
        nextStock.beer -= 1
      } else if (item === 'drugs' && resources.cash >= p.drugsBuy && nextStock.drugs > 0) {
        resources = { ...resources, cash: resources.cash - p.drugsBuy, drugs: resources.drugs + 1 }
        runStats = patchRunStats(runStats, {
          substancesConsumed: runStats.substancesConsumed + 1,
        })
        nextStock.drugs -= 1
      } else if (
        item === 'tickets' &&
        p.ticketBuy != null &&
        resources.cash >= p.ticketBuy &&
        nextStock.tickets > 0
      ) {
        resources = {
          ...resources,
          cash: resources.cash - p.ticketBuy,
          tickets: resources.tickets + 1,
        }
        nextStock.tickets -= 1
      } else if (
        item === 'gas' &&
        resources.hasVehicle &&
        p.gasBuy != null &&
        resources.cash >= p.gasBuy &&
        nextStock.gas > 0
      ) {
        resources = {
          ...resources,
          cash: resources.cash - p.gasBuy,
          gas: resources.gas + gasUnits,
        }
        nextStock.gas -= 1
      } else return s
      return persistMarketStock(
        {
          ...s,
          resources,
          runStats,
          currentMarketStock: nextStock,
          crewAlert: null,
          ...setOutcome(s,labels[item], {
            resourcesBefore,
            resourcesAfter: resources,
          }),
        },
        nextStock,
      )
    })
  }, [])

  const marketSell = useCallback((item: 'food' | 'beer' | 'drugs') => {
    setState((s) => {
      if (s.marketCopChase) return s
      const p = s.currentMarket
      if (!p) return s
      const resourcesBefore = { ...s.resources }
      let resources = { ...s.resources }
      const rngSeed = s.rngSeed + 1
      const labels: Record<typeof item, string> = {
        food: 'Sold food',
        beer: 'Sold beer',
        drugs: 'Sold substances',
      }

      if (item === 'food' && resources.food > 0) {
        resources = { ...resources, food: resources.food - 1, cash: resources.cash + p.foodSell }
      } else if (item === 'beer' && resources.beer > 0) {
        resources = { ...resources, beer: resources.beer - 1, cash: resources.cash + p.beerSell }
      } else if (item === 'drugs' && resources.drugs > 0) {
        const proceeds = p.drugsSell
        resources = {
          ...resources,
          drugs: resources.drugs - 1,
          cash: resources.cash + proceeds,
        }
        if (rollDrugSellCopChase(rngSeed)) {
          return {
            ...s,
            resources,
            rngSeed,
            marketCopChase: {
              fine: BALANCE.markets.copChase.fine,
              proceeds,
              reason: 'drug_sell',
            },
            ...setOutcome(s,`${labels.drugs} — cops noticed`, {
              resourcesBefore,
              resourcesAfter: resources,
            }),
          }
        }
      } else return s

      return {
        ...s,
        resources,
        rngSeed,
        ...setOutcome(s,labels[item], {
          resourcesBefore,
          resourcesAfter: resources,
        }),
      }
    })
  }, [])

  const buyBalloons = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'post_show_shakedown' || s.marketCopChase) return s
      const price = BALANCE.markets.balloons.price
      if (s.resources.cash < price) return s

      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      const resources = { ...s.resources, cash: s.resources.cash - price }
      const crew = applyBalloonsToCrew(s.crew.map((c) => ({ ...c })))
      const rngSeed = s.rngSeed + 23
      const flavor = balloonBuyMessage(rngSeed)
      const snap = {
        resourcesBefore,
        resourcesAfter: resources,
        crewBefore,
        crewAfter: crew,
      }

      if (rollBalloonCopChase(rngSeed + 5)) {
        return {
          ...s,
          resources,
          crew,
          rngSeed,
          marketCopChase: {
            fine: BALANCE.markets.copChase.fine,
            proceeds: 0,
            reason: 'balloons',
          },
          ...setOutcome(s,`${flavor} — cops noticed`, snap),
        }
      }

      return {
        ...s,
        resources,
        crew,
        rngSeed,
        crewAlert: null,
        ...setOutcome(s,flavor, snap),
      }
    })
  }, [])

  const clownJuiceBalloonChoice = useCallback((choice: ClownJuiceChoice) => {
    setState((s) => {
      if (
        (s.phase !== 'shakedown' && s.phase !== 'post_show_shakedown') ||
        s.shakedownLotEvent?.id !== 'clown_juice_mafia' ||
        s.marketCopChase
      ) {
        return s
      }
      const price = clownJuicePrice(choice)
      if (choice === 'retail' && s.resources.cash < price) return s
      if (choice === 'deal' && !canAttemptClownJuiceDeal(s.resources)) return s

      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      const rngSeed = s.rngSeed + (choice === 'retail' ? 23 : 37)
      const doses = clownJuiceDoses(choice)
      let resources = { ...s.resources }
      let crew = s.crew.map((c) => ({ ...c }))
      let flavor = clownJuiceBuyMessage(choice, rngSeed)

      if (choice === 'retail') {
        resources = { ...resources, cash: resources.cash - price }
        crew = applyBalloonsToCrew(crew, doses)
      } else {
        const deal = resolveClownJuiceDeal(resources, rngSeed)
        if (!deal) return s

        resources = { ...resources, cash: resources.cash - price }
        if (deal.kind === 'beer') {
          resources = { ...resources, beer: resources.beer - 1 }
          flavor = clownJuiceBuyMessage(choice, rngSeed, { beerDeal: true })
        } else {
          flavor = clownJuiceBuyMessage(choice, rngSeed, { punched: deal.punched })
          if (deal.punched) {
            const punch = applyPunchToRandomCrew(
              crew,
              BALANCE.shakedown.clownJuiceMafia.punchHealth,
              rngSeed,
            )
            crew = punch.crew
            if (punch.victimName) {
              flavor += ` ${punch.victimName} took one to the mouth.`
            }
          }
        }
        crew = applyBalloonsToCrew(crew, doses)
      }

      const snap = {
        resourcesBefore,
        resourcesAfter: resources,
        crewBefore,
        crewAfter: crew,
      }

      const runStats = patchRunStats(s.runStats, { balloonsHuffed: s.runStats.balloonsHuffed + doses })

      if (rollBalloonCopChase(rngSeed + 5)) {
        return {
          ...s,
          resources,
          crew,
          rngSeed,
          runStats,
          marketCopChase: {
            fine: BALANCE.markets.copChase.fine,
            proceeds: 0,
            reason: 'balloons',
          },
          ...setOutcome(s,`${flavor} — cops noticed`, snap),
        }
      }

      return {
        ...s,
        resources,
        crew,
        rngSeed,
        runStats,
        crewAlert: null,
        ...setOutcome(s,flavor, snap),
      }
    })
  }, [])

  const resolveMarketCopChase = useCallback((choice: 'stay' | 'run') => {
    setState((s) => {
      const chase = s.marketCopChase
      if (!chase) return s
      const seed = s.rngSeed + 19
      const resourcesBefore = { ...s.resources }
      const { resources, message } = resolveCopChase(s.resources, choice, chase.fine, seed)
      return {
        ...s,
        resources,
        rngSeed: seed,
        marketCopChase: null,
        crewAlert: null,
        ...setOutcome(s,message, {
          resourcesBefore,
          resourcesAfter: resources,
        }),
      }
    })
  }, [])

  const startTravelToStop = useCallback((s: GameState, stopIndex: number): GameState => {
    if (!s.tour) return s
    const stop = s.tour.stops[stopIndex]
    if (!stop) return s
    const prevCity = stopIndex === 0 ? s.homeCity : s.tour.stops[stopIndex - 1]!.city
    const seed = s.rngSeed + stopIndex * 31
    let next: GameState = {
      ...s,
      rngSeed: seed,
      phase: 'travel',
      activeSetlistBets: [],
      tourStory: appendStory(
        s.tourStory,
        storyTravelStop(seed, stop.city, stop.venue),
      ),
      stopMarkets: {},
      activeMarketKey: null,
      currentMarket: null,
      marketContext: null,
    }
    return beginTravelLegs(next, prevCity, stop.city, seed)
  }, [])

  const goToVenueGatesAction = useCallback(() => {
    setState((s) => goToVenueGates(s, applyMarket))
  }, [])

  const goToLocation = useCallback((location: LocationId) => {
    setState((s) => {
      if (location === 'venue') {
        return goToVenueGates(s, applyMarket)
      }

      // Free return to lot hub — no turn burn
      if (location === 'shakedown' && s.currentLocation !== 'shakedown') {
        const next: GameState = {
          ...s,
          phase: 'shakedown',
          currentLocation: 'shakedown',
          spotFindEvent: null,
        }
        return applyMarket(next, 'shakedown', s.rngSeed + 50)
      }

      const atShakedown = s.phase === 'shakedown' && s.currentLocation === 'shakedown'
      const atLoc = s.phase === 'location' && s.currentLocation === location
      if (atShakedown && location === 'shakedown') return s
      if (atLoc) return s

      let next: GameState = {
        ...s,
        currentLocation: location,
        spotFindEvent: null,
        phase: (location === 'shakedown' ? 'shakedown' : 'location') as PhaseId,
        turnsUntilShow: Math.max(0, s.turnsUntilShow - 1),
        tourStory: appendStory(
          s.tourStory,
          storyLocation(
            s.rngSeed + location.length * 3,
            location,
            s.tour?.stops[s.tour.currentStopIndex]?.venue,
          ),
        ),
      }
      next = applyMarket(next, location, s.rngSeed + location.length * 3)
      next = applyLocationEventOnVisit(next, location, s.rngSeed + location.length * 7, next.tour?.band.name ?? '')
      next = afterCrewTick(next, next.crew)
      if (needsVenueGates(next)) {
        next = goToVenueGates(next, applyMarket)
      }
      return next
    })
  }, [afterCrewTick])

  const returnToShakedown = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      if (s.phase === 'shakedown' && s.currentLocation === 'shakedown') return s
      if (s.phase !== 'location') return s
      if (s.currentLocation === 'shakedown') return s
      if (s.currentLocation === 'venue' && s.turnsUntilShow <= 0) return s

      const next: GameState = {
        ...s,
        phase: 'shakedown',
        currentLocation: 'shakedown',
        spotFindEvent: null,
      }
      return applyMarket(next, 'shakedown', s.rngSeed + 50)
    })
  }, [])

  const enterShow = useCallback(() => {
    setState((s) => {
      const blocked = venueEntryBlockedMessage(s.crew)
      if (blocked) {
        return { ...s, crewAlert: blocked, ...setOutcome(s,blocked, undefined, 'error') }
      }
      return { ...s, phase: 'show', currentLocation: 'venue', crewAlert: null }
    })
  }, [])

  const resolveBets = (
    s: GameState,
    setlist: GameState['lastSetlist'],
    recap: string,
    options?: { attendShow?: boolean },
  ) => {
    const attendShow = options?.attendShow ?? true
    let resources = { ...s.resources }
    let crew = s.crew.map((c) => ({ ...c }))
    let recapOut = recap
    let runBetsWon = s.runBetsWon
    const betResults: ShowBetResult[] = []
    for (const bet of s.activeSetlistBets) {
      if (!attendShow || !setlist) {
        betResults.push({
          songId: bet.songId,
          songTitle: bet.songTitle,
          slot: bet.slot,
          outcome: 'void',
          payout: 0,
        })
        continue
      }
      const hit = resolveSetlistBet(bet, setlist)
      const pay = payoutForBet(bet, hit)
      betResults.push({
        songId: bet.songId,
        songTitle: bet.songTitle,
        slot: bet.slot,
        outcome: hit ? 'hit' : 'miss',
        payout: pay,
      })
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

  const finishShow = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const blocked = venueEntryBlockedMessage(s.crew)
      if (blocked) {
        return { ...s, crewAlert: blocked, ...setOutcome(s,blocked, undefined, 'error') }
      }
      const stop = s.tour.stops[s.tour.currentStopIndex]
      if (!stop) return s
      const setlist = stop.plannedSetlist
      const active = activeCrew(s.crew)
      const ticketsOk = s.resources.tickets >= active.length
      let recap = ticketsOk
        ? showRecapLine('made_it', s.rngSeed, { venue: stop.venue })
        : showRecapLine('chaos_gate', s.rngSeed, { venue: stop.venue })
      const flavor = showRecapFlavor(s.rngSeed + 11)
      if (flavor) recap = `${recap} ${flavor}`
      const { resources, recapOut, runBetsWon, crew: crewAfterBets, betResults } = resolveBets(
        s,
        setlist,
        recap,
      )
      let finalResources = resources
      if (ticketsOk) {
        finalResources = {
          ...finalResources,
          tickets: Math.max(0, finalResources.tickets - active.length),
        }
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
        tourStory: appendStory(
          s.tourStory,
          storyPostShow(s.rngSeed, stop.venue, setlist.songs.length, false),
        ),
        activeSetlistBets: [],
        phase: 'post_show',
      }
    })
  }, [])

  const missShow = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const stop = s.tour.stops[s.tour.currentStopIndex]
      const seed = s.rngSeed + 37
      const hustle = rollMissShowHustleEvent(seed, s.crew)
      let recap = showRecapLine('missed', seed, { venue: stop?.venue ?? 'the show' })
      const flavor = showRecapFlavor(seed + 19)
      if (flavor) recap = `${recap} ${flavor}`
      const {
        resources: afterBets,
        recapOut,
        runBetsWon,
        crew: crewAfterBets,
        betResults,
      } = resolveBets(s, null, recap, { attendShow: false })
      let resources = afterBets
      const resourcesBeforeHustle = { ...resources }
      if (hustle) {
        resources = applyMissShowHustleEffects(resources, hustle.id)
      }
      const hustleLoot = hustle
        ? formatResourceDeltas(resourcesBeforeHustle, resources)
        : ''
      const runStats = patchRunStats(s.runStats, { showsMissed: s.runStats.showsMissed + 1 })
      const hustleEvent = hustle
        ? { ...hustle, loot: hustleLoot || undefined }
        : null
      const hustleSnap: OutcomeSnapshot | undefined =
        hustle && hustleLoot
          ? { resourcesBefore: resourcesBeforeHustle, resourcesAfter: resources }
          : undefined
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
          ? appendStory(
              appendStory(
                s.tourStory,
                storyPostShow(seed, stop?.venue ?? 'the show', 0, true),
              ),
              storyEvent(seed + 3, hustle.title, hustle.body),
            )
          : appendStory(
              s.tourStory,
              storyPostShow(seed, stop?.venue ?? 'the show', 0, true),
            ),
        activeSetlistBets: [],
        lastSetlist: null,
        phase: 'post_show',
        ...(hustleSnap ? setOutcome(s, hustle!.title, hustleSnap) : {}),
      }
    })
  }, [])

  const enterPostShowShakedown = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const seed = s.rngSeed + 41
      const genre = (s.genre ?? DEFAULT_GENRE) as GenreId
      const djBand = generateBand(seed + 99, genre).name
      const rolled = rollPostShowShakedownEvent(seed, djBand)
      const resourcesBefore = { ...s.resources }
      let resources = { ...s.resources }
      if (rolled) {
        resources = applyShakedownEventEffects(resources, rolled.id)
      }
      const loot = rolled ? formatResourceDeltas(resourcesBefore, resources) : ''
      const event = rolled ? { ...rolled, loot: loot || undefined } : null
      const snap: OutcomeSnapshot | undefined =
        rolled && loot
          ? { resourcesBefore, resourcesAfter: resources }
          : undefined

      // After-party DJ set counts as a show + unique band
      let runStats = s.runStats
      if (rolled?.id.startsWith('after_party')) {
        runStats = patchRunStats(runStats, {
          showsSeen: runStats.showsSeen + 1,
          bandsSeen: runStats.bandsSeen + 1,
        })
      }

      // Crew effects from after-party: health drain on all active, then wook flu if applicable
      let crew = s.crew
      let crewAlert = s.crewAlert
      if (rolled?.healthDrain) {
        const drain = rolled.healthDrain
        crew = crew.map((m) =>
          m.bailed ? m : { ...m, health: Math.max(0, m.health - drain) },
        )
      }
      if (rolled?.crewEffect === 'wook_flu') {
        const infected = infectRandomCrewWithWookFlu(crew, seed + 13)
        crew = infected.crew
        if (infected.infectedName) {
          crewAlert = `${infected.infectedName} caught something at the after-party. Wook flu.`
        }
      }

      let next = applyMarket(
        { ...s, crew, resources, rngSeed: seed },
        'post_show_shakedown',
        seed + 7,
      )
      return {
        ...next,
        crew,
        crewAlert,
        runStats,
        phase: 'post_show_shakedown',
        postShowShakedownEvent: event,
        tourStory: appendStory(
          next.tourStory,
          storyEvent(
            seed,
            rolled?.title ?? 'After-show shakedown',
            rolled?.body ?? 'The lot exhales. Time to hustle before the highway.',
          ),
        ),
        ...(snap ? setOutcome(s, rolled!.title, snap) : {}),
      }
    })
  }, [])

  const prepNextLeg = useCallback(() => {
    setState((s) => {
      if (!s.tour) return { ...s, phase: 'title' as PhaseId }
      const nextIndex = s.tour.currentStopIndex + 1
      if (nextIndex >= s.tour.stops.length) {
        return endRun(
          s,
          'completed',
          'Tour wrapped. You saw the band, burned miles, and lived to tell the lot about it.',
        )
      }
      return startTravelToStop(
        {
          ...s,
          tour: { ...s.tour, currentStopIndex: nextIndex },
          turnsUntilShow: BALANCE.travel.turnsUntilShow,
          currentLocation: 'shakedown',
          postShowShakedownEvent: null,
          shakedownLotEvent: null,
          spotFindEvent: null,
          missShowHustleEvent: null,
          currentMarket: null,
          currentMarketStock: null,
          marketFlavor: null,
          marketContext: null,
          activeMarketKey: null,
          marketCopChase: null,
          lastOutcome: null,
          lastOutcomeTone: 'default',
        },
        nextIndex,
      )
    })
  }, [endRun, startTravelToStop])

  const finishRunRecap = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: 'title',
      tour: null,
      travel: null,
      runStats: emptyRunStats(),
      runBetsWon: 0,
      tourStory: [],
      startRunAfterCrewSave: false,
      lastSetlist: null,
      postShowRecap: '',
      lastShowBetResults: [],
      postShowShakedownEvent: null,
      shakedownLotEvent: null,
      spotFindEvent: null,
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobStipend: null,
      activeSetlistBets: [],
      currentMarket: null,
      marketContext: null,
      currentMarketStock: null,
      marketFlavor: null,
      crewAlert: null,
      lastOutcome: null,
      lastOutcomeTone: 'default',
    }))
  }, [])

  const clearLastOutcome = useCallback(() => {
    setState((s) =>
      s.lastOutcome == null
        ? s
        : { ...s, lastOutcome: null, lastOutcomeTone: 'default' },
    )
  }, [])

  const performLocationAction = useCallback((actionId: string) => {
    setState((s) => {
      const actions = getLocationActions(s.currentLocation)
      const action: LocationAction | undefined = actions.find((a) => a.id === actionId)
      if (!action) return s
      if (!canAffordAction(action, s.resources)) return s

      // Apply cost
      let resources = { ...s.resources }
      for (const [key, amount] of Object.entries(action.cost) as [keyof Resources, number][]) {
        if (key === 'hasVehicle' || typeof amount !== 'number') continue
        const cur = resources[key]
        if (typeof cur === 'number') resources = { ...resources, [key]: Math.max(0, cur - amount) }
      }

      // dig_bins: 50% chance of $10–30 cash find, 50% flavor only
      if (actionId === 'dig_bins') {
        const lucky = Math.abs(s.rngSeed + 13) % 2 === 0
        if (lucky) {
          const amount = 10 + (Math.abs(s.rngSeed + 31) % 3) * 10
          resources = { ...resources, cash: resources.cash + amount }
          return {
            ...s,
            resources,
            ...setOutcome(s, `Dug the bins — found $${amount} tucked in a sleeve`),
          }
        }
        return { ...s, resources, ...setOutcome(s, 'Dug the bins — nothing but good vibes') }
      }

      // Apply effect
      for (const [key, amount] of Object.entries(action.effect) as [keyof Resources, number][]) {
        if (key === 'hasVehicle' || typeof amount !== 'number') continue
        const cur = resources[key]
        if (typeof cur === 'number') resources = { ...resources, [key]: Math.max(0, cur + amount) }
      }

      const flavorMap: Partial<Record<string, string>> = {
        join_circle: 'Joined the circle — good hang',
        order_meal: 'Ordered a meal — +3 food',
      }
      const flavor = flavorMap[actionId] ?? action.label
      return { ...s, resources, ...setOutcome(s, flavor) }
    })
  }, [])

  const takeDayJobStipend = useCallback(() => {
    setState((s) => {
      if (!s.dayJobStipend || !s.savedCrew) {
        return { ...s, phase: 'title' as PhaseId, dayJobStipend: null }
      }
      return {
        ...s,
        savedCrew: { ...s.savedCrew, bank: s.dayJobStipend },
        phase: 'title' as PhaseId,
        dayJobStipend: null,
        runStats: emptyRunStats(),
        runBetsWon: 0,
        tourStory: [],
        runRecapMessage: '',
      }
    })
  }, [])

  const adjustResources = useCallback((partial: Partial<Resources>) => {
    setState((s) => ({ ...s, resources: { ...s.resources, ...partial } }))
  }, [])

  const hotelCrash = useCallback(() => {
    setState((s) => {
      if (!s.tour || s.currentLocation !== 'hotel') return s
      if (s.turnsUntilShow <= 0) return s
      const cost = BALANCE.resources.hotelCrashCost
      if (s.resources.cash < cost) return s

      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      const resourcesAfter = { ...s.resources, cash: s.resources.cash - cost }
      const crew = applyHotelCrashToCrew(s.crew.map((c) => ({ ...c })))
      const rngSeed = s.rngSeed + 13
      const feedback = consumeFeedback('hotel_crash', 'Crew', rngSeed, { cost })

      let next = finalizeCrewCare(
        {
          ...s,
          resources: resourcesAfter,
          rngSeed,
          turnsUntilShow: Math.max(0, s.turnsUntilShow - 1),
        },
        crew,
        feedback,
        {
          resourcesBefore,
          resourcesAfter,
          crewBefore,
          crewAfter: crew,
        },
      )
      if (needsVenueGates(next)) {
        next = goToVenueGates(next, applyMarket)
      }
      return next
    })
  }, [finalizeCrewCare])

  const friendsCrash = useCallback(() => {
    setState((s) => {
      if (!s.tour || s.currentLocation !== 'friends_house') return s
      if (s.turnsUntilShow <= 0) return s
      const cost = BALANCE.resources.friendsCrashCost
      if (s.resources.cash < cost) return s

      const resourcesBefore = { ...s.resources }
      const crewBefore = s.crew.map((c) => ({ ...c }))
      const resourcesAfter = { ...s.resources, cash: s.resources.cash - cost }
      const crew = applyFriendsCrashToCrew(s.crew.map((c) => ({ ...c })))
      const rngSeed = s.rngSeed + 17
      const feedback = consumeFeedback('friends_crash', 'Crew', rngSeed, { cost })

      let next = finalizeCrewCare(
        {
          ...s,
          resources: resourcesAfter,
          rngSeed,
          turnsUntilShow: Math.max(0, s.turnsUntilShow - 1),
        },
        crew,
        feedback,
        {
          resourcesBefore,
          resourcesAfter,
          crewBefore,
          crewAfter: crew,
        },
      )
      if (needsVenueGates(next)) {
        next = goToVenueGates(next, applyMarket)
      }
      return next
    })
  }, [finalizeCrewCare])

  const value = useMemo(
    () => ({
      state,
      goToTitle,
      goToCrew,
      goToStats,
      requestStartRun,
      saveCrew,
      setCrewSize,
      shuffleCrewNames,
      resetCrew,
      setCrewMemberName,
      setCrewMemberSticker,
      setHomeCity,
      setGenre,
      setBudget,
      crewConsume,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      visitRoadside,
      leaveRoadside,
      placeSetlistBet,
      cancelSetlistBet,
      marketBuy,
      buyBalloons,
      clownJuiceBalloonChoice,
      marketSell,
      resolveMarketCopChase,
      shuffleOnHome,
      missShow,
      goToLocation,
      goToVenueGates: goToVenueGatesAction,
      returnToShakedown,
      enterShow,
      finishShow,
      enterPostShowShakedown,
      prepNextLeg,
      finishRunRecap,
      takeDayJobStipend,
      adjustResources,
      hotelCrash,
      friendsCrash,
      clearLastOutcome,
      performLocationAction,
    }),
    [
      state,
      goToTitle,
      goToCrew,
      goToStats,
      requestStartRun,
      saveCrew,
      setCrewSize,
      shuffleCrewNames,
      resetCrew,
      setCrewMemberName,
      setCrewMemberSticker,
      setHomeCity,
      setGenre,
      setBudget,
      crewConsume,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      visitRoadside,
      leaveRoadside,
      placeSetlistBet,
      cancelSetlistBet,
      marketBuy,
      buyBalloons,
      clownJuiceBalloonChoice,
      marketSell,
      resolveMarketCopChase,
      shuffleOnHome,
      missShow,
      goToLocation,
      goToVenueGatesAction,
      returnToShakedown,
      enterShow,
      finishShow,
      enterPostShowShakedown,
      prepNextLeg,
      finishRunRecap,
      takeDayJobStipend,
      adjustResources,
      hotelCrash,
      friendsCrash,
      clearLastOutcome,
      performLocationAction,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
