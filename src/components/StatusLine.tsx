import { Group, Text } from '@mantine/core'
import { activeCrew } from '../game/crew/meters'
import { RESOURCE_LABELS } from '../game/resources'
import { useGame } from '../game/GameContext'

const RESOURCE_KEYS = ['cash', 'food', 'beer', 'drugs', 'tickets', 'gas'] as const

/** One-line stash summary for the Scene tab */
export function StatusLine() {
  const { state } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const parts: string[] = []

  for (const key of RESOURCE_KEYS) {
    parts.push(`${RESOURCE_LABELS[key]} ${String(state.resources[key])}`)
  }
  if (state.resources.hasVehicle) parts.push('Vehicle')

  return (
    <Group gap="xs" mb="sm" wrap="wrap">
      <Text size="xs" c="dimmed">
        {activeCrew(state.crew).length}/{state.crew.length} crew
        {state.tour && stop ? ` · ${state.tour.band.name} · ${stop.city}` : ''}
        {(state.phase === 'shakedown' || state.phase === 'location') &&
          ` · ${state.turnsUntilShow} turn${state.turnsUntilShow === 1 ? '' : 's'} to show`}
      </Text>
      <Text size="xs">{parts.join(' · ')}</Text>
    </Group>
  )
}
