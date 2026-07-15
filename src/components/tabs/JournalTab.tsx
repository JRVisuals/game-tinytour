import { Stack } from '@mantine/core'
import { TabPanelHeader } from '../TabPanelHeader'
import { TourStoryPanel } from '../TourStoryPanel'

export function JournalTab() {
  return (
    <Stack gap="sm">
      <TabPanelHeader
        title="Journal"
        blurb="The road so far — copy and share when the run ends."
      />
      <TourStoryPanel embedded />
    </Stack>
  )
}
