import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { useGame } from '../game/GameContext'
import type { MarketPrices } from '../game/types'

interface MarketPanelProps {
  prices: MarketPrices
  contextLabel: string
  showTickets?: boolean
}

export function MarketPanel({ prices, contextLabel, showTickets }: MarketPanelProps) {
  const { state, marketBuy, marketSell } = useGame()

  return (
    <Paper withBorder p="sm" mt="sm">
      <Text fw={600} mb="xs">
        Market — {contextLabel}
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        Prices shift by spot. Buy low somewhere else, sell high here — or regret it.
      </Text>
      <Stack gap="xs">
        <Group gap="xs">
          <Button size="compact-xs" onClick={() => marketBuy('food')} disabled={state.resources.cash < prices.foodBuy}>
            Buy food ${prices.foodBuy}
          </Button>
          <Button size="compact-xs" variant="default" onClick={() => marketSell('food')} disabled={state.resources.food <= 0}>
            Sell food ${prices.foodSell}
          </Button>
        </Group>
        <Group gap="xs">
          <Button size="compact-xs" onClick={() => marketBuy('beer')} disabled={state.resources.cash < prices.beerBuy}>
            Buy beer ${prices.beerBuy}
          </Button>
          <Button size="compact-xs" variant="default" onClick={() => marketSell('beer')} disabled={state.resources.beer <= 0}>
            Sell beer ${prices.beerSell}
          </Button>
        </Group>
        <Group gap="xs">
          <Button size="compact-xs" onClick={() => marketBuy('drugs')} disabled={state.resources.cash < prices.drugsBuy}>
            Buy substances ${prices.drugsBuy}
          </Button>
          <Button size="compact-xs" variant="default" onClick={() => marketSell('drugs')} disabled={state.resources.drugs <= 0}>
            Sell substances ${prices.drugsSell}
          </Button>
        </Group>
        {showTickets && prices.ticketBuy != null && (
          <Button size="compact-xs" onClick={() => marketBuy('tickets')} disabled={state.resources.cash < prices.ticketBuy}>
            Buy ticket ${prices.ticketBuy}
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
