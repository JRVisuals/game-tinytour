/** Game phase ids — keep in sync with CONTEXT.MD */
export type PhaseId =
  | 'title'
  | 'crew'
  | 'stats'
  | 'travel'
  | 'shakedown'
  | 'location'
  | 'show'
  | 'post_show'
  | 'run_recap'
  | 'day_job'

export type LocationId =
  | 'shakedown'
  | 'park'
  | 'venue'
  | 'hotel'
  | 'friends_house'

export interface CrewMember {
  id: string
  name: string
  health: number
  hunger: number
  thirst: number
}

export interface SavedCrew {
  name: string
  homeCity: string
  favoriteBandHint: string
  budget: number
}

export interface Resources {
  cash: number
  food: number
  beer: number
  drugs: number
  tickets: number
  gas: number
  hasVehicle: boolean
}

export interface Band {
  name: string
  homeScene: string
}

export interface TourStop {
  city: string
  venue: string
  dayLabel: string
}

export interface Tour {
  band: Band
  stops: TourStop[]
  currentStopIndex: number
}

export interface Setlist {
  songs: string[]
}

export interface TravelLeg {
  id: string
  label: string
  miles: number
  flavor: string
}

export interface TravelEventChoice {
  id: string
  label: string
}

export interface TravelEvent {
  id: string
  title: string
  body: string
  choices?: TravelEventChoice[]
}

export interface TravelState {
  origin: string
  destination: string
  legs: TravelLeg[]
  currentLegIndex: number
  pendingEvent: TravelEvent | null
}

export interface RunStats {
  venuesVisited: number
  songsHeard: number
  bandsSeen: number
  milesTraveled: number
  substancesConsumed: number
  foodConsumed: number
  beerConsumed: number
}

export interface LifetimeStats extends RunStats {
  runsCompleted: number
  dayJobsTaken: number
}

export interface GameState {
  phase: PhaseId
  crew: CrewMember[]
  homeCity: string
  favoriteBandHint: string
  resources: Resources
  tour: Tour | null
  travel: TravelState | null
  currentLocation: LocationId
  turnsUntilShow: number
  lastSetlist: Setlist | null
  postShowRecap: string
  rngSeed: number
  runStats: RunStats
  lifetimeStats: LifetimeStats
  savedCrew: SavedCrew | null
  /** After crew save, jump straight into a new run */
  startRunAfterCrewSave: boolean
  runRecapMessage: string
}

export const PHASE_LABELS: Record<PhaseId, string> = {
  title: 'Title',
  crew: 'Crew',
  stats: 'Stats',
  travel: 'Travel',
  shakedown: 'Shakedown',
  location: 'Location',
  show: 'The show',
  post_show: 'Post-show',
  run_recap: 'Run recap',
  day_job: 'Day job',
}

export const STAT_LABELS: Record<keyof RunStats, string> = {
  venuesVisited: 'Venues visited',
  songsHeard: 'Songs heard',
  bandsSeen: 'Bands seen',
  milesTraveled: 'Miles traveled',
  substancesConsumed: 'Substances consumed',
  foodConsumed: 'Food consumed',
  beerConsumed: 'Beer consumed',
}
