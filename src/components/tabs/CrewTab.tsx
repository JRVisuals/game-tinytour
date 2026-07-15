import { useState } from 'react'
import { Paper, SegmentedControl, Stack, Text } from '@mantine/core'
import { CrewMeterPanel } from '../CrewMeterPanel'
import { MarketPanel } from '../MarketPanel'
import { StatusBar } from '../StatusBar'
import { useGame } from '../../game/GameContext'
import type { GameState } from '../../game/types'
import { isClownJuiceMafia } from '../../game/shakedown/events'

function marketShowTickets(state: GameState): boolean {
  return (
    state.phase === 'shakedown' ||
    state.phase === 'post_show_shakedown' ||
    (state.phase === 'location' && state.currentLocation === 'venue')
  )
}

export function CrewTab() {
  const { state } = useGame()
  const hasMarket = !!(state.currentMarket && state.currentMarketStock)
  const [section, setSection] = useState<'crew' | 'hustle'>('crew')
  const showBalloons =
    state.phase === 'post_show_shakedown' ||
    (state.phase === 'shakedown' && isClownJuiceMafia(state.shakedownLotEvent))

  return (
    <Stack gap="sm">
      <StatusBar />
      {hasMarket && (
        <SegmentedControl
          fullWidth
          size="xs"
          value={section}
          onChange={(v) => setSection(v as 'crew' | 'hustle')}
          data={[
            { label: 'Your Crew', value: 'crew' },
            { label: 'Hustle', value: 'hustle' },
          ]}
        />
      )}
      {section === 'hustle' && hasMarket ? (
        <Paper withBorder p="sm">
          <Text size="xs" c="dimmed" mb="sm">
            {state.marketFlavor ?? `Trading at ${state.marketContext ?? 'the lot'}.`}
          </Text>
          <MarketPanel
            prices={state.currentMarket!}
            stock={state.currentMarketStock!}
            flavor={null}
            contextLabel={state.marketContext ?? 'lot'}
            showTickets={marketShowTickets(state)}
            showBalloons={showBalloons}
          />
        </Paper>
      ) : (
        <CrewMeterPanel />
      )}
      {hasMarket && section === 'crew' && (
        <Text size="xs" c="dimmed" ta="center">
          Vendors nearby — open Hustle above.
        </Text>
      )}
      {!hasMarket && state.phase === 'travel' && (
        <Text size="xs" c="dimmed" ta="center">
          No vendors here. Pull over or reach the lot to hustle.
        </Text>
      )}
    </Stack>
  )
}
