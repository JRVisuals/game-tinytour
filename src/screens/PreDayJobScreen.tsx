import { Paper, Stack, Text } from '@mantine/core'
import { TabPanelHeader } from '../components/TabPanelHeader'
import { useGame } from '../game/GameContext'

export function PreDayJobScreen() {
  const { state } = useGame()
  const reason = state.dayJobReason ?? state.runRecapMessage

  return (
    <Stack gap="md">
      <TabPanelHeader title="Tour over" />

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text fw={600} size="sm" c="red.4" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            That's a wrap
          </Text>
          <Text style={{ lineHeight: 1.6 }}>{reason}</Text>
          <Text size="sm" c="dimmed" fs="italic">
            The road will keep going. You can grab a day-job stipend, reset your crew, or head
            back to the title to start fresh.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  )
}
