import { Button, List, SimpleGrid, Stack, Text } from '@mantine/core'
import { TabPanelHeader } from '../components/TabPanelHeader'
import { TourStoryPanel } from '../components/TourStoryPanel'
import { crewRepLabel } from '../game/crew/repTitles'
import { useGame } from '../game/GameContext'
import { STAT_LABELS } from '../game/types'

export function RunRecapScreen() {
  const { state, finishRunRecap } = useGame()
  const isOver =
    state.runRecapMessage.toLowerCase().includes('bailed') ||
    state.runRecapMessage.toLowerCase().includes('shuffled')
  const blurb = state.savedCrew
    ? `Banked $${state.savedCrew.bank} · ${crewRepLabel(state.savedCrew.rep)}`
    : undefined

  return (
    <Stack>
      <TabPanelHeader title={isOver ? 'Tour over' : 'Run recap'} blurb={blurb} />
      <Text>{state.runRecapMessage}</Text>
      <Text fw={500}>This run</Text>
      <SimpleGrid cols={2}>
        {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
          <Text key={key} size="sm">
            {STAT_LABELS[key]}: {state.runStats[key]}
          </Text>
        ))}
      </SimpleGrid>
      {state.lastSetlist && (
        <>
          <Text fw={500}>Last setlist heard</Text>
          <List size="sm">
            {state.lastSetlist.songs.slice(0, 5).map((song) => (
              <List.Item key={song}>{song}</List.Item>
            ))}
          </List>
        </>
      )}
      <TourStoryPanel />
      <Button onClick={finishRunRecap}>Back to title</Button>
    </Stack>
  )
}
