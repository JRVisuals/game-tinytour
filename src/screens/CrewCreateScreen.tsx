import {
  Button,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { CrewSticker } from '../components/CrewSticker'
import { CITIES } from '../game/cities'
import { crewStickerSelectData } from '../game/crew/stickers'
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

const STICKER_OPTIONS = crewStickerSelectData()

export function CrewCreateScreen() {
  const {
    state,
    setCrewSize,
    setCrewMemberName,
    setCrewMemberSticker,
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
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>Crew</Title>
        {state.startRunAfterCrewSave && (
          <Text c="dimmed">Build your crew — then we roll from home.</Text>
        )}
        {hasSavedCrew && (
          <Text size="sm">
            Crew rep: <strong>{crewRepLabel(state.savedCrew!.rep)}</strong> · Bank:{' '}
            <strong>${bank}</strong>
          </Text>
        )}
      </Stack>

      <Grid gap="md" align="stretch">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm" h="100%">
            <Text fw={600} size="sm">
              The crew
            </Text>
            <Select
              label="Crew size"
              data={CREW_SIZES}
              value={String(state.crew.length)}
              onChange={(v) => v && setCrewSize(Number(v))}
            />
            <SimpleGrid cols={{ base: 1, sm: state.crew.length > 1 ? 2 : 1 }} spacing="sm">
              {state.crew.map((member, i) => (
                <Paper key={member.id} withBorder p="sm" radius="md" h="100%">
                  <Stack gap="xs">
                    <Group align="flex-start" wrap="nowrap" gap="sm">
                      <CrewSticker stickerId={member.stickerId} size="lg" />
                      <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <TextInput
                          label={i === 0 ? 'Your name' : `Member ${i + 1}`}
                          value={member.name}
                          onChange={(e) => setCrewMemberName(i, e.currentTarget.value)}
                        />
                        <Select
                          label="Sticker"
                          data={STICKER_OPTIONS}
                          value={member.stickerId ?? STICKER_OPTIONS[0]?.value}
                          onChange={(v) => v && setCrewMemberSticker(i, v)}
                          searchable
                          comboboxProps={{ withinPortal: true }}
                        />
                      </Stack>
                    </Group>
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
                </Paper>
              ))}
            </SimpleGrid>
            <Group grow mt="auto">
              <Button variant="light" onClick={shuffleCrewNames}>
                Shuffle names
              </Button>
              <Button variant="default" color="orange" onClick={resetCrew}>
                Reset crew
              </Button>
            </Group>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm" h="100%" justify="space-between">
            <Stack gap="sm">
              <Text fw={600} size="sm">
                Tour setup
              </Text>
              <Select
                label="Home city"
                data={[...CITIES]}
                value={state.homeCity}
                onChange={(v) => v && setHomeCity(v)}
                searchable
                comboboxProps={{ withinPortal: true }}
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
            </Stack>
            <Stack gap="xs">
              <Button onClick={saveCrew}>
                {state.startRunAfterCrewSave ? 'Save & hit the road' : 'Save crew'}
              </Button>
              {!state.startRunAfterCrewSave && (
                <Button variant="default" onClick={goToTitle}>
                  Back to title
                </Button>
              )}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
