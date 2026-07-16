import { Group, List, Text, Tooltip } from '@mantine/core'
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
      <List size="sm">
        {setlist.songs.map((song, i) => {
          const marker = betMarkerForSong(song, i, songIds, betResults)
          return (
            <List.Item key={song + i}>
              <Group gap="sm" wrap="nowrap" align="center" justify="space-between">
                <Text component="span" size="sm" style={{ flex: 1, minWidth: 0 }}>
                  {song}
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
            </List.Item>
          )
        })}
      </List>
    </>
  )
}
