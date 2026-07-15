import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'
import { isAtRoadsideHustle } from '../game/hustle/tab'

interface BackToSceneButtonProps {
  onBackToScene: () => void
}

/** Hustle tab only — one tap returns to Scene and exits roadside / lot sub-stops. */
export function BackToSceneButton({ onBackToScene }: BackToSceneButtonProps) {
  const { state, returnToShakedown, leaveRoadside } = useGame()

  const atRoadside = isAtRoadsideHustle(state)
  const atLotStop =
    state.phase === 'location' &&
    state.currentLocation !== 'shakedown' &&
    state.currentLocation !== 'venue'

  const handleClick = () => {
    if (atRoadside) leaveRoadside()
    else if (atLotStop) returnToShakedown()
    onBackToScene()
  }

  return (
    <Button variant="default" onClick={handleClick}>
      Back to scene
    </Button>
  )
}
