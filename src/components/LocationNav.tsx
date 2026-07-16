import { Button, Group, Stack, Text } from '@mantine/core'
import { LOT_DESTINATIONS } from '../game/marketCache'
import type { LocationId } from '../game/types'

export interface PrimaryNavAction {
  label: string
  onClick: () => void
  disabled?: boolean
  disabledReason?: string
}

export function LocationNav({
  current,
  turnsUntilShow,
  onGo,
  exclude,
  primaryActions,
}: {
  current: LocationId
  turnsUntilShow: number
  onGo: (location: LocationId) => void
  exclude?: LocationId[]
  primaryActions?: PrimaryNavAction[]
}) {
  const hidden = new Set([current, ...(exclude ?? [])])
  const regularDests = LOT_DESTINATIONS.filter((d) => !hidden.has(d.id))

  return (
    <Stack gap="xs">
      <Text fw={500}>Where to?</Text>
      <Group>
        {primaryActions?.map((action) => (
          <Button
            key={action.label}
            color="teal"
            className={!action.disabled ? 'title-start-btn' : undefined}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
        {regularDests.map((d) => (
          <Button
            key={d.id}
            variant="light"
            onClick={() => onGo(d.id)}
            disabled={turnsUntilShow <= 0}
          >
            {d.label}
          </Button>
        ))}
      </Group>
      {primaryActions?.map(
        (a) =>
          a.disabled && a.disabledReason && (
            <Text key={a.label} size="sm" c="red">
              {a.disabledReason}
            </Text>
          ),
      )}
    </Stack>
  )
}
