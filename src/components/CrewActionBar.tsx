import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function CrewActionBar() {
  const { state, saveCrew, goToTitle, shuffleCrewNames, resetCrew } = useGame()
  const hitTheRoad = !!state.startRunAfterCrewSave

  return (
    <div className="game-shell-tab-bar">
      <Button
        size="compact-sm"
        variant="filled"
        color="teal"
        onClick={saveCrew}
      >
        {hitTheRoad ? 'SAVE & ROLL' : 'SAVE CREW'}
      </Button>
      {!hitTheRoad && (
        <Button
          size="compact-sm"
          variant="light"
          color="gray"
          onClick={goToTitle}
        >
          TITLE
        </Button>
      )}
      <Button
        size="compact-sm"
        variant="light"
        color="gray"
        onClick={shuffleCrewNames}
      >
        SHUFFLE
      </Button>
      <Button
        size="compact-sm"
        variant="light"
        color="orange"
        onClick={resetCrew}
      >
        RESET
      </Button>
    </div>
  )
}
