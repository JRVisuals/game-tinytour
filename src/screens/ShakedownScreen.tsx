import { Alert, Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { ClownJuiceMafiaPanel } from '../components/ClownJuiceMafiaPanel'
import { LocationNav } from '../components/LocationNav'
import { SpotFindAlert } from '../components/SpotFindAlert'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'
import { isClownJuiceMafia } from '../game/shakedown/events'

export function ShakedownScreen() {
  const { state, goToLocation, goToVenueGates, adjustResources } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)
  const event = state.shakedownLotEvent
  const showBalloons = isClownJuiceMafia(event)

  return (
    <Stack>
      <Title order={2}>Shakedown</Title>
      <Text>
        Lot hub near <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. Store / grab gear from the car when you have one.
      </Text>

      {event && (
        <Paper withBorder p="sm" bg="rgba(120,40,140,0.12)">
          <Text fw={600} mb={4}>
            {event.title}
          </Text>
          <Text size="sm">{event.body}</Text>
        </Paper>
      )}

      {state.spotFindEvent && (
        <SpotFindAlert
          title={state.spotFindEvent.title}
          body={state.spotFindEvent.body}
        />
      )}

      {!event && (
        <Alert color="teal" title="Quiet lot">
          Vendors packing, stragglers humming. Scout prices before showtime.
        </Alert>
      )}

      {showBalloons && <ClownJuiceMafiaPanel />}

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
      {state.currentMarket && (
        <Text size="xs" c="dimmed" ta="center">
          Vendors in the lot — open Crew → Hustle to trade.
        </Text>
      )}
    </Stack>
  )
}
