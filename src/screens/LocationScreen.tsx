import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'
import type { LocationId } from '../game/types'

const LOCATION_COPY: Record<Exclude<LocationId, 'shakedown'>, string> = {
  park: 'Blankets, hacky, soft trades. Food and beer move easy here.',
  venue: 'Box office tension. Tickets if you have cash. Security eye contact.',
  hotel: 'Showers and a safe fridge — if you booked a room (stub: pay cash).',
  friends_house: 'Couch courtesy. Maybe a crash pad and a little stash help.',
}

export function LocationScreen() {
  const { state, returnToShakedown, adjustResources, enterShow } = useGame()
  const loc = state.currentLocation

  if (loc === 'shakedown') {
    return null
  }

  const buyTicket = () => {
    if (state.resources.cash < 40) return
    adjustResources({
      cash: state.resources.cash - 40,
      tickets: state.resources.tickets + 1,
    })
  }

  const buyFood = () => {
    if (state.resources.cash < 8) return
    adjustResources({
      cash: state.resources.cash - 8,
      food: state.resources.food + 1,
    })
  }

  const buyBeer = () => {
    if (state.resources.cash < 6) return
    adjustResources({
      cash: state.resources.cash - 6,
      beer: state.resources.beer + 1,
    })
  }

  return (
    <Stack>
      <Title order={2}>{loc.split('_').join(' ')}</Title>
      <Text>{LOCATION_COPY[loc]}</Text>
      <Text size="sm" c="dimmed">
        Turns left before show: {state.turnsUntilShow}
      </Text>
      <Group>
        {loc === 'venue' && (
          <Button onClick={buyTicket} disabled={state.resources.cash < 40}>
            Buy ticket ($40)
          </Button>
        )}
        {(loc === 'park' || loc === 'friends_house') && (
          <>
            <Button onClick={buyFood} disabled={state.resources.cash < 8}>
              Food ($8)
            </Button>
            <Button onClick={buyBeer} disabled={state.resources.cash < 6}>
              Beer ($6)
            </Button>
          </>
        )}
        {loc === 'hotel' && (
          <Button
            onClick={() =>
              adjustResources({
                cash: Math.max(0, state.resources.cash - 60),
              })
            }
            disabled={state.resources.cash < 60}
          >
            Crash ($60) — stub
          </Button>
        )}
      </Group>
      <Group>
        <Button variant="default" onClick={returnToShakedown}>
          Back to shakedown
        </Button>
        {state.turnsUntilShow <= 0 && (
          <Button color="grape" onClick={enterShow}>
            Showtime
          </Button>
        )}
      </Group>
    </Stack>
  )
}
