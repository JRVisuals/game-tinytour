import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { BALANCE, COPY, pickText } from '../game/config'
import { useGame } from '../game/GameContext'

export function ClownJuiceMafiaPanel() {
  const { state, clownJuiceBalloonChoice, resolveMarketCopChase } = useGame()
  const chase = state.marketCopChase
  const cfg = BALANCE.shakedown.clownJuiceMafia
  const fx = BALANCE.markets.balloons
  const chasePrompt = chase
    ? pickText(
        COPY.travelOutcomes.market_cop_chase.balloons_prompt,
        state.rngSeed,
        'Cops clocked the balloon cart.',
      )
    : null

  return (
    <Paper withBorder p="sm" bg="rgba(120,40,140,0.08)">
      <Text fw={600} mb="xs">
        Clown Juice Mafia
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        Vibe +{fx.vibe} / health {fx.health} per hit. Deal is {cfg.dealDoses} hits for ${cfg.dealPrice}
        — haggle risk: fist to the mouth.
      </Text>

      {chase && (
        <Alert color="red" title="Cops!" mb="sm">
          <Text size="sm" mb="xs">
            {chasePrompt} Balloons already hit. Pay ${chase.fine} or run?
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
        <Button
          size="sm"
          color="grape"
          onClick={() => clownJuiceBalloonChoice('retail')}
          disabled={!!chase || state.resources.cash < cfg.retailPrice}
        >
          Buy balloons — ${cfg.retailPrice}
        </Button>
        <Button
          size="sm"
          variant="light"
          color="grape"
          onClick={() => clownJuiceBalloonChoice('deal')}
          disabled={!!chase || state.resources.cash < cfg.dealPrice}
        >
          Make a deal — {cfg.dealDoses} for ${cfg.dealPrice} (punch risk)
        </Button>
      </Stack>
    </Paper>
  )
}
