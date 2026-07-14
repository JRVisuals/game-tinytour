import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function ShowScreen() {
  const { state, finishShow } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const ticketsNeeded = state.crew.length
  const hasTickets = state.resources.tickets >= ticketsNeeded

  const sneak = () => {
    // Stub: risk resolution fills in later (jail, ankle, etc.)
    finishShow()
  }

  return (
    <Stack>
      <Title order={2}>The show</Title>
      <Text>
        {stop?.dayLabel} — <strong>{stop?.venue}</strong>, {stop?.city}
      </Text>
      <Text>
        Tickets in hand: {state.resources.tickets} / {ticketsNeeded} needed.
      </Text>
      {hasTickets ? (
        <Text c="teal">Crew is ticketed. Go get weird.</Text>
      ) : (
        <Text c="orange">
          Short on tickets. You can still try the fence (stub risk).
        </Text>
      )}
      <Group>
        <Button onClick={finishShow} disabled={!hasTickets}>
          Walk in with tickets
        </Button>
        {!hasTickets && (
          <Button color="red" variant="light" onClick={sneak}>
            Sneak / scramble
          </Button>
        )}
      </Group>
      <Text size="sm" c="dimmed">
        Later: sit-out hustle, limited show activities, scoring from stock +
        entry.
      </Text>
    </Stack>
  )
}
