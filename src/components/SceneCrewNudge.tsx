import { Button, Group } from '@mantine/core'
import { crewStatusChip } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { usePlayTab } from './PlayTabContext'

interface SceneCrewNudgeProps {
  /** Inline with scene content vs centered hint row */
  inline?: boolean
}

export function SceneCrewNudge({ inline }: SceneCrewNudgeProps) {
  const { state } = useGame()
  const { setPlayTab } = usePlayTab()
  const urgent = state.crew.find((m) => {
    if (m.bailed) return false
    const chip = crewStatusChip(m)
    return chip.severity === 'critical' || chip.severity === 'warning'
  })

  if (!urgent) return null

  const chip = crewStatusChip(urgent)
  const label = `${urgent.name} is ${chip.label} — Crew`

  if (inline) {
    return (
      <Button
        size="compact-sm"
        variant="light"
        color="orange"
        onClick={() => setPlayTab('crew')}
      >
        {label}
      </Button>
    )
  }

  return (
    <Group justify="center">
      <Button
        size="compact-sm"
        variant="light"
        color="orange"
        onClick={() => setPlayTab('crew')}
      >
        {label}
      </Button>
    </Group>
  )
}
