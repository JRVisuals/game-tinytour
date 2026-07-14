import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import {
  HEALTH_LABEL,
  HUNGER_LABEL,
  THIRST_LABEL,
  VIBE_LABEL,
  activeCrew,
} from '../game/crew/meters'
import { useGame } from '../game/GameContext'

export function CrewMeterPanel() {
  const { state } = useGame()
  const crew = state.crew

  return (
    <Paper withBorder p="sm" mb="md">
      <Text fw={600} mb="xs">
        Crew ({activeCrew(crew).length}/{crew.length} active)
      </Text>
      <Stack gap="sm">
        {crew.map((m) => (
          <Stack key={m.id} gap={4}>
            <Text size="sm" fw={500} c={m.bailed ? 'dimmed' : undefined}>
              {m.name}
              {m.bailed && ' — bailed'}
            </Text>
            {!m.bailed && (
              <Group gap={6}>
                <Badge size="xs" variant="outline">
                  {HUNGER_LABEL[m.hunger]}
                </Badge>
                <Badge size="xs" variant="outline">
                  {THIRST_LABEL[m.thirst]}
                </Badge>
                <Badge size="xs" variant="outline" color={m.health === 'wook_flu' ? 'red' : undefined}>
                  {HEALTH_LABEL[m.health]}
                </Badge>
                <Badge size="xs" variant="outline" color={m.vibe === 'low' ? 'orange' : undefined}>
                  {VIBE_LABEL[m.vibe]}
                </Badge>
                {m.roughTurns > 0 && (
                  <Badge size="xs" color="red" variant="light">
                    rough {m.roughTurns}/3
                  </Badge>
                )}
              </Group>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
