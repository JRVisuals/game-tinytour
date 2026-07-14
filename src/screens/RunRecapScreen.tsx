import { Button, List, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { TourStoryPanel } from '../components/TourStoryPanel'
import { crewRepLabel } from '../game/crew/repTitles'
import { useGame } from '../game/GameContext'
import { STAT_LABELS } from '../game/types'

export function RunRecapScreen() {
  const { state, finishRunRecap } = useGame()

  return (
    <Stack>
      <Title order={2}>
        {state.runRecapMessage.toLowerCase().includes('bailed') ||
        state.runRecapMessage.toLowerCase().includes('shuffled')
          ? 'Tour over'
          : 'Run recap'}
      </Title>
      <Text>{state.runRecapMessage}</Text>
      {state.savedCrew && (
        <Text size="sm" c="teal">
          Banked ${state.savedCrew.bank} · Crew rep {crewRepLabel(state.savedCrew.rep)}
        </Text>
      )}
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
