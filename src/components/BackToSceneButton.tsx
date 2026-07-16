import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'
import { isAtRoadsideHustle } from '../game/hustle/tab'

interface BackToSceneButtonProps {
  onBackToScene: () => void
  /** Hustle tab — also exit roadside / lot sub-stops */
  exitSubStop?: boolean
}

export function BackToSceneButton({ onBackToScene, exitSubStop = false }: BackToSceneButtonProps) {
  const { state, returnToShakedown, leaveRoadside } = useGame()

  const atRoadside = isAtRoadsideHustle(state)
  const atLotStop =
    state.phase === 'location' &&
    state.currentLocation !== 'shakedown' &&
    state.currentLocation !== 'venue'

  const handleClick = () => {
    if (exitSubStop) {
      if (atRoadside) leaveRoadside()
      else if (atLotStop) returnToShakedown()
    }
    onBackToScene()
  }

  return (
    <Button variant="default" onClick={handleClick}>
      Back to scene
    </Button>
  )
}
