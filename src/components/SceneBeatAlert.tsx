import { Alert, Stack, Text } from '@mantine/core'

interface SceneBeatAlertProps {
  title: string
  body: string
  color?: string
  loot?: string
}

export function SceneBeatAlert({ title, body, color = 'teal', loot }: SceneBeatAlertProps) {
  return (
    <Alert color={color} title={title} variant="light">
      <Stack gap={6}>
        <Text size="sm">{body}</Text>
        {loot && (
          <Text size="sm" fw={700} c="yellow.4">
            {loot}
          </Text>
        )}
      </Stack>
    </Alert>
  )
}
