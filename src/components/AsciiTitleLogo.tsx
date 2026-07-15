import { Box } from '@mantine/core'
import { TINY_TOUR_ASCII } from '../game/brand'

export function AsciiTitleLogo() {
  return (
    <Box
      className="ascii-logo-scroll"
      w="100%"
      py="xs"
    >
      <Box
        component="pre"
        className="ascii-logo-pre"
        aria-label="TINY TOUR"
        m={0}
      >
        {TINY_TOUR_ASCII}
      </Box>
    </Box>
  )
}
