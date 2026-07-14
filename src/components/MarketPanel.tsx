import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { useGame } from '../game/GameContext'
import type { MarketPrices, MarketStock } from '../game/types'

interface MarketPanelProps {
  prices: MarketPrices
  stock: MarketStock
  flavor?: string | null
  contextLabel: string
  showTickets?: boolean
}

export function MarketPanel({
  prices,
  stock,
  flavor,
  contextLabel,
  showTickets,
}: MarketPanelProps) {
  const { state, marketBuy, marketSell } = useGame()

  return (
    <Paper withBorder p="sm" mt="sm">
      <Text fw={600} mb="xs">
        Market — {contextLabel}
      </Text>
      {flavor && (
        <Text size="xs" c="dimmed" mb="xs">
          {flavor}
        </Text>
      )}
      <Text size="xs" c="dimmed" mb="sm">
        Limited stock per stop. Buy price &gt; sell price here — scout other spots to flip.
      </Text>
      <Stack gap="xs">
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('food')}
            disabled={state.resources.cash < prices.foodBuy || stock.food <= 0}
          >
            Buy food ${prices.foodBuy} ({stock.food} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('food')}
            disabled={state.resources.food <= 0}
          >
            Sell food ${prices.foodSell}
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('beer')}
            disabled={state.resources.cash < prices.beerBuy || stock.beer <= 0}
          >
            Buy beer ${prices.beerBuy} ({stock.beer} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('beer')}
            disabled={state.resources.beer <= 0}
          >
            Sell beer ${prices.beerSell}
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('drugs')}
            disabled={state.resources.cash < prices.drugsBuy || stock.drugs <= 0}
          >
            Buy substances ${prices.drugsBuy} ({stock.drugs} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('drugs')}
            disabled={state.resources.drugs <= 0}
          >
            Sell substances ${prices.drugsSell}
          </Button>
        </Group>
        {showTickets && prices.ticketBuy != null && (
          <Button
            size="xs"
            onClick={() => marketBuy('tickets')}
            disabled={state.resources.cash < prices.ticketBuy || stock.tickets <= 0}
          >
            Buy ticket ${prices.ticketBuy} ({stock.tickets} left)
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
