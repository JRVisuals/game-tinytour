import { Button, Stack, Text, Title } from '@mantine/core'
import { ArtPanel } from '../components/ArtPanel'
import { AsciiTitle, TITLE_ASCII } from '../components/AsciiTitle'
import { useGame } from '../game/GameContext'

export function TitleScreen() {
  const { goToCrew, goToStats, requestStartRun } = useGame()

  return (
    <Stack gap="md">
      <AsciiTitle text={TITLE_ASCII} />
      <ArtPanel />
      <Title order={2} ta="center">
        Little Jam Band Tour
      </Title>
      <Text ta="center" c="dimmed">
        Follow the band. Hustle the lot. Make the show.
      </Text>
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
