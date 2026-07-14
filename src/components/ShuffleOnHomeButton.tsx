import { Button, Tooltip } from '@mantine/core'
import { useGame } from '../game/GameContext'
import { canShuffleHome } from '../game/stats'

export function ShuffleOnHomeButton() {
  const { state, shuffleOnHome } = useGame()
  if (!state.tour) return null

  const allowed = canShuffleHome(state.runStats)

  return (
    <Tooltip
      label="Play at least one show before going home"
      disabled={allowed}
      withArrow
    >
      <span style={{ display: 'inline-block' }}>
        <Button
          size="compact-sm"
          variant="light"
          color="gray"
          onClick={shuffleOnHome}
          disabled={!allowed}
        >
          Go home
        </Button>
      </span>
    </Tooltip>
  )
}
