import { Button } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function ShuffleOnHomeButton() {
  const { state, shuffleOnHome } = useGame()
  if (!state.tour) return null

  return (
    <Button size="compact-sm" variant="subtle" color="gray" onClick={shuffleOnHome}>
      Shuffle on home
    </Button>
  )
}
