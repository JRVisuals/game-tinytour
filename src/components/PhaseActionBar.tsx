import { Button, Group, ScrollArea } from '@mantine/core'
import { activeCrew, canEnterVenue, venueEntryBlockedMessage } from '../game/crew/meters'
import { useGame } from '../game/GameContext'
import { BALANCE } from '../game/config'
import { canShowHustleMarket, marketShowTickets, isAtRoadsideHustle } from '../game/hustle/tab'
import { pickLocationAction, canAffordAction } from '../game/location/locationEvents'
import { LOT_DESTINATIONS } from '../game/marketCache'
import { ROADSIDE_LABELS, pushThroughCost } from '../game/travel/legs'
import { isLotTurnPhase } from '../game/showtime'
import { RESOURCE_BALANCE } from '../game/resources'

/**
 * Primary action buttons for the current phase — rendered above the tab bar.
 * Context-aware: shows verbs relevant to the active tab + current phase.
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
    marketBuy,
    marketSell,
    buyBalloons,
    leaveRoadsideAndAdvance,
    performLocationAction,
    hotelCrash,
    friendsCrash,
    goToLocation,
  } = useGame()

  const phase = state.phase
  const travel = state.travel
  const venueOk = canEnterVenue(state.crew)
  const gateMsg = venueEntryBlockedMessage(state.crew)
  const active = activeCrew(state.crew)
  const hasTickets = state.resources.tickets >= active.length

  // ── Hustle tab: market buy/sell buttons ──────────────────────────────────
  if (activeTab === 'hustle' && canShowHustleMarket(state) && state.currentMarket && state.currentMarketStock) {
    const { currentMarket: p, currentMarketStock: s, resources: r } = state
    const chase = state.marketCopChase
    const postShowBalloons = phase === 'post_show_shakedown'
    const showBalloons = postShowBalloons
    const atRoadside = isAtRoadsideHustle(state)
    const isPreShowLot = phase === 'shakedown' || phase === 'location'
    const balloonPrice = BALANCE.markets.balloons.price
    const showTickets = marketShowTickets(state)

    const outline = '0 0 2px rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1), -1px -1px 0 rgba(0,0,0,1)'
    const D = <span style={{ color: 'var(--mantine-color-red-5)', textShadow: outline }}>▼</span>
    const U = <span style={{ color: 'var(--mantine-color-green-5)', textShadow: outline }}>▲</span>

    return (
      <div className="phase-action-bar">
        <ScrollArea scrollbarSize={4}>
          <Group px="sm" py={6} gap="xs" wrap="nowrap">
            {/* Quick exit — context-aware: venue gates on lot, keep rolling on road */}
            {isPreShowLot ? (
              <Button size="xs" color="blue" onClick={() => { goToVenueGates(); onSwitchToScene() }}>
                Venue Gates
              </Button>
            ) : atRoadside ? (
              <Button size="xs" color="blue" onClick={() => { leaveRoadsideAndAdvance(); onSwitchToScene() }}>
                Keep rolling
              </Button>
            ) : null}
            {showBalloons && (
              <Button size="xs" color="grape" disabled={!!chase || r.cash < balloonPrice} onClick={() => buyBalloons()} title={`Buy balloons — $${balloonPrice}`}>
                {D}🎈 ${balloonPrice}
              </Button>
            )}
            <Button size="xs" disabled={!!chase || r.cash < p.foodBuy || s.food <= 0} onClick={() => marketBuy('food')} title={`Buy food — $${p.foodBuy}`}>
              {D}🌮 ${p.foodBuy}
            </Button>
            <Button size="xs" variant="subtle" color="gray" disabled={!!chase || r.food <= 0} onClick={() => marketSell('food')} title={`Sell food — $${p.foodSell}`}>
              {U}🌮 ${p.foodSell}
            </Button>
            <Button size="xs" disabled={!!chase || r.cash < p.beerBuy || s.beer <= 0} onClick={() => marketBuy('beer')} title={`Buy beer — $${p.beerBuy}`}>
              {D}🍺 ${p.beerBuy}
            </Button>
            <Button size="xs" variant="subtle" color="gray" disabled={!!chase || r.beer <= 0} onClick={() => marketSell('beer')} title={`Sell beer — $${p.beerSell}`}>
              {U}🍺 ${p.beerSell}
            </Button>
            <Button size="xs" disabled={!!chase || r.cash < p.drugsBuy || s.drugs <= 0} onClick={() => marketBuy('drugs')} title={`Buy substances — $${p.drugsBuy}`}>
              {D}🍄 ${p.drugsBuy}
            </Button>
            <Button size="xs" variant="subtle" color="gray" disabled={!!chase || r.drugs <= 0} onClick={() => marketSell('drugs')} title={`Sell substances — $${p.drugsSell}`}>
              {U}🍄 ${p.drugsSell}
            </Button>
            {showTickets && p.ticketBuy != null && (
              <Button size="xs" disabled={!!chase || r.cash < p.ticketBuy || s.tickets <= 0} onClick={() => marketBuy('tickets')} title={`Buy ticket — $${p.ticketBuy}`}>
                {D}🎟 ${p.ticketBuy}
              </Button>
            )}
            {r.hasVehicle && p.gasBuy != null && s.gas > 0 && (
              <Button size="xs" color="blue" disabled={!!chase || r.cash < p.gasBuy} onClick={() => marketBuy('gas')} title={`Buy gas — $${p.gasBuy}`}>
                {D}⛽ ${p.gasBuy}
              </Button>
            )}
          </Group>
        </ScrollArea>
      </div>
    )
  }

  // ── Non-scene tabs: urgent venue nudge ───────────────────────────────────
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

    if (event) return <div className="phase-action-bar phase-action-bar--empty" />
    return (
      <div className="phase-action-bar">
        <Group px="sm" py={6} gap="xs" wrap="wrap">
          <Button
            color="blue"
            disabled={!canAct}
            onClick={travel.atRoadside ? leaveRoadside : advanceTravelLeg}
          >
            {travel.atRoadside ? 'Back on the road' : 'Keep rolling'}
          </Button>
          {roadside && !travel.atRoadside && (
            <Button size="sm" color="blue" variant="light" className="action-bar-btn" onClick={visitRoadside}>
              Pull over — {ROADSIDE_LABELS[roadside]}
            </Button>
          )}
          {travel.atRoadside && (
            <Button size="sm" color="blue" variant="light" disabled>
              Pulled over — {roadside ? ROADSIDE_LABELS[roadside] : 'roadside'}
            </Button>
          )}
          <Button size="sm" color="orange" variant="light" disabled={!canAct} onClick={() => travelAction('rest')}>
            Rest
          </Button>
          <Button size="sm" color="orange" variant="light" disabled={!canAct} onClick={() => travelAction('hitch')}>
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

  // Shakedown + location phases — shared lot nav logic
  if (phase === 'shakedown' || phase === 'location') {
    const loc = state.currentLocation
    const isVenue = loc === 'venue'
    const noTurns = state.turnsUntilShow <= 0
    const locationAction = (phase === 'location' && !isVenue)
      ? pickLocationAction(loc, state.usedLocationActions, state.rngSeed)
      : null
    const canAffordHotel = state.resources.cash >= RESOURCE_BALANCE.hotelCrashCost
    const canAffordFriends = state.resources.cash >= RESOURCE_BALANCE.friendsCrashCost
    return (
      <div className="phase-action-bar">
        <ScrollArea scrollbarSize={4}>
          <Group px="sm" py={6} gap="xs" wrap="nowrap">
            {/* Nav destinations — shakedown first, then others; current loc styled as active tab */}
            {[
              ...LOT_DESTINATIONS.filter((d) => d.id === 'shakedown'),
              ...LOT_DESTINATIONS.filter((d) => d.id !== 'shakedown' && d.id !== 'venue'),
            ].map((d) => {
              const isCurrent = d.id === loc
              return (
                <Button
                  key={d.id}
                  size="sm"
                  variant={isCurrent ? 'filled' : 'subtle'}
                  color={isCurrent ? 'teal' : 'gray'}
                  disabled={!isCurrent && noTurns}
                  style={isCurrent ? { cursor: 'default', pointerEvents: 'none' } : undefined}
                  onClick={isCurrent ? undefined : () => goToLocation(d.id)}
                >
                  {d.label}
                </Button>
              )
            })}

            {/* One location action surfaced per visit — balloon encounters render inline, not here */}
            {locationAction && locationAction.id !== 'buy_balloons' && (() => {
              const disabled = !canAffordAction(locationAction, state.resources)
              let label = locationAction.label
              if (locationAction.id === 'celo') {
                const seed = Math.abs(state.rngSeed + state.resources.cash + state.runStats.milesTraveled)
                const ante = (1 + (seed % 10)) * 5
                label = `Play celó ($${ante} ante)`
              }
              return (
                <Button
                  key={locationAction.id}
                  size="sm"
                  color="yellow"
                  variant="light"
                  disabled={disabled}
                  onClick={() => performLocationAction(locationAction.id)}
                >
                  {label}
                </Button>
              )
            })()}

            {/* Hotel / friends crash */}
            {loc === 'hotel' && (
              <Button size="sm" color="blue" variant="light" disabled={noTurns || !canAffordHotel} onClick={hotelCrash}>
                Book room ${RESOURCE_BALANCE.hotelCrashCost}
              </Button>
            )}
            {loc === 'friends_house' && (
              <Button size="sm" color="blue" variant="light" disabled={noTurns || !canAffordFriends} onClick={friendsCrash}>
                Crash on couch ${RESOURCE_BALANCE.friendsCrashCost}
              </Button>
            )}

            {/* Venue gates — only reachable from shakedown lot, always last */}
            {isVenue && (
              <Button
                color="blue"
                className={venueOk ? 'action-bar-btn' : undefined}
                disabled={!venueOk || active.length === 0}
                onClick={enterShow}
              >
                Into the show
              </Button>
            )}
            {phase === 'shakedown' && (
              <Button
                color="blue"
                className={venueOk ? 'action-bar-btn' : undefined}
                disabled={!venueOk}
                onClick={goToVenueGates}
              >
                {noTurns ? 'Showtime — venue gates' : 'Venue gates'}
              </Button>
            )}
          </Group>
        </ScrollArea>
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
          <Button color="blue" className="action-bar-btn" onClick={enterPostShowShakedown}>After-show shakedown</Button>
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
