import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function StatsActionBar() {
  const { goToTitle, goToCrew } = useGame()

  return (
    <div className="game-shell-tab-bar">
      <Button size="compact-sm" variant="light" color="gray" onClick={goToTitle}>
        TITLE
      </Button>
      <Button size="compact-sm" variant="light" color="teal" onClick={() => goToCrew()}>
        EDIT CREW
      </Button>
    </div>
  )
}
