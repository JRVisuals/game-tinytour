import crewMetersJson from '../../content/balance/crew-meters.json'
import resourcesJson from '../../content/balance/resources.json'
import travelJson from '../../content/balance/travel.json'
import eventEffectsJson from '../../content/balance/event-effects.json'
import pulledOverJson from '../../content/balance/pulled-over.json'
import bettingJson from '../../content/balance/betting.json'
import marketsJson from '../../content/balance/markets.json'
import crewEconomyJson from '../../content/balance/crew-economy.json'
import shakedownJson from '../../content/balance/shakedown.json'
import travelOutcomesJson from '../../content/copy/travel-outcomes.json'
import crewCopyJson from '../../content/copy/crew.json'
import travelLegsJson from '../../content/copy/travel-legs.json'
import locationsJson from '../../content/copy/locations.json'
import marketFlavorsJson from '../../content/copy/market-flavors.json'
import crewRepTitlesJson from '../../content/copy/crew-rep-titles.json'
import tourStoryJson from '../../content/copy/tour-story.json'
import type { GameBalance, GameCopy } from './types'

/** Tweak numbers in src/content/balance/*.json */
export const BALANCE: GameBalance = {
  crewMeters: crewMetersJson,
  resources: resourcesJson,
  travel: travelJson,
  eventEffects: eventEffectsJson,
  pulledOver: pulledOverJson,
  betting: bettingJson,
  markets: marketsJson,
  crewEconomy: crewEconomyJson,
  shakedown: shakedownJson,
}

/** Tweak phrasing in src/content/copy/*.json */
export const COPY: GameCopy = {
  travelOutcomes: travelOutcomesJson,
  crew: crewCopyJson,
  travelLegs: travelLegsJson,
  locations: locationsJson,
  marketFlavors: marketFlavorsJson,
  tourStory: tourStoryJson,
  crewRepTitles: crewRepTitlesJson,
}

export type { GameBalance, GameCopy } from './types'
export { pickText, formatText, pickTextWithPlural, pluralS } from './text'
