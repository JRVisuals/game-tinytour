import { Box, Paper, Text } from '@mantine/core'

interface ArtSlotProps {
  /** Short label — e.g. "Logo", "Scene" */
  label: string
  /** Suggested path for a future asset (shown as hint only) */
  assetHint?: string
  minHeight?: number
}

/** Reserved space for artwork — drop an <img> or background image here later */
export function ArtSlot({ label, assetHint, minHeight = 100 }: ArtSlotProps) {
  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        borderStyle: 'dashed',
      }}
    >
      <Box ta="center">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
          {label}
        </Text>
        {assetHint && (
          <Text size="xs" c="dimmed" ff="monospace">
            {assetHint}
          </Text>
        )}
      </Box>
    </Paper>
  )
}
