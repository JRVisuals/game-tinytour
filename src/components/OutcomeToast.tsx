import { Alert, Text } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/GameContext'
import type { OutcomeTone } from '../game/types'

const HOLD_MS: Record<OutcomeTone, number> = {
  default: 3200,
  error: 4000,
}

const FADE_MS = 450

const TONE_COLOR: Record<OutcomeTone, string> = {
  default: 'gold',
  error: 'red',
}

type ToastPhase = 'hidden' | 'in' | 'out'

export function OutcomeToast() {
  const { state, clearLastOutcome } = useGame()
  const [phase, setPhase] = useState<ToastPhase>('hidden')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<OutcomeTone>('default')
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showFrameRef = useRef<number | null>(null)
  const dismissRef = useRef(0)

  useEffect(() => {
    if (!state.lastOutcome || !state.tour || state.lastOutcomeSeq === 0) {
      setPhase('hidden')
      return
    }

    const dismissId = ++dismissRef.current
    const nextTone = state.lastOutcomeTone ?? 'default'

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    if (showFrameRef.current != null) cancelAnimationFrame(showFrameRef.current)

    setMessage(state.lastOutcome)
    setTone(nextTone)
    setPhase('hidden')

    showFrameRef.current = requestAnimationFrame(() => {
      showFrameRef.current = requestAnimationFrame(() => {
        if (dismissRef.current !== dismissId) return
        setPhase('in')
      })
    })

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
      if (showFrameRef.current != null) cancelAnimationFrame(showFrameRef.current)
    }
  }, [
    state.lastOutcome,
    state.lastOutcomeSeq,
    state.lastOutcomeTone,
    state.tour,
    clearLastOutcome,
  ])

  if (phase === 'hidden' || !message) return null

  return (
    <div
      key={state.lastOutcomeSeq}
      className={`outcome-toast outcome-toast--${phase}`}
      role="status"
      aria-live="polite"
    >
      <Alert
        color={TONE_COLOR[tone]}
        variant="light"
        radius="md"
        p="md"
        className={tone === 'error' ? 'outcome-toast-alert outcome-toast-alert--error' : 'outcome-toast-alert'}
      >
        <Text size="md" fw={600} lh={1.45} ta="center">
          {message}
        </Text>
      </Alert>
    </div>
  )
}
