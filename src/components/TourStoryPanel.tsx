import { useCallback } from 'react'
import { ActionIcon, CopyButton, Stack, Text, Textarea, Tooltip } from '@mantine/core'
import { useGame } from '../game/GameContext'

export function TourStoryPanel() {
  const { state } = useGame()
  const text = state.tourStory.join('\n\n')
  const visible =
    state.tourStory.length > 0 &&
    (state.tour !== null || state.phase === 'run_recap')

  const scrollToBottom = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) node.scrollTop = node.scrollHeight
  }, [])

  if (!visible) return null

  return (
    <Stack gap="xs" mt="md">
      <Text size="sm" fw={600}>
        Tour story
      </Text>
      <Textarea
        ref={scrollToBottom}
        value={text}
        readOnly
        autosize
        minRows={4}
        maxRows={14}
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
      />
      <CopyButton value={text}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied' : 'Copy story'} withArrow>
            <ActionIcon variant="light" color={copied ? 'teal' : 'gray'} onClick={copy}>
              {copied ? '✓' : '⎘'}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Stack>
  )
}
