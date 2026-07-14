import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { MarketPanel } from '../components/MarketPanel'
import { SongCatalogPanel } from '../components/SongCatalogPanel'
import { useGame } from '../game/GameContext'
import type { LocationId } from '../game/types'

const DESTINATIONS: { id: LocationId; label: string }[] = [
  { id: 'park', label: 'Park' },
  { id: 'venue', label: 'Venue gates' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'friends_house', label: "Friend's house" },
]

export function ShakedownScreen() {
  const { state, goToLocation, enterShow, adjustResources } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]

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
            size="xs"
            variant="light"
            onClick={() =>
              adjustResources({
                hasVehicle: true,
                gas: 8,
                cash: Math.max(0, state.resources.cash - 80),
              })
            }
          >
            Score a beater (-$80)
          </Button>
        </Group>
      )}
      <Text fw={500}>Where to?</Text>
      <Group>
        {DESTINATIONS.map((d) => (
          <Button
            key={d.id}
            variant="default"
            onClick={() => goToLocation(d.id)}
            disabled={state.turnsUntilShow <= 0}
          >
            {d.label}
          </Button>
        ))}
      </Group>
      <Button color="grape" onClick={enterShow}>
        {state.turnsUntilShow > 0 ? 'Head to show early' : 'Showtime'}
      </Button>
      {state.currentMarket && (
        <MarketPanel
          prices={state.currentMarket}
          contextLabel="shakedown"
          showTickets
        />
      )}
      <SongCatalogPanel />
    </Stack>
  )
}
