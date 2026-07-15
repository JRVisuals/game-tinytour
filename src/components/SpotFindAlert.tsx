import { Paper, Text } from '@mantine/core'

interface SpotFindAlertProps {
  title: string
  body: string
}

export function SpotFindAlert({ title, body }: SpotFindAlertProps) {
  return (
    <Paper withBorder p="sm" bg="rgba(40,120,60,0.12)">
      <Text fw={600} mb={4}>
        {title}
      </Text>
      <Text size="sm">{body}</Text>
    </Paper>
  )
}
