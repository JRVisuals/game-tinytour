import { Button, Stack, Text } from '@mantine/core'
import { LocationNav } from '../components/LocationNav'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { COPY } from '../game/config'
import { useGame } from '../game/GameContext'
import { RESOURCE_BALANCE } from '../game/resources'
import { showtimeTurnsLabel } from '../game/showtime'
import { locationSceneBeat } from '../game/scene/beat'
import { getLocationActions, canAffordAction } from '../game/location/locationEvents'

export function LocationScreen() {
  const { state, goToLocation, goToVenueGates, enterShow, hotelCrash, friendsCrash, performLocationAction } = useGame()
  const loc = state.currentLocation
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const locationActions = getLocationActions(loc)

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
        {state.turnsUntilShow > 0 ? (
          <>
            <Text size="sm" c="dimmed">
              Still time on the lot — head back if you need supplies.
            </Text>
            <LocationNav
              current="venue"
              turnsUntilShow={state.turnsUntilShow}
              onGo={goToLocation}
              exclude={['venue']}
              primaryActions={[{
                label: 'Into the show',
                onClick: enterShow,
                disabled: !venueOk,
                disabledReason: gateMessage ?? undefined,
              }]}
            />
          </>
        ) : (
          <LocationNav
            current="venue"
            turnsUntilShow={0}
            onGo={goToLocation}
            exclude={['venue']}
            primaryActions={[{
              label: 'Into the show',
              onClick: enterShow,
              disabled: !venueOk,
              disabledReason: gateMessage ?? undefined,
            }]}
          />
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
      <SceneBeatSlot beat={locationSceneBeat(state)} />
      <Text size="sm" c="dimmed">
        {state.turnsUntilShow > 0
          ? 'Each move burns a turn.'
          : 'Out of turns — head to venue gates or into the show.'}
      </Text>
      {locationActions.length > 0 && (
        <Stack gap="xs">
          <Text fw={500} size="sm">Things to do</Text>
          {locationActions.map((action) => {
            const used = action.once && state.usedLocationActions.includes(action.id)
            const disabled = used || !canAffordAction(action, state.resources)
            return (
              <Button
                key={action.id}
                color="yellow"
                variant="light"
                disabled={disabled}
                onClick={() => performLocationAction(action.id)}
                title={used ? 'Already done here' : undefined}
              >
                {action.label}{used ? ' ✓' : ''}
              </Button>
            )
          })}
        </Stack>
      )}
      <LocationNav
        current={loc}
        turnsUntilShow={state.turnsUntilShow}
        onGo={goToLocation}
        primaryActions={[{
          label: state.turnsUntilShow > 0 ? 'Venue gates' : 'Showtime — venue gates',
          onClick: goToVenueGates,
          disabled: !venueOk,
          disabledReason: gateMessage ?? undefined,
        }]}
      />
      {loc === 'hotel' && (
        <Button
          onClick={hotelCrash}
          disabled={
            state.turnsUntilShow <= 0 || state.resources.cash < RESOURCE_BALANCE.hotelCrashCost
          }
        >
          Book a room (${RESOURCE_BALANCE.hotelCrashCost}) — full crew reset
        </Button>
      )}
      {loc === 'friends_house' && (
        <Button
          variant="light"
          onClick={friendsCrash}
          disabled={
            state.turnsUntilShow <= 0 ||
            state.resources.cash < RESOURCE_BALANCE.friendsCrashCost
          }
        >
          Crash on the couch (${RESOURCE_BALANCE.friendsCrashCost}) — half reset, wook flu stays
        </Button>
      )}
    </Stack>
  )
}
