import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { generateBand, generateSetlist, generateTour } from './generators'
import { createStartingResources } from './resources'
import type {
  GameState,
  LocationId,
  PhaseId,
  Resources,
} from './types'

interface GameContextValue {
  state: GameState
  setPhase: (phase: PhaseId) => void
  setHomeCity: (city: string) => void
  setFavoriteBandHint: (hint: string) => void
  setCrewName: (name: string) => void
  setBudget: (budget: number) => void
  startTour: () => void
  arriveAtShakedown: () => void
  goToLocation: (location: LocationId) => void
  returnToShakedown: () => void
  enterShow: () => void
  finishShow: () => void
  prepNextLeg: () => void
  adjustResources: (partial: Partial<Resources>) => void
}

const GameContext = createContext<GameContextValue | null>(null)

function createInitialState(): GameState {
  const seed = Date.now() % 100000
  return {
    phase: 'crew_create',
    crew: [
      {
        id: 'p1',
        name: 'Tour Kid',
        health: 100,
        hunger: 20,
        thirst: 20,
      },
    ],
    homeCity: 'Burlington, VT',
    favoriteBandHint: '',
    resources: createStartingResources(200),
    tour: null,
    currentLocation: 'shakedown',
    turnsUntilShow: 4,
    lastSetlist: null,
    postShowRecap: '',
    rngSeed: seed,
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState)

  const setPhase = useCallback((phase: PhaseId) => {
    setState((s) => ({ ...s, phase }))
  }, [])

  const setHomeCity = useCallback((city: string) => {
    setState((s) => ({ ...s, homeCity: city }))
  }, [])

  const setFavoriteBandHint = useCallback((hint: string) => {
    setState((s) => ({ ...s, favoriteBandHint: hint }))
  }, [])

  const setCrewName = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      crew: s.crew.map((c, i) => (i === 0 ? { ...c, name } : c)),
    }))
  }, [])

  const setBudget = useCallback((budget: number) => {
    setState((s) => ({
      ...s,
      resources: { ...createStartingResources(budget), hasVehicle: s.resources.hasVehicle },
    }))
  }, [])

  const startTour = useCallback(() => {
    setState((s) => {
      const seed = s.rngSeed + 17
      const band = generateBand(seed)
      const tour = generateTour(band, seed + 3, 5)
      return {
        ...s,
        rngSeed: seed,
        tour,
        phase: 'travel',
        turnsUntilShow: 4,
      }
    })
  }, [])

  const arriveAtShakedown = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: 'shakedown',
      currentLocation: 'shakedown',
      turnsUntilShow: 4,
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
      return {
        ...s,
        rngSeed: seed,
        lastSetlist: setlist,
        postShowRecap: recap,
        phase: 'post_show',
      }
    })
  }, [])

  const prepNextLeg = useCallback(() => {
    setState((s) => {
      if (!s.tour) return { ...s, phase: 'tour_start' }
      const nextIndex = s.tour.currentStopIndex + 1
      if (nextIndex >= s.tour.stops.length) {
        return {
          ...s,
          phase: 'tour_start',
          postShowRecap: 'Tour wrapped. Time to hunt the next run.',
          tour: null,
        }
      }
      return {
        ...s,
        tour: { ...s.tour, currentStopIndex: nextIndex },
        phase: 'travel',
        turnsUntilShow: 4,
        currentLocation: 'shakedown',
      }
    })
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
      setPhase,
      setHomeCity,
      setFavoriteBandHint,
      setCrewName,
      setBudget,
      startTour,
      arriveAtShakedown,
      goToLocation,
      returnToShakedown,
      enterShow,
      finishShow,
      prepNextLeg,
      adjustResources,
    }),
    [
      state,
      setPhase,
      setHomeCity,
      setFavoriteBandHint,
      setCrewName,
      setBudget,
      startTour,
      arriveAtShakedown,
      goToLocation,
      returnToShakedown,
      enterShow,
      finishShow,
      prepNextLeg,
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
