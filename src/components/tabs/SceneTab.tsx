import { Paper } from '@mantine/core'
import { useGame } from '../../game/GameContext'
import { playLocationLabel } from '../../game/scene/labels'
import { PhaseRouter } from '../PhaseRouter'
import { ScreenFrame } from '../ScreenFrame'

export function SceneTab() {
  const { state } = useGame()
  const title = playLocationLabel(state)

  return (
    <Paper withBorder p="lg" radius="md">
      <ScreenFrame title={title} compactArt>
        <PhaseRouter />
      </ScreenFrame>
    </Paper>
  )
}
