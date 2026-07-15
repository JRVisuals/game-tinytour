import { SimpleGrid, Text } from '@mantine/core'
import type { RunStats } from '../game/types'
import { STAT_LABELS } from '../game/types'

export function RunStatsGrid({ stats }: { stats: RunStats }) {
  return (
    <SimpleGrid cols={2} spacing="xs">
      {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
        <Text key={key} size="sm">
          {STAT_LABELS[key]}: {stats[key] ?? 0}
        </Text>
      ))}
    </SimpleGrid>
  )
}
