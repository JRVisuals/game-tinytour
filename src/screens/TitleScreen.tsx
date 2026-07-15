import { Button, Stack, Text, Title } from '@mantine/core'
import { ArtSlot } from '../components/ArtSlot'
import { resolveArtSceneById } from '../game/art/scenes'
import { useGame } from '../game/GameContext'

const titleLogo = resolveArtSceneById('title-logo')
const titleScene = resolveArtSceneById('title')

export function TitleScreen() {
  const { goToCrew, goToStats, requestStartRun } = useGame()

  return (
    <Stack gap="md">
      <ArtSlot
        label={titleLogo.label}
        assetHint={titleLogo.hint}
        src={titleLogo.src}
        alt="Little Jam Band Tour"
        minHeight={titleLogo.height}
        compact
      />
      <Title order={1} ta="center">
        Little Jam Band Tour
      </Title>
      <Text ta="center" c="dimmed">
        Follow the band. Hustle the lot. Make the show.
      </Text>
      <ArtSlot
        label={titleScene.label}
        assetHint={titleScene.hint}
        src={titleScene.src}
        alt={titleScene.label}
        minHeight={titleScene.height}
      />
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
