import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
  applyHotelCrashToCrew,
  applyBurnGasCruiseToCrew,
  applyHitchVibe,
  applyPushThroughToCrew,
  applyRestToCrew,
  applyShowVibeToCrew,
  applySubstancesToMember,
  applyWookFluToCrew,
  collectCrewWarnings,
  crewAllWookFlu,
  defaultMeters,
  tickCrewMeters,
  venueEntryBlockedMessage,
} from './crew/meters'
import { generateBand, generateCrewNames, generateTour } from './generators'
import { type MarketContext } from './market'
import { ensureMarket, persistMarketStock } from './marketCache'
import { BALANCE } from './config'
import { MAX_ACTIVE_BETS } from './betting'
import {
  bathroomFindResult,
  consumeFeedback,
  pulledOverResult,
  runEndLine,
  shuffleHomeBlockedMessage,
  showRecapLine,
  soloEventResult,
  travelFeedback,
} from './travel/eventOutcomes'
import { resolveIntelTrade, type IntelEventKey } from './travel/intelTips'
import { resolvePulledOver } from './travel/pulledOverResolve'
import { loadPersisted, savePersisted } from './persistence'
import { createStartingResources } from './resources'
import { emptyRunStats, patchRunStats, canShuffleHome } from './stats'
import { maybeRollTravelEvent } from './travel/events'
import {
  applyMissShowHustleEffects,
  rollMissShowHustleEvent,
} from './hustle/missShowEvents'
import {
  applyShakedownEventEffects,
  rollPostShowShakedownEvent,
} from './shakedown/events'
import { goToVenueGates, needsVenueGates } from './venueGates'
import { generateTravelLegs, pushThroughCost } from './travel/legs'
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

type RunOutcome = 'completed' | 'day_job' | 'shuffle'

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
  setHomeCity: (city: string) => void
  setFavoriteBandHint: (hint: string) => void
  setBudget: (budget: number) => void
  crewConsume: (memberId: string, item: 'eat' | 'drink' | 'substances') => void
  travelAction: (action: TravelAction) => void
  resolveTravelEvent: (choiceId?: string) => void
  advanceTravelLeg: () => void
  visitRoadside: () => void
  leaveRoadside: () => void
  placeSetlistBet: (songId: string, songTitle: string, amount: number, slot: BetSlot) => void
  marketBuy: (item: 'food' | 'beer' | 'drugs' | 'tickets') => void
  marketSell: (item: 'food' | 'beer' | 'drugs') => void
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
    ...defaultMeters(),
  }))
}

function buildCrewFromNames(names: string[]): CrewMember[] {
  return names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    ...defaultMeters(),
  }))
}

function defaultCrew(size = 1, seed = Date.now() % 100000): CrewMember[] {
  return buildCrewFromNames(generateCrewNames(size, seed))
}

function createInitialState(): GameState {
  const persisted = loadPersisted()
  const saved = persisted.savedCrew
  const tier: StarterTier = saved?.starterTier ?? 200
  return {
    phase: 'title',
    crew: saved ? crewFromSaved(saved) : defaultCrew(1),
    homeCity: saved?.homeCity ?? 'Burlington, VT',
    favoriteBandHint: saved?.favoriteBandHint ?? '',
    resources: createStartingResources(saved?.bank ?? tier),
    tour: null,
    travel: null,
    currentLocation: 'shakedown',
    turnsUntilShow: BALANCE.travel.turnsUntilShow,
    lastSetlist: null,
    postShowRecap: '',
    postShowShakedownEvent: null,
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
    crewAlert: null,
  }
}

function persistCrew(savedCrew: SavedCrew | null) {
  savePersisted({ savedCrew })
}

function crewLabel(saved: SavedCrew | null, crew: CrewMember[]): string {
  if (saved?.members.length) return saved.members.map((m) => m.name).join(', ')
  return crew.map((c) => c.name).join(', ')
}

function buildTravel(origin: string, destination: string, seed: number) {
  return {
    origin,
    destination,
    legs: generateTravelLegs(seed, origin, destination),
    currentLegIndex: 0,
    pendingEvent: null,
    atRoadside: false,
    lastEventResult: null,
  }
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
      const { crew: ticked, bailMessages, warnings } = tickCrewMeters(crew)
      const alertParts = [...bailMessages, ...warnings]
      let next: GameState = {
        ...s,
        crew: ticked,
        crewAlert: alertParts.length > 0 ? alertParts.join(' ') : null,
      }
      if (bailMessages.length) {
        next = {
          ...next,
          postShowRecap: [next.postShowRecap, ...bailMessages].filter(Boolean).join(' '),
        }
      }
      if (activeCrew(ticked).length === 0 && ticked.length > 0) {
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
      if (allCrewBailed(s.crew)) {
        return endRun(s, 'shuffle', message)
      }
      return s
    },
    [endRun],
  )

  const finalizeCrewCare = useCallback(
    (s: GameState, crew: CrewMember[], feedback: string | null): GameState => {
      const warnings = collectCrewWarnings(crew)
      const alertParts = feedback ? [feedback, ...warnings] : warnings
      const next: GameState = {
        ...s,
        crew,
        crewAlert: alertParts.length > 0 ? alertParts.join(' ') : null,
      }
      return maybeEndRunIfAllBailed(next, next.crewAlert ?? 'Everyone shuffled on home.')
    },
    [maybeEndRunIfAllBailed],
  )

  const consumeCrewItem = useCallback(
    (s: GameState, memberId: string, item: 'eat' | 'drink' | 'substances'): GameState => {
      if (!s.tour) return s
      if (allCrewBailed(s.crew)) {
        return endRun(s, 'shuffle', s.crewAlert ?? 'Everyone shuffled on home.')
      }

      const member = s.crew.find((c) => c.id === memberId)
      if (!member || member.bailed) return s

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
          favoriteBandHint: s.savedCrew.favoriteBandHint,
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
    const band = generateBand(seed)
    const tour = generateTour(band, seed + 3, BALANCE.travel.tourStops)
    const stop = tour.stops[0]!
    const origin = base.homeCity
    let next: GameState = {
      ...base,
      crew,
      resources,
      rngSeed: seed,
      tour,
      travel: buildTravel(origin, stop.city, seed + 5),
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
      postShowShakedownEvent: null,
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobStipend: null,
      activeSetlistBets: [],
      stopMarkets: {},
      activeMarketKey: null,
      currentMarket: null,
      marketContext: null,
    }
    next = applyMarket(next, 'shakedown', seed + 99)
    return next
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
        favoriteBandHint: s.savedCrew.favoriteBandHint,
      })
    })
  }, [beginRun])

  const saveCrew = useCallback(() => {
    setState((s) => {
      const seed = Date.now() % 100000
      const tier = (s.starterTier ?? s.resources.cash) as StarterTier
      const members = s.crew.map((c, i) => ({
        name: c.name,
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
            favoriteBandHint: s.favoriteBandHint,
            members,
          }
        : createNewSavedCrew({
            homeCity: s.homeCity,
            favoriteBandHint: s.favoriteBandHint,
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
          crew.push({ id: `p${crew.length + 1}`, name, ...defaultMeters() })
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
        crew: s.crew.map((member, i) => ({ ...member, name: names[i]! })),
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
        favoriteBandHint: '',
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

  const setHomeCity = useCallback((city: string) => {
    setState((s) => ({ ...s, homeCity: city }))
  }, [])

  const setFavoriteBandHint = useCallback((hint: string) => {
    setState((s) => ({ ...s, favoriteBandHint: hint }))
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
          return endRun(s, 'shuffle', s.crewAlert ?? 'Everyone shuffled on home.')
        }

        let resources = { ...s.resources }
        let runStats = { ...s.runStats }
        let crew = s.crew.map((c) => ({ ...c }))
        let rngSeed = s.rngSeed + 1

        const TA = BALANCE.travel
        switch (action) {
          case 'rest':
            crew = applyRestToCrew(crew)
            return finalizeCrewCare(
              { ...s, resources, runStats, crew, rngSeed },
              crew,
              consumeFeedback('rest', 'Crew', rngSeed),
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
            break
          case 'push_through': {
            if (s.travel.pendingEvent || s.travel.atRoadside) return s
            const remaining = s.travel.legs.slice(s.travel.currentLegIndex)
            if (remaining.length === 0) return s

            const cost = pushThroughCost(s.travel, resources.hasVehicle)
            if (resources.food < cost.food) {
              return {
                ...s,
                crewAlert: travelFeedback('push_through_need_food', rngSeed, {
                  food: cost.food,
                  legs: cost.legs,
                }),
              }
            }
            if (resources.hasVehicle && resources.gas < cost.gas) {
              return {
                ...s,
                crewAlert: travelFeedback('push_through_need_gas', rngSeed, {
                  gas: cost.gas,
                  legs: cost.legs,
                }),
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

            next = applyMarket(next, 'shakedown', next.rngSeed + 50)
            return {
              ...next,
              phase: 'shakedown',
              currentLocation: 'shakedown',
              turnsUntilShow: BALANCE.travel.turnsUntilShow,
              travel: null,
              crewAlert: travelFeedback('push_through_success', next.rngSeed, {
                legs: cost.legs,
                miles: cost.miles,
              }),
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
              next = applyMarket(next, 'shakedown', rngSeed + 50)
              return {
                ...next,
                phase: 'shakedown',
                currentLocation: 'shakedown',
                turnsUntilShow: BALANCE.travel.turnsUntilShow,
                travel: null,
              }
            }

            return {
              ...next,
              travel: {
                ...s.travel,
                currentLegIndex: newIndex,
                pendingEvent: null,
                atRoadside: false,
                lastEventResult: message,
              },
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
            break
          }
        }

        return afterCrewTick({ ...s, resources, runStats, crew, rngSeed, crewAlert: null }, crew)
      })
    },
    [afterCrewTick, endRun, finalizeCrewCare],
  )

  const applyEventEffects = useCallback(
    (s: GameState, event: NonNullable<GameState['travel']>['pendingEvent'], choiceId?: string) => {
      if (!event) return s
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
          break
        }
        case 'robbed': {
          const fx = FX.robbed
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash + fx.cash),
            drugs: Math.max(0, resources.drugs + fx.drugs),
          }
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
        case 'wook_flu':
          crew = applyWookFluToCrew(crew)
          if (crewAllWookFlu(crew)) {
            return endRun(
              { ...s, resources, runStats, crew, rngSeed },
              'day_job',
              soloEventResult('wook_flu', rngSeed),
            )
          }
          break
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

      return {
        ...s,
        resources,
        runStats,
        crew,
        rngSeed,
        activeSetlistBets,
        tourStory: appendStory(
          s.tourStory,
          storyEvent(rngSeed, event.title, resultMessage),
        ),
        travel: s.travel
          ? { ...s.travel, pendingEvent: null, lastEventResult: resultMessage }
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
        return endRun(s, 'shuffle', s.crewAlert ?? 'Everyone shuffled on home.')
      }
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s

      const rngSeed = s.rngSeed + 9
      const event = maybeRollTravelEvent(rngSeed, s.tour
        ? {
            catalog: s.tour.catalog,
            plannedSetlist: s.tour.stops[s.tour.currentStopIndex]?.plannedSetlist,
          }
        : undefined)
      if (event) {
        return {
          ...s,
          rngSeed,
          travel: { ...s.travel, pendingEvent: event, lastEventResult: null },
        }
      }

      const runStats = patchRunStats(s.runStats, {
        milesTraveled: s.runStats.milesTraveled + leg.miles,
      })
      let crew = s.crew.map((c) => ({ ...c }))
      let next = afterCrewTick({ ...s, rngSeed, runStats, crew }, crew)

      const nextIndex = s.travel.currentLegIndex + 1
      if (nextIndex >= s.travel.legs.length) {
        next = applyMarket(next, 'shakedown', rngSeed + 50)
        return {
          ...next,
          phase: 'shakedown',
          currentLocation: 'shakedown',
          turnsUntilShow: BALANCE.travel.turnsUntilShow,
          travel: null,
        }
      }

      return {
        ...next,
        travel: {
          ...s.travel,
          currentLegIndex: nextIndex,
          pendingEvent: null,
          atRoadside: false,
          lastEventResult: null,
        },
      }
    })
  }, [afterCrewTick, endRun])

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
      return { ...s, travel: { ...s.travel, atRoadside: false } }
    })
  }, [])

  const placeSetlistBet = useCallback(
    (songId: string, songTitle: string, amount: number, slot: BetSlot) => {
      setState((s) => {
        if (s.resources.cash < amount || s.activeSetlistBets.length >= MAX_ACTIVE_BETS) return s
        if (s.activeSetlistBets.some((b) => b.songId === songId && b.slot === slot)) return s
        return {
          ...s,
          resources: { ...s.resources, cash: s.resources.cash - amount },
          activeSetlistBets: [...s.activeSetlistBets, { songId, songTitle, amount, slot }],
        }
      })
    },
    [],
  )

  const marketBuy = useCallback((item: 'food' | 'beer' | 'drugs' | 'tickets') => {
    setState((s) => {
      const p = s.currentMarket
      const stock = s.currentMarketStock
      if (!p || !stock) return s
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let nextStock = { ...stock }

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
      } else return s
      return persistMarketStock(
        {
          ...s,
          resources,
          runStats,
          currentMarketStock: nextStock,
          crewAlert: null,
        },
        nextStock,
      )
    })
  }, [])

  const marketSell = useCallback((item: 'food' | 'beer' | 'drugs') => {
    setState((s) => {
      const p = s.currentMarket
      if (!p) return s
      let resources = { ...s.resources }
      if (item === 'food' && resources.food > 0) {
        resources = { ...resources, food: resources.food - 1, cash: resources.cash + p.foodSell }
      } else if (item === 'beer' && resources.beer > 0) {
        resources = { ...resources, beer: resources.beer - 1, cash: resources.cash + p.beerSell }
      } else if (item === 'drugs' && resources.drugs > 0) {
        resources = { ...resources, drugs: resources.drugs - 1, cash: resources.cash + p.drugsSell }
      } else return s
      return { ...s, resources }
    })
  }, [])

  const startTravelToStop = useCallback((s: GameState, stopIndex: number): GameState => {
    if (!s.tour) return s
    const stop = s.tour.stops[stopIndex]
    if (!stop) return s
    const prevCity = stopIndex === 0 ? s.homeCity : s.tour.stops[stopIndex - 1]!.city
    const seed = s.rngSeed + stopIndex * 31
    return {
      ...s,
      rngSeed: seed,
      phase: 'travel',
      activeSetlistBets: [],
      travel: buildTravel(prevCity, stop.city, seed),
      tourStory: appendStory(
        s.tourStory,
        storyTravelStop(seed, stop.city, stop.venue),
      ),
      stopMarkets: {},
      activeMarketKey: null,
      currentMarket: null,
      marketContext: null,
    }
  }, [])

  const goToVenueGatesAction = useCallback(() => {
    setState((s) => goToVenueGates(s, applyMarket))
  }, [])

  const goToLocation = useCallback((location: LocationId) => {
    setState((s) => {
      if (location === 'venue') {
        return goToVenueGates(s, applyMarket)
      }
      const atShakedown = s.phase === 'shakedown' && s.currentLocation === 'shakedown'
      const atLoc = s.phase === 'location' && s.currentLocation === location
      if (atShakedown && location === 'shakedown') return s
      if (atLoc) return s

      let next: GameState = {
        ...s,
        currentLocation: location,
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
      next = afterCrewTick(next, next.crew)
      if (needsVenueGates(next)) {
        next = goToVenueGates(next, applyMarket)
      }
      return next
    })
  }, [afterCrewTick])

  const returnToShakedown = useCallback(() => {
    goToLocation('shakedown')
  }, [goToLocation])

  const enterShow = useCallback(() => {
    setState((s) => {
      const blocked = venueEntryBlockedMessage(s.crew)
      if (blocked) {
        return { ...s, crewAlert: blocked }
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
    let recapOut = recap
    let runBetsWon = s.runBetsWon
    for (const bet of s.activeSetlistBets) {
      if (!attendShow || !setlist) {
        recapOut += ` Bet “${bet.songTitle}” (${bet.slot}) void — wasn't inside to hear it.`
        continue
      }
      const hit = resolveSetlistBet(bet, setlist)
      const pay = payoutForBet(bet, hit)
      if (hit) {
        resources = { ...resources, cash: resources.cash + pay }
        runBetsWon += 1
        recapOut += ` Bet “${bet.songTitle}” (${bet.slot}) HIT +$${pay}.`
      } else {
        recapOut += ` Bet “${bet.songTitle}” (${bet.slot}) missed.`
      }
    }
    return { resources, recapOut, runBetsWon }
  }

  const finishShow = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const blocked = venueEntryBlockedMessage(s.crew)
      if (blocked) {
        return { ...s, crewAlert: blocked }
      }
      const stop = s.tour.stops[s.tour.currentStopIndex]
      if (!stop) return s
      const setlist = stop.plannedSetlist
      const active = activeCrew(s.crew)
      const ticketsOk = s.resources.tickets >= active.length
      let recap = ticketsOk
        ? showRecapLine('made_it', s.rngSeed, { venue: stop.venue })
        : showRecapLine('chaos_gate', s.rngSeed, { venue: stop.venue })
      const { resources, recapOut, runBetsWon } = resolveBets(s, setlist, recap)
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
        bandsSeen: s.runStats.bandsSeen + 1,
      })
      const crew = ticketsOk ? applyShowVibeToCrew(s.crew) : s.crew
      return {
        ...s,
        crew,
        resources: finalResources,
        lastSetlist: setlist,
        postShowRecap: recapOut,
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
      const { resources: afterBets, recapOut, runBetsWon } = resolveBets(
        s,
        null,
        recap,
        { attendShow: false },
      )
      let resources = afterBets
      if (hustle) {
        resources = applyMissShowHustleEffects(resources, hustle.id)
      }
      const runStats = patchRunStats(s.runStats, { showsMissed: s.runStats.showsMissed + 1 })
      return {
        ...s,
        resources,
        rngSeed: seed,
        postShowRecap: recapOut,
        runStats,
        runBetsWon,
        missShowHustleEvent: hustle,
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
      }
    })
  }, [])

  const enterPostShowShakedown = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const seed = s.rngSeed + 41
      const rolled = rollPostShowShakedownEvent(seed)
      let resources = { ...s.resources }
      if (rolled) {
        resources = applyShakedownEventEffects(resources, rolled.id)
      }
      let next = applyMarket(
        { ...s, resources, rngSeed: seed },
        'post_show_shakedown',
        seed + 7,
      )
      return {
        ...next,
        phase: 'post_show_shakedown',
        postShowShakedownEvent: rolled,
        tourStory: appendStory(
          next.tourStory,
          storyEvent(
            seed,
            rolled?.title ?? 'After-show shakedown',
            rolled?.body ?? 'The lot exhales. Time to hustle before the highway.',
          ),
        ),
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
          missShowHustleEvent: null,
          currentMarket: null,
          currentMarketStock: null,
          marketFlavor: null,
          marketContext: null,
          activeMarketKey: null,
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
      postShowShakedownEvent: null,
      missShowHustleEvent: null,
      runRecapMessage: '',
      dayJobStipend: null,
      activeSetlistBets: [],
      currentMarket: null,
      marketContext: null,
      currentMarketStock: null,
      marketFlavor: null,
      crewAlert: null,
    }))
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
      const cost = BALANCE.resources.hotelCrashCost
      if (s.resources.cash < cost) return s

      const crew = applyHotelCrashToCrew(s.crew.map((c) => ({ ...c })))
      const rngSeed = s.rngSeed + 13
      const feedback = consumeFeedback('hotel_crash', 'Crew', rngSeed, { cost })

      return finalizeCrewCare(
        {
          ...s,
          resources: { ...s.resources, cash: s.resources.cash - cost },
          rngSeed,
        },
        crew,
        feedback,
      )
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
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
      crewConsume,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      visitRoadside,
      leaveRoadside,
      placeSetlistBet,
      marketBuy,
      marketSell,
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
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
      crewConsume,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      visitRoadside,
      leaveRoadside,
      placeSetlistBet,
      marketBuy,
      marketSell,
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
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
