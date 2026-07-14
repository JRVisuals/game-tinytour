# Context

Living snapshot of how the game works right now. Prefer short bullets. Update when behavior ships or the loop shifts.

## Current product shape

**v0.1.2** — Bet slots (anywhere/opener/closer/encore), scrollable song catalog, JSON travel events, per-member crew meters, location markets, miss show, shuffle on home.

## Edit event copy

Travel event text lives in [`src/content/travel-events.json`](src/content/travel-events.json). Add/edit entries there (`title`, `body`, `choices`, `weight`). Lot rumor supports `{song}` placeholder.

Dark comedy. User may author event/location copy over time — stub text in code for now.

## Phases / screens

| Phase | Intent |
|-------|--------|
| `title` | ASCII header, art panel, CREW / STATS / GET THIS SHOW ON THE ROAD |
| `crew` | Create or edit saved crew; gate before first run |
| `stats` | Lifetime stats + current run if active |
| `travel` | Multi-leg road from home (or last stop) to next venue; events + actions |
| `shakedown` | Hub near the venue; car stash; navigate locations |
| `location` | Park, venue, hotel, friend’s house — buy/sell stubs |
| `show` | Tickets or sneak; enter show |
| `post_show` | Recap + setlist → next travel leg |
| `run_recap` | Tour complete summary → title |
| `day_job` | Run ended (wook flu / burnout) — “death” is a day job |

## Resources

- Cash, food, beer, drugs, tickets, gas, vehicle flag
- Crew meters: health, hunger, thirst (travel/shakedown pressure)

## Stats tracked

Per-run and lifetime: venues visited, songs heard, bands seen, miles traveled, substances / food / beer consumed. Also runs completed vs day jobs taken.

## Glossary

- **Shakedown** — lot hub near the venue
- **Day job** — run over; back to real life (soft fail state)
- **Leg** — one abstract hop on the road between cities

## Run

```bash
pnpm install
pnpm dev
```
