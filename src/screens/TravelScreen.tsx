import { Alert, Button, Group, Stack, Text } from '@mantine/core'
import { SceneCrewNudge } from '../components/SceneCrewNudge'
import { activeCrew } from '../game/crew/meters'
import { ROADSIDE_COPY, ROADSIDE_LABELS } from '../game/travel/legs'
import { useGame } from '../game/GameContext'

export function TravelScreen() {
  const { state, resolveTravelEvent } = useGame()

  const tour = state.tour
  const travel = state.travel
  const stop = tour?.stops[tour.currentStopIndex]

  if (!tour || !travel || !stop) {
    return <Text c="dimmed">No route loaded.</Text>
  }

  const leg = travel.legs[travel.currentLegIndex]
  const event = travel.pendingEvent
  const canAct = activeCrew(state.crew).length > 0

  // At roadside — narrative + hustle nudge
  if (travel.atRoadside && leg?.roadside) {
    return (
      <Stack>
        <Text fw={600}>{ROADSIDE_LABELS[leg.roadside]}</Text>
        <Text size="md">{ROADSIDE_COPY[leg.roadside]}</Text>
        {state.currentMarket && (
          <Text size="md" c="blue.4">
            Vendors are set up — check the Hustle tab to buy and sell.
          </Text>
        )}
      </Stack>
    )
  }

  const isIntro = !!travel.introFlavor && !event

  return (
    <Stack>
      {/* Intro departure scene — first leg of the run */}
      {isIntro && (
        <Text size="md">{travel.introFlavor}</Text>
      )}

      {/* Leg location name + flavor */}
      {leg && !event && !isIntro && (
        <>
          <Text fw={600} size="md">{leg.label}</Text>
          <Text size="md">{leg.flavor}</Text>
          {leg.roadside && (
            <Text size="md" c="blue.4">
              There's a {ROADSIDE_LABELS[leg.roadside].toLowerCase()} on this stretch if you want to pull over.
            </Text>
          )}
        </>
      )}

      {/* Road event card */}
      {event && (
        <Stack gap="xs" p="sm" style={{ border: '1px solid #444', borderRadius: 8 }}>
          <Text fw={600}>{event.title}</Text>
          <Text size="sm">{event.body}</Text>
          {event.choices ? (
            <Group>
              {event.choices.map((c) => (
                <Button key={c.id} size="sm" onClick={() => resolveTravelEvent(c.id)}>
                  {c.label}
                </Button>
              ))}
            </Group>
          ) : (
            <Button size="sm" onClick={() => resolveTravelEvent()}>
              {(['Roll with it', 'Onward', 'Back on the road', 'Copy that'] as const)[
                event.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 4
              ]}
            </Button>
          )}
        </Stack>
      )}

      {!event && !canAct && (
        <Alert color="red" title="Tour over">
          Everyone bailed. Shuffle on home from the header.
        </Alert>
      )}
      {!event && <SceneCrewNudge inline />}
    </Stack>
  )
}
