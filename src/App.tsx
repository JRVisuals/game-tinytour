import { AppShell, Badge, Container, Grid, Group, Paper, Stack, Title } from '@mantine/core'
import { CrewMeterPanel } from './components/CrewMeterPanel'
import { SongCatalogPanel } from './components/SongCatalogPanel'
import { TourStoryPanel } from './components/TourStoryPanel'
import { ShuffleOnHomeButton } from './components/ShuffleOnHomeButton'
import { StatusBar } from './components/StatusBar'
import { VersionBadge } from './components/VersionBadge'
import { useGame } from './game/GameContext'
import { PHASE_LABELS } from './game/types'
import { CrewCreateScreen } from './screens/CrewCreateScreen'
import { DayJobScreen } from './screens/DayJobScreen'
import { LocationScreen } from './screens/LocationScreen'
import { PostShowScreen } from './screens/PostShowScreen'
import { PostShowShakedownScreen } from './screens/PostShowShakedownScreen'
import { RunRecapScreen } from './screens/RunRecapScreen'
import { ShakedownScreen } from './screens/ShakedownScreen'
import { ShowScreen } from './screens/ShowScreen'
import { StatsScreen } from './screens/StatsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { TravelScreen } from './screens/TravelScreen'

const MENU_PHASES = new Set(['title', 'crew', 'stats', 'run_recap', 'day_job'])

function PhaseRouter() {
  const { state } = useGame()
  switch (state.phase) {
    case 'title':
      return <TitleScreen />
    case 'crew':
      return <CrewCreateScreen />
    case 'stats':
      return <StatsScreen />
    case 'travel':
      return <TravelScreen />
    case 'shakedown':
      return <ShakedownScreen />
    case 'location':
      return <LocationScreen />
    case 'show':
      return <ShowScreen />
    case 'post_show':
      return <PostShowScreen />
    case 'post_show_shakedown':
      return <PostShowShakedownScreen />
    case 'run_recap':
      return <RunRecapScreen />
    case 'day_job':
      return <DayJobScreen />
  }
}

export default function App() {
  const { state } = useGame()
  const showShell = !MENU_PHASES.has(state.phase)
  const showBets =
    state.tour != null &&
    state.phase !== 'show' &&
    state.phase !== 'post_show' &&
    state.phase !== 'post_show_shakedown'

  if (state.phase === 'title') {
    return (
      <>
        <Container size="sm" py="xl">
          <Paper withBorder p="lg" radius="md">
            <TitleScreen />
          </Paper>
        </Container>
        <VersionBadge />
      </>
    )
  }

  return (
    <>
      <AppShell header={{ height: 56 }} padding="md">
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={3}>Little Jam Band Tour</Title>
            <Group gap="sm">
              <ShuffleOnHomeButton />
              <Badge size="lg" variant="light">
                {PHASE_LABELS[state.phase]}
              </Badge>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <Container size="xl" py="xs">
            {showShell ? (
              <Grid gap="md" align="flex-start">
                <Grid.Col span={{ base: 12, md: 8, lg: 7 }}>
                  <StatusBar />
                  <Paper withBorder p="lg" radius="md">
                    <PhaseRouter />
                  </Paper>
                  <TourStoryPanel />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4, lg: 5 }}>
                  <Stack gap="md">
                    <CrewMeterPanel />
                    {showBets && <SongCatalogPanel />}
                  </Stack>
                </Grid.Col>
              </Grid>
            ) : state.phase === 'stats' ? (
              <PhaseRouter />
            ) : (
              <Paper withBorder p="lg" radius="md">
                <PhaseRouter />
              </Paper>
            )}
          </Container>
        </AppShell.Main>
      </AppShell>
      <VersionBadge />
    </>
  )
}
