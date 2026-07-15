import { Box, Paper, Text } from '@mantine/core'
import { useState } from 'react'

interface ArtSlotProps {
  /** Short label — e.g. "Logo", "Scene" */
  label: string
  /** Suggested path for a future asset (shown as hint only) */
  assetHint?: string
  /** When set, renders image; falls back to placeholder if load fails */
  src?: string | null
  alt?: string
  minHeight?: number
  /** Shorter banner for in-game screens */
  compact?: boolean
}

/** Reserved frame for artwork — drop PNG/WebP/GIF/Lottie here later */
export function ArtSlot({
  label,
  assetHint,
  src,
  alt,
  minHeight,
  compact = false,
}: ArtSlotProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const height = minHeight ?? (compact ? 72 : 100)
  const showImage = Boolean(src) && !imageFailed

  return (
    <Paper
      withBorder
      radius="md"
      className={showImage ? 'art-slot art-slot--filled' : 'art-slot art-slot--empty'}
      style={{
        minHeight: height,
        maxHeight: compact ? height + 24 : undefined,
        overflow: 'hidden',
        position: 'relative',
        borderStyle: showImage ? 'solid' : 'dashed',
        background: showImage ? 'rgba(0, 0, 0, 0.35)' : undefined,
      }}
      p={showImage ? 0 : 'md'}
    >
      {showImage ? (
        <Box
          component="img"
          src={src!}
          alt={alt ?? label}
          onError={() => setImageFailed(true)}
          style={{
            display: 'block',
            width: '100%',
            height,
            objectFit: 'cover',
          }}
        />
      ) : (
        <Box
          className="art-slot__placeholder"
          style={{
            minHeight: height - 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box ta="center" px="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
              {label}
            </Text>
            <Text size="xs" c="dimmed">
              Illustration slot
            </Text>
            {assetHint && (
              <Text size="xs" c="dimmed" ff="monospace" mt={4}>
                {assetHint}
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
