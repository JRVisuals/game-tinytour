import {
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { CrewSticker } from '../components/CrewSticker'
import { TabPanelHeader } from '../components/TabPanelHeader'
import { CITIES } from '../game/cities'
import { crewStickerSelectData } from '../game/crew/stickers'
import { MEMBER_KIT_LABELS } from '../game/crew/starterKit'
import { crewRepLabel } from '../game/crew/repTitles'
import { GENRE_OPTIONS, DEFAULT_GENRE, type GenreId } from '../game/generators/genre'
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
    setGenre,
    setBudget,
  } = useGame()

  const hasSavedCrew = state.savedCrew !== null
  const bank = state.savedCrew?.bank ?? state.resources.cash
  const budgetData = hasSavedCrew
    ? [{ value: String(bank), label: `Your bank — $${bank}` }]
    : BUDGETS
  const budgetValue = hasSavedCrew ? String(bank) : String(state.starterTier ?? state.resources.cash)

  const blurb = state.startRunAfterCrewSave
    ? 'Build your crew — then we roll from home.'
    : hasSavedCrew
      ? `Rep: ${crewRepLabel(state.savedCrew!.rep)} · Bank: $${bank}`
      : undefined

  return (
    <Stack gap="md">
      <TabPanelHeader title="Crew" blurb={blurb} />

      <Grid gap="md" align="stretch">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Stack gap="sm">
              <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
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
                  <Paper key={member.id} withBorder p="sm" radius="md">
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
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" h="100%">
            <Stack gap="sm">
              <Text fw={600} size="sm" c="teal.3" tt="uppercase" style={{ letterSpacing: '0.06em' }}>
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
              <Select
                label="Jam scene"
                data={GENRE_OPTIONS}
                value={state.genre ?? DEFAULT_GENRE}
                onChange={(v) => v && setGenre(v as GenreId)}
                comboboxProps={{ withinPortal: true }}
              />
              <Select
                label={hasSavedCrew ? 'Tour bank' : 'Starting budget'}
                data={budgetData}
                value={budgetValue}
                disabled={hasSavedCrew}
                onChange={(v) => v && !hasSavedCrew && setBudget(Number(v))}
              />
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
