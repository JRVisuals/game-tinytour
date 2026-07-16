import { Paper, Stack } from '@mantine/core'
import { BackToSceneButton } from '../BackToSceneButton'
import { RunStatsGrid } from '../RunStatsGrid'
import { TabPanelHeader } from '../TabPanelHeader'
import { TourStoryPanel } from '../TourStoryPanel'
import { useGame } from '../../game/GameContext'

interface JournalTabProps {
  onBackToScene: () => void
}

export function JournalTab({ onBackToScene }: JournalTabProps) {
  const { state } = useGame()
  const inRun = state.tour != null

  return (
    <Stack gap="sm">
      <TabPanelHeader
        title="Journal"
        blurb="The road so far — copy and share when the run ends."
      />

      <TourStoryPanel embedded />

      {inRun && (
        <>
          <TabPanelHeader
            title="Stats"
            blurb="This run — venues, miles, consumables, bets."
          />
          <Paper withBorder p="sm" className="solid-panel">
            <RunStatsGrid stats={state.runStats} />
          </Paper>
        </>
      )}

      <BackToSceneButton onBackToScene={onBackToScene} />
    </Stack>
  )
}
