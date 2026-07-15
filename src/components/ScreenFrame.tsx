import { Stack } from '@mantine/core'
import type { ReactNode } from 'react'
import { useGame } from '../game/GameContext'
import { SceneArt } from './SceneArt'

interface ScreenFrameProps {
  children: ReactNode
  /** Shorter art banner so gameplay UI stays primary */
  compactArt?: boolean
}

/** Wraps every gameplay screen with a consistent illustration slot */
export function ScreenFrame({ children, compactArt = false }: ScreenFrameProps) {
  const { state } = useGame()

  return (
    <Stack gap="md">
      <SceneArt
        phase={state.phase}
        location={state.currentLocation}
        compact={compactArt}
      />
      {children}
    </Stack>
  )
}
