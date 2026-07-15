import stickersJson from '../../content/copy/crew-stickers.json'

export interface CrewSticker {
  id: string
  emoji: string
  label: string
}

export const CREW_STICKERS = stickersJson.stickers as CrewSticker[]

const STICKER_BY_ID = new Map(CREW_STICKERS.map((s) => [s.id, s]))

export const DEFAULT_STICKER_ID = CREW_STICKERS[0]?.id ?? 'guitar'

export function stickerEmoji(stickerId?: string): string {
  return STICKER_BY_ID.get(stickerId ?? '')?.emoji ?? '🎶'
}

export function stickerLabel(stickerId?: string): string {
  return STICKER_BY_ID.get(stickerId ?? '')?.label ?? 'Tour kid'
}

export function defaultStickerId(seed: number): string {
  return CREW_STICKERS[Math.abs(seed) % CREW_STICKERS.length]?.id ?? DEFAULT_STICKER_ID
}

export function crewStickerSelectData() {
  return CREW_STICKERS.map((s) => ({
    value: s.id,
    label: `${s.emoji} ${s.label}`,
  }))
}
