import type { LocationId, RoadsideType } from './types'

export interface MarketPrices {
  foodBuy: number
  foodSell: number
  beerBuy: number
  beerSell: number
  drugsBuy: number
  drugsSell: number
  ticketBuy?: number
}

export type MarketContext = LocationId | RoadsideType | 'shakedown'

const BASE = {
  foodBuy: 8,
  foodSell: 4,
  beerBuy: 6,
  beerSell: 3,
  drugsBuy: 25,
  drugsSell: 12,
  ticketBuy: 40,
}

const CONTEXT_BIAS: Record<string, Partial<MarketPrices>> = {
  park: { foodBuy: 6, beerBuy: 5, drugsSell: 15 },
  venue: { ticketBuy: 45, beerBuy: 8 },
  hotel: { foodBuy: 10, beerBuy: 7 },
  friends_house: { foodBuy: 5, beerBuy: 4 },
  shakedown: { drugsBuy: 20, drugsSell: 18, beerSell: 5 },
  truck_stop: { foodBuy: 7, beerBuy: 5, drugsBuy: 30 },
  rest_area: { foodBuy: 9, beerBuy: 7 },
  farmers_market: { foodBuy: 4, foodSell: 6, beerBuy: 8 },
}

function jitter(base: number, seed: number, pct = 0.25): number {
  const spread = Math.floor(base * pct)
  const delta = (Math.abs(seed) % (spread * 2 + 1)) - spread
  return Math.max(1, base + delta)
}

export function rollMarket(seed: number, context: MarketContext): MarketPrices {
  const bias = CONTEXT_BIAS[context] ?? {}
  const mk = (key: keyof MarketPrices, fallback: number) =>
    jitter(bias[key] ?? BASE[key as keyof typeof BASE] ?? fallback, seed + key.length * 7)

  return {
    foodBuy: mk('foodBuy', BASE.foodBuy),
    foodSell: mk('foodSell', BASE.foodSell),
    beerBuy: mk('beerBuy', BASE.beerBuy),
    beerSell: mk('beerSell', BASE.beerSell),
    drugsBuy: mk('drugsBuy', BASE.drugsBuy),
    drugsSell: mk('drugsSell', BASE.drugsSell),
    ticketBuy: mk('ticketBuy', BASE.ticketBuy),
  }
}

export function marketContextLabel(context: MarketContext): string {
  return context.replace(/_/g, ' ')
}
