import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'
import { isAtRoadsideHustle } from '../game/hustle/tab'

interface BackToSceneButtonProps {
  onBackToScene?: () => void
}

export function BackToSceneButton({ onBackToScene }: BackToSceneButtonProps) {
  const { state, returnToShakedown, leaveRoadside } = useGame()

  const atRoadside = isAtRoadsideHustle(state)
  const atLotStop =
    state.phase === 'location' &&
    state.currentLocation !== 'shakedown' &&
    (state.currentLocation !== 'venue' || state.turnsUntilShow > 0)

  if (!atRoadside && !atLotStop) return null

  const handleClick = () => {
    if (atRoadside) leaveRoadside()
    else returnToShakedown()
    onBackToScene?.()
  }

  return (
    <Button variant="default" onClick={handleClick}>
      Back to scene
    </Button>
  )
}
