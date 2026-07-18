import { Text } from '@mantine/core'
import type { Tour } from '../game/types'

interface TourMapStripProps {
  tour: Tour
  hint?: string | null
  showNum?: number | null
  totalShows?: number | null
  legText?: string | null
  venueName?: string | null
}

/** Highway sign — show counter, stop dots, leg info, direction arrow */
export function TourMapStrip({ tour, hint, showNum, totalShows, legText, venueName }: TourMapStripProps) {
  const { stops, currentStopIndex } = tour
  const atVenue = !!venueName

  return (
    <div className={`tour-map-strip__sign${atVenue ? ' tour-map-strip__sign--venue' : ''}`} aria-label="Tour progress">
      {/* Show counter — always */}
      {showNum != null && totalShows != null && (
        <Text size="xs" lh={1} className="tour-map-strip__show-label">
          SHOW {showNum}/{totalShows}
        </Text>
      )}

      {/* Stop dots */}
      <div className="tour-map-strip__dots">
        {stops.map((stop, i) => {
          const done = i < currentStopIndex
          const here = i === currentStopIndex
          return (
            <span key={stop.city + i} className="tour-map-strip__stop">
              <span
                className={`tour-map-strip__dot${done ? ' tour-map-strip__dot--done' : here ? ' tour-map-strip__dot--here' : ''}`}
                title={`${stop.city}${here ? ' — you are here' : done ? ' — done' : ''}`}
              />
              {i < stops.length - 1 && <span className="tour-map-strip__dash" />}
            </span>
          )
        })}
      </div>

      {/* Leg info or hint */}
      {legText && (
        <Text size="xs" lh={1} className="tour-map-strip__leg-text">{legText}</Text>
      )}
      {!legText && hint && (
        <Text size="xs" lh={1.2} className="tour-map-strip__hint">{hint}</Text>
      )}

      {/* Venue name replaces arrow when at location */}
      {atVenue ? (
        <Text lh={1} className="tour-map-strip__venue-name">
          {venueName}
        </Text>
      ) : (
        <div className="tour-map-strip__arrow" aria-hidden />
      )}
    </div>
  )
}
