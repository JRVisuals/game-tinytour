import { Stack } from '@mantine/core'
import { BackToSceneButton } from '../BackToSceneButton'
import { TabPanelHeader } from '../TabPanelHeader'
import { CrewMeterPanel } from '../CrewMeterPanel'
import { crewContextBlurb } from '../../game/crew/tab'
import { useGame } from '../../game/GameContext'

interface CrewTabProps {
  onBackToScene: () => void
}

export function CrewTab({ onBackToScene }: CrewTabProps) {
  const { state } = useGame()

  return (
    <Stack gap="sm">
      <TabPanelHeader title="Crew" blurb={crewContextBlurb(state)} />
      <CrewMeterPanel />
      <BackToSceneButton onBackToScene={onBackToScene} />
    </Stack>
  )
}
