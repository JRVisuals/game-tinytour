import { Divider, Group, Text, Tooltip } from '@mantine/core'
import { BET_SLOT_SHORT } from '../game/betting'
import type { Setlist, ShowBetResult } from '../game/types'

function betMarkerForSong(
  song: string,
  songIndex: number,
  songIds: string[],
  results: ShowBetResult[],
): { kind: 'hit' | 'miss' | 'void'; title: string } | null {
  const id = songIds[songIndex]
  const bet = results.find((r) => r.songId === id || r.songTitle === song)
  if (!bet) return null
  const slot = BET_SLOT_SHORT[bet.slot]
  if (bet.outcome === 'hit') {
    return { kind: 'hit' as const, title: `Bet hit (${slot}) +$${bet.payout}` }
  }
  if (bet.outcome === 'miss') {
    return { kind: 'miss' as const, title: `Bet missed (${slot})` }
  }
  return { kind: 'void' as const, title: `Bet void (${slot}) — not inside to hear it` }
}

interface SetlistRecapProps {
  setlist: Setlist
  betResults: ShowBetResult[]
  band?: string
  venue?: string
  city?: string
}

export function SetlistRecap({ setlist, betResults, band, venue, city }: SetlistRecapProps) {
  const songIds = setlist.songIds ?? []
  const missedBets = betResults.filter((r) => r.outcome === 'miss' || r.outcome === 'void')

  return (
    <>
      <Text fw={500}>Setlist</Text>
      {(band || venue || city) && (
        <Text size="sm" c="dimmed">
          {[band, venue, city].filter(Boolean).join(' · ')}
        </Text>
      )}
      {betResults.length > 0 && (
        <Text size="xs" c="dimmed">
          💰 hit · <Text component="span" c="red" inherit>✕</Text> missed
        </Text>
      )}
      <div style={{ borderRadius: 6, overflow: 'hidden' }}>
        {setlist.songs.map((song, i) => {
          const marker = betMarkerForSong(song, i, songIds, betResults)
          return (
            <Group
              key={song + i}
              gap="sm"
              wrap="nowrap"
              align="center"
              justify="space-between"
              px="sm"
              py={4}
              style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
            >
              <Text component="span" size="sm" style={{ flex: 1, minWidth: 0 }}>
                {i + 1}. {song}
              </Text>
              {marker && (
                <Tooltip label={marker.title} withArrow openDelay={200}>
                  {marker.kind === 'hit' ? (
                    <Text component="span" size="sm" aria-label={marker.title}>
                      💰
                    </Text>
                  ) : marker.kind === 'miss' ? (
                    <Text component="span" size="sm" c="red" fw={700} aria-label={marker.title}>
                      ✕
                    </Text>
                  ) : (
                    <Text component="span" size="sm" c="dimmed" aria-label={marker.title}>
                      —
                    </Text>
                  )}
                </Tooltip>
              )}
            </Group>
          )
        })}
      </div>
      {missedBets.length > 0 && (
        <>
          <Divider label="Missed bets" labelPosition="left" />
          <div style={{ borderRadius: 6, overflow: 'hidden' }}>
            {missedBets.map((r, i) => {
              const slot = BET_SLOT_SHORT[r.slot]
              const tooltipLabel = r.outcome === 'void'
                ? `Bet void (${slot}) — not inside to hear it`
                : `Bet missed (${slot})`
              return (
                <Group
                  key={r.songId + r.slot}
                  gap="sm"
                  wrap="nowrap"
                  align="center"
                  justify="space-between"
                  px="sm"
                  py={4}
                  style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                >
                  <Text component="span" size="sm" style={{ flex: 1, minWidth: 0 }}>
                    {r.songTitle}
                  </Text>
                  <Tooltip label={tooltipLabel} withArrow openDelay={200}>
                    <Text component="span" size="sm" c={r.outcome === 'void' ? 'dimmed' : 'red'} fw={700} aria-label={tooltipLabel}>
                      {r.outcome === 'void' ? '—' : '✕'}
                    </Text>
                  </Tooltip>
                </Group>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
