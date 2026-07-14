import { Button, Stack, Text, Title } from '@mantine/core'
import { ArtSlot } from '../components/ArtSlot'
import { useGame } from '../game/GameContext'

export function TitleScreen() {
  const { goToCrew, goToStats, requestStartRun } = useGame()

  return (
    <Stack gap="md">
      <ArtSlot label="Logo" assetHint="public/logo.png" minHeight={80} />
      <Title order={1} ta="center">
        Little Jam Band Tour
      </Title>
      <Text ta="center" c="dimmed">
        Follow the band. Hustle the lot. Make the show.
      </Text>
      <ArtSlot label="Scene art" assetHint="public/title-scene.png" minHeight={140} />
      <Button size="md" onClick={() => goToCrew(false)}>
        Crew
      </Button>
      <Button size="md" variant="default" onClick={goToStats}>
        Stats
      </Button>
      <Button size="md" color="teal" onClick={requestStartRun}>
        Get this show on the road
      </Button>
    </Stack>
  )
}
