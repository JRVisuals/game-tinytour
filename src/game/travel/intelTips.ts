import { BALANCE } from '../config'
import type { BandCatalog, BetSlot, Resources, Setlist } from '../types'
import { intelTipResult } from './eventOutcomes'

export type IntelEventKey = 'hitchhiker_intel' | 'lot_rumor' | 'encore_whisper'

export interface IntelEventEffect {
  correctChancePercent: number
  slot: BetSlot
  food?: number
  beer?: number
  drugs?: number
  preferDeepCutWrong?: boolean
}

export function intelEffect(key: IntelEventKey): IntelEventEffect {
  return BALANCE.eventEffects[key] as IntelEventEffect
}

export function setlistSongId(setlist: Setlist | undefined, slot: BetSlot): string | undefined {
  const ids = setlist?.songIds ?? []
  if (ids.length === 0) return undefined
  if (slot === 'opener') return ids[0]
  if (slot === 'encore') return ids[ids.length - 1]
  if (slot === 'anywhere') return ids[Math.abs(ids.length) % ids.length]
  return undefined
}

export function buildIntelTipSongId(
  catalog: BandCatalog,
  setlist: Setlist,
  config: IntelEventEffect,
  seed: number,
): string | undefined {
  const setIds = setlist.songIds ?? []
  const correct = Math.abs(seed + 11) % 100 < config.correctChancePercent

  if (config.slot === 'anywhere') {
    if (setIds.length === 0) return undefined
    if (correct) {
      return setIds[Math.abs(seed + 17) % setIds.length]
    }
    let wrongPool = catalog.songs.filter((s) => !setIds.includes(s.id))
    if (config.preferDeepCutWrong) {
      const deep = wrongPool.filter((s) => s.tier === 'deep_cut')
      if (deep.length > 0) wrongPool = deep
    }
    if (wrongPool.length === 0) return setIds[0]
    return wrongPool[Math.abs(seed + 29) % wrongPool.length]!.id
  }

  const actualId = setlistSongId(setlist, config.slot)
  if (!actualId) return undefined
  if (correct) return actualId

  let wrongPool = catalog.songs.filter((s) => s.id !== actualId)
  if (config.preferDeepCutWrong) {
    const deep = wrongPool.filter((s) => s.tier === 'deep_cut')
    if (deep.length > 0) wrongPool = deep
  }
  if (wrongPool.length === 0) return actualId
  return wrongPool[Math.abs(seed + 29) % wrongPool.length]!.id
}

type ResourceKey = 'food' | 'beer' | 'drugs'

function tradeResourceForKey(key: IntelEventKey): ResourceKey | null {
  const fx = intelEffect(key)
  if (fx.food) return 'food'
  if (fx.beer) return 'beer'
  if (fx.drugs) return 'drugs'
  return null
}

export function intelTradeChoiceId(key: IntelEventKey): string {
  const res = tradeResourceForKey(key)
  return res ? `trade_${res}` : 'trade'
}

export function resolveIntelTrade(
  eventKey: IntelEventKey,
  choiceId: string | undefined,
  resources: Resources,
  songTitle: string | undefined,
  slot: BetSlot,
  seed: number,
): { resources: Resources; message: string } {
  const tradeId = intelTradeChoiceId(eventKey)

  if (choiceId !== tradeId) {
    return {
      resources,
      message: intelTipResult(eventKey, 'decline', { songTitle, slot, seed }),
    }
  }

  const resource = tradeResourceForKey(eventKey)
  if (!resource) {
    return {
      resources,
      message: intelTipResult(eventKey, 'decline', { songTitle, slot, seed }),
    }
  }

  const fx = intelEffect(eventKey)
  const cost = Math.abs(fx[resource] ?? 0)
  if (resources[resource] < cost) {
    return {
      resources,
      message: intelTipResult(eventKey, tradeId, {
        songTitle,
        slot,
        seed,
        missing: resource,
      }),
    }
  }

  return {
    resources: { ...resources, [resource]: resources[resource] - cost },
    message: intelTipResult(eventKey, tradeId, { songTitle, slot, seed }),
  }
}
