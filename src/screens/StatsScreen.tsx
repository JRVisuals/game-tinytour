import { Button, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'
import type { RunStats } from '../game/types'
import { STAT_LABELS } from '../game/types'

function StatBlock({ title, stats }: { title: string; stats: RunStats }) {
  return (
    <Stack gap="xs">
      <Text fw={600}>{title}</Text>
      <SimpleGrid cols={2} spacing="xs">
        {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
          <Text key={key} size="sm">
            {STAT_LABELS[key]}: {stats[key] ?? 0}
          </Text>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

export function StatsScreen() {
  const { state, goToTitle } = useGame()
  const inRun = state.tour !== null

  return (
    <Stack>
      <Title order={2}>Stats</Title>
      <StatBlock title="Lifetime" stats={state.lifetimeStats} />
      {inRun && <StatBlock title="This run" stats={state.runStats} />}
      <Text size="sm" c="dimmed">
        Runs completed: {state.lifetimeStats.runsCompleted} · Day jobs taken:{' '}
        {state.lifetimeStats.dayJobsTaken}
      </Text>
      <Button variant="default" onClick={goToTitle}>
        Back to title
      </Button>
    </Stack>
  )
}
