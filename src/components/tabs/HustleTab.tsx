import { Paper, Stack, Text } from '@mantine/core'
import { BackToSceneButton } from '../BackToSceneButton'
import { TabPanelHeader } from '../TabPanelHeader'
import { ClownJuiceMafiaPanel } from '../ClownJuiceMafiaPanel'
import { MarketPanel } from '../MarketPanel'
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

interface HustleTabProps {
  onBackToScene: () => void
}

export function HustleTab({ onBackToScene }: HustleTabProps) {
  const { state } = useGame()
  const inContext = isHustleContext(state)
  const hasAnything = hustleTabActive(state)
  const clownJuice = hasClownJuiceMafia(state)
  const bets = showSetlistBets(state)
  const postShowBalloons = state.phase === 'post_show_shakedown'
  const showMarket = canShowHustleMarket(state)
  const locationLabel = hustleLocationLabel(state)
  const hustleTitle = locationLabel ? `Hustle: ${locationLabel}` : 'Hustle'

  return (
    <Stack gap="sm">
      <TabPanelHeader title={hustleTitle} blurb={hustleContextBlurb(state)} />

      {inContext && clownJuice && <ClownJuiceMafiaPanel />}

      {showMarket && (
        <Paper withBorder p="sm">
          <MarketPanel
            prices={state.currentMarket!}
            stock={state.currentMarketStock!}
            flavor={null}
            contextLabel={state.marketContext ?? 'lot'}
            showTickets={marketShowTickets(state)}
            showBalloons={postShowBalloons && !clownJuice}
          />
        </Paper>
      )}

      {inContext && bets && (
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Setlist bets
          </Text>
          <SongCatalogPanel />
        </Stack>
      )}

      {!hasAnything && (
        <Paper withBorder p="md" bg="rgba(0,0,0,0.15)">
          <Text size="sm" c="dimmed" ta="center">
            {state.phase === 'travel'
              ? 'On the road — pull over or reach the next stop to hustle.'
              : 'No vendors, no bets, no sketchy balloon carts. Check Scene for where to go next.'}
          </Text>
        </Paper>
      )}

      <BackToSceneButton onBackToScene={onBackToScene} exitSubStop />
    </Stack>
  )
}
