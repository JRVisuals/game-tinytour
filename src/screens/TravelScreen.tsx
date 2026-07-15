import { Alert, Button, Group, Progress, Stack, Text, Title } from '@mantine/core'
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
    advanceTravelLeg,
    visitRoadside,
    leaveRoadside,
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
  const roadside = leg?.roadside
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

  if (travel.atRoadside && roadside && state.currentMarket && state.currentMarketStock) {
    return (
      <Stack>
        <Title order={2}>{ROADSIDE_LABELS[roadside]}</Title>
        <Text size="sm">{ROADSIDE_COPY[roadside]}</Text>
        <Text size="xs" c="dimmed" ta="center">
          Roadside vendors — open Crew → Hustle to buy or sell.
        </Text>
        <Button variant="default" onClick={leaveRoadside}>
          Back on the road
        </Button>
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={2}>On the road</Title>
      <Text>
        Following <strong>{tour.band.name}</strong> — next stop:{' '}
        <strong>{stop.city}</strong> ({stop.venue})
      </Text>
      <Text size="sm">
        {travel.origin} → {travel.destination} · {travel.legs.length} leg
        {travel.legs.length === 1 ? '' : 's'}
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
          {roadside && (
            <Button size="sm" variant="light" onClick={visitRoadside}>
              Pull over — {ROADSIDE_LABELS[roadside]}
            </Button>
          )}
        </>
      )}
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
              Deal with it
            </Button>
          )}
        </Stack>
      )}
      {!event && (
        <>
          {!canAct && (
            <Alert color="red" title="Tour over">
              Everyone bailed. Shuffle on home from the header.
            </Alert>
          )}
          <Text fw={500} size="sm">
            Road actions
          </Text>
          <Stack gap="xs">
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
          <Button onClick={advanceTravelLeg} disabled={!canAct}>
            Continue down the road
          </Button>
        </>
      )}
    </Stack>
  )
}
