import { Button, Group } from '@mantine/core'
import { activeCrew, canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { BALANCE } from '../game/config'
import { ROADSIDE_LABELS, pushThroughCost } from '../game/travel/legs'
import { isLotTurnPhase } from '../game/showtime'

/**
 * Primary action buttons for the current phase — rendered above the tab bar.
 * On non-Scene tabs, shows the single most urgent action (or nothing).
 */
export function PhaseActionBar({
  activeTab,
  onSwitchToScene,
}: {
  activeTab: string
  onSwitchToScene: () => void
}) {
  const {
    state,
    advanceTravelLeg,
    travelAction,
    goToVenueGates,
    enterShow,
    missShow,
    finishShow,
    enterPostShowShakedown,
    prepNextLeg,
    visitRoadside,
    leaveRoadside,
  } = useGame()

  const phase = state.phase
  const travel = state.travel
  const venueOk = canEnterVenue(state.crew)
  const gateMsg = venueEntryBlockedMessage(state.crew)
  const active = activeCrew(state.crew)
  const hasTickets = state.resources.tickets >= active.length

  // On non-scene tabs only show the most urgent venue action
  if (activeTab !== 'scene') {
    const showVenueNudge =
      isLotTurnPhase(phase) && state.turnsUntilShow <= 1 && phase !== 'show'
    if (!showVenueNudge) return <div className="phase-action-bar phase-action-bar--empty" />
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button
            size="sm"
            color="blue"
            className={venueOk ? 'action-bar-btn' : undefined}
            disabled={!venueOk}
            onClick={() => { goToVenueGates(); onSwitchToScene() }}
          >
            {state.turnsUntilShow <= 0 ? 'Showtime — venue gates' : 'Venue gates'}
          </Button>
          {!venueOk && gateMsg && (
            <Button size="sm" variant="default" disabled>{gateMsg}</Button>
          )}
        </Group>
      </div>
    )
  }

  // Travel phase actions
  if (phase === 'travel' && travel) {
    const event = travel.pendingEvent
    const leg = travel.legs[travel.currentLegIndex]
    const roadside = leg?.roadside
    const canAct = active.length > 0
    const pushCost = !event && !travel.atRoadside ? pushThroughCost(travel, state.resources.hasVehicle) : null
    const canPush = canAct && pushCost != null && pushCost.legs > 0
      && state.resources.food >= pushCost.food
      && (!state.resources.hasVehicle || state.resources.gas >= pushCost.gas)
    const canBurnGas = canAct && state.resources.hasVehicle && state.resources.gas > 0
      && !event && !travel.atRoadside && travel.currentLegIndex < travel.legs.length
      && state.resources.gas >= BALANCE.travel.burnGas.gas

    if (travel.atRoadside) {
      return (
        <div className="phase-action-bar">
          <Group px="sm" py={6} gap="xs">
            <Button size="sm" color="blue" onClick={leaveRoadside}>Back on the road</Button>
          </Group>
        </div>
      )
    }
    if (event) return <div className="phase-action-bar phase-action-bar--empty" />
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs" wrap="wrap">
          <Button
            color="blue"
            disabled={!canAct}
            onClick={advanceTravelLeg}
          >
            Keep rolling
          </Button>
          {roadside && (
            <Button size="sm" color="blue" variant="light" className="action-bar-btn" onClick={visitRoadside}>
              Pull over — {ROADSIDE_LABELS[roadside]}
            </Button>
          )}
          <Button size="sm" color="blue" variant="light" disabled={!canAct} onClick={() => travelAction('rest')}>
            Rest
          </Button>
          <Button size="sm" color="blue" variant="light" disabled={!canAct} onClick={() => travelAction('hitch')}>
            Hitch
          </Button>
          <Button
            size="sm" variant="light" color="orange"
            disabled={!canPush}
            title={pushCost && pushCost.legs > 0 ? `Finish drive (${pushCost.legs} leg${pushCost.legs === 1 ? '' : 's'}, ~${pushCost.miles} mi) — costs ${pushCost.food} food${pushCost.gas > 0 ? `, ${pushCost.gas} gas` : ''}. Hard on crew.` : undefined}
            onClick={() => travelAction('push_through')}
          >
            Push through
          </Button>
          {state.resources.hasVehicle && (
            <Button
              size="sm" variant="light" color="blue"
              disabled={!canBurnGas}
              title={`Cruise up to 2 legs (~${BALANCE.travel.burnGas.gas} gas) — skips road events, sometimes scores a beer.`}
              onClick={() => travelAction('burn_gas')}
            >
              Burn gas
            </Button>
          )}
        </Group>
      </div>
    )
  }

  // Shakedown + lot location
  if (phase === 'shakedown' || (phase === 'location' && state.currentLocation !== 'venue')) {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button
            color="blue"
            className={venueOk ? 'action-bar-btn' : undefined}
            disabled={!venueOk}
            onClick={goToVenueGates}
            title={!venueOk ? (gateMsg ?? undefined) : undefined}
          >
            {state.turnsUntilShow <= 0 ? 'Showtime — venue gates' : 'Venue gates'}
          </Button>
        </Group>
      </div>
    )
  }

  // Venue gates
  if (phase === 'location' && state.currentLocation === 'venue') {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button
            color="blue"
            className={venueOk ? 'action-bar-btn' : undefined}
            disabled={!venueOk || active.length === 0}
            onClick={enterShow}
          >
            Into the show
          </Button>
        </Group>
      </div>
    )
  }

  // Show gate
  if (phase === 'show') {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          {venueOk && hasTickets && (
            <Button color="blue" className="action-bar-btn" onClick={finishShow}>
              Walk in with tickets
            </Button>
          )}
          {venueOk && !hasTickets && (
            <Button color="orange" variant="light" onClick={finishShow}>
              Sneak / scramble
            </Button>
          )}
          <Button variant="default" onClick={missShow}>Stay out &amp; hustle</Button>
        </Group>
      </div>
    )
  }

  // Post-show
  if (phase === 'post_show') {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button color="blue" onClick={enterPostShowShakedown}>After-show shakedown</Button>
        </Group>
      </div>
    )
  }

  // Post-show shakedown
  if (phase === 'post_show_shakedown') {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button color="blue" className="action-bar-btn" onClick={prepNextLeg}>Hit the road</Button>
        </Group>
      </div>
    )
  }

  return <div className="phase-action-bar phase-action-bar--empty" />
}
