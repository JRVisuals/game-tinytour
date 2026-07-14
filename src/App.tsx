import { AppShell, Badge, Container, Group, Paper, Title } from '@mantine/core'
import { StatusBar } from './components/StatusBar'
import { useGame } from './game/GameContext'
import { PHASE_LABELS } from './game/types'
import { CrewCreateScreen } from './screens/CrewCreateScreen'
import { LocationScreen } from './screens/LocationScreen'
import { PostShowScreen } from './screens/PostShowScreen'
import { ShakedownScreen } from './screens/ShakedownScreen'
import { ShowScreen } from './screens/ShowScreen'
import { TourStartScreen } from './screens/TourStartScreen'
import { TravelScreen } from './screens/TravelScreen'

function PhaseRouter() {
  const { state } = useGame()
  switch (state.phase) {
    case 'crew_create':
      return <CrewCreateScreen />
    case 'tour_start':
      return <TourStartScreen />
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
  }
}

export default function App() {
  const { state } = useGame()

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>Little Jam Band Tour</Title>
          <Badge size="lg" variant="light">
            {PHASE_LABELS[state.phase]}
          </Badge>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="sm">
          {state.phase !== 'crew_create' && state.phase !== 'tour_start' && (
            <StatusBar />
          )}
          <Paper withBorder p="lg" radius="md">
            <PhaseRouter />
          </Paper>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
