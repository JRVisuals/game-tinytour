import { Badge, Box, Container, Group, Paper, Stack } from '@mantine/core'
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
  if (state.phase === 'location' && state.currentLocation === 'venue') return 'Gates'
  const short: Partial<Record<GameState['phase'], string>> = {
    post_show_shakedown: 'After-show',
    run_recap: 'Recap',
    day_job: 'Day job',
  }
  return short[state.phase] ?? PHASE_LABELS[state.phase]
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

  useEffect(() => {
    if (state.phase === 'title') {
      document.documentElement.classList.remove('game-chrome-lock')
      return
    }
    document.documentElement.classList.add('game-chrome-lock')
    return () => document.documentElement.classList.remove('game-chrome-lock')
  }, [state.phase])

  const playContent = useMemo(() => {
    switch (playTab) {
      case 'hustle':
        return <HustleTab onBackToScene={() => setPlayTab('scene')} />
      case 'crew':
        return <CrewTab onBackToScene={() => setPlayTab('scene')} />
      case 'journal':
        return <JournalTab onBackToScene={() => setPlayTab('scene')} />
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
    <div className={`game-shell${showPlayShell ? ' game-shell--tabs' : ''}`}>
      <header className="game-shell-header">
        <Group
          className="game-shell-header-inner"
          h="100%"
          px="md"
          justify="space-between"
          wrap="nowrap"
          gap="xs"
        >
          <Box className="game-shell-header-logo">
            <AsciiHeaderLogo />
          </Box>
          <Group className="game-shell-header-actions" gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <ShuffleOnHomeButton />
            <Badge size="sm" variant="light" className="phase-badge">
              {phaseLabel(state)}
            </Badge>
          </Group>
        </Group>
      </header>

      <main className="game-shell-main">
        <Container size="sm" py="xs" px={0}>
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
      </main>

      {showPlayShell && (
        <footer className="game-shell-footer">
          <TourTabBar
            active={playTab}
            onChange={setPlayTab}
            crewAlert={crewAlert}
            hustleActive={hustleActive}
            hustleEnabled={hustleEnabled}
          />
        </footer>
      )}

      {showPlayShell && <OutcomeToast />}
      <VersionBadge />
    </div>
  )
}
