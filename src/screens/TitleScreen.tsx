import { Button, Stack, Text } from '@mantine/core'
import { AsciiTitleLogo } from '../components/AsciiTitleLogo'
import { ArtSlot } from '../components/ArtSlot'
import { resolveArtSceneById } from '../game/art/scenes'
import { useGame } from '../game/GameContext'

const titleScene = resolveArtSceneById('title')

export function TitleScreen() {
  const { goToCrew, goToStats, requestStartRun } = useGame()

  return (
    <Stack gap="md">
      <AsciiTitleLogo />
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
