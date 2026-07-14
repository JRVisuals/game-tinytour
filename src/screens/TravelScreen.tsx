import { Button, List, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function TravelScreen() {
  const { state, arriveAtShakedown } = useGame()
  const tour = state.tour
  const stop = tour?.stops[tour.currentStopIndex]

  if (!tour || !stop) {
    return (
      <Stack>
        <Title order={2}>Travel</Title>
        <Text>No tour loaded.</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={2}>Travel</Title>
      <Text>
        Following <strong>{tour.band.name}</strong> ({tour.band.homeScene}).
      </Text>
      <Text>
        Leg to <strong>{stop.city}</strong> — {stop.dayLabel} @ {stop.venue}
      </Text>
      <Text size="sm" c="dimmed">
        Stub travel beat: gas burns later, hitch events later, pickup crew later.
      </Text>
      <List size="sm">
        {tour.stops.map((s, i) => (
          <List.Item key={`${s.city}-${i}`}>
            {i === tour.currentStopIndex ? '→ ' : ''}
            {s.dayLabel}: {s.city} ({s.venue})
          </List.Item>
        ))}
      </List>
      <Button onClick={arriveAtShakedown}>Arrive on shakedown</Button>
    </Stack>
  )
}
