import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function RecapActionBar() {
  const { state, finishRunRecap, confirmDayJob, takeDayJobStipend, resetCrew } = useGame()
  const isDayJob = state.phase === 'day_job'
  const isPreDayJob = state.phase === 'pre_day_job'
  const stipend = state.dayJobStipend ?? 0

  if (isPreDayJob) {
    return (
      <div className="game-shell-tab-bar">
        <Button size="compact-sm" color="orange" onClick={confirmDayJob}>
          FACE THE MUSIC
        </Button>
      </div>
    )
  }

  if (isDayJob) {
    return (
      <div className="game-shell-tab-bar">
        <Button size="compact-sm" variant="light" color="gray" onClick={finishRunRecap}>
          TITLE (BROKE)
        </Button>
        <Button size="compact-sm" variant="light" color="orange" onClick={resetCrew}>
          RESET CREW
        </Button>
        {stipend > 0 && (
          <Button size="compact-sm" color="teal" onClick={takeDayJobStipend}>
            TAKE STIPEND
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="game-shell-tab-bar">
      <Button size="compact-sm" color="teal" onClick={finishRunRecap}>
        BACK TO TITLE
      </Button>
    </div>
  )
}
