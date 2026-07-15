import { Button, Group, Stack, Text } from '@mantine/core'
import { BackToSceneButton } from '../components/BackToSceneButton'
import { LocationNav } from '../components/LocationNav'
import { SceneBeatAlert } from '../components/SceneBeatAlert'
import { TabHintButton } from '../components/TabHintButton'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { COPY } from '../game/config'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'
import { showtimeTurnsLabel } from '../game/showtime'

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
        <Text size="sm" c="orange" fw={700}>
          {showtimeTurnsLabel(state.turnsUntilShow)}
        </Text>
        <Text>{COPY.locations.venue}</Text>
        {stop && (
          <Text size="sm" c="dimmed">
            {state.tour?.band.name} · {stop.venue}, {stop.city}
          </Text>
        )}
        <Text size="sm" c="orange" fw={500}>
          Showtime — last chance to flip stash or grab tickets.
        </Text>
        {prices && (
          <TabHintButton tab="hustle">Gate vendors — Hustle</TabHintButton>
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
              exclude={['venue', 'shakedown']}
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
      <Text size="sm" c="orange" fw={700}>
        {showtimeTurnsLabel(state.turnsUntilShow)}
      </Text>
      <Text>{COPY.locations[loc]}</Text>
      <BackToSceneButton />
      {state.spotFindEvent && (
        <SceneBeatAlert
          title={state.spotFindEvent.title}
          body={state.spotFindEvent.body}
        />
      )}
      <Text size="sm" c="dimmed">
        {state.turnsUntilShow > 0
          ? 'Each move burns a turn.'
          : 'Out of turns — head to venue gates or into the show.'}
      </Text>
      <LocationNav
        current={loc}
        turnsUntilShow={state.turnsUntilShow}
        onGo={goToLocation}
        exclude={['shakedown']}
      />
      {prices && (
        <TabHintButton tab="hustle">Vendors nearby — Hustle</TabHintButton>
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
