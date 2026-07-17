import { Alert, Button, Group, Stack, Text } from '@mantine/core'
import { SceneCrewNudge } from '../components/SceneCrewNudge'
import { BALANCE } from '../game/config'
import { activeCrew } from '../game/crew/meters'
import {
  ROADSIDE_COPY,
  ROADSIDE_LABELS,
  pushThroughCost,
} from '../game/travel/legs'
import { useGame } from '../game/GameContext'

export function TravelScreen() {
  const {
    state,
    travelAction,
    resolveTravelEvent,
  } = useGame()

  const tour = state.tour
  const travel = state.travel
  const stop = tour?.stops[tour.currentStopIndex]

  if (!tour || !travel || !stop) {
    return <Text c="dimmed">No route loaded.</Text>
  }

  const leg = travel.legs[travel.currentLegIndex]
  const event = travel.pendingEvent
  const activeCount = activeCrew(state.crew).length
  const canAct = activeCount > 0
  const pushCost =
    travel && !travel.pendingEvent && !travel.atRoadside
      ? pushThroughCost(travel, state.resources.hasVehicle)
      : null
  const canPush =
    canAct &&
    pushCost != null &&
    pushCost.legs > 0 &&
    state.resources.food >= pushCost.food &&
    (!state.resources.hasVehicle || state.resources.gas >= pushCost.gas)
  const canBurnGas =
    canAct &&
    state.resources.hasVehicle &&
    state.resources.gas > 0 &&
    !event &&
    !travel.atRoadside &&
    travel.currentLegIndex < travel.legs.length

  // At roadside
  if (travel.atRoadside && leg?.roadside && state.currentMarket && state.currentMarketStock) {
    return (
      <Stack>
        <Text fw={600}>{ROADSIDE_LABELS[leg.roadside]}</Text>
        <Text size="sm">{ROADSIDE_COPY[leg.roadside]}</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      {/* Current leg flavor */}
      {leg && !event && (
        <Stack gap={4}>
          <Text fw={500}>
            Leg {travel.currentLegIndex + 1} of {travel.legs.length}: {leg.label}
          </Text>
          <Text size="sm" c="dimmed">
            {leg.flavor} (~{leg.miles} mi)
          </Text>
        </Stack>
      )}

      {/* Road event */}
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

      {/* Secondary road actions */}
      {!event && (
        <Stack gap="xs">
          {!canAct && (
            <Alert color="red" title="Tour over">
              Everyone bailed. Shuffle on home from the header.
            </Alert>
          )}
          <SceneCrewNudge inline />
          <Text fw={500} size="sm">Road actions</Text>
          <Group>
            <Button size="sm" variant="light" onClick={() => travelAction('rest')} disabled={!canAct}>
              Rest
            </Button>
            <Button size="sm" variant="light" onClick={() => travelAction('hitch')} disabled={!canAct}>
              Hitch
            </Button>
            <Button
              size="sm"
              variant="light"
              color="orange"
              onClick={() => travelAction('push_through')}
              disabled={!canPush}
            >
              Push through
            </Button>
            {state.resources.hasVehicle && (
              <Button
                size="sm"
                variant="light"
                color="teal"
                onClick={() => travelAction('burn_gas')}
                disabled={!canBurnGas}
              >
                Burn gas
              </Button>
            )}
          </Group>
          {state.resources.hasVehicle && (
            <Text size="xs" c="dimmed">
              Burn gas: cruise up to 2 legs (~{BALANCE.travel.burnGas.gas} gas) — skips road
              events, boosts vibe, sometimes scores a beer.
            </Text>
          )}
          {pushCost && pushCost.legs > 0 && (
            <Text size="xs" c="dimmed">
              Push through: finish the drive ({pushCost.legs} leg{pushCost.legs === 1 ? '' : 's'}, ~
              {pushCost.miles} mi) — costs {pushCost.food} food
              {pushCost.gas > 0 ? `, ${pushCost.gas} gas` : ''}. Skips roadside events. Hard on
              crew.
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  )
}
