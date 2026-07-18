import { Paper, Stack, Text } from '@mantine/core'
import { ClownJuiceMafiaPanel } from '../ClownJuiceMafiaPanel'
import { MarketPanel } from '../MarketPanel'
import { ScreenFrame } from '../ScreenFrame'
import { SongCatalogPanel } from '../SongCatalogPanel'
import { useGame } from '../../game/GameContext'
import {
  canShowHustleMarket,
  hasClownJuiceMafia,
  hustleContextBlurb,
  hustleLocationLabel,
  hustleTabActive,
  isHustleContext,
  marketShowTickets,
  showSetlistBets,
} from '../../game/hustle/tab'

export function HustleTab() {
  const { state } = useGame()
  const inContext = isHustleContext(state)
  const hasAnything = hustleTabActive(state)
  const clownJuice = hasClownJuiceMafia(state)
  const bets = showSetlistBets(state)
  const showMarket = canShowHustleMarket(state)
  const locationLabel = hustleLocationLabel(state)
  const hustleTitle = locationLabel ? `Hustle: ${locationLabel}` : 'Hustle'

  return (
    <Paper withBorder p="lg" radius="md">
      <ScreenFrame title={hustleTitle} compactArt>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">{hustleContextBlurb(state)}</Text>

          {inContext && clownJuice && <ClownJuiceMafiaPanel />}

          {showMarket && (
            <MarketPanel
              prices={state.currentMarket!}
              stock={state.currentMarketStock!}
              flavor={null}
              contextLabel={state.marketContext ?? 'lot'}
              showTickets={marketShowTickets(state)}
              displayOnly
            />
          )}

          {inContext && bets && (
            <Stack gap="xs">
              <Text size="sm" fw={600}>Setlist bets</Text>
              <SongCatalogPanel />
            </Stack>
          )}

          {!hasAnything && (
            <Text size="sm" c="dimmed" ta="center">
              {state.phase === 'travel'
                ? 'On the road — pull over or reach the next stop to hustle.'
                : 'No vendors, no bets, no sketchy balloon carts. Check Scene for where to go next.'}
            </Text>
          )}

        </Stack>
      </ScreenFrame>
    </Paper>
  )
}
