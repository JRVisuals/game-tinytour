import { BALANCE, COPY, pickText } from './config'
import type { LocationId, MarketPrices, MarketSnapshot, MarketStock, RoadsideType } from './types'

export type { MarketPrices, MarketStock, MarketSnapshot } from './types'

export type MarketContext = LocationId | RoadsideType | 'shakedown' | 'post_show_shakedown'

type PriceTier = 'low' | 'mid' | 'high'

const M = BALANCE.markets

const GAS_CONTEXTS = new Set<MarketContext>([
  'truck_stop',
  'supermarket',
  'rest_area',
  'farmers_market',
])

function applyGas(
  context: MarketContext,
  h: number,
  prices: MarketPrices,
  stock: Omit<MarketStock, 'gas'>,
): { prices: MarketPrices; stock: MarketStock } {
  if (!GAS_CONTEXTS.has(context)) {
    return { prices, stock: { ...stock, gas: 0 } }
  }
  const gasBuy = jitter(M.tiers.gasBuy![pickTier(h + 11)], h + 12)
  const S = M.stock
  return {
    prices: { ...prices, gasBuy },
    stock: {
      ...stock,
      gas: S.gasBase + ((h >> S.gasShift) % S.gasMod) + 1,
    },
  }
}

function hashContext(seed: number, context: MarketContext): number {
  let h = seed
  for (const c of context) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function pickTier(n: number): PriceTier {
  const r = n % 3
  if (r === 0) return 'low'
  if (r === 1) return 'mid'
  return 'high'
}

function jitter(base: number, seed: number): number {
  const delta = (Math.abs(seed) % M.jitterRange) - 2
  return Math.max(1, base + delta)
}

/** Sell price tracks buy — spread shrinks when sell tier is high (better resale). */
function sellFromBuy(buy: number, sellTier: PriceTier, seed: number): number {
  const cfg = M.sellSpreadByTier[sellTier]
  const span = cfg.max - cfg.min + 1
  let spread = cfg.min + (Math.abs(seed) % span)
  spread = Math.max(M.minSpread, Math.min(spread, buy - 1))
  return Math.max(1, buy - spread)
}

function flavorFor(buy: PriceTier, sell: PriceTier, seed: number): string {
  if (buy === 'low' && sell === 'high') {
    return pickText(COPY.marketFlavors.jackpot, seed, 'Buy cheap, sell dear.')
  }
  if (buy === 'low') {
    return pickText(COPY.marketFlavors.cheapBuy, seed, 'Good spot to stock up.')
  }
  if (sell === 'high') {
    return pickText(COPY.marketFlavors.goodSell, seed, 'Buyers paying top dollar here.')
  }
  if (buy === 'high' && sell === 'low') {
    return pickText(COPY.marketFlavors.trap, seed, 'Tourist trap prices.')
  }
  return pickText(COPY.marketFlavors.fair, seed, 'Fair lot economics.')
}

export function rollMarket(seed: number, context: MarketContext): MarketSnapshot {
  const h = hashContext(seed, context)

  if (context === 'venue') {
    const V = M.venueGate
    return {
      prices: {
        foodBuy: V.foodBuy,
        foodSell: V.foodSell,
        beerBuy: V.beerBuy,
        beerSell: V.beerSell,
        drugsBuy: V.drugsBuy,
        drugsSell: V.drugsSell,
        ticketBuy: V.ticketBuy,
      },
      stock: { ...V.stock, gas: 0 },
      flavor: V.flavor,
    }
  }

  if (context === 'supermarket') {
    const TIER = M.tiers
    const foodBuy = jitter(TIER.foodBuy!.low, h + 1)
    const beerBuy = jitter(TIER.beerBuy!.low, h + 3)
    const drugsBuy = jitter(TIER.drugsBuy!.mid, h + 5)
    const S = M.stock
    const snapped = applyGas(
      context,
      h,
      {
        foodBuy,
        foodSell: sellFromBuy(foodBuy, 'high', h + 2),
        beerBuy,
        beerSell: sellFromBuy(beerBuy, 'high', h + 4),
        drugsBuy,
        drugsSell: sellFromBuy(drugsBuy, 'mid', h + 6),
        ticketBuy: jitter(TIER.ticketBuy!.mid, h + 7),
      },
      {
        food: S.foodBase + (h % S.foodMod) + 4,
        beer: S.beerBase + ((h >> S.beerShift) % S.beerMod) + 3,
        drugs: S.drugsBase + ((h >> S.drugsShift) % S.drugsMod),
        tickets: S.ticketsBase + ((h >> S.ticketsShift) % S.ticketsMod),
      },
    )
    return {
      ...snapped,
      flavor: 'Supermarket run — cheap food and beer, corporate fluorescent vibes.',
    }
  }

  let buyTier = pickTier(h)
  let sellTier = pickTier(h * 7 + 3)

  if (h % M.jackpotMod === 0) {
    buyTier = 'low'
    sellTier = 'high'
  } else if (h % M.trapMod === 0) {
    buyTier = 'high'
    sellTier = 'low'
  }

  const TIER = M.tiers

  let foodBuy = jitter(TIER.foodBuy![buyTier], h + 1)
  const foodSell = sellFromBuy(foodBuy, sellTier, h + 2)

  let beerBuy = jitter(TIER.beerBuy![buyTier], h + 3)
  const beerSell = sellFromBuy(beerBuy, sellTier, h + 4)

  let drugsBuy = jitter(TIER.drugsBuy![buyTier], h + 5)
  const drugsSell = sellFromBuy(drugsBuy, sellTier, h + 6)

  const ticketBuy = jitter(TIER.ticketBuy![pickTier(h + 8)], h + 7)

  const S = M.stock
  const baseStock = {
    food: S.foodBase + (h % S.foodMod),
    beer: S.beerBase + ((h >> S.beerShift) % S.beerMod),
    drugs: S.drugsBase + ((h >> S.drugsShift) % S.drugsMod),
    tickets: S.ticketsBase + ((h >> S.ticketsShift) % S.ticketsMod),
  }

  const withGas = applyGas(
    context,
    h,
    {
      foodBuy,
      foodSell,
      beerBuy,
      beerSell,
      drugsBuy,
      drugsSell,
      ticketBuy,
    },
    baseStock,
  )

  return {
    prices: withGas.prices,
    stock: withGas.stock,
    flavor: flavorFor(buyTier, sellTier, h),
  }
}

export function marketContextLabel(context: MarketContext): string {
  return context.replace(/_/g, ' ')
}

const ALL_CONTEXTS: MarketContext[] = [
  'shakedown',
  'post_show_shakedown',
  'park',
  'venue',
  'hotel',
  'friends_house',
  'diner',
  'record_store',
  'truck_stop',
  'rest_area',
  'farmers_market',
  'supermarket',
]

export { ALL_CONTEXTS }
