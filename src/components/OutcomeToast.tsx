import { Alert, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext'
import type { OutcomeTone } from '../game/types'

const HOLD_MS: Record<OutcomeTone, number> = {
  default: 4500,
  error: 5500,
}

const FADE_MS = 450

const TONE_COLOR: Record<OutcomeTone, string> = {
  default: 'teal',
  error: 'red',
}

type ToastPhase = 'hidden' | 'in' | 'out'

export function OutcomeToast() {
  const { state, clearLastOutcome } = useGame()
  const [phase, setPhase] = useState<ToastPhase>('hidden')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<OutcomeTone>('default')
  const [epoch, setEpoch] = useState(0)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissRef = useRef(0)

  useEffect(() => {
    if (!state.lastOutcome || !state.tour) return

    const dismissId = ++dismissRef.current
    const nextTone = state.lastOutcomeTone ?? 'default'

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    setMessage(state.lastOutcome)
    setTone(nextTone)
    setEpoch((e) => e + 1)
    setPhase('in')

    holdTimerRef.current = setTimeout(() => {
      if (dismissRef.current !== dismissId) return
      setPhase('out')
      fadeTimerRef.current = setTimeout(() => {
        if (dismissRef.current !== dismissId) return
        setPhase('hidden')
        clearLastOutcome()
      }, FADE_MS)
    }, HOLD_MS[nextTone])

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [state.lastOutcome, state.lastOutcomeTone, state.tour, clearLastOutcome])

  if (phase === 'hidden' || !message) return null

  return (
    <div
      key={epoch}
      className={`outcome-toast outcome-toast--${phase}`}
      role="status"
      aria-live="polite"
    >
      <Alert color={TONE_COLOR[tone]} variant="filled" radius="md" p="md">
        <Text size="md" fw={600} lh={1.45} ta="center">
          {message}
        </Text>
      </Alert>
    </div>
  )
}
