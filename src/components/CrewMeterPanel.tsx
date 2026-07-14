import { Alert, Button, Group, Paper, Progress, Stack, Text } from '@mantine/core'
import {
  BAIL_ROUGH_THRESHOLD,
  ROUGH_THRESHOLD,
  STONED_WASTED_THRESHOLD,
  activeCrew,
  healthLabel,
  hungerLabel,
  meterBarColor,
  meterNeedBarColor,
  needBarValue,
  stonedBarColor,
  stonedLabel,
  thirstLabel,
  vibeLabel,
} from '../game/crew/meters'
import { useGame } from '../game/GameContext'

function MeterRow({ label, value, valueLabel, color }: {
  label: string
  value: number
  valueLabel: string
  color?: string
}) {
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="xs" fw={500}>
          {valueLabel}
        </Text>
      </Group>
      <Progress value={value} size="sm" color={color ?? meterBarColor(value)} />
    </Stack>
  )
}

function StonedMeterRow({ value, valueLabel }: { value: number; valueLabel: string }) {
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          Stoned
        </Text>
        <Text size="xs" fw={500} c={value >= STONED_WASTED_THRESHOLD ? 'red' : undefined}>
          {valueLabel}
        </Text>
      </Group>
      <Progress value={value} size="sm" color={stonedBarColor(value)} />
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          Sober
        </Text>
        <Text size="xs" c="dimmed">
          Wasted
        </Text>
      </Group>
    </Stack>
  )
}

/** Full on the left, empty/starving on the right — fill shows unmet need */
function NeedMeterRow({
  label,
  satisfaction,
  valueLabel,
  leftLabel,
  rightLabel,
}: {
  label: string
  satisfaction: number
  valueLabel: string
  leftLabel: string
  rightLabel: string
}) {
  const need = needBarValue(satisfaction)
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="xs" fw={500}>
          {valueLabel}
        </Text>
      </Group>
      <Progress value={need} size="sm" color={meterNeedBarColor(need)} />
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed">
          {leftLabel}
        </Text>
        <Text size="xs" c="dimmed">
          {rightLabel}
        </Text>
      </Group>
    </Stack>
  )
}

export function CrewMeterPanel() {
  const { state, crewConsume } = useGame()
  const crew = state.crew
  const active = activeCrew(crew)
  const canCare = !!state.tour
  const { food, beer, drugs } = state.resources

  return (
    <Paper withBorder p="sm">
      {state.crewAlert && (
        <Alert color="orange" mb="sm" title="Crew">
          {state.crewAlert}
        </Alert>
      )}
      <Text fw={600} mb="sm">
        Crew ({active.length}/{crew.length} active)
      </Text>
      <Stack gap="md">
        {crew.map((m) => {
          const memberActive = !m.bailed
          return (
            <Stack key={m.id} gap={6}>
              <Group justify="space-between" gap="xs" align="flex-start">
                <Text size="sm" fw={500} c={m.bailed ? 'dimmed' : undefined}>
                  {m.name}
                  {m.bailed && ' — bailed'}
                </Text>
                {memberActive && m.roughTurns >= 2 && m.roughTurns < BAIL_ROUGH_THRESHOLD && (
                  <Text size="xs" c="red">
                    bail in {BAIL_ROUGH_THRESHOLD - m.roughTurns} turn
                    {BAIL_ROUGH_THRESHOLD - m.roughTurns === 1 ? '' : 's'}
                  </Text>
                )}
              </Group>
              {memberActive && (
                <>
                  <Group gap={4} grow>
                    <Button
                      size="xs"
                      variant="light"
                      disabled={!canCare || food <= 0}
                      onClick={() => crewConsume(m.id, 'eat')}
                    >
                      Eat
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      disabled={!canCare || beer <= 0}
                      onClick={() => crewConsume(m.id, 'drink')}
                    >
                      Drink
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="grape"
                      disabled={!canCare || drugs <= 0}
                      onClick={() => crewConsume(m.id, 'substances')}
                    >
                      Consume
                    </Button>
                  </Group>
                  <Stack gap={6}>
                    <NeedMeterRow
                      label="Hunger"
                      satisfaction={m.hunger}
                      valueLabel={hungerLabel(m.hunger)}
                      leftLabel="Full"
                      rightLabel="Starving"
                    />
                    <NeedMeterRow
                      label="Thirst"
                      satisfaction={m.thirst}
                      valueLabel={thirstLabel(m.thirst)}
                      leftLabel="Hydrated"
                      rightLabel="Parched"
                    />
                    <MeterRow label="Health" value={m.health} valueLabel={healthLabel(m.health)} />
                    <MeterRow label="Vibe" value={m.vibe} valueLabel={vibeLabel(m.vibe)} />
                    <StonedMeterRow value={m.stoned} valueLabel={stonedLabel(m.stoned)} />
                    {m.stoned >= STONED_WASTED_THRESHOLD && (
                      <Text size="xs" c="red">
                        Too wasted to drive — cops will not be chill
                      </Text>
                    )}
                    {(m.hunger < ROUGH_THRESHOLD ||
                      m.thirst < ROUGH_THRESHOLD ||
                      m.health < ROUGH_THRESHOLD ||
                      m.vibe < ROUGH_THRESHOLD) && (
                      <Text size="xs" c="orange">
                        Danger zone — feed, hydrate, or rest
                      </Text>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          )
        })}
      </Stack>
    </Paper>
  )
}
