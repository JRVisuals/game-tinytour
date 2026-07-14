import { COPY, pickText } from '../config'

export function appendStory(story: string[], line: string): string[] {
  if (!line.trim()) return story
  return [...story, line]
}

export function storyIntro(
  seed: number,
  vars: { home: string; band: string; destination: string; crew: string },
): string[] {
  const line = pickText(
    COPY.tourStory.intro,
    seed,
    `Left ${vars.home} chasing ${vars.band}.`,
    vars,
  )
  return [line]
}

export function storyTravelStop(
  seed: number,
  city: string,
  venue: string,
): string {
  return pickText(
    COPY.tourStory.travel_stop,
    seed,
    `Next stop: ${city} — ${venue}.`,
    { city, venue },
  )
}

export function storyLocation(seed: number, location: string, venue?: string): string {
  const pool =
    COPY.tourStory.location[location] ?? COPY.tourStory.location.shakedown
  return pickText(pool, seed, `Stopped at ${location}.`, { venue: venue ?? '' })
}

export function storyEvent(seed: number, title: string, detail?: string): string {
  return pickText(COPY.tourStory.event, seed, `${title}.`, {
    title,
    detail: detail ?? '',
  })
}

export function storyPostShow(
  seed: number,
  venue: string,
  songCount: number,
  missed: boolean,
): string {
  const pool = missed ? COPY.tourStory.post_show_missed : COPY.tourStory.post_show
  return pickText(pool, seed, missed ? `Missed ${venue}.` : `Show at ${venue}.`, {
    venue,
    songs: String(songCount),
  })
}

export function storyTourEnd(
  seed: number,
  vars: { city: string; venue: string; band: string; crew: string },
): string {
  return pickText(
    COPY.tourStory.tour_end,
    seed,
    `Tour wrapped at ${vars.venue}.`,
    vars,
  )
}

export function storyGoHome(seed: number): string {
  return pickText(COPY.tourStory.go_home, seed, 'Shuffled on home.')
}
