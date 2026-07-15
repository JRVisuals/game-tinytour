import { Paper, Stack, Text } from '@mantine/core'

interface TabPanelHeaderProps {
  title: string
  blurb: string
}

export function TabPanelHeader({ title, blurb }: TabPanelHeaderProps) {
  return (
    <Paper withBorder p="sm" className="solid-panel tab-panel-header">
      <Stack gap={4}>
        <Text
          size="sm"
          fw={700}
          c="teal.3"
          tt="uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {title}
        </Text>
        <Text size="sm" c="gray.1" lh={1.45}>
          {blurb}
        </Text>
      </Stack>
    </Paper>
  )
}
