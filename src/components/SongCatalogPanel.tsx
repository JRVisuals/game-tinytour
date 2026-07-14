import { Badge, Button, Group, Paper, ScrollArea, Select, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import {
  BET_SLOT_LABEL,
  BET_SLOT_SHORT,
  BET_UI_AMOUNTS,
  MAX_ACTIVE_BETS,
} from '../game/betting'
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
  const stop = state.tour?.stops[state.tour.currentStopIndex]
  const [slot, setSlot] = useState<BetSlot>('anywhere')
  const [amount, setAmount] = useState(String(BET_UI_AMOUNTS[0] ?? 10))

  if (!catalog || !state.tour) return null

  const betAmount = Number(amount) || BET_UI_AMOUNTS[0] || 10
  const slotsLeft = MAX_ACTIVE_BETS - state.activeSetlistBets.length
  const canBet = slotsLeft > 0 && state.resources.cash >= betAmount
  const slotShort = BET_SLOT_SHORT[slot]
  const betButtonLabel = `$${betAmount} · ${slotShort}`

  return (
    <Paper withBorder p="sm">
      <Text fw={600} mb={4}>
        Setlist bets
      </Text>
      {stop && (
        <Text size="xs" c="dimmed" mb="xs">
          {state.tour.band.name} · {stop.venue}, {stop.city}
        </Text>
      )}
      <Text size="xs" c="dimmed" mb="sm">
        Pick placement & amount, then tap a song. {slotsLeft}/{MAX_ACTIVE_BETS} bets left.
      </Text>

      {state.activeSetlistBets.length > 0 && (
        <Stack gap={4} mb="sm" p="xs" style={{ background: 'rgba(0,80,70,0.15)', borderRadius: 6 }}>
          <Text size="xs" fw={600}>
            Active bets
          </Text>
          {state.activeSetlistBets.map((b) => (
            <Text key={`${b.songId}-${b.slot}`} size="sm">
              {b.songTitle} — ${b.amount} · {BET_SLOT_SHORT[b.slot]}
            </Text>
          ))}
        </Stack>
      )}

      <Group mb="sm" grow>
        <Select
          label="Song placement"
          size="xs"
          data={BET_SLOTS}
          value={slot}
          onChange={(v) => v && setSlot(v as BetSlot)}
        />
        <Select
          label="Bet amount"
          size="xs"
          data={BET_UI_AMOUNTS.map((n) => String(n))}
          value={amount}
          onChange={(v) => v && setAmount(v)}
        />
      </Group>

      <Text size="xs" c="teal" mb="xs" fw={500}>
        Next bet: {betButtonLabel}
      </Text>

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
                  size="xs"
                  variant="light"
                  color="teal"
                  disabled={!canBet || already}
                  onClick={() => placeSetlistBet(song.id, song.title, betAmount, slot)}
                >
                  {already ? 'Placed' : betButtonLabel}
                </Button>
              </Group>
            )
          })}
        </Stack>
      </ScrollArea>
    </Paper>
  )
}
