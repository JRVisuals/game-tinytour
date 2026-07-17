import { Badge, Divider, Group, Paper, Progress, Stack, Text } from '@mantine/core'
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

  return (
    <Paper withBorder p="sm" className="solid-panel play-chrome-status" mb={0}>
      <Stack gap={6}>
        {/* Band + location header */}
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm" className="status-line-top">
          <Text size="md" fw={700} c="gray.0" lh={1.3} style={{ flex: '1 1 auto', minWidth: 0 }}>
            {tour && stop ? <>{tour.band.name} · {stop.city}</> : 'On tour'}
          </Text>
          <div className="status-line-trail">
            {showTurns && (
              <Badge size="lg" variant="filled" color={state.turnsUntilShow <= 0 ? 'red' : 'orange'}>
                {showtimeTurnsLabel(state.turnsUntilShow)}
              </Badge>
            )}
            {tour && tour.stops.length > 0 && (
              <TourMapStrip tour={tour} hint={foreshadow} />
            )}
          </div>
        </Group>

        {/* Travel: route + progress bar */}
        {isTravel && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              {travel.origin} → {travel.destination} · Leg {travel.currentLegIndex + 1} of {travel.legs.length}
              {(() => { const leg = travel.legs[travel.currentLegIndex]; return leg ? ` · ~${leg.miles} mi` : '' })()}
            </Text>
            {travelProgress !== null && (
              <Progress value={travelProgress} size="xs" color="teal" />
            )}
          </Stack>
        )}

        <Divider opacity={0.3} />

        {/* Resources */}
        <Group gap="md" wrap="wrap">
          <Text size="md" fw={700}>
            {RESOURCE_EMOJI.cash} {resources.cash}
          </Text>
          {RESOURCE_KEYS.filter((k) => k !== 'cash').map((key) => (
            <Text key={key} size="md" fw={500}>
              {RESOURCE_EMOJI[key]} {String(resources[key])}
            </Text>
          ))}
          {resources.hasVehicle && (
            <Text size="md" fw={500}>{RESOURCE_EMOJI.hasVehicle}</Text>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
