import { Button, Group, Text } from '@mantine/core'
import { LOT_DESTINATIONS } from '../game/marketCache'
import type { LocationId } from '../game/types'

export function LocationNav({
  current,
  turnsUntilShow,
  onGo,
  exclude,
}: {
  current: LocationId
  turnsUntilShow: number
  onGo: (location: LocationId) => void
  exclude?: LocationId[]
}) {
  const hidden = new Set([current, ...(exclude ?? [])])

  return (
    <>
      <Text fw={500}>Where to?</Text>
      <Group>
        {LOT_DESTINATIONS.filter((d) => !hidden.has(d.id)).map((d) => (
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
    </>
  )
}
