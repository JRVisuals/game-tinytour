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
  activeCrew,
  defaultMeters,
  improveHealth,
  improveHunger,
  improveThirst,
  improveVibe,
  tickCrewMeters,
  worsenHealth,
  worsenHunger,
  worsenThirst,
  worsenVibe,
} from './crew/meters'
import { generateBand, generateTour } from './generators'
import { rollMarket, type MarketContext } from './market'
import { loadPersisted, savePersisted } from './persistence'
import { createStartingResources } from './resources'
import { emptyRunStats, mergeRunIntoLifetime, patchRunStats } from './stats'
import { maybeRollTravelEvent } from './travel/events'
import { generateTravelLegs } from './travel/legs'
import type {
  BetSlot,
  CrewMember,
  GameState,
  LifetimeStats,
  LocationId,
  PhaseId,
  Resources,
  SavedCrew,
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
  setCrewMemberName: (index: number, name: string) => void
  setHomeCity: (city: string) => void
  setFavoriteBandHint: (hint: string) => void
  setBudget: (budget: number) => void
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
  returnToShakedown: () => void
  enterShow: () => void
  finishShow: () => void
  prepNextLeg: () => void
  finishRunRecap: () => void
  adjustResources: (partial: Partial<Resources>) => void
}

export type TravelAction =
  | 'rest'
  | 'eat'
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

function defaultCrew(size = 1): CrewMember[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `p${i + 1}`,
    name: i === 0 ? 'Tour Kid' : `Crew ${i + 1}`,
    ...defaultMeters(),
  }))
}

function mapActiveCrew(crew: CrewMember[], fn: (m: CrewMember) => CrewMember): CrewMember[] {
  return crew.map((m) => (m.bailed ? m : fn(m)))
}

function createInitialState(): GameState {
  const persisted = loadPersisted()
  return {
    phase: 'title',
    crew: persisted.savedCrew ? crewFromSaved(persisted.savedCrew) : defaultCrew(1),
    homeCity: persisted.savedCrew?.homeCity ?? 'Burlington, VT',
    favoriteBandHint: persisted.savedCrew?.favoriteBandHint ?? '',
    resources: createStartingResources(persisted.savedCrew?.budget ?? 200),
    tour: null,
    travel: null,
    currentLocation: 'shakedown',
    turnsUntilShow: 4,
    lastSetlist: null,
    postShowRecap: '',
    rngSeed: Date.now() % 100000,
    runStats: emptyRunStats(),
    lifetimeStats: persisted.lifetimeStats,
    savedCrew: persisted.savedCrew,
    startRunAfterCrewSave: false,
    runRecapMessage: '',
    activeSetlistBets: [],
    currentMarket: null,
    marketContext: null,
  }
}

function persistCrewAndStats(savedCrew: SavedCrew | null, lifetimeStats: LifetimeStats) {
  savePersisted({ savedCrew, lifetimeStats })
}

function buildTravel(origin: string, destination: string, seed: number) {
  return {
    origin,
    destination,
    legs: generateTravelLegs(seed, origin, destination),
    currentLegIndex: 0,
    pendingEvent: null,
    atRoadside: false,
  }
}

function setMarket(s: GameState, context: MarketContext, seed: number): GameState {
  const prices = rollMarket(seed, context)
  return {
    ...s,
    rngSeed: seed,
    currentMarket: prices,
    marketContext: context,
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState)

  useEffect(() => {
    persistCrewAndStats(state.savedCrew, state.lifetimeStats)
  }, [state.savedCrew, state.lifetimeStats])

  const endRun = useCallback(
    (s: GameState, outcome: RunOutcome, message: string): GameState => {
      const lifetimeStats = mergeRunIntoLifetime(s.lifetimeStats, s.runStats, outcome)
      return {
        ...s,
        lifetimeStats,
        phase: outcome === 'day_job' ? 'day_job' : 'run_recap',
        runRecapMessage: message,
        tour: null,
        travel: null,
        currentMarket: null,
        marketContext: null,
      }
    },
    [],
  )

  const afterCrewTick = useCallback(
    (s: GameState, crew: CrewMember[], extraRecap = ''): GameState => {
      const { crew: ticked, bailMessages } = tickCrewMeters(crew)
      let next = { ...s, crew: ticked }
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
          `Everyone bailed.${extraRecap ? ` ${extraRecap}` : ''} You shuffled on home.`,
        )
      }
      return next
    },
    [endRun],
  )

  const goToTitle = useCallback(() => {
    setState((s) => ({ ...s, phase: 'title', startRunAfterCrewSave: false }))
  }, [])

  const goToCrew = useCallback((startAfterSave = false) => {
    setState((s) => {
      const base = s.savedCrew
        ? {
            ...s,
            crew: crewFromSaved(s.savedCrew),
            homeCity: s.savedCrew.homeCity,
            favoriteBandHint: s.savedCrew.favoriteBandHint,
            resources: {
              ...createStartingResources(s.savedCrew.budget),
              hasVehicle: s.resources.hasVehicle,
            },
          }
        : s
      return { ...base, phase: 'crew' as PhaseId, startRunAfterCrewSave: startAfterSave }
    })
  }, [])

  const goToStats = useCallback(() => {
    setState((s) => ({ ...s, phase: 'stats' }))
  }, [])

  const beginRun = useCallback((base: GameState): GameState => {
    const seed = base.rngSeed + 17
    const band = generateBand(seed)
    const tour = generateTour(band, seed + 3, 5)
    const stop = tour.stops[0]!
    const origin = base.homeCity
    let next: GameState = {
      ...base,
      rngSeed: seed,
      tour,
      travel: buildTravel(origin, stop.city, seed + 5),
      resources: createStartingResources(base.savedCrew?.budget ?? base.resources.cash),
      runStats: emptyRunStats(),
      phase: 'travel',
      turnsUntilShow: 4,
      lastSetlist: null,
      postShowRecap: '',
      runRecapMessage: '',
      activeSetlistBets: [],
      currentMarket: null,
      marketContext: null,
    }
    next = setMarket(next, 'shakedown', seed + 99)
    return next
  }, [])

  const requestStartRun = useCallback(() => {
    setState((s) => {
      if (!s.savedCrew) return { ...s, phase: 'crew', startRunAfterCrewSave: true }
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
      const saved: SavedCrew = {
        homeCity: s.homeCity,
        favoriteBandHint: s.favoriteBandHint,
        budget: s.resources.cash,
        members: s.crew.map((c) => ({ name: c.name })),
      }
      const next = { ...s, savedCrew: saved, startRunAfterCrewSave: false }
      if (s.startRunAfterCrewSave) return beginRun(next)
      return { ...next, phase: 'title' as PhaseId }
    })
  }, [beginRun])

  const setCrewSize = useCallback((size: number) => {
    const n = Math.min(3, Math.max(1, size))
    setState((s) => {
      const crew = [...s.crew]
      while (crew.length < n) {
        crew.push({ id: `p${crew.length + 1}`, name: `Crew ${crew.length + 1}`, ...defaultMeters() })
      }
      while (crew.length > n) crew.pop()
      return { ...s, crew }
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
    setState((s) => ({
      ...s,
      resources: { ...createStartingResources(budget), hasVehicle: s.resources.hasVehicle },
    }))
  }, [])

  const shuffleOnHome = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      return endRun(s, 'shuffle', 'You shuffled on home. The lot will still be there next time.')
    })
  }, [endRun])

  const travelAction = useCallback(
    (action: TravelAction) => {
      setState((s) => {
        if (!s.travel) return s
        let resources = { ...s.resources }
        let runStats = { ...s.runStats }
        let crew = s.crew.map((c) => ({ ...c }))
        let rngSeed = s.rngSeed + 1

        switch (action) {
          case 'rest':
            crew = mapActiveCrew(crew, (c) => ({
              ...c,
              health: improveHealth(c.health),
              vibe: improveVibe(c.vibe),
              thirst: improveThirst(c.thirst),
            }))
            break
          case 'eat':
            if (resources.food <= 0) return s
            resources = { ...resources, food: resources.food - 1 }
            runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
            crew = mapActiveCrew(crew, (c) => ({
              ...c,
              hunger: improveHunger(c.hunger),
              health: improveHealth(c.health),
            }))
            break
          case 'hitch':
            runStats = patchRunStats(runStats, { milesTraveled: runStats.milesTraveled + 40 })
            resources = {
              ...resources,
              cash: Math.max(0, resources.cash - 5),
              beer: resources.beer + (rngSeed % 2 === 0 ? 1 : 0),
            }
            crew = mapActiveCrew(crew, (c) => ({ ...c, vibe: improveVibe(c.vibe) }))
            break
          case 'push_through':
            runStats = patchRunStats(runStats, { milesTraveled: runStats.milesTraveled + 60 })
            crew = mapActiveCrew(crew, (c) => ({
              ...c,
              health: worsenHealth(c.health),
              hunger: worsenHunger(c.hunger),
              thirst: worsenThirst(c.thirst),
              vibe: worsenVibe(c.vibe),
            }))
            break
          case 'burn_gas':
            if (!resources.hasVehicle || resources.gas <= 0) return s
            resources = { ...resources, gas: resources.gas - 1 }
            runStats = patchRunStats(runStats, { milesTraveled: runStats.milesTraveled + 90 })
            break
          case 'roadside_food':
            if (resources.cash < 6) return s
            resources = { ...resources, cash: resources.cash - 6, food: resources.food + 2 }
            runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
            break
          case 'roadside_beer':
            if (resources.cash < 5) return s
            resources = { ...resources, cash: resources.cash - 5, beer: resources.beer + 2 }
            runStats = patchRunStats(runStats, { beerConsumed: runStats.beerConsumed + 1 })
            break
          case 'roadside_sell_drugs':
            if (resources.drugs <= 0) return s
            resources = { ...resources, drugs: resources.drugs - 1, cash: resources.cash + 35 }
            break
        }

        return afterCrewTick({ ...s, resources, runStats, crew, rngSeed }, crew)
      })
    },
    [afterCrewTick],
  )

  const applyEventEffects = useCallback(
    (s: GameState, event: NonNullable<GameState['travel']>['pendingEvent'], choiceId?: string) => {
      if (!event) return s
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let crew = s.crew.map((c) => ({ ...c }))
      let rngSeed = s.rngSeed + 3
      let activeSetlistBets = [...s.activeSetlistBets]

      switch (event.eventKey) {
        case 'miracle_ticket':
          resources = { ...resources, tickets: resources.tickets + 1 }
          break
        case 'flat_tire':
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash - 35),
            gas: resources.hasVehicle ? Math.max(0, resources.gas - 1) : resources.gas,
          }
          break
        case 'robbed':
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash - 50),
            drugs: Math.max(0, resources.drugs - 1),
          }
          break
        case 'hitchhiker_intel':
          if (resources.cash >= 6 && resources.beer >= 1) {
            resources = { ...resources, cash: resources.cash - 6, beer: resources.beer - 1 }
          }
          break
        case 'wook_flu':
          crew = mapActiveCrew(crew, (c) => ({ ...c, health: 'wook_flu' as const }))
          if (activeCrew(crew).every((c) => c.health === 'wook_flu')) {
            return endRun(
              { ...s, resources, runStats, crew, rngSeed },
              'day_job',
              'Wook flu got the whole crew. HR at the day job says “we need you Tuesday.”',
            )
          }
          break
        case 'pulled_over': {
          const lying = choiceId === 'lie'
          const hasDrugs = resources.drugs > 0
          const roll = Math.abs(rngSeed) % 10
          if (lying) {
            if (roll < 4) {
              resources = { ...resources, cash: Math.max(0, resources.cash - 75) }
              if (hasDrugs) resources = { ...resources, drugs: 0 }
              if (roll < 2) {
                return endRun(
                  { ...s, resources, runStats, crew, rngSeed },
                  'day_job',
                  'Busted on the highway. Court overlaps showtime. Day job acquired.',
                )
              }
            }
          } else if (hasDrugs && roll < 5) {
            resources = { ...resources, drugs: 0, cash: Math.max(0, resources.cash - 50) }
          } else if (roll < 3) {
            resources = { ...resources, cash: Math.max(0, resources.cash - 25) }
          }
          break
        }
        case 'bathroom_find':
          if (choiceId === 'try_it') {
            resources = { ...resources, drugs: resources.drugs + 1 }
            runStats = patchRunStats(runStats, {
              substancesConsumed: runStats.substancesConsumed + 1,
            })
            if (rngSeed % 4 === 0) {
              return endRun(
                { ...s, resources, runStats, crew, rngSeed },
                'day_job',
                'That wasn\'t what you thought it was. The day job has dental.',
              )
            }
          }
          break
        case 'lot_rumor':
          if (choiceId === 'bet_yes' && event.rumorSongId && resources.cash >= 20) {
            const song = s.tour?.catalog.songs.find((x) => x.id === event.rumorSongId)
            if (song && activeSetlistBets.length < 3) {
              resources = { ...resources, cash: resources.cash - 20 }
              activeSetlistBets.push({
                songId: song.id,
                songTitle: song.title,
                amount: 20,
                slot: 'opener',
              })
            }
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
        travel: s.travel ? { ...s.travel, pendingEvent: null } : null,
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
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s

      const rngSeed = s.rngSeed + 9
      const event = maybeRollTravelEvent(rngSeed, s.tour?.catalog)
      if (event) {
        return { ...s, rngSeed, travel: { ...s.travel, pendingEvent: event } }
      }

      const runStats = patchRunStats(s.runStats, {
        milesTraveled: s.runStats.milesTraveled + leg.miles,
      })
      let crew = s.crew.map((c) => ({ ...c }))
      let next = afterCrewTick({ ...s, rngSeed, runStats, crew }, crew)

      const nextIndex = s.travel.currentLegIndex + 1
      if (nextIndex >= s.travel.legs.length) {
        next = setMarket(next, 'shakedown', rngSeed + 50)
        return {
          ...next,
          phase: 'shakedown',
          currentLocation: 'shakedown',
          turnsUntilShow: 4,
          travel: null,
        }
      }

      return {
        ...next,
        travel: { ...s.travel, currentLegIndex: nextIndex, pendingEvent: null, atRoadside: false },
      }
    })
  }, [afterCrewTick])

  const visitRoadside = useCallback(() => {
    setState((s) => {
      if (!s.travel) return s
      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg?.roadside) return s
      const seeded = setMarket(s, leg.roadside, s.rngSeed + 22)
      return {
        ...seeded,
        travel: { ...s.travel, atRoadside: true },
      }
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
        if (s.resources.cash < amount || s.activeSetlistBets.length >= 3) return s
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
      if (!p) return s
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      if (item === 'food' && resources.cash >= p.foodBuy) {
        resources = { ...resources, cash: resources.cash - p.foodBuy, food: resources.food + 1 }
        runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
      } else if (item === 'beer' && resources.cash >= p.beerBuy) {
        resources = { ...resources, cash: resources.cash - p.beerBuy, beer: resources.beer + 1 }
        runStats = patchRunStats(runStats, { beerConsumed: runStats.beerConsumed + 1 })
      } else if (item === 'drugs' && resources.cash >= p.drugsBuy) {
        resources = { ...resources, cash: resources.cash - p.drugsBuy, drugs: resources.drugs + 1 }
        runStats = patchRunStats(runStats, {
          substancesConsumed: runStats.substancesConsumed + 1,
        })
      } else if (item === 'tickets' && p.ticketBuy != null && resources.cash >= p.ticketBuy) {
        resources = {
          ...resources,
          cash: resources.cash - p.ticketBuy,
          tickets: resources.tickets + 1,
        }
      } else return s
      return { ...s, resources, runStats }
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
      currentMarket: null,
      marketContext: null,
    }
  }, [])

  const goToLocation = useCallback((location: LocationId) => {
    setState((s) => {
      let next = {
        ...s,
        currentLocation: location,
        phase: (location === 'shakedown' ? 'shakedown' : 'location') as PhaseId,
        turnsUntilShow: Math.max(0, s.turnsUntilShow - 1),
      }
      next = setMarket(next, location, s.rngSeed + location.length * 3)
      return afterCrewTick(next, next.crew)
    })
  }, [afterCrewTick])

  const returnToShakedown = useCallback(() => {
    setState((s) => {
      let next = setMarket(
        { ...s, currentLocation: 'shakedown', phase: 'shakedown' },
        'shakedown',
        s.rngSeed + 7,
      )
      return afterCrewTick(next, next.crew)
    })
  }, [afterCrewTick])

  const enterShow = useCallback(() => {
    setState((s) => ({ ...s, phase: 'show', currentLocation: 'venue' }))
  }, [])

  const resolveBets = (s: GameState, setlist: GameState['lastSetlist'], recap: string) => {
    let resources = { ...s.resources }
    let recapOut = recap
    for (const bet of s.activeSetlistBets) {
      if (!setlist) continue
      const hit = resolveSetlistBet(bet, setlist)
      const pay = payoutForBet(bet, hit)
      if (hit) {
        resources = { ...resources, cash: resources.cash + pay }
        recapOut += ` Bet “${bet.songTitle}” (${bet.slot}) HIT +$${pay}.`
      } else {
        recapOut += ` Bet “${bet.songTitle}” (${bet.slot}) missed.`
      }
    }
    return { resources, recapOut }
  }

  const finishShow = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const stop = s.tour.stops[s.tour.currentStopIndex]
      if (!stop) return s
      const setlist = stop.plannedSetlist
      const active = activeCrew(s.crew)
      const ticketsOk = s.resources.tickets >= active.length
      let recap = ticketsOk
        ? `Made it into ${stop.venue}. Crew intact. The floor was soup.`
        : `Chaos at the gate. Not everyone got in clean — the night still happened around you.`
      const { resources, recapOut } = resolveBets(s, setlist, recap)
      const runStats = patchRunStats(s.runStats, {
        venuesVisited: s.runStats.venuesVisited + 1,
        songsHeard: s.runStats.songsHeard + setlist.songs.length,
        bandsSeen: s.runStats.bandsSeen + 1,
      })
      return {
        ...s,
        resources,
        lastSetlist: setlist,
        postShowRecap: recapOut,
        runStats,
        activeSetlistBets: [],
        phase: 'post_show',
      }
    })
  }, [])

  const missShow = useCallback(() => {
    setState((s) => {
      if (!s.tour) return s
      const stop = s.tour.stops[s.tour.currentStopIndex]
      let recap = `Missed ${stop?.venue ?? 'the show'} — sat out to hustle gas money and sanity.`
      const { resources, recapOut } = resolveBets(s, stop?.plannedSetlist ?? null, recap)
      const runStats = patchRunStats(s.runStats, { showsMissed: s.runStats.showsMissed + 1 })
      return {
        ...s,
        resources,
        postShowRecap: recapOut,
        runStats,
        activeSetlistBets: [],
        lastSetlist: null,
        phase: 'post_show',
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
          turnsUntilShow: 4,
          currentLocation: 'shakedown',
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
      startRunAfterCrewSave: false,
      lastSetlist: null,
      postShowRecap: '',
      runRecapMessage: '',
      activeSetlistBets: [],
      currentMarket: null,
      marketContext: null,
    }))
  }, [])

  const adjustResources = useCallback((partial: Partial<Resources>) => {
    setState((s) => ({ ...s, resources: { ...s.resources, ...partial } }))
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
      setCrewMemberName,
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
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
      returnToShakedown,
      enterShow,
      finishShow,
      prepNextLeg,
      finishRunRecap,
      adjustResources,
    }),
    [
      state,
      goToTitle,
      goToCrew,
      goToStats,
      requestStartRun,
      saveCrew,
      setCrewSize,
      setCrewMemberName,
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
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
      returnToShakedown,
      enterShow,
      finishShow,
      prepNextLeg,
      finishRunRecap,
      adjustResources,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
