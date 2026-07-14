import { Badge, Group, Paper, Text } from '@mantine/core'
import { RESOURCE_LABELS } from '../game/resources'
import { useGame } from '../game/GameContext'
import type { Resources } from '../game/types'

const METER_KEYS: (keyof Resources)[] = [
  'cash',
  'food',
  'beer',
  'drugs',
  'tickets',
  'gas',
]

export function StatusBar() {
  const { state } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]

  return (
    <Paper withBorder p="sm" mb="md">
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{state.crew[0]?.name ?? 'Crew'}</Text>
        <Group gap="xs">
          {state.tour && (
            <Badge variant="light">
              {state.tour.band.name}
              {stop ? ` · ${stop.city}` : ''}
            </Badge>
          )}
          {(state.phase === 'shakedown' || state.phase === 'location') && (
            <Badge color="orange">Turns to show: {state.turnsUntilShow}</Badge>
          )}
        </Group>
      </Group>
      <Group gap="sm">
        {METER_KEYS.map((key) => (
          <Badge key={key} variant="outline">
            {RESOURCE_LABELS[key]}: {String(state.resources[key])}
          </Badge>
        ))}
        {state.resources.hasVehicle && <Badge color="teal">Vehicle</Badge>}
      </Group>
    </Paper>
  )
}
