import { Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { TabPanelHeader } from '../components/TabPanelHeader'
import { BALANCE } from '../game/config'
import { useGame } from '../game/GameContext'
import { STAT_LABELS } from '../game/types'

export function DayJobScreen() {
  const { state } = useGame()
  const perMember = BALANCE.crewEconomy.dayJobStipendPerMember
  const stipend = state.dayJobStipend ?? 0
  const [recapTitle, recapSubtitle] = state.runRecapMessage.includes('\n')
    ? state.runRecapMessage.split('\n', 2)
    : [state.runRecapMessage, null]

  const crewSize = state.savedCrew?.members.length ?? state.crew.length

  return (
    <Stack gap="md">
      <TabPanelHeader title="Day job" blurb={recapTitle} />

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            The desk calls
          </Text>
          {recapSubtitle && <Text c="dimmed">{recapSubtitle}</Text>}
          <Text c="dimmed">
            The tour can wait. Nametags, time clock, burnt coffee. Your crew rep carries — cash
            doesn&apos;t.
          </Text>
          {stipend > 0 && (
            <Text fw={500}>
              Stipend on the table: ${stipend} (${perMember} × {crewSize} crew)
            </Text>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            Run stats
          </Text>
          <SimpleGrid cols={2} spacing="xs">
            {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
              <Text key={key} size="sm">
                {STAT_LABELS[key]}: <strong>{state.runStats[key]}</strong>
              </Text>
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>

    </Stack>
  )
}
