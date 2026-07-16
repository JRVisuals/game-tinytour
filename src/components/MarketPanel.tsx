import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { BALANCE, COPY, pickText } from '../game/config'
import { useGame } from '../game/GameContext'
import type { MarketPrices, MarketStock } from '../game/types'

interface MarketPanelProps {
  prices: MarketPrices
  stock: MarketStock
  flavor?: string | null
  contextLabel: string
  showTickets?: boolean
  showBalloons?: boolean
}

export function MarketPanel({
  prices,
  stock,
  flavor,
  contextLabel: _contextLabel,
  showTickets,
  showBalloons,
}: MarketPanelProps) {
  const { state, marketBuy, marketSell, buyBalloons, resolveMarketCopChase } = useGame()
  const chase = state.marketCopChase
  const balloonPrice = BALANCE.markets.balloons.price
  const chasePrompt = chase
    ? pickText(
        chase.reason === 'balloons'
          ? COPY.travelOutcomes.market_cop_chase.balloons_prompt
          : COPY.travelOutcomes.market_cop_chase.prompt,
        state.rngSeed,
        chase.reason === 'balloons'
          ? 'Cops clocked the balloon cart.'
          : 'Undercovers saw the handoff.',
      )
    : null

  return (
    <Paper withBorder p="sm" mt="sm">
      <Text fw={600} mb="xs">
        Market
      </Text>
      {flavor && (
        <Text size="xs" c="dimmed" mb="xs">
          {flavor}
        </Text>
      )}
      <Text size="xs" c="dimmed" mb="sm">
        Limited stock per stop. Buy price &gt; sell price here — scout other spots to flip.
      </Text>

      {chase && (
        <Alert color="red" title="Cops!" mb="sm">
          <Text size="sm" mb="xs">
            {chase.reason === 'balloons'
              ? `${chasePrompt} Balloons already hit. Pay $${chase.fine} or run?`
              : `${chasePrompt} Sale went through (+$${chase.proceeds}). Pay $${chase.fine} or run?`}
          </Text>
          <Group gap="xs">
            <Button size="xs" onClick={() => resolveMarketCopChase('stay')}>
              Stay — pay ${chase.fine}
            </Button>
            <Button size="xs" variant="light" color="orange" onClick={() => resolveMarketCopChase('run')}>
              Run
            </Button>
          </Group>
        </Alert>
      )}

      <Stack gap="xs">
        {showBalloons && (
          <Button
            size="xs"
            color="grape"
            onClick={() => buyBalloons()}
            disabled={!!chase || state.resources.cash < balloonPrice}
          >
            Balloons ${balloonPrice} — vibe up, health down
          </Button>
        )}
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('food')}
            disabled={!!chase || state.resources.cash < prices.foodBuy || stock.food <= 0}
          >
            Buy food ${prices.foodBuy} ({stock.food} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('food')}
            disabled={!!chase || state.resources.food <= 0}
          >
            Sell food ${prices.foodSell} ({state.resources.food})
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('beer')}
            disabled={!!chase || state.resources.cash < prices.beerBuy || stock.beer <= 0}
          >
            Buy beer ${prices.beerBuy} ({stock.beer} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('beer')}
            disabled={!!chase || state.resources.beer <= 0}
          >
            Sell beer ${prices.beerSell} ({state.resources.beer})
          </Button>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            onClick={() => marketBuy('drugs')}
            disabled={!!chase || state.resources.cash < prices.drugsBuy || stock.drugs <= 0}
          >
            Buy substances ${prices.drugsBuy} ({stock.drugs} left)
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={() => marketSell('drugs')}
            disabled={!!chase || state.resources.drugs <= 0}
          >
            Sell substances ${prices.drugsSell} ({state.resources.drugs})
          </Button>
        </Group>
        {showTickets && prices.ticketBuy != null && (
          <Button
            size="xs"
            onClick={() => marketBuy('tickets')}
            disabled={!!chase || state.resources.cash < prices.ticketBuy || stock.tickets <= 0}
          >
            Buy ticket ${prices.ticketBuy} ({stock.tickets} left)
          </Button>
        )}
        {state.resources.hasVehicle && prices.gasBuy != null && stock.gas > 0 && (
          <Button
            size="xs"
            color="yellow"
            onClick={() => marketBuy('gas')}
            disabled={!!chase || state.resources.cash < prices.gasBuy}
          >
            Buy gas ${prices.gasBuy} (+{BALANCE.markets.gasUnitsPerBuy} ⛽, {stock.gas} left)
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
