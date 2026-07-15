import { Stack } from '@mantine/core'
import { TabPanelHeader } from '../TabPanelHeader'
import { CrewMeterPanel } from '../CrewMeterPanel'
import { crewContextBlurb } from '../../game/crew/tab'
import { useGame } from '../../game/GameContext'

export function CrewTab() {
  const { state } = useGame()

  return (
    <Stack gap="sm">
      <TabPanelHeader title="Crew" blurb={crewContextBlurb(state)} />
      <CrewMeterPanel />
    </Stack>
  )
}
