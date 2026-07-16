# Context

Living snapshot of how the game works right now. Prefer short bullets. Update when behavior ships or the loop shifts.

## Display name

**TINY TOUR** — in-game brand (`src/game/brand.ts`). Repo/package name unchanged (`game_little_jamband_tour`).

## Current product shape

**v0.1.2+** on `feature/crew-compact-ui` — mobile-first play shell, Oregon Trail travel, crew economy (bank/rep/kits), JSON events & copy, setlist bets, markets, wook flu / bail, lot events (Clown Juice Mafia, spot find, cop chase).

## Play shell (during a run)

Bottom tabs — **Scene · Hustle · Crew · Journal**

| Tab | Contents |
|-----|----------|
| **Scene** | Art, phase actions, location nav, one persistent beat (`SceneBeatSlot`) |
| **Hustle** | Markets, setlist bets, Clown Juice deals — enabled on lot or roadside pull-over only |
| **Crew** | Compact accordion rows (sticker + status chip → expand for meters/care) |
| **Journal** | Run stats (in tour) + tour story log |

**Chrome:** compact `StatusLine` (band/city/turns/resources), `OutcomeToast` for action feedback, `TabPanelHeader` on each tab (ALL CAPS title + blurb). Scene tab header replaces duplicate screen `Title` on play phases.

**Title menu** (outside play shell): CREW · STATS · GET THIS SHOW ON THE ROAD — full career stats + crew editor still live here.

## Outcome UX

- **Toast** — buys, bets, travel actions, gate blocks (~3s, center fade; supersede restarts animation)
- **Inline alert** — lot events, spot find, travel choice cards (`SceneBeatAlert`) until you leave the beat
- Rule: world beats don't also toast the same title

## Phases / screens

| Phase | Intent |
|-------|--------|
| `title` | Big ASCII logo, CREW / STATS / GET THIS SHOW ON THE ROAD |
| `crew` | Create or edit saved crew (1–3); gate before first run |
| `stats` | Lifetime career + crew bank/rep (menu screen) |
| `travel` | Multi-leg road; events; pull-over → auto Hustle |
| `shakedown` | Lot hub; navigate locations; venue gates |
| `location` | Park, venue, hotel, friend's house |
| `show` | Tickets or sneak |
| `post_show` | Recap + setlist |
| `post_show_shakedown` | After-show lot hustle |
| `run_recap` | Tour complete → title |
| `day_job` | Run ended (soft fail) |

## Resources & crew

- Stash: cash, food, beer, drugs, tickets, gas, vehicle
- Per-member meters: health, hunger, thirst, vibe, stoned; bail / wook flu
- Bank + rep persist on saved crew; supplies liquidate on run end
- Rep cap **9999** with 25 tier titles; shuffle home **−25 rep**, no partial-run gains

## Clown Juice Mafia deal

- Retail: $30 / 1 balloon
- Deal: **always $10** + 3 balloons
- **Beer (42% when you have one):** also −1 beer, **no punch** from Mr NO DEALS
- Otherwise: $10 + **38% punch** risk

## Edit copy

- Travel events: [`src/content/travel-events.json`](src/content/travel-events.json)
- Outcomes / flavor: [`src/content/copy/travel-outcomes.json`](src/content/copy/travel-outcomes.json)
- Balance: [`src/content/balance/`](src/content/balance/)

## Next steps

### Done / settled (no action)

- Status line density — current chrome is fine
- Progressive market disclosure — not pursuing for now
- **Single-beat Scene** — one `SceneBeatSlot` per screen (`beat.ts` priority); minimap foreshadow via `tourForeshadow` on `TourMapStrip`

### Up next (discuss then build)

- **Phase-trimmed Scene UI** — OT-style one line + 2–4 verbs per phase; talk through per-phase before coding

### Nice-to-have backlog

- Journal badge when new tour-log entry
- Contextual collapsed crew action (`[Feed]` on HUNGRY row)
- Vehicle stash mechanic (still stub text on shakedown)
- Career stats snippet in Journal (title STATS menu keeps full grid)
- ASCII header size tuning on small phones

## Glossary

- **Shakedown** — lot hub near the venue
- **Hustle** — buy/sell/bet tab (not a game phase)
- **Day job** — run over; back to real life
- **Leg** — one hop on the road between cities

## Run

```bash
pnpm install
pnpm dev
```
