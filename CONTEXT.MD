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

## Bail & run-end conditions

### Per-member bail
- Meters decay **−8 hunger / −8 thirst per turn** passively
- A member is **rough** when any meter (hunger, thirst, health, vibe) < **25**
- Rough for **5 consecutive turns** → member **bails** (leaves the tour)
- Warning status "BAILING · Xt" shows after **2 turns** rough
- **Wook flu** — caught when health < **50** (6% chance/tick); deals **−22 health/turn**; spreads to others at **25% chance/turn**
- **Wasted** — stoned meter ≥ **60** (warning, doesn't directly bail)

### Run outcomes

| Outcome | Trigger | Phase |
|---|---|---|
| **Completed** | All tour stops visited | `run_recap` |
| **Shuffle** | All crew bailed (not all wook flu) | `run_recap` |
| **Shuffle** | Player manually shuffles home (needs ≥1 venue visited or show missed) | `run_recap` |
| **Day job** | All crew bailed AND every bailout was wook flu | `day_job` |
| **Day job** | Certain travel/show events force it | `day_job` |

- **Completed / Shuffle** → supplies liquidate to bank, rep updated
- **Day job** → cash wiped, rep penalty applied, stipend offer shown

## Substances vs balloons

Two distinct drug resources tracked separately:

| Thing | Resource key | Stat tracked | Source |
|---|---|---|---|
| **Substances** | `drugs` (🍄) | `substancesConsumed` | Bought at markets, lot fam hookup, bathroom find, encore whisper trade |
| **Balloons** (nitrous oxide) | — (not stored, consumed immediately) | `balloonsHuffed` | Clown Juice Mafia only |

Substances give vibe+stoned. Balloons (via CJM) give vibe up, health down. Only balloon purchases from CJM increment `balloonsHuffed` — not crew consumption of substances.

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

### Next session priorities

- **Balloons as market commodity** — currently removed from market UI (was in post-show shakedown market). Future: add as a proper buy/sell commodity with limited stock, higher prices at venue gate, scarce elsewhere. Ties into the gas-selling NPC arc below.
- **Gas selling → CJM extortion arc** — if you sell gas at multiple stops across a run, by the end of the tour the Clown Juice Mafia finds out and demands a cut: 30% of your cash. The more stops you sold at, the more likely/certain the shakedown. Needs: `runStats.gasSold` counter (or per-stop tracking), end-of-run or post-show trigger checking threshold, CJM lot event variant for the shakedown. Fun slow-burn NPC consequence.
- **Balloons at post_show_shakedown** — balloon buy is now a location action at `park`, `hotel`, `friends_house`. Still need to wire it for `post_show_shakedown` (that's a phase not a LocationId so the location action system doesn't reach it — needs a dedicated lot event or inline action). Also noted: balloons as a buy/sell market commodity for a future pass.
- **Market gameplay review** — buying low / selling high across locations should feel fun and strategic. Location profiles now in place (truck stop cheap gas+drugs, diner cheap food+beer, supermarket food+beer, farmers market food, venue scarce+expensive drugs, cheap tickets). Review: are spreads wide enough to make arbitrage rewarding? Is there enough stock to make it worth planning routes around?
- **Narratives** — want to talk through copy, story beats, and tone across phases
- **Bug hunt + UI polish** — final alignment pass before phone testing; check all phases on small screens

### In-game button color system

Rationalized across `PhaseActionBar`, `TourTabBar`, and all play-shell screens:

| Color | Role | Examples |
|-------|------|---------|
| **Teal** (filled = current, subtle = nav) | Wayfinding — where you are, where you go | Tab bar active, location nav buttons, current location indicator |
| **Blue** (filled = primary, light = secondary) | Actions — deliberate moves that advance the game | Keep rolling, Venue gates, Into the show, Buy items, Book room, Burn gas |
| **Orange** (light) | Cost / risk / urgency — burns a resource, uncertain outcome, time pressure | Push through, Rest, Hitch, Sneak/scramble, crew alerts |
| **Yellow** (light) | Location flavor actions — optional, situational, one at a time | Join the circle, Dig the bins, Play celó |
| **Gray** (subtle) | Passive / neutral — opt-out or sell (receiving value) | Stay out & hustle, Sell items |
| **Grape** | Nitrous — distinct from all other economies | Buy balloons (CJM or post-show) |
| **Glow (`action-bar-btn`)** | "This moves the narrative forward right now" | Venue gates (when ready), Walk in with tickets, Hit the road, After-show shakedown |

**Location action logic:** only one action is surfaced per visit, randomly selected from available (unused once-per-visit ones first, then repeatables). Clears on location change.

### Instructions page copy (collected, not yet built)

Travel action tooltips / help text:
- **Rest** — take a breather; small crew meter restore
- **Hitch** — thumb it; chance of a free leg, chance of drama
- **Push through** — finish the drive in one go (remaining legs, ~X mi) — costs food + gas. Skips roadside events. Hard on crew.
- **Burn gas** — cruise up to 2 legs (~1 gas) — skips road events, boosts vibe, sometimes scores a beer.

### Nice-to-have backlog

- **Wook relationship system** — "Wook trade offer" currently always declines. Ideas:
  - Make it a narrative choice (accept/decline) with two outcomes
  - Persistent wook relationship flag on run state — decisions across encounters within a run affect future interactions
  - Possible payoffs: discounted substances, free ticket hookup, surprise gift after the show ("the wook you traded with earlier finds you after the last song and hands you a bag")
  - Could weight the wook event to appear more often if you've traded before
  - Needs design pass before building — complexity lives in the relationship state and how many encounters we seed per run

- Journal badge when new tour-log entry
- Contextual collapsed crew action (`[Feed]` on HUNGRY row)
- Vehicle stash mechanic (still stub text on shakedown):
  - Stashable items: balloons (fragile — heat pops, cops notice tank/tubes), hard drugs (separate resource from substances, harsher dealing threshold)
  - Pulled-over w/ vehicle: adds a "search the car?" branch — stashed items bypass on-person check but are catastrophic if found
  - Secret compartment upgrade: one-time cost (e.g. $150) at a location (mechanic, truck stop) — reduces vehicle search find-chance significantly or negates it entirely; flag on SavedCrew/resources so it persists across runs; could be a shakedown or roadside action
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
