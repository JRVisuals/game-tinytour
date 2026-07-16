import { Button, Group, Stack, Text } from '@mantine/core'
import { LocationNav } from '../components/LocationNav'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'
import { shakedownSceneBeat } from '../game/scene/beat'
import { showtimeTurnsLabel } from '../game/showtime'

export function ShakedownScreen() {
  const { state, goToLocation, goToVenueGates, adjustResources } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)
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
          <Text size="sm" c="dimmed">
            No ride yet.
          </Text>
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
      <LocationNav
        current="shakedown"
        turnsUntilShow={state.turnsUntilShow}
        onGo={goToLocation}
      />
      <Button
        color="grape"
        onClick={goToVenueGates}
        disabled={!venueOk}
      >
        {state.turnsUntilShow > 0 ? 'Head to venue gates' : 'Showtime — venue gates'}
      </Button>
      {!venueOk && gateMessage && (
        <Text size="sm" c="red">
          {gateMessage}
        </Text>
      )}
    </Stack>
  )
}
