import { Text } from '@mantine/core'
import { VERSION } from '../version'

export function VersionBadge() {
  return (
    <Text size="xs" c="dimmed" style={{ position: 'fixed', bottom: 'max(8px, env(safe-area-inset-bottom))', right: 12 }}>
      v{VERSION}
    </Text>
  )
}
