import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
} from '@mantine/core'
import {
  BAIL_ROUGH_THRESHOLD,
  ROUGH_THRESHOLD,
  STONED_WASTED_THRESHOLD,
  crewStatusBadgeColor,
  crewStatusChip,
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
import type { CrewMember } from '../game/types'
import { useGame } from '../game/GameContext'
import { CrewSticker } from './CrewSticker'

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

function CrewMemberSummary({ member }: { member: CrewMember }) {
  const status = crewStatusChip(member)

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs" style={{ flex: 1, minWidth: 0 }}>
      <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <CrewSticker stickerId={member.stickerId} size="md" />
        <Text
          size="sm"
          fw={600}
          c={member.bailed ? 'dimmed' : undefined}
          truncate
        >
          {member.name}
        </Text>
      </Group>
      <Badge
        size="sm"
        variant={status.severity === 'ok' ? 'light' : 'filled'}
        color={crewStatusBadgeColor(status.severity)}
      >
        {status.label}
      </Badge>
    </Group>
  )
}

function CrewMemberDetails({
  member,
  canCare,
  food,
  beer,
  drugs,
  onConsume,
}: {
  member: CrewMember
  canCare: boolean
  food: number
  beer: number
  drugs: number
  onConsume: (item: 'eat' | 'drink' | 'substances') => void
}) {
  if (member.bailed) {
    return (
      <Text size="sm" c="dimmed">
        Tapped out — not on the lot anymore.
      </Text>
    )
  }

  return (
    <Stack gap="sm">
      {member.roughTurns >= 2 && member.roughTurns < BAIL_ROUGH_THRESHOLD && (
        <Text size="xs" c="red">
          Bail in {BAIL_ROUGH_THRESHOLD - member.roughTurns} turn
          {BAIL_ROUGH_THRESHOLD - member.roughTurns === 1 ? '' : 's'}
        </Text>
      )}
      <NeedMeterRow
        label="Hunger"
        satisfaction={member.hunger}
        valueLabel={hungerLabel(member.hunger)}
        leftLabel="Full"
        rightLabel="Starving"
      />
      <NeedMeterRow
        label="Thirst"
        satisfaction={member.thirst}
        valueLabel={thirstLabel(member.thirst)}
        leftLabel="Hydrated"
        rightLabel="Parched"
      />
      <MeterRow label="Health" value={member.health} valueLabel={healthLabel(member.health)} />
      {member.wookFlu && (
        <Text size="xs" c="red">
          Wook flu — contagious until rested or hotel crash
        </Text>
      )}
      <MeterRow label="Vibe" value={member.vibe} valueLabel={vibeLabel(member.vibe)} />
      <StonedMeterRow value={member.stoned} valueLabel={stonedLabel(member.stoned)} />
      {member.stoned >= STONED_WASTED_THRESHOLD && (
        <Text size="xs" c="red">
          Too wasted to drive — cops will not be chill
        </Text>
      )}
      {(member.hunger < ROUGH_THRESHOLD ||
        member.thirst < ROUGH_THRESHOLD ||
        member.health < ROUGH_THRESHOLD ||
        member.vibe < ROUGH_THRESHOLD) && (
        <Text size="xs" c="orange">
          Danger zone — starving or parched drains health; run-down crew catches wook flu
        </Text>
      )}
      <Group gap="xs" grow>
        <Button
          size="compact-sm"
          variant="light"
          disabled={!canCare || food <= 0}
          onClick={() => onConsume('eat')}
        >
          Eat
        </Button>
        <Button
          size="compact-sm"
          variant="light"
          disabled={!canCare || beer <= 0}
          onClick={() => onConsume('drink')}
        >
          Drink
        </Button>
        <Button
          size="compact-sm"
          variant="light"
          color="grape"
          disabled={!canCare || drugs <= 0}
          onClick={() => onConsume('substances')}
        >
          Consume
        </Button>
      </Group>
    </Stack>
  )
}

function firstUrgentMemberId(crew: CrewMember[]): string | null {
  const urgent = crew.find((m) => {
    const s = crewStatusChip(m)
    return s.severity === 'critical' || s.severity === 'warning'
  })
  return urgent?.id ?? null
}

export function CrewMeterPanel() {
  const { state, crewConsume } = useGame()
  const crew = state.crew
  const canCare = !!state.tour
  const { food, beer, drugs } = state.resources
  const urgentId = useMemo(() => firstUrgentMemberId(crew), [crew])
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (openId != null) return
    if (urgentId) setOpenId(urgentId)
  }, [openId, urgentId])

  return (
    <Paper withBorder p="sm">
      <Text size="sm" fw={600} mb="xs">
        Your Crew
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        Tap a member for meters and care actions.
      </Text>
      {state.crewAlert && (
        <Alert color="orange" mb="sm" title="Crew alert">
          {state.crewAlert}
        </Alert>
      )}
      <Accordion
        chevronPosition="right"
        variant="separated"
        value={openId}
        onChange={setOpenId}
      >
        {crew.map((m) => (
          <Accordion.Item key={m.id} value={m.id}>
            <Accordion.Control py="sm">
              <CrewMemberSummary member={m} />
            </Accordion.Control>
            <Accordion.Panel>
              <CrewMemberDetails
                member={m}
                canCare={canCare}
                food={food}
                beer={beer}
                drugs={drugs}
                onConsume={(item) => crewConsume(m.id, item)}
              />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Paper>
  )
}
