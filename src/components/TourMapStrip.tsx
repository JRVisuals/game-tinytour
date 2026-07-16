import { Text } from '@mantine/core'
import type { Tour } from '../game/types'

interface TourMapStripProps {
  tour: Tour
  hint?: string | null
}

/** Stop progress: filled = done, ring = here, empty = ahead */
export function TourMapStrip({ tour, hint }: TourMapStripProps) {
  const { stops, currentStopIndex } = tour

  return (
    <div className="tour-map-strip">
      <div className="tour-map-strip__dots" aria-label="Tour progress">
        {stops.map((stop, i) => {
          const done = i < currentStopIndex
          const here = i === currentStopIndex
          const symbol = done ? '●' : here ? '◉' : '○'
          const color = done ? 'teal' : here ? 'yellow' : 'dimmed'

          return (
            <span key={stop.city + i} className="tour-map-strip__stop">
              <Text
                component="span"
                size="md"
                fw={here ? 700 : 500}
                c={color}
                lh={1}
                title={`${stop.city}${here ? ' — you are here' : done ? ' — done' : ''}`}
              >
                {symbol}
              </Text>
              {i < stops.length - 1 && (
                <Text component="span" size="sm" c="dimmed" lh={1}>
                  —
                </Text>
              )}
            </span>
          )
        })}
      </div>
      {hint && (
        <Text size="xs" c="teal.4" ta="right" lh={1.2} className="tour-map-strip__hint">
          {hint}
        </Text>
      )}
    </div>
  )
}
