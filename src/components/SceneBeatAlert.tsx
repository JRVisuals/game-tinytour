import { Alert } from '@mantine/core'

interface SceneBeatAlertProps {
  title: string
  body: string
  color?: string
}

export function SceneBeatAlert({ title, body, color = 'teal' }: SceneBeatAlertProps) {
  return (
    <Alert color={color} title={title} variant="light">
      {body}
    </Alert>
  )
}
