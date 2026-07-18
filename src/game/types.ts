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
  | 'post_show_shakedown'
  | 'run_recap'
  | 'pre_day_job'
  | 'day_job'

export type LocationId =
  | 'shakedown'
  | 'park'
  | 'venue'
  | 'hotel'
  | 'friends_house'
  | 'diner'
  | 'record_store'

export interface CrewMember {
  id: string
  name: string
  /** Emoji sticker id — future portrait slot */
  stickerId?: string
  hunger: number
  thirst: number
  health: number
  vibe: number
  stoned: number
  roughTurns: number
  bailed: boolean
  /** Set when the crew catches wook flu — run can end with day job if everyone taps out sick */
  wookFlu?: boolean
}

export type StarterTier = 100 | 200 | 400

export type MemberKitId = 'flat' | 'ticket_fairy' | 'driver' | 'stash' | 'cooler' | 'hustler'

export interface SavedCrewMember {
  name: string
  /** Emoji sticker id — future portrait slot */
  stickerId?: string
  /** Extra members only — leader always gets flat leader kit */
  kit?: MemberKitId
}

export interface CrewCareerStats {
  venuesVisited: number
  songsHeard: number
  showsSeen: number
  bandsSeen: number
  milesTraveled: number
  substancesConsumed: number
  balloonsHuffed: number
  foodConsumed: number
  beerConsumed: number
  showsMissed: number
  runsCompleted: number
  toursCompleted: number
  dayJobsTaken: number
  shufflesHome: number
  betsWon: number
  bestVenuesRun: number
  bestSongsRun: number
}

export interface SavedCrew {
  homeCity: string
  genre: string
  bank: number
  starterTier: StarterTier
  rep: number
  bestRep: number
  career: CrewCareerStats
  hasVehicle: boolean
  members: SavedCrewMember[]
}

export type BetSlot = 'anywhere' | 'opener' | 'closer' | 'encore'

export type ShowBetOutcome = 'hit' | 'miss' | 'void'

export interface ShowBetResult {
  songId: string
  songTitle: string
  slot: BetSlot
  outcome: ShowBetOutcome
  payout: number
}

export interface SetlistBet {
  songId: string
  songTitle: string
  amount: number
  slot: BetSlot
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

export type SongTier = 'hot' | 'deep_cut' | 'bust_out'

export interface BandSong {
  id: string
  title: string
  tier: SongTier
}

export interface BandCatalog {
  songs: BandSong[]
}

export interface TourStop {
  city: string
  venue: string
  dayLabel: string
  plannedSetlist: Setlist
}

export interface Tour {
  band: Band
  catalog: BandCatalog
  stops: TourStop[]
  currentStopIndex: number
  usedBustOuts: string[]
}

export interface Setlist {
  songs: string[]
  songIds?: string[]
}

/** Inline lot / post-show beat with optional stash delta summary */
export interface SceneLotEvent {
  id: string
  title: string
  body: string
  loot?: string
}

export type RoadsideType = 'truck_stop' | 'rest_area' | 'farmers_market' | 'supermarket'

export interface TravelLeg {
  id: string
  label: string
  miles: number
  flavor: string
  roadside: RoadsideType | null
}

export interface TravelEventChoice {
  id: string
  label: string
}

export type TravelEventType =
  | 'pulled_over'
  | 'lot_rumor'
  | 'bathroom_find'
  | 'hitchhiker_intel'
  | 'encore_intel'
  | 'wook_flu'
  | 'solo'
  | 'roadside_burger'
  | 'speeding_fine'
  | 'gas_station_deal'
  | 'van_breakdown_minor'

export interface TravelEvent {
  id: string
  eventKey: string
  title: string
  body: string
  eventType: TravelEventType
  choices?: TravelEventChoice[]
  /** Intel tip — accuracy set per event in balance JSON */
  intelTipSongId?: string
  intelSlot?: BetSlot
}

export interface TravelState {
  origin: string
  destination: string
  legs: TravelLeg[]
  currentLegIndex: number
  pendingEvent: TravelEvent | null
  atRoadside: boolean
  /** Shown on road panel after resolving an event */
  lastEventResult: string | null
  /** Intro flavor shown on the very first leg of a run instead of an event */
  introFlavor: string | null
}

export interface MarketStock {
  food: number
  beer: number
  drugs: number
  tickets: number
  gas: number
}

export interface MarketSnapshot {
  prices: MarketPrices
  stock: MarketStock
  flavor: string
}

export interface MarketPrices {
  foodBuy: number
  foodSell: number
  beerBuy: number
  beerSell: number
  drugsBuy: number
  drugsSell: number
  ticketBuy?: number
  gasBuy?: number
}

export interface RunStats {
  venuesVisited: number
  songsHeard: number
  showsSeen: number
  bandsSeen: number
  milesTraveled: number
  substancesConsumed: number
  balloonsHuffed: number
  foodConsumed: number
  beerConsumed: number
  showsMissed: number
}

export interface LifetimeStats extends RunStats {
  runsCompleted: number
  toursCompleted: number
  dayJobsTaken: number
  shufflesHome: number
  betsWon: number
}

export interface GameState {
  phase: PhaseId
  crew: CrewMember[]
  homeCity: string
  genre: string
  resources: Resources
  tour: Tour | null
  travel: TravelState | null
  currentLocation: LocationId
  turnsUntilShow: number
  lastSetlist: Setlist | null
  postShowRecap: string
  /** Resolved setlist bets from the last show — icons on recap setlist */
  lastShowBetResults: ShowBetResult[]
  /** Random lot moment after the show — title + body from shakedown-events.json */
  postShowShakedownEvent: SceneLotEvent | null
  /** Random lot moment on pre-show shakedown — e.g. Clown Juice Mafia */
  shakedownLotEvent: SceneLotEvent | null
  /** Rare cash find when visiting park or shakedown */
  spotFindEvent: SceneLotEvent | null
  /** Action IDs used this location visit — cleared on location change */
  usedLocationActions: string[]
  /** Lot hustle when you skip the show */
  missShowHustleEvent: SceneLotEvent | null
  rngSeed: number
  runStats: RunStats
  runBetsWon: number
  /** Live tour diary — prose lines appended as the run unfolds */
  tourStory: string[]
  savedCrew: SavedCrew | null
  /** Draft kits for unsaved crew slots (index 1+) */
  memberKits: (MemberKitId | undefined)[]
  starterTier: StarterTier | null
  startRunAfterCrewSave: boolean
  runRecapMessage: string
  /** Narrative shown on the pre_day_job screen before landing on day job */
  dayJobReason: string | null
  /** Offered after day job — $50 × crew size */
  dayJobStipend: number | null
  activeSetlistBets: SetlistBet[]
  currentMarket: MarketPrices | null
  currentMarketStock: MarketStock | null
  marketFlavor: string | null
  marketContext: string | null
  /** Cached prices/stock per stop or road pull-over for this show */
  stopMarkets: Record<string, MarketSnapshot>
  activeMarketKey: string | null
  /** Cops noticed a shady lot transaction — stay (fine) or run (drop stash) */
  marketCopChase: { fine: number; proceeds: number; reason?: 'drug_sell' | 'balloons' } | null
  /** Last crew bail / warning — shown in UI */
  crewAlert: string | null
  /** Brief action feedback — consumed by OutcomeToast */
  lastOutcome: string | null
  lastOutcomeTone: OutcomeTone
  /** Bumps on every outcome so toasts restart when text repeats */
  lastOutcomeSeq: number
}

export type OutcomeTone = 'default' | 'error'

export const PHASE_LABELS: Record<PhaseId, string> = {
  title: 'Title',
  crew: 'Crew',
  stats: 'Stats',
  travel: 'Travel',
  shakedown: 'Shakedown',
  location: 'Location',
  show: 'The Show',
  post_show: 'Post-show',
  post_show_shakedown: 'After-show shakedown',
  run_recap: 'Run recap',
  pre_day_job: 'Day job',
  day_job: 'Day job',
}

export const STAT_LABELS: Record<keyof RunStats, string> = {
  venuesVisited: 'Venues visited',
  songsHeard: 'Songs heard',
  showsSeen: 'Shows seen',
  bandsSeen: 'Bands seen (career)',
  milesTraveled: 'Miles traveled',
  substancesConsumed: 'Substances consumed',
  balloonsHuffed: 'Balloons huffed',
  foodConsumed: 'Food consumed',
  beerConsumed: 'Beer consumed',
  showsMissed: 'Shows missed',
}
