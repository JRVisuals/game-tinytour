import { Button, Stack, Text } from '@mantine/core'
import { ArtSlot } from '../components/ArtSlot'
import { AsciiTitleLogo } from '../components/AsciiTitleLogo'
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
      <Button size="md" variant="light" color="gray" onClick={() => goToCrew(false)}>
        CHECK CREW
      </Button>
      <Button size="md" variant="light" color="gray" onClick={goToStats}>
        PEEP STATS
      </Button>
      <Button size="md" color="teal" className="title-start-btn" onClick={requestStartRun}>
        LET'S TOUR
      </Button>
    </Stack>
  )
}
