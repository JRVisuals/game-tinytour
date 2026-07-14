import { Button, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function TourStartScreen() {
  const { state, startTour, setPhase } = useGame()

  return (
    <Stack>
      <Title order={2}>Go on tour</Title>
      <Text>
        Heading out from <strong>{state.homeCity}</strong>
        {state.favoriteBandHint ? ` chasing “${state.favoriteBandHint}”` : ''}.
        The generator will invent a band and a five-stop run.
      </Text>
      <Button onClick={startTour}>Generate tour & travel</Button>
      <Button variant="default" onClick={() => setPhase('crew_create')}>
        Back to crew
      </Button>
    </Stack>
  )
}
