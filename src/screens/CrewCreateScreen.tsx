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
    saveCrew,
    goToTitle,
  } = useGame()

  return (
    <Stack>
      <Title order={2}>Crew</Title>
      <Text c="dimmed">
        {state.startRunAfterCrewSave
          ? 'Build your tour kid, then we roll from home.'
          : 'Create or edit your saved crew. MVP: solo tour kid.'}
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
      <Button onClick={saveCrew}>
        {state.startRunAfterCrewSave ? 'Save & hit the road' : 'Save crew'}
      </Button>
      {!state.startRunAfterCrewSave && (
        <Button variant="default" onClick={goToTitle}>
          Back to title
        </Button>
      )}
    </Stack>
  )
}
