import { Button } from '@mantine/core'

export type PlayTabId = 'scene' | 'hustle' | 'crew' | 'journal'

interface TourTabBarProps {
  active: PlayTabId
  onChange: (tab: PlayTabId) => void
  crewAlert?: boolean
  hustleActive?: boolean
  hustleEnabled?: boolean
}

const TABS: { id: PlayTabId; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'hustle', label: 'Hustle' },
  { id: 'crew', label: 'Crew' },
  { id: 'journal', label: 'Journal' },
]

export function TourTabBar({
  active,
  onChange,
  crewAlert,
  hustleActive,
  hustleEnabled = true,
}: TourTabBarProps) {
  return (
    <div className="game-shell-tab-bar">
      {TABS.map((tab) => {
        const attention =
          (tab.id === 'crew' && crewAlert) || (tab.id === 'hustle' && hustleActive)
        const disabled = tab.id === 'hustle' && !hustleEnabled
        const pulse = attention && active !== tab.id

        return (
          <Button
            key={tab.id}
            size="compact-sm"
            variant={active === tab.id ? 'filled' : 'light'}
            color={active === tab.id ? 'teal' : 'gray'}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={pulse ? 'tab-bar-attention' : undefined}
          >
            {tab.label.toUpperCase()}
          </Button>
        )
      })}
    </div>
  )
}
