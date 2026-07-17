import { Paper } from '@mantine/core'
import { PhaseRouter } from '../PhaseRouter'
import { ScreenFrame } from '../ScreenFrame'

export function SceneTab() {
  return (
    <Paper withBorder p="lg" radius="md">
      <ScreenFrame compactArt>
        <PhaseRouter />
      </ScreenFrame>
    </Paper>
  )
}
