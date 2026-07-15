import { Box } from '@mantine/core'
import { TINY_TOUR_ASCII_COMPACT } from '../game/brand'

/** Compact block-letter logo for the play shell header */
export function AsciiHeaderLogo() {
  return (
    <Box
      component="pre"
      className="ascii-header-pre"
      aria-label="TINY TOUR"
      m={0}
    >
      {TINY_TOUR_ASCII_COMPACT}
    </Box>
  )
}
