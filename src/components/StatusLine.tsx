import { Badge, Group, Paper, Progress, Stack, Text } from '@mantine/core'
import { TourMapStrip } from './TourMapStrip'
import { RESOURCE_EMOJI } from '../game/resources'
import { isLotTurnPhase, showtimeTurnsLabel } from '../game/showtime'
import { tourForeshadow } from '../game/scene/foreshadow'
import { useGame } from '../game/GameContext'

const RESOURCE_KEYS = ['cash', 'food', 'beer', 'drugs', 'tickets', 'gas'] as const

/** Status block — band/location/progress + resources */
export function StatusLine() {
  const { state } = useGame()
  const tour = state.tour
  const stop = tour?.stops[tour.currentStopIndex]
  const { resources } = state
  const showTurns = isLotTurnPhase(state.phase)
  const foreshadow = tourForeshadow(state)
  const travel = state.travel
  const isTravel = state.phase === 'travel' && !!travel
  const travelProgress = isTravel && travel.legs.length > 0
    ? (travel.currentLegIndex / travel.legs.length) * 100
    : null

  const legText = isTravel
    ? `Leg ${travel.currentLegIndex + 1}/${travel.legs.length}${(() => { const leg = travel.legs[travel.currentLegIndex]; return leg ? ` · ~${leg.miles}mi` : '' })()}`
    : null

  const showNum = tour ? tour.currentStopIndex + 1 : null
  const totalShows = tour ? tour.stops.length : null
  const isAtLot = ['shakedown', 'location', 'show', 'post_show', 'post_show_shakedown'].includes(state.phase)
  const venueName = isAtLot && stop ? stop.venue : null

  return (
    <Paper withBorder p="sm" className="solid-panel play-chrome-status" mb={0}>
      <div className="status-line-columns">
        {/* Left: everything stacked compactly */}
        <Stack gap={4} style={{ flex: '1 1 auto', minWidth: 0 }}>
          {/* Band + city + turns badge */}
          <Group align="center" gap="xs" wrap="nowrap">
            <Text size="sm" fw={700} c="gray.0" lh={1.2} style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tour && stop ? <>{tour.band.name} · {stop.city}</> : 'On tour'}
            </Text>
            {showTurns && (
              <Badge size="xs" variant="filled" color={state.turnsUntilShow <= 0 ? 'red' : 'orange'} style={{ flexShrink: 0 }}>
                {showtimeTurnsLabel(state.turnsUntilShow)}
              </Badge>
            )}
          </Group>

          {/* Travel route + progress while driving */}
          {isTravel && (
            <Stack gap={3}>
              <Text size="xs" c="dimmed">
                {travel.origin} → {travel.destination}
              </Text>
              {travelProgress !== null && (
                <Progress value={travelProgress} size={6} color="teal" className="travel-progress" />
              )}
            </Stack>
          )}

          {/* Lot flavor */}
          {isAtLot && (
            <Text size="xs" c="dimmed" fs="italic">
              So you thought you might come to the show…
            </Text>
          )}

          {/* Resources */}
          <Group gap="sm" wrap="wrap">
            <Text size="md" fw={700}>{RESOURCE_EMOJI.cash} {resources.cash}</Text>
            {RESOURCE_KEYS.filter((k) => k !== 'cash').map((key) => (
              <Text key={key} size="md">{RESOURCE_EMOJI[key]} {String(resources[key])}</Text>
            ))}
            {resources.hasVehicle && <Text size="md">{RESOURCE_EMOJI.hasVehicle}</Text>}
          </Group>
        </Stack>

        {/* Right: highway sign */}
        {tour && tour.stops.length > 0 && (
          <TourMapStrip
            tour={tour}
            hint={foreshadow}
            showNum={showNum}
            totalShows={totalShows}
            legText={legText}
            venueName={venueName}
          />
        )}
      </div>
    </Paper>
  )
}
