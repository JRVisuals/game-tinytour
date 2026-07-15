import { Alert, Button, Stack, Text, Title } from '@mantine/core'
import { SceneBeatAlert } from '../components/SceneBeatAlert'
import { TabHintButton } from '../components/TabHintButton'
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

      {event && <SceneBeatAlert title={event.title} body={event.body} />}

      {!event && (
        <Alert color="teal" title="Quiet lot">
          Vendors packing, stragglers humming. Nothing wild — just space to trade.
        </Alert>
      )}

      {state.currentMarket && (
        <TabHintButton tab="hustle">After-show vendors — Hustle</TabHintButton>
      )}

      <Button color="teal" onClick={prepNextLeg}>
        Hit the road
      </Button>
    </Stack>
  )
}
