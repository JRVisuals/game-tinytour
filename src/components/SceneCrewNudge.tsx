import { crewStatusChip } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { TabHintButton } from './TabHintButton'

export function SceneCrewNudge() {
  const { state } = useGame()
  const urgent = state.crew.find((m) => {
    if (m.bailed) return false
    const chip = crewStatusChip(m)
    return chip.severity === 'critical' || chip.severity === 'warning'
  })

  if (!urgent) return null

  const chip = crewStatusChip(urgent)
  return (
    <TabHintButton tab="crew">
      {`${urgent.name} is ${chip.label} — Crew`}
    </TabHintButton>
  )
}
