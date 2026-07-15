import { AppShell, Badge, Container, Group, Paper, Stack } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AsciiHeaderLogo } from './components/AsciiHeaderLogo'
import { PhaseRouter } from './components/PhaseRouter'
import { ScreenFrame } from './components/ScreenFrame'
import { ShuffleOnHomeButton } from './components/ShuffleOnHomeButton'
import { StatusLine } from './components/StatusLine'
import { TourTabBar, type PlayTabId } from './components/TourTabBar'
import { CrewTab } from './components/tabs/CrewTab'
import { HustleTab } from './components/tabs/HustleTab'
import { JournalTab } from './components/tabs/JournalTab'
import { SceneTab } from './components/tabs/SceneTab'
import { PlayTabProvider } from './components/PlayTabContext'
import { OutcomeToast } from './components/OutcomeToast'
import { VersionBadge } from './components/VersionBadge'
import { crewStatusChip } from './game/crew/meters'
import { hustleTabActive, isHustleContext } from './game/hustle/tab'
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
  const hustleActive = hustleTabActive(state)
  const hustleEnabled = isHustleContext(state)
  const crewAlert = hasUrgentCrew(state) || !!state.crewAlert
  const wasAtRoadside = useRef(false)

  useEffect(() => {
    if (playTab === 'hustle' && !hustleEnabled) setPlayTab('scene')
  }, [playTab, hustleEnabled])

  useEffect(() => {
    const atRoadside = state.phase === 'travel' && !!state.travel?.atRoadside
    if (atRoadside && !wasAtRoadside.current) {
      setPlayTab('hustle')
    }
    wasAtRoadside.current = atRoadside
  }, [state.phase, state.travel?.atRoadside])

  const playContent = useMemo(() => {
    switch (playTab) {
      case 'hustle':
        return <HustleTab onBackToScene={() => setPlayTab('scene')} />
      case 'crew':
        return <CrewTab />
      case 'journal':
        return <JournalTab />
      default:
        return <SceneTab />
    }
  }, [playTab])

  if (state.phase === 'title') {
    return (
      <>
        <Container size="sm" className="title-page-shell" py="md">
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
          <Group h="100%" px="md" justify="space-between" wrap="nowrap" gap="xs">
            <AsciiHeaderLogo />
            <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              <ShuffleOnHomeButton />
              <Badge size="lg" variant="light">
                {phaseLabel(state)}
              </Badge>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Main>
          <Container
            size="sm"
            py="xs"
            pb={showPlayShell ? 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' : 'xs'}
            pt="xs"
          >
            {showPlayShell ? (
              <PlayTabProvider setPlayTab={setPlayTab}>
                <Stack gap="sm">
                  <StatusLine />
                  {playContent}
                </Stack>
              </PlayTabProvider>
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
              hustleActive={hustleActive}
              hustleEnabled={hustleEnabled}
            />
          </AppShell.Footer>
        )}
      </AppShell>
      {showPlayShell && <OutcomeToast />}
      <VersionBadge />
    </>
  )
}
