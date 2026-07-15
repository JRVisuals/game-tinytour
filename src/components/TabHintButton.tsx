import { Button, Group } from '@mantine/core'
import type { PlayTabId } from './TourTabBar'
import { usePlayTab } from './PlayTabContext'

const TAB_COLOR: Record<PlayTabId, string> = {
  scene: 'gray',
  hustle: 'teal',
  crew: 'orange',
  journal: 'blue',
}

interface TabHintButtonProps {
  tab: PlayTabId
  children: string
  disabled?: boolean
}

export function TabHintButton({ tab, children, disabled }: TabHintButtonProps) {
  const { setPlayTab } = usePlayTab()

  return (
    <Group justify="center">
      <Button
        size="compact-sm"
        variant="light"
        color={TAB_COLOR[tab]}
        disabled={disabled}
        onClick={() => setPlayTab(tab)}
      >
        {children}
      </Button>
    </Group>
  )
}
