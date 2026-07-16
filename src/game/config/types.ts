export interface CrewMetersBalance {
  meterMax: number
  roughThreshold: number
  bailRoughThreshold: number
  roughWarningMinTurns: number
  tickHunger: number
  tickThirst: number
  eatHunger: number
  eatStoned: number
  eatHealth: number
  beerStoned: number
  beerThirst: number
  drinkHealth: number
  consumeDrugsVibe: number
  consumeDrugsStoned: number
  consumeDrugsHealth: number
  showVibe: number
  betWinVibe: number
  betLossVibe: number
  badEventVibe: number
  restHealth: number
  restThirst: number
  restVibe: number
  restStoned: number
  hitchVibe: number
  pushPenalty: number
  wookFluHealthDamage: number
  wookFluSpreadChancePercent: number
  neglectHungerHealthDamage: number
  neglectThirstHealthDamage: number
  lowHealthWookFluThreshold: number
  wookFluLowHealthTickChancePercent: number
  wookFluEventWeightBonusPerLowHealth: number
  stonedWastedThreshold: number
  bathroomBagStoned: number
  defaultMeters: {
    hunger: number
    thirst: number
    health: number
    vibe: number
    stoned: number
  }
  labelTiers: { high: number; mid: number; low: number }
  barColors: { good: number; warn: number }
}

export interface ResourcesBalance {
  defaultBudget: number
  startingFood: number
  startingBeer: number
  vehicleCost: number
  vehicleGas: number
  hotelCrashCost: number
  friendsCrashCost: number
}

export interface TravelBalance {
  eventChancePercent: number
  forcedPulledOverBelow: number
  forcedLotRumorBelow: number
  turnsUntilShow: number
  tourStops: number
  hitch: { miles: number; cash: number; beerChancePercent: number }
  burnGas: { gas: number; legsMax: number; vibe: number; beerChancePercent: number }
  roadsideFood: { cash: number; food: number }
  roadsideBeer: { cash: number; beer: number }
  roadsideSellDrugs: { drugs: number; cash: number }
  pushThrough: { foodPerLeg: number; gasPerLeg: number }
}

export interface IntelEventEffect {
  correctChancePercent: number
  slot: string
  food?: number
  beer?: number
  drugs?: number
  preferDeepCutWrong?: boolean
}

export interface ShakedownBalance {
  postShowEventChancePercent: number
  lotEventChancePercent: number
  missShowHustleEventChancePercent: number
  clownJuiceMafia: {
    retailPrice: number
    dealPrice: number
    dealDoses: number
    beerDealChancePercent: number
    punchChancePercent: number
    punchHealth: number
  }
  spotFind: {
    chancePercent: number
  }
}

export interface EventEffectsBalance {
  miracle_ticket: { tickets: number }
  flat_tire: { cash: number; gas: number }
  robbed: { cash: number; drugs: number }
  hitchhiker_intel: IntelEventEffect
  lot_rumor: IntelEventEffect
  encore_whisper: IntelEventEffect
  wook_flu: { healthDamage: number }
  bathroom_find: {
    try_it: { drugs: number; lacedChancePercent: number }
    toss_it: Record<string, never>
  }
}

export interface PulledOverBranch {
  bustBelow?: number
  triggerBelow?: number
  fine?: number
  drugsGoneBelow?: number
  drugsFine?: number
  fineBelow?: number
}

export interface PulledOverBalance {
  rollMod: number
  wasted: { lie: PulledOverBranch; truth: PulledOverBranch }
  sober: { lie: PulledOverBranch; truth: PulledOverBranch }
}

export interface BettingBalance {
  maxActiveBets: number
  multipliers: Record<string, number>
  uiAmounts: number[]
}

export interface MarketsBalance {
  minSpread: number
  jackpotMod: number
  trapMod: number
  jitterRange: number
  /** Sell = buy − spread; tier controls how tight spread is (high = better sell price). */
  sellSpreadByTier: Record<'low' | 'mid' | 'high', { min: number; max: number }>
  tiers: Record<string, { low: number; mid: number; high: number }>
  stock: {
    foodBase: number
    foodMod: number
    beerBase: number
    beerShift: number
    beerMod: number
    drugsBase: number
    drugsShift: number
    drugsMod: number
    ticketsBase: number
    ticketsShift: number
    ticketsMod: number
    gasBase: number
    gasShift: number
    gasMod: number
  }
  gasUnitsPerBuy: number
  venueGate: {
    foodBuy: number
    foodSell: number
    beerBuy: number
    beerSell: number
    drugsBuy: number
    drugsSell: number
    ticketBuy: number
    stock: {
      food: number
      beer: number
      drugs: number
      tickets: number
    }
    flavor: string
  }
  drugSellCopChancePercent: number
  balloons: {
    price: number
    copChancePercent: number
    vibe: number
    health: number
  }
  copChase: {
    fine: number
    runDrop: {
      foodChancePercent: number
      beerChancePercent: number
      drugsChancePercent: number
      foodMax: number
      beerMax: number
      drugsMax: number
    }
  }
}

export interface CrewEconomyBalance {
  liquidate: Record<string, number>
  dayJobStipendPerMember: number
  starterTierRep: Record<string, number>
  rep: {
    cap: number
    venue: number
    tourComplete: number
    betWon: number
    bankDivisor: number
    milesDivisor: number
    dayJobPenalty: number
    shufflePenalty: number
  }
  leaderKit: { food: number; beer: number; cash: number }
  flatMemberKit: { food: number; beer: number; cash: number }
  archetypeChance: number
  archetypes: Record<
    string,
    {
      food?: number
      beer?: number
      cash?: number
      drugs?: number
      tickets?: number
      gas?: number
      vehicle?: boolean
    }
  >
}

export interface GameBalance {
  crewMeters: CrewMetersBalance
  resources: ResourcesBalance
  travel: TravelBalance
  eventEffects: EventEffectsBalance
  pulledOver: PulledOverBalance
  betting: BettingBalance
  markets: MarketsBalance
  crewEconomy: CrewEconomyBalance
  shakedown: ShakedownBalance
}

export interface MeterLabelTiers {
  high: string
  mid: string
  low: string
  worst: string
  midHigh?: string
}

export interface RunOutcomesCopy {
  shuffle: string[]
  shuffle_blocked: string[]
  all_bailed: string[]
  wook_flu_death: { title: string; subtitle: string }
}

export interface TravelOutcomesCopy {
  wook_flu: Record<string, string[]>
  solo: Record<string, string[]>
  pulled_over: {
    wasted: Record<string, string[]>
    sober: Record<string, string[]>
  }
  bathroom_find: Record<string, string[]>
  lot_rumor: Record<string, string[]>
  encore_whisper: Record<string, string[]>
  hitchhiker_intel: Record<string, string[]>
  market_cop_chase: Record<string, string[]>
  consume: Record<string, string[]>
  clown_juice: Record<string, string[]>
  travel: Record<string, string[]>
  show: Record<string, string[]>
  run: RunOutcomesCopy
}

export interface CrewCopy {
  bail: Record<string, string[]>
  warnings: Record<string, string[]>
  wookFluSpread: string[]
  neglect: Record<string, string[]>
  lowHealthWookFlu: string[]
  venueBlocked: string[]
  meterLabels: Record<string, MeterLabelTiers>
}

export interface TravelLegsCopy {
  legLabels: string[]
  legFlavors: string[]
  roadside: Record<string, { label: string; copy: string }>
}

export interface TourStoryCopy {
  intro: string[]
  travel_stop: string[]
  location: Record<string, string[]>
  event: string[]
  post_show: string[]
  post_show_missed: string[]
  tour_end: string[]
  go_home: string[]
}

export interface CrewRepTitlesCopy {
  tiers: { min: number; name: string }[]
}

export interface GameCopy {
  travelOutcomes: TravelOutcomesCopy
  crew: CrewCopy
  travelLegs: TravelLegsCopy
  locations: Record<string, string>
  marketFlavors: Record<string, string[]>
  tourStory: TourStoryCopy
  crewRepTitles: CrewRepTitlesCopy
}
