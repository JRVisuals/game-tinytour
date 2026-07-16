import { Button, Stack, Text } from '@mantine/core'
import { SceneBeatSlot } from '../components/SceneBeatSlot'
import { SetlistRecap } from '../components/SetlistRecap'
import { useGame } from '../game/GameContext'

export function PostShowScreen() {
  const { state, enterPostShowShakedown } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const band = state.tour?.band.name
  const missed = !state.lastSetlist
  const hustle = state.missShowHustleEvent

  return (
    <Stack>
      <Text>{state.postShowRecap}</Text>

      {hustle && (
        <SceneBeatSlot
          beat={{
            title: hustle.title,
            body: hustle.body,
            loot: hustle.loot,
          }}
        />
      )}

      {state.lastSetlist && (
        <SetlistRecap
          setlist={state.lastSetlist}
          betResults={state.lastShowBetResults}
          band={band}
          venue={stop?.venue}
          city={stop?.city}
        />
      )}

      {missed && !hustle && (
        <Text size="sm" c="dimmed">
          The lot was weirdly quiet. You still hustled — just nothing headline-worthy.
        </Text>
      )}

      <Text size="sm" c="dimmed">
        Shakedown again — hustle before the next travel leg.
      </Text>
      <Button onClick={enterPostShowShakedown}>After-show shakedown</Button>
    </Stack>
  )
}
