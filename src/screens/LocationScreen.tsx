import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { MarketPanel } from '../components/MarketPanel'
import { useGame } from '../game/GameContext'
import type { LocationId } from '../game/types'

const LOCATION_COPY: Record<Exclude<LocationId, 'shakedown'>, string> = {
  park: 'Blankets, hacky, soft trades. Food and beer move easy here.',
  venue: 'Box office tension. Tickets if you have cash. Security eye contact.',
  hotel: 'Showers and a safe fridge — if you booked a room (stub: pay cash).',
  friends_house: 'Couch courtesy. Maybe a crash pad and a little stash help.',
}

export function LocationScreen() {
  const { state, returnToShakedown, enterShow, adjustResources } = useGame()
  const loc = state.currentLocation
  const prices = state.currentMarket

  if (loc === 'shakedown') {
    return null
  }

  return (
    <Stack>
      <Title order={2}>{loc.split('_').join(' ')}</Title>
      <Text>{LOCATION_COPY[loc]}</Text>
      <Text size="sm" c="dimmed">
        Turns left before show: {state.turnsUntilShow}
      </Text>
      {prices && (
        <MarketPanel
          prices={prices}
          contextLabel={state.marketContext ?? loc}
          showTickets={loc === 'venue'}
        />
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
