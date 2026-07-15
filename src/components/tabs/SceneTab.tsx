import { Paper, Stack } from '@mantine/core'
import { SceneCrewNudge } from '../SceneCrewNudge'
import { TabPanelHeader } from '../TabPanelHeader'
import { PhaseRouter } from '../PhaseRouter'
import { ScreenFrame } from '../ScreenFrame'
import { sceneContextBlurb } from '../../game/scene/tab'
import { useGame } from '../../game/GameContext'

export function SceneTab() {
  const { state } = useGame()

  return (
    <Stack gap="sm">
      <TabPanelHeader title="Scene" blurb={sceneContextBlurb(state)} />
      <SceneCrewNudge />
      <Paper withBorder p="lg" radius="md">
        <ScreenFrame compactArt>
          <PhaseRouter />
        </ScreenFrame>
      </Paper>
    </Stack>
  )
}
