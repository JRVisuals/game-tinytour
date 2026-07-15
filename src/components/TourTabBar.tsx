import { Badge, Button, Group } from '@mantine/core'

export type PlayTabId = 'scene' | 'crew' | 'journal'

interface TourTabBarProps {
  active: PlayTabId
  onChange: (tab: PlayTabId) => void
  crewAlert?: boolean
  betsAvailable?: boolean
  hustleAvailable?: boolean
}

const TABS: { id: PlayTabId; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'crew', label: 'Crew' },
  { id: 'journal', label: 'Journal' },
]

export function TourTabBar({
  active,
  onChange,
  crewAlert,
  betsAvailable,
  hustleAvailable,
}: TourTabBarProps) {
  return (
    <Group grow gap={4} px="xs" py="xs">
      {TABS.map((tab) => {
        let dot = false
        if (tab.id === 'crew' && (crewAlert || hustleAvailable)) dot = true
        if (tab.id === 'scene' && betsAvailable) dot = true

        return (
          <Button
            key={tab.id}
            size="sm"
            variant={active === tab.id ? 'filled' : 'light'}
            color={active === tab.id ? 'teal' : 'gray'}
            onClick={() => onChange(tab.id)}
            rightSection={
              dot ? (
                <Badge size="xs" circle color="orange" variant="filled">
                  {' '}
                </Badge>
              ) : undefined
            }
          >
            {tab.label}
          </Button>
        )
      })}
    </Group>
  )
}
