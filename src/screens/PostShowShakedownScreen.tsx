import { Button, Stack, Text } from '@mantine/core'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { useGame } from '../game/GameContext'
import { postShowShakedownSceneBeat } from '../game/scene/beat'

export function PostShowShakedownScreen() {
  const { state, prepNextLeg } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const event = state.postShowShakedownEvent

  return (
    <Stack>
      <Text>
        The lot's still humming outside <strong>{stop?.venue ?? 'the venue'}</strong> in{' '}
        {stop?.city ?? '…'}. One more hustle before the next leg.
      </Text>

      <SceneBeatSlot beat={postShowShakedownSceneBeat(event)} />

      <Button color="teal" onClick={prepNextLeg}>
        Hit the road
      </Button>
    </Stack>
  )
}
