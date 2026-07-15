import { Alert, Button, Paper, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function PostShowShakedownScreen() {
  const { state, prepNextLeg } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const event = state.postShowShakedownEvent

  return (
    <Stack>
      <Title order={2}>After-show shakedown</Title>
      <Text>
        The lot's still humming outside <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. One more hustle before the next leg.
      </Text>

      {event && (
        <Paper withBorder p="sm" bg="rgba(0,80,70,0.12)">
          <Text fw={600} mb={4}>
            {event.title}
          </Text>
          <Text size="sm">{event.body}</Text>
        </Paper>
      )}

      {!event && (
        <Alert color="teal" title="Quiet lot">
          Vendors packing, stragglers humming. Nothing wild — just space to trade.
        </Alert>
      )}

      {state.currentMarket && (
        <Text size="xs" c="dimmed" ta="center">
          After-show vendors — open Crew → Hustle (balloons too).
        </Text>
      )}

      <Button color="teal" onClick={prepNextLeg}>
        Hit the road
      </Button>
    </Stack>
  )
}
