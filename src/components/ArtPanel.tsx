import { Box, Paper, Text } from '@mantine/core'

/** Simple art panel — swap for real assets later */
export function ArtPanel() {
  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      mb="md"
      style={{
        background:
          'linear-gradient(135deg, #1a2f2a 0%, #0f1a18 50%, #1f1520 100%)',
        minHeight: 120,
      }}
    >
      <Box
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          lineHeight: 1.2,
          color: '#7ec8b8',
          whiteSpace: 'pre',
        }}
      >
        {`    _______________
   |  LITTLE TOUR  |
   |  [====van====] |
   |   o        o   |
 ~~~~~~~~~~~~~~~~~~~
   lot · tape · miles`}
      </Box>
      <Text size="xs" c="dimmed" mt="xs">
        Shakedown at dusk. Somewhere between home and the next show.
      </Text>
    </Paper>
  )
}
