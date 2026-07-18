import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { setOutcome } from './outcome/state'
import { afterCrewTick, crewLabel, endRun, finalizeCrewCare, maybeEndRunIfAllBailed } from './run/helpers'
import { arriveAtShakedownHub } from './shakedown/arrival'
import { applyEventEffects } from './travel/eventEffects'
import { resolveTravelAction, type TravelAction } from './travel/travelActions'
import { resolveEnterShow, resolveFinishShow, resolveMissShow, resolveEnterPostShowShakedown } from './show/resolve'
import { buildRunResources, canStartTour, dayJobStipend } from './crew/economy'
import { createNewSavedCrew } from './crew/rep'
import { rollMemberKit } from './crew/starterKit'
import { appendStory, storyIntro, storyLocation, storyTravelStop } from './crew/tourStory'
import {
  allCrewBailed,
  applyDrinkToMember,
  applyEatToMember,
  applyFriendsCrashToCrew,
  applyHotelCrashToCrew,
  applyBalloonsToCrew,
  applyPunchToRandomCrew,
  applySubstancesToMember,
  defaultMeters,
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
  consumeFeedback,
  runEndLine,
  shuffleHomeBlockedMessage,
} from './travel/eventOutcomes'
import { loadPersisted, savePersisted } from './persistence'
import { createStartingResources } from './resources'
import { emptyRunStats, patchRunStats, canShuffleHome } from './stats'
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
  applyLocationActionEffects,
  type LocationAction,
} from './location/locationEvents'
import { goToVenueGates, needsVenueGates } from './venueGates'
import { beginTravelLegs, pickIntroFlavor, rollLegArrivalEvent } from './travel/arrival'
import type {
  BetSlot,
  CrewMember,
  GameState,
  LocationId,
  PhaseId,
  Resources,
  SavedCrew,
  StarterTier,
} from './types'


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
  leaveRoadsideAndAdvance: () => void
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
  confirmDayJob: () => void
  takeDayJobStipend: () => void
  adjustResources: (partial: Partial<Resources>) => void
  hotelCrash: () => void
  friendsCrash: () => void
  clearLastOutcome: () => void
  performLocationAction: (actionId: string) => void
}

export type { TravelAction }

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
    usedLocationActions: [],
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
    dayJobReason: null,
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


function applyMarket(
  s: GameState,
  context: MarketContext,
  seed: number,
): GameState {
  return ensureMarket(s, context, seed)
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
    [],
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
    usedLocationActions: [],
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobReason: null,
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
    next = beginTravelLegs(next, origin, stop.city, seed + 5, pickIntroFlavor(seed + 3))
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
    phase: 'pre_day_job',
    runRecapMessage: message,
    dayJobReason: message,
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
  }, [])

  const travelAction = useCallback((action: TravelAction) => {
    setState((s) => resolveTravelAction(s, action))
  }, [])

  const resolveTravelEvent = useCallback((choiceId?: string) => {
    setState((s) => {
      const event = s.travel?.pendingEvent
      if (!event) return s
      if (event.choices && !choiceId) return s
      return applyEventEffects(s, event, choiceId)
    })
  }, [])

  const advanceTravelLeg = useCallback(() => {
    setState((s) => {
      if (!s.travel || s.travel.pendingEvent || s.travel.atRoadside) return s
      if (allCrewBailed(s.crew)) {
        return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
      }
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s

      const rngSeed = s.rngSeed + 9
      const runStats = patchRunStats(s.runStats, { milesTraveled: s.runStats.milesTraveled + leg.miles })
      const crew = s.crew.map((c) => ({ ...c }))
      let next = afterCrewTick({ ...s, rngSeed, runStats, crew }, crew)

      const nextIndex = s.travel.currentLegIndex + 1
      if (nextIndex >= s.travel.legs.length) {
        return arriveAtShakedownHub(next, rngSeed + 50)
      }
      next = {
        ...next,
        travel: { ...s.travel, currentLegIndex: nextIndex, pendingEvent: null, atRoadside: false, lastEventResult: null, introFlavor: null },
      }
      return rollLegArrivalEvent(next, rngSeed + 11)
    })
  }, [])

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

  // Leave roadside AND advance to the next leg in one click
  const leaveRoadsideAndAdvance = useCallback(() => {
    setState((s) => {
      if (!s.travel || s.travel.pendingEvent) return s
      if (allCrewBailed(s.crew)) {
        return maybeEndRunIfAllBailed(s, s.crewAlert ?? 'Everyone shuffled on home.')
      }
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s
      // Clear roadside + market first
      const cleared: typeof s = {
        ...s,
        travel: { ...s.travel, atRoadside: false },
        currentMarket: null,
        currentMarketStock: null,
        marketFlavor: null,
        marketContext: null,
        activeMarketKey: null,
      }
      const rngSeed = cleared.rngSeed + 9
      const runStats = patchRunStats(cleared.runStats, { milesTraveled: cleared.runStats.milesTraveled + leg.miles })
      const crew = cleared.crew.map((c) => ({ ...c }))
      let next = afterCrewTick({ ...cleared, rngSeed, runStats, crew }, crew)
      const nextIndex = cleared.travel!.currentLegIndex + 1
      if (nextIndex >= cleared.travel!.legs.length) {
        return arriveAtShakedownHub(next, rngSeed + 50)
      }
      next = {
        ...next,
        travel: { ...cleared.travel!, currentLegIndex: nextIndex, pendingEvent: null, atRoadside: false, lastEventResult: null, introFlavor: null },
      }
      return rollLegArrivalEvent(next, rngSeed + 11)
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
    usedLocationActions: [],
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
    usedLocationActions: [],
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
  }, [])

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
    usedLocationActions: [],
      }
      return applyMarket(next, 'shakedown', s.rngSeed + 50)
    })
  }, [])

  const enterShow = useCallback(() => { setState(resolveEnterShow) }, [])
  const finishShow = useCallback(() => { setState(resolveFinishShow) }, [])
  const missShow = useCallback(() => { setState(resolveMissShow) }, [])
  const enterPostShowShakedown = useCallback(() => { setState(resolveEnterPostShowShakedown) }, [])

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
    usedLocationActions: [],
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
  }, [startTravelToStop])

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
    usedLocationActions: [],
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobReason: null,
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
      // Enforce once-per-visit
      if (action.once && s.usedLocationActions.includes(actionId)) return s
      if (!canAffordAction(action, s.resources)) return s

      // dig_bins: 50% chance of $10–30 bonus, 50% flavor only (overrides JSON effect)
      let resources = { ...s.resources }
      if (actionId === 'dig_bins') {
        // Deduct cost first
        resources = applyLocationActionEffects(resources, { ...action, effect: {} })
        const lucky = Math.abs(s.rngSeed + 13) % 2 === 0
        const bonus = lucky ? 10 + (Math.abs(s.rngSeed + 31) % 3) * 10 : 0
        resources = { ...resources, cash: resources.cash + bonus }
        const msg = lucky
          ? `Dug the bins — found $${bonus} tucked in a sleeve`
          : 'Dug the bins — nothing but good vibes'
        return {
          ...s,
          resources,
          usedLocationActions: action.once ? [...s.usedLocationActions, actionId] : s.usedLocationActions,
          turnsUntilShow: action.burnsTurn ? Math.max(0, s.turnsUntilShow - 1) : s.turnsUntilShow,
          ...setOutcome(s, msg),
        }
      }

      // buy_balloons: location action — same effect as post-show balloon buy, no cop chase
      if (actionId === 'buy_balloons') {
        const price = BALANCE.markets.balloons.price
        if (s.resources.cash < price) return s
        const rngSeed = s.rngSeed + 31
        const crew = applyBalloonsToCrew(s.crew)
        const runStats = patchRunStats(s.runStats, { balloonsHuffed: s.runStats.balloonsHuffed + 1 })
        resources = { ...resources, cash: resources.cash - price }
        const flavor = balloonBuyMessage(rngSeed)
        return {
          ...s,
          resources,
          crew,
          rngSeed,
          runStats,
          usedLocationActions: [...s.usedLocationActions, actionId],
          turnsUntilShow: action.burnsTurn ? Math.max(0, s.turnsUntilShow - 1) : s.turnsUntilShow,
          ...setOutcome(s, flavor),
        }
      }

      // celo: random ante $5-$50 (multiples of 5), 50% win, 50% lose
      if (actionId === 'celo') {
        const seed = Math.abs(s.rngSeed + s.resources.cash + s.runStats.milesTraveled)
        const ante = (1 + (seed % 10)) * 5  // 5, 10, 15 … 50
        if (s.resources.cash < ante) return s  // can't afford this roll
        const win = Math.random() < 0.5
        resources = { ...resources, cash: resources.cash - ante }
        if (win) resources = { ...resources, cash: resources.cash + ante * 2 }
        const msg = win ? `Celó — winner! +$${ante}` : `Celó — snake eyes. Lost $${ante}.`
        return {
          ...s,
          resources,
          usedLocationActions: action.once ? [...s.usedLocationActions, actionId] : s.usedLocationActions,
          turnsUntilShow: action.burnsTurn ? Math.max(0, s.turnsUntilShow - 1) : s.turnsUntilShow,
          ...setOutcome(s, msg),
        }
      }

      // order_meal: $10 per crew member, heals everyone's hunger to full
      if (actionId === 'order_meal') {
        const costPerHead = 10
        const totalCost = costPerHead * s.crew.length
        if (s.resources.cash < totalCost) return s
        resources = { ...resources, cash: resources.cash - totalCost }
        const healedCrew = s.crew.map((m) => ({ ...m, hunger: 100 }))
        return {
          ...s,
          resources,
          crew: healedCrew,
          usedLocationActions: action.once ? [...s.usedLocationActions, actionId] : s.usedLocationActions,
          turnsUntilShow: action.burnsTurn ? Math.max(0, s.turnsUntilShow - 1) : s.turnsUntilShow,
          ...setOutcome(s, `Ordered a round of meals — everyone's full ($${totalCost})`),
        }
      }

      resources = applyLocationActionEffects(resources, action)
      const flavorMap: Partial<Record<string, string>> = {
        join_circle: 'Joined the circle — scored a beer',
      }
      const flavor = flavorMap[actionId] ?? action.label
      return {
        ...s,
        resources,
        usedLocationActions: action.once ? [...s.usedLocationActions, actionId] : s.usedLocationActions,
        turnsUntilShow: action.burnsTurn ? Math.max(0, s.turnsUntilShow - 1) : s.turnsUntilShow,
        ...setOutcome(s, flavor),
      }
    })
  }, [])

  const confirmDayJob = useCallback(() => {
    setState((s) => ({ ...s, phase: 'day_job' as PhaseId }))
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
      dayJobReason: null,
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
  }, [])

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
  }, [])

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
      leaveRoadsideAndAdvance,
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
      confirmDayJob,
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
      leaveRoadsideAndAdvance,
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
      confirmDayJob,
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
