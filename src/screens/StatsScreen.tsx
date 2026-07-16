import {
  Badge,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { buildRunResources } from '../game/crew/economy'
import { crewRepLabel } from '../game/crew/repTitles'
import { stickerLabel } from '../game/crew/stickers'
import { useGame } from '../game/GameContext'
import { RESOURCE_EMOJI } from '../game/resources'
import type { CrewCareerStats, Resources, RunStats, SavedCrew } from '../game/types'
import { CrewSticker } from '../components/CrewSticker'
import { RunStatsGrid } from '../components/RunStatsGrid'
import { TabPanelHeader } from '../components/TabPanelHeader'

const SUPPLY_KEYS: (keyof Resources)[] = ['food', 'beer', 'drugs', 'tickets', 'gas']

function SuppliesRow({ resources, inRun }: { resources: Resources; inRun: boolean }) {
  return (
    <Stack gap={6}>
      <Group gap="md" wrap="wrap">
        <Text size="md" fw={700}>
          {RESOURCE_EMOJI.cash} {resources.cash}
        </Text>
        {SUPPLY_KEYS.map((key) => (
          <Text key={key} size="md" fw={500}>
            {RESOURCE_EMOJI[key]} {String(resources[key])}
          </Text>
        ))}
        {resources.hasVehicle && (
          <Text size="md" fw={500}>{RESOURCE_EMOJI.hasVehicle}</Text>
        )}
      </Group>
      {inRun && (
        <Text size="xs" c="dimmed">
          Supplies liquidate to bank when you go home or finish the tour.
        </Text>
      )}
    </Stack>
  )
}

function CurrentCrewPanel({
  saved,
  inRun,
  resources,
}: {
  saved: SavedCrew
  inRun: boolean
  resources: Resources
}) {
  return (
    <Paper withBorder p="md" radius="md" h="100%">
      <Stack gap="sm">
        <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>Current crew</Text>
        <Stack gap="xs">
          {saved.members.map((m) => (
            <Group key={m.name} gap="sm" wrap="nowrap">
              <CrewSticker stickerId={m.stickerId} size="lg" />
              <Stack gap={0}>
                <Text fw={600}>{m.name}</Text>
                <Text size="xs" c="dimmed">
                  {stickerLabel(m.stickerId)}
                </Text>
              </Stack>
            </Group>
          ))}
        </Stack>
        <Text size="sm" c="dimmed">
          Home: {saved.homeCity}
        </Text>

        <Group gap="sm">
          <Badge size="lg" variant="light" color="teal">
            {crewRepLabel(saved.rep)}
          </Badge>
          <Badge size="lg" variant="light" color="yellow">
            Bank ${saved.bank}
          </Badge>
          {inRun && (
            <Badge size="lg" variant="light" color="blue">
              On tour
            </Badge>
          )}
        </Group>

        <Divider label={inRun ? 'On the road' : 'Next run kit'} labelPosition="left" />

        <SuppliesRow resources={resources} inRun={inRun} />
      </Stack>
    </Paper>
  )
}

function CareerPanel({
  saved,
  career,
  fallbackStats,
}: {
  saved: SavedCrew
  career: CrewCareerStats | undefined
  fallbackStats: RunStats
}) {
  return (
    <Paper withBorder p="md" radius="md" h="100%">
      <Stack gap="sm">
        <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>Career record</Text>
        <Text size="sm">
          Personal best rep: <strong>{crewRepLabel(saved.bestRep)}</strong>
        </Text>

        <SimpleGrid cols={2} spacing="xs">
          <Text size="sm">Tours completed: {career?.toursCompleted ?? 0}</Text>
          <Text size="sm">Runs completed: {career?.runsCompleted ?? 0}</Text>
          <Text size="sm">Day jobs: {career?.dayJobsTaken ?? 0}</Text>
          <Text size="sm">Went home early: {career?.shufflesHome ?? 0}</Text>
          <Text size="sm">Bets won: {career?.betsWon ?? 0}</Text>
        </SimpleGrid>

        <Divider label="Personal bests" labelPosition="left" />

        <SimpleGrid cols={2} spacing="xs">
          <Text size="sm">Best run — venues: {career?.bestVenuesRun ?? 0}</Text>
          <Text size="sm">Best run — songs: {career?.bestSongsRun ?? 0}</Text>
        </SimpleGrid>

        <Divider label="Lifetime totals" labelPosition="left" />

        <RunStatsGrid stats={career ?? fallbackStats} />
      </Stack>
    </Paper>
  )
}

export function StatsScreen() {
  const { state } = useGame()
  const inRun = state.tour !== null
  const saved = state.savedCrew
  const career = saved?.career
  const nextRunResources = saved ? buildRunResources(saved, state.rngSeed + 17) : null
  const crewResources = inRun ? state.resources : nextRunResources!

  const blurb = saved
    ? `${crewRepLabel(saved.rep)} · Bank $${saved.bank}${inRun ? ' · On tour' : ''}`
    : 'No crew saved yet.'

  return (
    <Stack gap="md">
      <TabPanelHeader title="Stats" blurb={blurb} />

      {!saved ? (
        <Paper withBorder p="md" radius="md">
          <Text c="dimmed">No crew saved yet. Build one from the title screen.</Text>
        </Paper>
      ) : (
        <Grid gap="md" align="stretch">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md" h="100%">
              <CurrentCrewPanel saved={saved} inRun={inRun} resources={crewResources} />
              {inRun && (
                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>This run</Text>
                    <RunStatsGrid stats={state.runStats} />
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <CareerPanel saved={saved} career={career} fallbackStats={state.runStats} />
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  )
}
