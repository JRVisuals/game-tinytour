import { Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useGame } from '../game/GameContext'
import { SceneArt } from './SceneArt'

interface ScreenFrameProps {
  children: ReactNode
  /** Shorter art banner so gameplay UI stays primary */
  compactArt?: boolean
  /** Teal uppercase section title rendered above the art */
  title?: string
}

/** Wraps every gameplay screen with a consistent illustration slot */
export function ScreenFrame({ children, compactArt = false, title }: ScreenFrameProps) {
  const { state } = useGame()

  return (
    <Stack gap="sm">
      {title && (
        <Text
          size="sm"
          fw={700}
          c="teal.3"
          tt="uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {title}
        </Text>
      )}
      <SceneArt
        phase={state.phase}
        location={state.currentLocation}
        compact={compactArt}
      />
      {children}
    </Stack>
  )
}
