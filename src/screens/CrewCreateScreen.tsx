import { Button, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useGame } from '../game/GameContext'

const CITIES = [
  'Burlington, VT',
  'Portland, ME',
  'Asbury Park, NJ',
  'Asheville, NC',
  'Boulder, CO',
  'Portland, OR',
  'Austin, TX',
]

const BUDGETS = [
  { value: '100', label: '$100 — couch start' },
  { value: '200', label: '$200 — standard' },
  { value: '400', label: '$400 — trust-fund weekend' },
]

export function CrewCreateScreen() {
  const {
    state,
    setCrewName,
    setHomeCity,
    setFavoriteBandHint,
    setBudget,
    setPhase,
  } = useGame()

  return (
    <Stack>
      <Title order={2}>Create your crew</Title>
      <Text c="dimmed">
        MVP: solo tour kid. Later: 1–5 crew mates sharing the road.
      </Text>
      <TextInput
        label="Your name"
        value={state.crew[0]?.name ?? ''}
        onChange={(e) => setCrewName(e.currentTarget.value)}
      />
      <Select
        label="Home city"
        data={CITIES}
        value={state.homeCity}
        onChange={(v) => v && setHomeCity(v)}
      />
      <TextInput
        label="Favorite band vibe (flavor)"
        placeholder="e.g. northeast barn circuit"
        value={state.favoriteBandHint}
        onChange={(e) => setFavoriteBandHint(e.currentTarget.value)}
      />
      <Select
        label="Starting budget"
        data={BUDGETS}
        value={String(state.resources.cash)}
        onChange={(v) => v && setBudget(Number(v))}
      />
      <Button onClick={() => setPhase('tour_start')}>Hit the road setup</Button>
    </Stack>
  )
}
