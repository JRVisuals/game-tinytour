import { Button, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { CITIES } from '../game/cities'
import { useGame } from '../game/GameContext'

const BUDGETS = [
  { value: '100', label: '$100 — couch start' },
  { value: '200', label: '$200 — standard' },
  { value: '400', label: '$400 — trust-fund weekend' },
]

const CREW_SIZES = [
  { value: '1', label: '1 — solo mission' },
  { value: '2', label: '2 — duo' },
  { value: '3', label: '3 — small crew' },
]

export function CrewCreateScreen() {
  const {
    state,
    setCrewSize,
    setCrewMemberName,
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
          ? 'Build your crew — then we roll from home.'
          : 'Create or edit your saved crew (1–3 tour kids).'}
      </Text>
      <Select
        label="Crew size"
        data={CREW_SIZES}
        value={String(state.crew.length)}
        onChange={(v) => v && setCrewSize(Number(v))}
      />
      {state.crew.map((member, i) => (
        <TextInput
          key={member.id}
          label={i === 0 ? 'Your name' : `Crew member ${i + 1}`}
          value={member.name}
          onChange={(e) => setCrewMemberName(i, e.currentTarget.value)}
        />
      ))}
      <Select
        label="Home city"
        data={[...CITIES]}
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
