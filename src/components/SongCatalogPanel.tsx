import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { useGame } from '../game/GameContext'
import type { SongTier } from '../game/types'

const TIER_LABEL: Record<SongTier, string> = {
  hot: 'Hot',
  deep_cut: 'Deep cut',
  bust_out: 'Bust out',
}

const TIER_COLOR: Record<SongTier, string> = {
  hot: 'teal',
  deep_cut: 'grape',
  bust_out: 'orange',
}

export function SongCatalogPanel() {
  const { state, placeSetlistBet } = useGame()
  const catalog = state.tour?.catalog
  if (!catalog) return null

  return (
    <Paper withBorder p="sm" mt="md">
      <Text fw={600} mb="xs">
        Band catalog ({catalog.songs.length} songs)
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        Hot = likely · Deep cut = rarer · Bust out = once-a-tour energy. Bet $10 on a song
        (one bet per show).
      </Text>
      <Stack gap={6}>
        {catalog.songs.map((song) => (
          <Group key={song.id} justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Badge size="xs" color={TIER_COLOR[song.tier]} variant="light">
                {TIER_LABEL[song.tier]}
              </Badge>
              <Text size="sm">{song.title}</Text>
            </Group>
            <Button
              size="compact-xs"
              variant="subtle"
              disabled={
                !!state.activeSetlistBet || state.resources.cash < 10
              }
              onClick={() => placeSetlistBet(song.id, song.title, 10)}
            >
              Bet $10
            </Button>
          </Group>
        ))}
      </Stack>
      {state.activeSetlistBet && (
        <Text size="sm" mt="sm" c="teal">
          Active bet: {state.activeSetlistBet.songTitle} (${state.activeSetlistBet.amount})
        </Text>
      )}
    </Paper>
  )
}
