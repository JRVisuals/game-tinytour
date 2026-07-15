import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core'
import { LocationNav } from '../components/LocationNav'
import { SceneBeatAlert } from '../components/SceneBeatAlert'
import { TabHintButton } from '../components/TabHintButton'
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
  const clownJuice = isClownJuiceMafia(event)

  return (
    <Stack>
      <Title order={2}>Shakedown</Title>
      <Text>
        Lot hub near <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. Store / grab gear from the car when you have one.
      </Text>

      {event && (
        <SceneBeatAlert
          title={event.title}
          body={event.body}
          color={clownJuice ? 'grape' : 'teal'}
        />
      )}

      {state.spotFindEvent && (
        <SceneBeatAlert
          title={state.spotFindEvent.title}
          body={state.spotFindEvent.body}
        />
      )}

      {!event && (
        <Alert color="teal" title="Quiet lot">
          Vendors packing, stragglers humming. Scout prices before showtime.
        </Alert>
      )}

      {clownJuice && (
        <TabHintButton tab="hustle">Balloon deals — Hustle</TabHintButton>
      )}

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
        <TabHintButton tab="hustle">Vendors in the lot — Hustle</TabHintButton>
      )}
    </Stack>
  )
}
