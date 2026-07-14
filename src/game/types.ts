/** Game phase ids — keep in sync with CONTEXT.MD */
export type PhaseId =
  | 'crew_create'
  | 'tour_start'
  | 'travel'
  | 'shakedown'
  | 'location'
  | 'show'
  | 'post_show'

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

export interface GameState {
  phase: PhaseId
  crew: CrewMember[]
  homeCity: string
  favoriteBandHint: string
  resources: Resources
  tour: Tour | null
  currentLocation: LocationId
  turnsUntilShow: number
  lastSetlist: Setlist | null
  postShowRecap: string
  rngSeed: number
}

export const PHASE_LABELS: Record<PhaseId, string> = {
  crew_create: 'Create crew',
  tour_start: 'Go on tour',
  travel: 'Travel',
  shakedown: 'Shakedown',
  location: 'Location',
  show: 'The show',
  post_show: 'Post-show',
}
