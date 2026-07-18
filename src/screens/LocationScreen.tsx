import { Stack, Text } from '@mantine/core'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { COPY } from '../game/config'
import { useGame } from '../game/GameContext'
import { pickLocationAction } from '../game/location/locationEvents'
import { showtimeTurnsLabel } from '../game/showtime'
import { locationSceneBeat } from '../game/scene/beat'

export function LocationScreen() {
  const { state } = useGame()
  const loc = state.currentLocation
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const locationAction = pickLocationAction(loc, state.usedLocationActions, state.rngSeed)

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
        {state.turnsUntilShow > 0 && (
          <Text size="sm" c="dimmed">
            Still time on the lot — head back if you need supplies.
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
      <SceneBeatSlot beat={locationSceneBeat(state)} />
      <Text size="sm" c="dimmed">
        {state.turnsUntilShow > 0
          ? 'Each move burns a turn.'
          : 'Out of turns — head back to shakedown then to venue gates.'}
      </Text>
      {locationAction?.flavorHint && (
        <Text size="sm" c="yellow.4">{locationAction.flavorHint}</Text>
      )}
    </Stack>
  )
}
