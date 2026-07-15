import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { LocationNav } from '../components/LocationNav'
import { MarketPanel } from '../components/MarketPanel'
import { SpotFindAlert } from '../components/SpotFindAlert'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { COPY } from '../game/config'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'

export function LocationScreen() {
  const { state, goToLocation, enterShow, hotelCrash } = useGame()
  const loc = state.currentLocation
  const prices = state.currentMarket
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)
  const stop = state.tour?.stops[state.tour.currentStopIndex]

  if (loc === 'shakedown') {
    return null
  }

  if (loc === 'venue') {
    return (
      <Stack>
        <Title order={2}>Venue gates</Title>
        <Text>{COPY.locations.venue}</Text>
        {stop && (
          <Text size="sm" c="dimmed">
            {state.tour?.band.name} · {stop.venue}, {stop.city}
          </Text>
        )}
        <Text size="sm" c="orange" fw={500}>
          Showtime — last chance to flip stash or grab tickets.
        </Text>
        {prices && state.currentMarketStock && (
          <MarketPanel
            prices={prices}
            stock={state.currentMarketStock}
            flavor={state.marketFlavor}
            contextLabel="venue gates"
            showTickets
          />
        )}
        {state.turnsUntilShow > 0 && (
          <>
            <Text size="sm" c="dimmed">
              Still time on the lot — head back if you need supplies.
            </Text>
            <LocationNav
              current="venue"
              turnsUntilShow={state.turnsUntilShow}
              onGo={goToLocation}
              exclude={['venue']}
            />
          </>
        )}
        <Button color="grape" onClick={enterShow} disabled={!venueOk}>
          Into the show
        </Button>
        {!venueOk && gateMessage && (
          <Text size="sm" c="red">
            {gateMessage}
          </Text>
        )}
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={2}>{loc.split('_').join(' ')}</Title>
      <Text>{COPY.locations[loc]}</Text>
      {state.spotFindEvent && (
        <SpotFindAlert
          title={state.spotFindEvent.title}
          body={state.spotFindEvent.body}
        />
      )}
      <Text size="sm" c="dimmed">
        Turns left before show: {state.turnsUntilShow}
      </Text>
      <LocationNav
        current={loc}
        turnsUntilShow={state.turnsUntilShow}
        onGo={goToLocation}
      />
      {prices && state.currentMarketStock && (
        <MarketPanel
          prices={prices}
          stock={state.currentMarketStock}
          flavor={state.marketFlavor}
          contextLabel={state.marketContext ?? loc}
        />
      )}
      {loc === 'hotel' && (
        <Button
          onClick={hotelCrash}
          disabled={state.resources.cash < RESOURCE_BALANCE.hotelCrashCost}
        >
          Crash (${RESOURCE_BALANCE.hotelCrashCost}) — reset crew
        </Button>
      )}
      {state.turnsUntilShow <= 0 && (
        <Group>
          <Text size="sm" c="dimmed">
            Showtime — heading to the venue gates…
          </Text>
        </Group>
      )}
    </Stack>
  )
}
