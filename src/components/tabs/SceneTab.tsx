import { useState } from 'react'
import { Paper, SegmentedControl, Stack, Text } from '@mantine/core'
import { OutcomeBanner } from '../OutcomeBanner'
import { PhaseRouter } from '../PhaseRouter'
import { ScreenFrame } from '../ScreenFrame'
import { SongCatalogPanel } from '../SongCatalogPanel'
import { StatusLine } from '../StatusLine'

interface SceneTabProps {
  showBets: boolean
}

export function SceneTab({ showBets }: SceneTabProps) {
  const [section, setSection] = useState<'play' | 'bets'>('play')

  return (
    <Stack gap="sm">
      <StatusLine />
      <OutcomeBanner />
      {showBets && (
        <SegmentedControl
          fullWidth
          size="xs"
          value={section}
          onChange={(v) => setSection(v as 'play' | 'bets')}
          data={[
            { label: 'Play', value: 'play' },
            { label: 'Setlist bets', value: 'bets' },
          ]}
        />
      )}
      {section === 'bets' && showBets ? (
        <SongCatalogPanel />
      ) : (
        <Paper withBorder p="lg" radius="md">
          <ScreenFrame compactArt>
            <PhaseRouter />
          </ScreenFrame>
        </Paper>
      )}
      {showBets && section === 'play' && (
        <Text size="xs" c="dimmed" ta="center">
          Setlist bets available — switch section above.
        </Text>
      )}
    </Stack>
  )
}
