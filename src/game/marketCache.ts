import type { GameState, LocationId, MarketSnapshot, MarketStock } from './types'
import { rollMarket, type MarketContext } from './market'

export function marketScopeKey(s: GameState, context: MarketContext): string | null {
  if (!s.tour) return null
  const stopIdx = s.tour.currentStopIndex
  if (s.travel?.atRoadside && s.phase === 'travel') {
    return `road:${stopIdx}:${s.travel.currentLegIndex}:${context}`
  }
  return `stop:${stopIdx}:${context}`
}

export function ensureMarket(
  s: GameState,
  context: MarketContext,
  seed: number,
): GameState {
  const scopeKey = marketScopeKey(s, context)
  if (!scopeKey) {
    return rollMarketToState(s, context, seed, null)
  }
  const cached = s.stopMarkets[scopeKey]
  if (cached) {
    return applySnapshot(s, cached, context, scopeKey)
  }
  const snap = rollMarket(seed, context)
  return {
    ...applySnapshot(s, snap, context, scopeKey),
    stopMarkets: { ...s.stopMarkets, [scopeKey]: snap },
  }
}

function rollMarketToState(
  s: GameState,
  context: MarketContext,
  seed: number,
  scopeKey: string | null,
): GameState {
  const snap = rollMarket(seed, context)
  const next = applySnapshot(s, snap, context, scopeKey)
  if (!scopeKey) return next
  return { ...next, stopMarkets: { ...s.stopMarkets, [scopeKey]: snap } }
}

function applySnapshot(
  s: GameState,
  snap: MarketSnapshot,
  context: MarketContext,
  scopeKey: string | null,
): GameState {
  return {
    ...s,
    currentMarket: snap.prices,
    currentMarketStock: { ...snap.stock },
    marketFlavor: snap.flavor,
    marketContext: context,
    activeMarketKey: scopeKey,
  }
}

export function persistMarketStock(s: GameState, stock: MarketStock): GameState {
  const key = s.activeMarketKey
  if (!key || !s.currentMarket) return { ...s, currentMarketStock: stock }

  const cached = s.stopMarkets[key]
  const snap: MarketSnapshot = cached
    ? { ...cached, stock: { ...stock } }
    : {
        prices: s.currentMarket,
        stock: { ...stock },
        flavor: s.marketFlavor ?? '',
      }

  return {
    ...s,
    currentMarketStock: stock,
    stopMarkets: { ...s.stopMarkets, [key]: snap },
  }
}

export const LOT_DESTINATIONS: { id: LocationId; label: string }[] = [
  { id: 'park', label: 'Park' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'friends_house', label: "Friend's house" },
  { id: 'shakedown', label: 'Shakedown' },
]
