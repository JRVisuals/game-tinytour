import { Text } from '@mantine/core'
import { stickerEmoji } from '../game/crew/stickers'

const SIZES = {
  sm: '1.15rem',
  md: '1.75rem',
  lg: '2.25rem',
} as const

export function CrewSticker({
  stickerId,
  size = 'md',
}: {
  stickerId?: string
  size?: keyof typeof SIZES
}) {
  return (
    <Text
      component="span"
      aria-hidden
      style={{
        fontSize: SIZES[size],
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {stickerEmoji(stickerId)}
    </Text>
  )
}
