import { Alert } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function OutcomeBanner() {
  const { state } = useGame()
  const message = state.lastOutcome
  if (!message || !state.tour) return null

  return (
    <Alert color="teal" title="What happened" mb="sm">
      {message}
    </Alert>
  )
}
