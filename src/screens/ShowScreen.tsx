import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { activeCrew } from '../game/crew/meters'
import { useGame } from '../game/GameContext'

export function ShowScreen() {
  const { state, finishShow, missShow } = useGame()
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const active = activeCrew(state.crew)
  const ticketsNeeded = active.length
  const hasTickets = state.resources.tickets >= ticketsNeeded

  const sneak = () => {
    finishShow()
  }

  return (
    <Stack>
      <Title order={2}>The show</Title>
      <Text>
        {stop?.dayLabel} — <strong>{stop?.venue}</strong>, {stop?.city}
      </Text>
      <Text>
        Tickets: {state.resources.tickets} / {ticketsNeeded} active crew
      </Text>
      {hasTickets ? (
        <Text c="teal">Crew is ticketed. Go get weird.</Text>
      ) : (
        <Text c="orange">
          Short on tickets. Sneak, scramble, or miss the show and hustle the next leg.
        </Text>
      )}
      <Group>
        <Button onClick={finishShow} disabled={!hasTickets || ticketsNeeded === 0}>
          Walk in with tickets
        </Button>
        {!hasTickets && (
          <Button color="red" variant="light" onClick={sneak}>
            Sneak / scramble
          </Button>
        )}
        <Button variant="default" onClick={missShow}>
          Miss the show (hustle)
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
