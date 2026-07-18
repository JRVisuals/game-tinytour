import { Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { TabPanelHeader } from '../components/TabPanelHeader'
import { TourStoryPanel } from '../components/TourStoryPanel'
import { SetlistRecap } from '../components/SetlistRecap'
import { crewRepLabel } from '../game/crew/repTitles'
import { useGame } from '../game/GameContext'
import { STAT_LABELS } from '../game/types'

export function RunRecapScreen() {
  const { state } = useGame()
  const isOver =
    state.runRecapMessage.toLowerCase().includes('bailed') ||
    state.runRecapMessage.toLowerCase().includes('shuffled')
  const blurb = state.savedCrew
    ? `Banked $${state.savedCrew.bank} · ${crewRepLabel(state.savedCrew.rep)}`
    : undefined

  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const band = state.tour?.band.name

  return (
    <Stack gap="md">
      <TabPanelHeader title={isOver ? 'Tour over' : 'Run recap'} blurb={blurb} />

      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
            This run
          </Text>
          <Text>{state.runRecapMessage}</Text>
          <SimpleGrid cols={2} spacing="xs">
            {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
              <Text key={key} size="sm">
                {STAT_LABELS[key]}: <strong>{state.runStats[key]}</strong>
              </Text>
            ))}
          </SimpleGrid>
        </Stack>
      </Paper>

      {state.lastSetlist && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Last setlist heard
            </Text>
            <SetlistRecap
              setlist={state.lastSetlist}
              betResults={state.lastShowBetResults}
              band={band}
              venue={stop?.venue}
              city={stop?.city}
            />
          </Stack>
        </Paper>
      )}

      {state.tourStory.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
              Tour story
            </Text>
            <TourStoryPanel embedded />
          </Stack>
        </Paper>
      )}

    </Stack>
  )
}
