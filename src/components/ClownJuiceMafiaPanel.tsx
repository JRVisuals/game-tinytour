import { Alert, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { BALANCE, COPY, pickText } from '../game/config'
import { canAttemptClownJuiceDeal } from '../game/shakedown/clownJuice'
import { useGame } from '../game/GameContext'

export function ClownJuiceMafiaPanel() {
  const { state, clownJuiceBalloonChoice, resolveMarketCopChase } = useGame()
  const chase = state.marketCopChase
  const cfg = BALANCE.shakedown.clownJuiceMafia
  const blurb = pickText(
    COPY.travelOutcomes.clown_juice.panel,
    state.rngSeed + 77,
    "Who doesn't love bloons?!",
  )
  const chasePrompt = chase
    ? pickText(
        COPY.travelOutcomes.market_cop_chase.balloons_prompt,
        state.rngSeed,
        'Cops clocked the balloon cart.',
      )
    : null

  return (
    <Paper withBorder p="sm" className="clown-juice-panel">
      <Text fw={600} mb="xs">
        Clown Juice Mafia
      </Text>
      <Text size="sm" c="gray.2" mb="sm" fs="italic">
        {blurb}
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
          disabled={!!chase || !canAttemptClownJuiceDeal(state.resources)}
        >
          Make a deal — {cfg.dealDoses} for ${cfg.dealPrice}
        </Button>
      </Stack>
    </Paper>
  )
}
