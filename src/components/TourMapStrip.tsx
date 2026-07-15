import { Group, Text } from '@mantine/core'
import type { Tour } from '../game/types'

interface TourMapStripProps {
  tour: Tour
}

/** Stop progress: filled = done, ring = here, empty = ahead */
export function TourMapStrip({ tour }: TourMapStripProps) {
  const { stops, currentStopIndex } = tour

  return (
    <Group
      gap={4}
      wrap="nowrap"
      align="center"
      aria-label="Tour progress"
      style={{ flexShrink: 0, overflowX: 'auto', maxWidth: '55%' }}
    >
      {stops.map((stop, i) => {
        const done = i < currentStopIndex
        const here = i === currentStopIndex
        const symbol = done ? '●' : here ? '◉' : '○'
        const color = done ? 'teal' : here ? 'yellow' : 'dimmed'

        return (
          <Group key={stop.city + i} gap={4} wrap="nowrap">
            <Text
              size="md"
              fw={here ? 700 : 500}
              c={color}
              lh={1}
              title={`${stop.city}${here ? ' — you are here' : done ? ' — done' : ''}`}
            >
              {symbol}
            </Text>
            {i < stops.length - 1 && (
              <Text size="sm" c="dimmed" lh={1}>
                —
              </Text>
            )}
          </Group>
        )
      })}
    </Group>
  )
}
