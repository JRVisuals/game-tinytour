import { Button, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'
import { STAT_LABELS } from '../game/types'

export function DayJobScreen() {
  const { state, finishRunRecap } = useGame()

  return (
    <Stack>
      <Title order={2}>Day job</Title>
      <Text>{state.runRecapMessage}</Text>
      <Text c="dimmed">
        The tour can wait. For now: nametags, a time clock, and a break room that smells like
        burnt coffee. You’ll be back on the lot someday.
      </Text>
      <Text fw={500}>Run stats (before the desk job)</Text>
      <SimpleGrid cols={2}>
        {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
          <Text key={key} size="sm">
            {STAT_LABELS[key]}: {state.runStats[key]}
          </Text>
        ))}
      </SimpleGrid>
      <Button onClick={finishRunRecap}>Back to title</Button>
    </Stack>
  )
}
