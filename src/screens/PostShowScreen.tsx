import { Button, List, Stack, Text } from '@mantine/core'
import { SceneBeatAlert } from '../components/SceneBeatAlert'
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
        <SceneBeatAlert title={hustle.title} body={hustle.body} loot={hustle.loot} />
      )}

      {state.lastSetlist && (
        <>
          <Text fw={500}>Setlist</Text>
          {(band || stop) && (
            <Text size="sm" c="dimmed">
              {[band, stop?.venue, stop?.city].filter(Boolean).join(' · ')}
            </Text>
          )}
          <List size="sm">
            {state.lastSetlist.songs.map((song) => (
              <List.Item key={song}>{song}</List.Item>
            ))}
          </List>
        </>
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
