import { Button, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { CITIES } from '../game/cities'
import { MEMBER_KIT_LABELS } from '../game/crew/starterKit'
import { crewRepLabel } from '../game/crew/repTitles'
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
    shuffleCrewNames,
    resetCrew,
  } = useGame()

  const hasSavedCrew = state.savedCrew !== null
  const bank = state.savedCrew?.bank ?? state.resources.cash
  const budgetData = hasSavedCrew
    ? [{ value: String(bank), label: `Your bank — $${bank}` }]
    : BUDGETS
  const budgetValue = hasSavedCrew ? String(bank) : String(state.starterTier ?? state.resources.cash)

  return (
    <Stack>
      <Title order={2}>Crew</Title>
      <Text c="dimmed">
        {state.startRunAfterCrewSave
          ? 'Build your crew — then we roll from home.'
          : 'Create or edit your saved crew (1–3 tour kids).'}
      </Text>
      {hasSavedCrew && (
        <Text size="sm">
          Crew rep: <strong>{crewRepLabel(state.savedCrew!.rep)}</strong> · Bank: <strong>${bank}</strong>
        </Text>
      )}
      <Select
        label="Crew size"
        data={CREW_SIZES}
        value={String(state.crew.length)}
        onChange={(v) => v && setCrewSize(Number(v))}
      />
      {state.crew.map((member, i) => (
        <Stack key={member.id} gap={4}>
          <TextInput
            label={i === 0 ? 'Your name' : `Crew member ${i + 1}`}
            value={member.name}
            onChange={(e) => setCrewMemberName(i, e.currentTarget.value)}
          />
          {i > 0 && !hasSavedCrew && state.memberKits[i] && (
            <Text size="xs" c="dimmed">
              Brings: {MEMBER_KIT_LABELS[state.memberKits[i]!]}
            </Text>
          )}
          {i > 0 && hasSavedCrew && state.savedCrew!.members[i]?.kit && (
            <Text size="xs" c="dimmed">
              Brings: {MEMBER_KIT_LABELS[state.savedCrew!.members[i]!.kit!]}
            </Text>
          )}
        </Stack>
      ))}
      <Group grow>
        <Button variant="light" onClick={shuffleCrewNames}>
          Shuffle names
        </Button>
        <Button variant="default" color="orange" onClick={resetCrew}>
          Reset crew
        </Button>
      </Group>
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
        label={hasSavedCrew ? 'Tour bank' : 'Starting budget'}
        data={budgetData}
        value={budgetValue}
        disabled={hasSavedCrew}
        onChange={(v) => v && !hasSavedCrew && setBudget(Number(v))}
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
