import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core'
import { activeCrew, canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'

export function ShowScreen() {
  const { state, finishShow, missShow } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const active = activeCrew(state.crew)
  const ticketsNeeded = active.length
  const hasTickets = state.resources.tickets >= ticketsNeeded
  const venueOk = canEnterVenue(state.crew)
  const gateMessage = venueEntryBlockedMessage(state.crew)

  return (
    <Stack>
      <Title order={2}>The show</Title>
      <Text>
        {stop?.dayLabel} — <strong>{stop?.venue}</strong>, {stop?.city}
      </Text>
      <Text>
        Tickets: {state.resources.tickets} / {ticketsNeeded} active crew
      </Text>
      {!venueOk && gateMessage && (
        <Alert color="red" title="Turned away at the gate">
          {gateMessage}
        </Alert>
      )}
      {venueOk && hasTickets ? (
        <Text c="teal">Crew is ticketed. Go get weird.</Text>
      ) : venueOk ? (
        <Text c="orange">
          Short on tickets. Sneak, scramble, or miss the show and hustle the next leg.
        </Text>
      ) : null}
      <Group>
        <Button
          onClick={finishShow}
          disabled={!hasTickets || ticketsNeeded === 0 || !venueOk}
        >
          Walk in with tickets
        </Button>
        {!hasTickets && venueOk && (
          <Button color="red" variant="light" onClick={finishShow}>
            Sneak / scramble
          </Button>
        )}
        <Button variant="default" onClick={missShow}>
          Stay out & hustle
        </Button>
      </Group>
      {ticketsNeeded === 0 && (
        <Text size="sm" c="red">
          No active crew left at the gate.
        </Text>
      )}
    </Stack>
  )
}
