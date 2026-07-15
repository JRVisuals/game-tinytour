import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { TourMapStrip } from './TourMapStrip'
import { RESOURCE_EMOJI } from '../game/resources'
import { isLotTurnPhase, showtimeTurnsLabel } from '../game/showtime'
import { useGame } from '../game/GameContext'

const RESOURCE_KEYS = ['cash', 'food', 'beer', 'drugs', 'tickets', 'gas'] as const

/** Compact stash strip — permanent play chrome */
export function StatusLine() {
  const { state } = useGame()
  const tour = state.tour
  const stop = tour?.stops[tour.currentStopIndex]
  const { resources } = state
  const showTurns = isLotTurnPhase(state.phase)

  return (
    <Paper withBorder p="sm" className="solid-panel play-chrome-status" mb={0}>
      <Stack gap={6}>
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Text
            size="md"
            fw={700}
            c="gray.0"
            lh={1.3}
            style={{ flex: '1 1 auto', minWidth: 0 }}
          >
            {tour && stop ? (
              <>
                {tour.band.name} · {stop.city}
              </>
            ) : (
              'On tour'
            )}
          </Text>
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {showTurns && (
              <Badge
                size="lg"
                variant="filled"
                color={state.turnsUntilShow <= 0 ? 'red' : 'orange'}
              >
                {showtimeTurnsLabel(state.turnsUntilShow)}
              </Badge>
            )}
            {tour && tour.stops.length > 0 && <TourMapStrip tour={tour} />}
          </Group>
        </Group>
        {showTurns && state.turnsUntilShow > 0 && (
          <Text size="xs" c="dimmed">
            Each lot move burns one turn — hustle at gates before time runs out.
          </Text>
        )}
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
            <Text size="md" fw={500}>
              {RESOURCE_EMOJI.hasVehicle}
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  )
}
