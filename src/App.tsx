import { AppShell, Badge, Container, Group, Paper, Title } from '@mantine/core'
import { useMemo, useState } from 'react'
import { PhaseRouter } from './components/PhaseRouter'
import { ScreenFrame } from './components/ScreenFrame'
import { ShuffleOnHomeButton } from './components/ShuffleOnHomeButton'
import { TourTabBar, type PlayTabId } from './components/TourTabBar'
import { CrewTab } from './components/tabs/CrewTab'
import { JournalTab } from './components/tabs/JournalTab'
import { SceneTab } from './components/tabs/SceneTab'
import { VersionBadge } from './components/VersionBadge'
import { crewStatusChip } from './game/crew/meters'
import { useGame } from './game/GameContext'
import { PHASE_LABELS, type GameState } from './game/types'
import { TitleScreen } from './screens/TitleScreen'

const MENU_PHASES = new Set(['title', 'crew', 'stats', 'run_recap', 'day_job'])

function phaseLabel(state: GameState): string {
  if (state.phase === 'location' && state.currentLocation === 'venue') return 'Venue gates'
  return PHASE_LABELS[state.phase]
}

function hasUrgentCrew(state: GameState): boolean {
  return state.crew.some((m) => {
    const s = crewStatusChip(m)
    return s.severity === 'critical' || s.severity === 'warning'
  })
}

export default function App() {
  const { state } = useGame()
  const [playTab, setPlayTab] = useState<PlayTabId>('scene')
  const showPlayShell = !MENU_PHASES.has(state.phase)
  const showBets =
    state.tour != null &&
    (state.phase === 'shakedown' || state.phase === 'location' || state.phase === 'show')
  const hustleAvailable = !!(state.currentMarket && state.currentMarketStock)
  const crewAlert = hasUrgentCrew(state) || !!state.crewAlert

  const playContent = useMemo(() => {
    switch (playTab) {
      case 'crew':
        return <CrewTab />
      case 'journal':
        return <JournalTab />
      default:
        return <SceneTab showBets={showBets} />
    }
  }, [playTab, showBets])

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
      <AppShell
        header={{ height: 56 }}
        footer={showPlayShell ? { height: 56 } : undefined}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={3}>Little Jam Band Tour</Title>
            <Group gap="sm">
              <ShuffleOnHomeButton />
              <Badge size="lg" variant="light">
                {phaseLabel(state)}
              </Badge>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <Container size="sm" py="xs" pb={showPlayShell ? 72 : 'xs'}>
            {showPlayShell ? (
              playContent
            ) : state.phase === 'stats' ? (
              <ScreenFrame>
                <PhaseRouter />
              </ScreenFrame>
            ) : (
              <Paper withBorder p="lg" radius="md">
                <ScreenFrame>
                  <PhaseRouter />
                </ScreenFrame>
              </Paper>
            )}
          </Container>
        </AppShell.Main>
        {showPlayShell && (
          <AppShell.Footer withBorder>
            <TourTabBar
              active={playTab}
              onChange={setPlayTab}
              crewAlert={crewAlert}
              betsAvailable={showBets}
              hustleAvailable={hustleAvailable}
            />
          </AppShell.Footer>
        )}
      </AppShell>
      <VersionBadge />
    </>
  )
}
