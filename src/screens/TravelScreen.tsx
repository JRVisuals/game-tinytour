import { Button, Group, Progress, Stack, Text, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function TravelScreen() {
  const {
    state,
    travelAction,
    resolveTravelEvent,
    advanceTravelLeg,
  } = useGame()

  const tour = state.tour
  const travel = state.travel
  const stop = tour?.stops[tour.currentStopIndex]

  if (!tour || !travel || !stop) {
    return (
      <Stack>
        <Title order={2}>Travel</Title>
        <Text>No route loaded.</Text>
      </Stack>
    )
  }

  const leg = travel.legs[travel.currentLegIndex]
  const progress =
    travel.legs.length > 0
      ? ((travel.currentLegIndex + 1) / travel.legs.length) * 100
      : 0
  const event = travel.pendingEvent

  return (
    <Stack>
      <Title order={2}>On the road</Title>
      <Text>
        Following <strong>{tour.band.name}</strong> — next stop:{' '}
        <strong>{stop.city}</strong> ({stop.venue})
      </Text>
      <Text size="sm">
        {travel.origin} → {travel.destination}
      </Text>
      <Progress value={progress} size="sm" color="teal" />
      {leg && !event && (
        <>
          <Text fw={500}>
            Leg {travel.currentLegIndex + 1} of {travel.legs.length}: {leg.label}
          </Text>
          <Text size="sm" c="dimmed">
            {leg.flavor} (~{leg.miles} mi)
          </Text>
        </>
      )}
      {event && (
        <Stack gap="xs" p="sm" style={{ border: '1px solid #444', borderRadius: 8 }}>
          <Text fw={600}>{event.title}</Text>
          <Text size="sm">{event.body}</Text>
          {event.choices ? (
            <Group>
              {event.choices.map((c) => (
                <Button key={c.id} size="xs" onClick={() => resolveTravelEvent(c.id)}>
                  {c.label}
                </Button>
              ))}
            </Group>
          ) : (
            <Button size="xs" onClick={() => resolveTravelEvent()}>
              Deal with it
            </Button>
          )}
        </Stack>
      )}
      {!event && (
        <>
          <Text fw={500} size="sm">
            Road actions
          </Text>
          <Group>
            <Button size="xs" variant="light" onClick={() => travelAction('rest')}>
              Rest
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => travelAction('eat')}
              disabled={state.resources.food <= 0}
            >
              Eat
            </Button>
            <Button size="xs" variant="light" onClick={() => travelAction('hitch')}>
              Hitch
            </Button>
            <Button size="xs" variant="light" onClick={() => travelAction('push_through')}>
              Push through
            </Button>
            {state.resources.hasVehicle && (
              <Button
                size="xs"
                variant="light"
                onClick={() => travelAction('burn_gas')}
                disabled={state.resources.gas <= 0}
              >
                Burn gas
              </Button>
            )}
          </Group>
          <Button onClick={advanceTravelLeg}>Continue down the road</Button>
        </>
      )}
    </Stack>
  )
}
