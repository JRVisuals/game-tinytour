import { Paper, Stack } from '@mantine/core'
import { TabPanelHeader } from '../TabPanelHeader'
import { PhaseRouter } from '../PhaseRouter'
import { ScreenFrame } from '../ScreenFrame'
import { sceneContextBlurb } from '../../game/scene/tab'
import { sceneTabTitle } from '../../game/scene/labels'
import { useGame } from '../../game/GameContext'

export function SceneTab() {
  const { state } = useGame()

  return (
    <Stack gap="sm">
      <TabPanelHeader title={sceneTabTitle(state)} blurb={sceneContextBlurb(state)} />
      <Paper withBorder p="lg" radius="md">
        <ScreenFrame compactArt>
          <PhaseRouter />
        </ScreenFrame>
      </Paper>
    </Stack>
  )
}
