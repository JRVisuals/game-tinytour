# Decisions

Dated, short ADRs. Newest first. One decision per bullet block.

## 2026-07-15 — TINY TOUR mobile play shell

- **Display name** TINY TOUR in-app; repo/package unchanged.
- **4-tab play shell** — Scene · Hustle · Crew · Journal; bottom nav, `Container size="sm"`.
- **Hustle tab** split from Scene (markets, bets, clown juice); gated to lot phases + roadside pull-over; auto-opens on pull-over.
- **Outcome split** — transient action feedback via center toast; persistent world beats inline (`SceneBeatAlert`). No duplicate banner + card for same beat.
- **Crew UI** — accordion rows with one status chip; full meters/care in drawer.
- **Scene headers** — `TabPanelHeader` on Scene tab; phase screens drop duplicate `Title` during play.
- **Journal** — tour story + in-run stats; title-menu STATS keeps full career grid.

## 2026-07-15 — Clown Juice beer deal

- Deal **always costs $10** + 3 balloons.
- Beer (42% when held) also spends 1 beer and **only** waives Mr NO DEALS punch — not the cash.

## 2026-07-14 — v0.1.1 travel, catalog, crew

- **1–4 legs** from pseudo-distance between cities + jitter.
- **Roadside stops** per leg (truck stop / rest area / farmers market) — trade different from shakedown.
- **Pulled over** event: truth vs lie → fine / lose drugs / busted (day job).
- **Song catalog**: ~20 songs per band (hot / deep cut / bust out); 6-song planned setlist per stop; betting at shakedown + lot rumor on road.
- **Crew 1–3** saved in localStorage.

## 2026-07-14 — v0.1.0 persistence & end state

- **localStorage** (`ljbt_v1`) for saved crew + lifetime stats — cookies too small for payload; same browser, no server.
- **Per-run + lifetime stats** tracked; run recap on tour complete, **day job** screen instead of “death.”
- Title menu: CREW / STATS / GET THIS SHOW ON THE ROAD; version in corner from `src/version.ts` + `package.json`.

## 2026-07-14 — Travel (Oregon Trail legs)

- Travel is **multi-leg** from home (or prior stop) to next venue — not instant arrive.
- Random road events + player actions (rest, eat, hitch, push through, burn gas).
- First show reached only after completing travel legs from **home city**.

## 2026-07-14 — Setlist generator

- Mash **Goose / Phish / Grateful Dead** fragments into unique song names (not straight catalog copies).

## 2026-07-14 — Bootstrap stack

- **Vite + React + TypeScript + pnpm** to match sibling games (`game_dicebound`, etc.).
- **Mantine** as UI kit: forms, selects, stacks, papers — fits screen/text/dropdown gameplay; art panels stay simple.
- Project path: `/Users/jr/repo/game_little_jamband_tour` with own git repo.
- Context living in root: `ANCHOR.MD`, `CONTEXT.MD`, `DECISIONS.MD` (lightweight, readable).

## 2026-07-14 — Content architecture

- Narrative/events as data modules (not hard-coded only in React components) so screens stay thin.
- Generators are swappable placeholders — richer tables later.
