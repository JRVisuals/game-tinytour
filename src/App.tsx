import { Badge, Container, Paper, Stack } from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AsciiHeaderLogo } from './components/AsciiHeaderLogo'
import { PhaseRouter } from './components/PhaseRouter'
import { ShuffleOnHomeButton } from './components/ShuffleOnHomeButton'
import { StatusLine } from './components/StatusLine'
import { TourTabBar, type PlayTabId } from './components/TourTabBar'
import { PhaseActionBar } from './components/PhaseActionBar'
import { CrewActionBar } from './components/CrewActionBar'
import { StatsActionBar } from './components/StatsActionBar'
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
  const [wiping, setWiping] = useState(false)
  const showPlayShell = !MENU_PHASES.has(state.phase)
  const showCrewShell = state.phase === 'crew'
  const showStatsShell = state.phase === 'stats'
  const hustleActive = hustleTabActive(state)
  const hustleEnabled = isHustleContext(state)
  const crewAlert = hasUrgentCrew(state) || !!state.crewAlert
  const wasAtRoadside = useRef(false)
  const prevLegIndex = useRef<number | null>(null)

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

  // Trigger wipe animation on leg advance
  useEffect(() => {
    const idx = state.travel?.currentLegIndex ?? null
    if (idx !== null && prevLegIndex.current !== null && idx !== prevLegIndex.current) {
      setWiping(true)
      const t = setTimeout(() => setWiping(false), 500)
      return () => clearTimeout(t)
    }
    prevLegIndex.current = idx
  }, [state.travel?.currentLegIndex])

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
        return <HustleTab />
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
    <div className={`game-shell${showPlayShell || showCrewShell || showStatsShell ? ' game-shell--tabs' : ''}`}>
      <header className="game-shell-header">
        <div className="game-shell-header-row">
          <div className="game-shell-header-logo">
            <AsciiHeaderLogo />
          </div>
          <div className="game-shell-header-actions">
            <ShuffleOnHomeButton />
            <Badge size="sm" variant="light" className="phase-badge">
              {phaseLabel(state)}
            </Badge>
          </div>
        </div>
      </header>

      <main className="game-shell-main">
        <Container size="sm" py="sm" px={0}>
          {showPlayShell ? (
            <PlayTabProvider setPlayTab={setPlayTab}>
              <Stack gap="sm">
                <StatusLine />
                {playContent}
              </Stack>
            </PlayTabProvider>
          ) : (
            <PhaseRouter />
          )}
        </Container>
      </main>

      {showPlayShell && (
        <footer className="game-shell-footer">
          <PhaseActionBar activeTab={playTab} onSwitchToScene={() => setPlayTab('scene')} />
          <TourTabBar
            active={playTab}
            onChange={setPlayTab}
            crewAlert={crewAlert}
            hustleActive={hustleActive}
            hustleEnabled={hustleEnabled}
          />
        </footer>
      )}
      {showCrewShell && (
        <footer className="game-shell-footer">
          <CrewActionBar />
        </footer>
      )}
      {showStatsShell && (
        <footer className="game-shell-footer">
          <StatsActionBar />
        </footer>
      )}

      {showPlayShell && <OutcomeToast />}
      <VersionBadge />
      {wiping && (
        <div className="travel-wipe" aria-hidden>
          <div className="travel-wipe-bar travel-wipe-bar--1" />
          <div className="travel-wipe-bar travel-wipe-bar--2" />
          <div className="travel-wipe-bar travel-wipe-bar--3" />
        </div>
      )}
    </div>
  )
}
