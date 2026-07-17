import { Button, Group } from '@mantine/core'
import { activeCrew, canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { ROADSIDE_LABELS } from '../game/travel/legs'
import { isLotTurnPhase } from '../game/showtime'

/**
 * Primary action buttons for the current phase — rendered above the tab bar.
 * On non-Scene tabs, shows the single most urgent action (or nothing).
 */
export function PhaseActionBar({ activeTab }: { activeTab: string }) {
  const {
    state,
    advanceTravelLeg,
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
            color="teal"
            className={venueOk ? 'title-start-btn' : undefined}
            disabled={!venueOk}
            onClick={goToVenueGates}
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

    if (travel.atRoadside) {
      return (
        <div className="phase-action-bar">
          <Group px="sm" py={6} gap="xs">
            <Button size="sm" color="teal" onClick={leaveRoadside}>Back on the road</Button>
          </Group>
        </div>
      )
    }
    if (event) return <div className="phase-action-bar phase-action-bar--empty" />
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button
            color="teal"
            className={active.length > 0 ? 'title-start-btn' : undefined}
            disabled={active.length === 0}
            onClick={advanceTravelLeg}
          >
            Keep rolling
          </Button>
          {roadside && (
            <Button size="sm" variant="light" onClick={visitRoadside}>
              Pull over — {ROADSIDE_LABELS[roadside]}
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
            color="teal"
            className={venueOk ? 'title-start-btn' : undefined}
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
            color="teal"
            className={venueOk ? 'title-start-btn' : undefined}
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
            <Button color="teal" className="title-start-btn" onClick={finishShow}>
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
          <Button color="teal" onClick={enterPostShowShakedown}>After-show shakedown</Button>
        </Group>
      </div>
    )
  }

  // Post-show shakedown
  if (phase === 'post_show_shakedown') {
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs">
          <Button color="teal" className="title-start-btn" onClick={prepNextLeg}>Hit the road</Button>
        </Group>
      </div>
    )
  }

  return <div className="phase-action-bar phase-action-bar--empty" />
}
