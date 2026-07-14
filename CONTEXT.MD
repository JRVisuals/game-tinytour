# Context

Living snapshot of how the game works right now. Prefer short bullets. Update when behavior ships or the loop shifts.

## Current product shape

Bootstrap shell: Vite + React + TypeScript + Mantine. Phase screens stubbed; generators and resource types stubbed. Economy / full event content not polished yet.

## Phases / screens

| Phase | Intent |
|-------|--------|
| `crew_create` | Build crew (MVP may be solo), outfit from starting budget, favorite bands, home city |
| `tour_start` | Pick (or auto-pick) a band; generate a tour |
| `travel` | City-to-city leg; pick up crew if room; burning resources / events |
| `shakedown` | Hub near the venue; car stash if you have a vehicle; navigate to other locations |
| `location` | Park, venue, hotel, friend’s house, etc. — buy/sell, events |
| `show` | Pre-show turn/hour timer resolved; tickets or sneak; limited show actions; score stocking + entry |
| `post_show` | Recap, setlist, narrative → back to shakedown → prep next travel |

## Resources (planned)

- Money (bank / cash on hand — exact split TBD)
- Inventory (tickets, food, beer, drugs, misc)
- Vehicle: gas tank (if bus/car scored)
- Meters: health, hunger, thirst; maybe social clout / social media later
- Fail states: e.g. “You have died of wook flu.”

## Notable systems (planned)

- Narrative events with multiple choices → branching outcomes
- Trading at locations
- Procedural band names, tour stops, setlists
- Song betting / gambling for money or resources
- Turn budget at a stop before showtime
- Optional: crew member sits out the show to hustle next leg

## Glossary

- **Shakedown** — lot / hub near the venue; main navigational hub for a stop
- **Tour kids** — the player crew following the band
- **Wook flu** — health fail-state flavor (Oregon Trail homage)
- **Setlist bet** — wager on songs that will be played

## Run

```bash
pnpm install
pnpm dev
```

## Next iteration (v0.2 — planned)

### Title / main menu
- Title screen with **version number** visible (from `package.json`)
- Buttons:
  - **CREW** — create or edit crew (persisted between runs)
  - **STATS** — lifetime / run stats
  - **GET THIS SHOW ON THE ROAD** — start a run

### Stats to track
- Venues visited, songs heard, bands seen, miles traveled
- Substances, food, beer consumed (and similar consumables)

### Travel (Oregon Trail energy)
- Run **starts in home town** — not at first show
- Travel is a **sequence**, not a single “arrive” button:
  - multi-step legs with events, resource burn, choices
  - first show is a destination you reach through travel

### Open design questions (see chat / DECISIONS when locked)
- Menu persistence: localStorage vs always fresh run?
- Travel granularity: days vs hours vs abstract “legs”?
- CREW required before start, or defaults OK?
- Stats: per-run + lifetime, or lifetime only?
