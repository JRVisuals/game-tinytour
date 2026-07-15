import { Text } from '@mantine/core'
import { VERSION } from '../version'

export function VersionBadge() {
  return (
    <Text
      size="xs"
      fw={600}
      style={{
        position: 'fixed',
        bottom: 'max(8px, env(safe-area-inset-bottom))',
        right: 12,
        color: '#1b4332',
      }}
    >
      v{VERSION}
    </Text>
  )
}
