import { Stack, Text } from '@mantine/core'
import { TourStoryPanel } from '../TourStoryPanel'

export function JournalTab() {
  return (
    <Stack gap="sm">
      <Text size="sm" fw={600}>
        Tour journal
      </Text>
      <Text size="xs" c="dimmed">
        The road so far — copy and share when the run ends.
      </Text>
      <TourStoryPanel embedded />
    </Stack>
  )
}
