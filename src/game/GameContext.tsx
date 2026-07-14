import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { generateBand, generateSetlist, generateTour } from './generators'
import {
  loadPersisted,
  savePersisted,
} from './persistence'
import { createStartingResources } from './resources'
import { emptyRunStats, mergeRunIntoLifetime, patchRunStats } from './stats'
import { maybeRollTravelEvent } from './travel/events'
import { generateTravelLegs } from './travel/legs'
import type {
  GameState,
  LifetimeStats,
  LocationId,
  PhaseId,
  Resources,
  SavedCrew,
} from './types'

interface GameContextValue {
  state: GameState
  goToTitle: () => void
  goToCrew: (startAfterSave?: boolean) => void
  goToStats: () => void
  requestStartRun: () => void
  saveCrew: () => void
  setCrewName: (name: string) => void
  setHomeCity: (city: string) => void
  setFavoriteBandHint: (hint: string) => void
  setBudget: (budget: number) => void
  travelAction: (action: TravelAction) => void
  resolveTravelEvent: (choiceId?: string) => void
  advanceTravelLeg: () => void
  arriveAtShakedown: () => void
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

const GameContext = createContext<GameContextValue | null>(null)

function crewFromSaved(saved: SavedCrew) {
  return [
    {
      id: 'p1',
      name: saved.name,
      health: 100,
      hunger: 20,
      thirst: 20,
    },
  ]
}

function createInitialState(): GameState {
  const persisted = loadPersisted()
  return {
    phase: 'title',
    crew: persisted.savedCrew
      ? crewFromSaved(persisted.savedCrew)
      : [{ id: 'p1', name: 'Tour Kid', health: 100, hunger: 20, thirst: 20 }],
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
  }
}

function persistCrewAndStats(savedCrew: SavedCrew | null, lifetimeStats: LifetimeStats) {
  savePersisted({ savedCrew, lifetimeStats })
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState)

  useEffect(() => {
    persistCrewAndStats(state.savedCrew, state.lifetimeStats)
  }, [state.savedCrew, state.lifetimeStats])

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
    const legs = generateTravelLegs(seed + 5, origin, stop.city, 4)
    return {
      ...base,
      rngSeed: seed,
      tour,
      travel: {
        origin,
        destination: stop.city,
        legs,
        currentLegIndex: 0,
        pendingEvent: null,
      },
      resources: createStartingResources(base.savedCrew?.budget ?? base.resources.cash),
      runStats: emptyRunStats(),
      phase: 'travel',
      turnsUntilShow: 4,
      lastSetlist: null,
      postShowRecap: '',
      runRecapMessage: '',
    }
  }, [])

  const requestStartRun = useCallback(() => {
    setState((s) => {
      if (!s.savedCrew) {
        return { ...s, phase: 'crew', startRunAfterCrewSave: true }
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
      const saved: SavedCrew = {
        name: s.crew[0]?.name ?? 'Tour Kid',
        homeCity: s.homeCity,
        favoriteBandHint: s.favoriteBandHint,
        budget: s.resources.cash,
      }
      const next = {
        ...s,
        savedCrew: saved,
        startRunAfterCrewSave: false,
      }
      if (s.startRunAfterCrewSave) {
        return beginRun(next)
      }
      return { ...next, phase: 'title' as PhaseId }
    })
  }, [beginRun])

  const setCrewName = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      crew: s.crew.map((c, i) => (i === 0 ? { ...c, name } : c)),
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
      resources: {
        ...createStartingResources(budget),
        hasVehicle: s.resources.hasVehicle,
      },
    }))
  }, [])

  const endRun = useCallback(
    (s: GameState, outcome: 'completed' | 'day_job', message: string): GameState => {
      const lifetimeStats = mergeRunIntoLifetime(s.lifetimeStats, s.runStats, outcome)
      return {
        ...s,
        lifetimeStats,
        phase: outcome === 'day_job' ? 'day_job' : 'run_recap',
        runRecapMessage: message,
        tour: null,
        travel: null,
      }
    },
    [],
  )

  const travelAction = useCallback((action: TravelAction) => {
    setState((s) => {
      if (!s.travel) return s
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let crew = s.crew.map((c) => ({ ...c }))
      let rngSeed = s.rngSeed + 1

      switch (action) {
        case 'rest':
          crew = crew.map((c) => ({
            ...c,
            health: Math.min(100, c.health + 15),
            hunger: Math.min(100, c.hunger + 5),
            thirst: Math.min(100, c.thirst + 5),
          }))
          break
        case 'eat':
          if (resources.food <= 0) return s
          resources = { ...resources, food: resources.food - 1 }
          runStats = patchRunStats(runStats, { foodConsumed: runStats.foodConsumed + 1 })
          crew = crew.map((c) => ({
            ...c,
            hunger: Math.max(0, c.hunger - 25),
            health: Math.min(100, c.health + 5),
          }))
          break
        case 'hitch':
          runStats = patchRunStats(runStats, {
            milesTraveled: runStats.milesTraveled + 40,
          })
          resources = {
            ...resources,
            cash: Math.max(0, resources.cash - 5),
            beer: resources.beer + (rngSeed % 2 === 0 ? 1 : 0),
          }
          break
        case 'push_through':
          runStats = patchRunStats(runStats, {
            milesTraveled: runStats.milesTraveled + 60,
          })
          crew = crew.map((c) => ({
            ...c,
            health: c.health - 8,
            hunger: Math.min(100, c.hunger + 10),
            thirst: Math.min(100, c.thirst + 10),
          }))
          break
        case 'burn_gas':
          if (!resources.hasVehicle || resources.gas <= 0) return s
          resources = { ...resources, gas: resources.gas - 1 }
          runStats = patchRunStats(runStats, {
            milesTraveled: runStats.milesTraveled + 90,
          })
          break
      }

      const broke = crew.some((c) => c.health <= 0 || c.hunger >= 100 || c.thirst >= 100)
      if (broke) {
        return endRun(
          { ...s, resources, runStats, crew, rngSeed },
          'day_job',
          'The road wins. You take a day job folding merch for a band you never heard of.',
        )
      }

      return { ...s, resources, runStats, crew, rngSeed }
    })
  }, [endRun])

  const applyEventEffects = useCallback(
    (s: GameState, event: NonNullable<GameState['travel']>['pendingEvent'], choiceId?: string) => {
      if (!event) return s
      let resources = { ...s.resources }
      let runStats = { ...s.runStats }
      let crew = s.crew.map((c) => ({ ...c }))
      let rngSeed = s.rngSeed + 3
      let forceDayJob = false

      if (event.title === 'Miracle ticket') {
        resources = { ...resources, tickets: resources.tickets + 1 }
      } else if (event.title === 'Flat tire') {
        resources = {
          ...resources,
          cash: Math.max(0, resources.cash - 35),
          gas: resources.hasVehicle ? Math.max(0, resources.gas - 1) : resources.gas,
        }
      } else if (event.title === 'Robbed') {
        resources = {
          ...resources,
          cash: Math.max(0, resources.cash - 50),
          drugs: Math.max(0, resources.drugs - 1),
        }
      } else if (event.title === 'Hitchhiker with intel') {
        if (resources.cash >= 6 && resources.beer >= 1) {
          resources = { ...resources, cash: resources.cash - 6, beer: resources.beer - 1 }
        }
      } else if (event.title === 'Wook flu') {
        crew = crew.map((c) => ({ ...c, health: c.health - 40 }))
        forceDayJob = crew.some((c) => c.health <= 0)
      } else if (event.title === 'Rest stop bathroom find') {
        if (choiceId === 'try_it') {
          resources = { ...resources, drugs: resources.drugs + 1 }
          runStats = patchRunStats(runStats, {
            substancesConsumed: runStats.substancesConsumed + 1,
          })
          if (rngSeed % 4 === 0) {
            crew = crew.map((c) => ({ ...c, health: c.health - 30 }))
            forceDayJob = crew.some((c) => c.health <= 0)
          }
        }
      } else if (event.title === 'Lot rumor') {
        if (choiceId === 'bet_yes' && resources.cash >= 20) {
          resources = {
            ...resources,
            cash: resources.cash + (rngSeed % 2 === 0 ? 40 : -20),
          }
        }
      }

      if (forceDayJob) {
        return endRun(
          { ...s, resources, runStats, crew, rngSeed },
          'day_job',
          'Wook flu got you. HR at the day job says “we need you Tuesday.”',
        )
      }

      return {
        ...s,
        resources,
        runStats,
        crew,
        rngSeed,
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
      if (!s.travel) return s
      if (s.travel.pendingEvent) return s

      const leg = s.travel.legs[s.travel.currentLegIndex]
      if (!leg) return s

      const rngSeed = s.rngSeed + 9
      const event = maybeRollTravelEvent(rngSeed)
      if (event) {
        return {
          ...s,
          rngSeed,
          travel: { ...s.travel, pendingEvent: event },
        }
      }

      const runStats = patchRunStats(s.runStats, {
        milesTraveled: s.runStats.milesTraveled + leg.miles,
      })

      const nextIndex = s.travel.currentLegIndex + 1
      if (nextIndex >= s.travel.legs.length) {
        return {
          ...s,
          rngSeed,
          runStats,
          phase: 'shakedown',
          currentLocation: 'shakedown',
          turnsUntilShow: 4,
          travel: null,
        }
      }

      return {
        ...s,
        rngSeed,
        runStats,
        travel: { ...s.travel, currentLegIndex: nextIndex, pendingEvent: null },
      }
    })
  }, [])

  const startTravelToStop = useCallback((s: GameState, stopIndex: number): GameState => {
    if (!s.tour) return s
    const stop = s.tour.stops[stopIndex]
    if (!stop) return s
    const prevCity =
      stopIndex === 0 ? s.homeCity : s.tour.stops[stopIndex - 1]!.city
    const seed = s.rngSeed + stopIndex * 31
    const legs = generateTravelLegs(seed, prevCity, stop.city, 4)
    return {
      ...s,
      rngSeed: seed,
      phase: 'travel',
      travel: {
        origin: prevCity,
        destination: stop.city,
        legs,
        currentLegIndex: 0,
        pendingEvent: null,
      },
    }
  }, [])

  const arriveAtShakedown = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: 'shakedown',
      currentLocation: 'shakedown',
      turnsUntilShow: 4,
      travel: null,
    }))
  }, [])

  const goToLocation = useCallback((location: LocationId) => {
    setState((s) => ({
      ...s,
      currentLocation: location,
      phase: location === 'shakedown' ? 'shakedown' : 'location',
      turnsUntilShow: Math.max(0, s.turnsUntilShow - 1),
    }))
  }, [])

  const returnToShakedown = useCallback(() => {
    setState((s) => ({
      ...s,
      currentLocation: 'shakedown',
      phase: 'shakedown',
    }))
  }, [])

  const enterShow = useCallback(() => {
    setState((s) => ({ ...s, phase: 'show', currentLocation: 'venue' }))
  }, [])

  const finishShow = useCallback(() => {
    setState((s) => {
      const seed = s.rngSeed + 41
      const setlist = generateSetlist(seed)
      const stop = s.tour?.stops[s.tour.currentStopIndex]
      const ticketsOk = s.resources.tickets >= s.crew.length
      const recap = ticketsOk
        ? `Made it into ${stop?.venue ?? 'the venue'}. Crew intact. The floor was soup.`
        : `Chaos at the gate. Not everyone got in clean — the night still happened around you.`
      const runStats = patchRunStats(s.runStats, {
        venuesVisited: s.runStats.venuesVisited + 1,
        songsHeard: s.runStats.songsHeard + setlist.songs.length,
        bandsSeen: s.runStats.bandsSeen + 1,
      })
      return {
        ...s,
        rngSeed: seed,
        lastSetlist: setlist,
        postShowRecap: recap,
        runStats,
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
    }))
  }, [])

  const adjustResources = useCallback((partial: Partial<Resources>) => {
    setState((s) => ({
      ...s,
      resources: { ...s.resources, ...partial },
    }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      goToTitle,
      goToCrew,
      goToStats,
      requestStartRun,
      saveCrew,
      setCrewName,
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      arriveAtShakedown,
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
      setCrewName,
      setHomeCity,
      setFavoriteBandHint,
      setBudget,
      travelAction,
      resolveTravelEvent,
      advanceTravelLeg,
      arriveAtShakedown,
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
