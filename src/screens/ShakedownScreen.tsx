import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { LocationNav } from '../components/LocationNav'
import { MarketPanel } from '../components/MarketPanel'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { RESOURCE_BALANCE } from '../game/resources'
import { useGame } from '../game/GameContext'

export function ShakedownScreen() {
  const { state, goToLocation, goToVenueGates, enterShow, adjustResources } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)

  return (
    <Stack>
      <Title order={2}>Shakedown</Title>
      <Text>
        Lot hub near <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. Store / grab gear from the car when you have one.
      </Text>
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
        onClick={() => (state.turnsUntilShow > 0 ? enterShow() : goToVenueGates())}
        disabled={!venueOk}
      >
        {state.turnsUntilShow > 0 ? 'Head to show early' : 'Showtime — venue gates'}
      </Button>
      {!venueOk && gateMessage && (
        <Text size="sm" c="red">
          {gateMessage}
        </Text>
      )}
      {state.currentMarket && state.currentMarketStock && (
        <MarketPanel
          prices={state.currentMarket}
          stock={state.currentMarketStock}
          flavor={state.marketFlavor}
          contextLabel="shakedown"
          showTickets
        />
      )}
    </Stack>
  )
}
