import { Text } from '@mantine/core'
import { VERSION } from '../version'

export function VersionBadge() {
  return (
    <Text
      size="xs"
      fw={600}
      className="version-badge"
    >
      v{VERSION}
    </Text>
  )
}
