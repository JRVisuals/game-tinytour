import { Button, Group, Stack, Text } from '@mantine/core'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'
import { shakedownSceneBeat } from '../game/scene/beat'
import { showtimeTurnsLabel } from '../game/showtime'

export function ShakedownScreen() {
  const { state, adjustResources } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const beat = shakedownSceneBeat(state)

  return (
    <Stack>
      <Text size="sm" c="orange" fw={700}>
        {showtimeTurnsLabel(state.turnsUntilShow)}
      </Text>
      <Text>
        Lot hub near <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. Store / grab gear from the car when you have one.
      </Text>

      <SceneBeatSlot beat={beat} />

      {state.resources.hasVehicle ? (
        <Text size="sm">Vehicle stash available (stub).</Text>
      ) : (
        <Group>
          <Text size="sm" c="dimmed">No ride yet.</Text>
          <Button
            size="sm"
            variant="light"
            onClick={() =>
              adjustResources({
                hasVehicle: true,
                gas: RESOURCE_BALANCE.vehicleGas,
                cash: Math.max(0, state.resources.cash - RESOURCE_BALANCE.vehicleCost),
              })
            }
          >
            Score a beater (-${RESOURCE_BALANCE.vehicleCost})
          </Button>
        </Group>
      )}
    </Stack>
  )
}
