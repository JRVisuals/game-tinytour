import { Badge, Button, Group, Paper, ScrollArea, Select, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { BET_SLOT_LABEL } from '../game/betting'
import { useGame } from '../game/GameContext'
import type { BetSlot, SongTier } from '../game/types'

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

const BET_SLOTS: { value: BetSlot; label: string }[] = [
  { value: 'anywhere', label: BET_SLOT_LABEL.anywhere },
  { value: 'opener', label: BET_SLOT_LABEL.opener },
  { value: 'closer', label: BET_SLOT_LABEL.closer },
  { value: 'encore', label: BET_SLOT_LABEL.encore },
]

export function SongCatalogPanel() {
  const { state, placeSetlistBet } = useGame()
  const catalog = state.tour?.catalog
  const [slot, setSlot] = useState<BetSlot>('anywhere')
  const [amount, setAmount] = useState('10')

  if (!catalog) return null

  const betAmount = Number(amount) || 10
  const canBet =
    state.activeSetlistBets.length < 3 &&
    state.resources.cash >= betAmount

  return (
    <Paper withBorder p="sm" mt="md">
      <Text fw={600} mb="xs">
        Band catalog ({catalog.songs.length} songs)
      </Text>
      <Text size="xs" c="dimmed" mb="sm">
        Hot · Deep cut · Bust out. Up to 3 bets per show.
      </Text>

      {state.activeSetlistBets.length > 0 && (
        <Stack gap={4} mb="sm" p="xs" style={{ background: 'rgba(0,80,70,0.15)', borderRadius: 6 }}>
          <Text size="xs" fw={600}>
            Active bets
          </Text>
          {state.activeSetlistBets.map((b) => (
            <Text key={`${b.songId}-${b.slot}`} size="sm">
              {b.songTitle} — {BET_SLOT_LABEL[b.slot]} (${b.amount})
            </Text>
          ))}
        </Stack>
      )}

      <Group mb="sm" grow>
        <Select
          label="Bet type"
          size="xs"
          data={BET_SLOTS}
          value={slot}
          onChange={(v) => v && setSlot(v as BetSlot)}
        />
        <Select
          label="Amount"
          size="xs"
          data={['10', '20', '50']}
          value={amount}
          onChange={(v) => v && setAmount(v)}
        />
      </Group>

      <ScrollArea h={220} type="auto" offsetScrollbars>
        <Stack gap={6} pr="xs">
          {catalog.songs.map((song) => {
            const already = state.activeSetlistBets.some((b) => b.songId === song.id)
            return (
              <Group key={song.id} justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  <Badge size="xs" color={TIER_COLOR[song.tier]} variant="light">
                    {TIER_LABEL[song.tier]}
                  </Badge>
                  <Text size="sm" truncate>
                    {song.title}
                  </Text>
                </Group>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  disabled={!canBet || already}
                  onClick={() => placeSetlistBet(song.id, song.title, betAmount, slot)}
                >
                  Bet
                </Button>
              </Group>
            )
          })}
        </Stack>
      </ScrollArea>
    </Paper>
  )
}
