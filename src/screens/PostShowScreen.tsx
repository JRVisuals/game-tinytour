import { Button, List, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function PostShowScreen() {
  const { state, prepNextLeg } = useGame()

  return (
    <Stack>
      <Title order={2}>Post-show</Title>
      <Text>{state.postShowRecap}</Text>
      {state.lastSetlist && (
        <>
          <Text fw={500}>Setlist (generated)</Text>
          <List size="sm">
            {state.lastSetlist.songs.map((song) => (
              <List.Item key={song}>{song}</List.Item>
            ))}
          </List>
        </>
      )}
      <Text size="sm" c="dimmed">
        Back toward shakedown energy — then hustle the next travel leg.
      </Text>
      <Button onClick={prepNextLeg}>Prep next leg</Button>
    </Stack>
  )
}
