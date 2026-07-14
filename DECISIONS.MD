# Decisions

Dated, short ADRs. Newest first. One decision per bullet block.

## 2026-07-14 — Bootstrap stack

- **Vite + React + TypeScript + pnpm** to match sibling games (`game_dicebound`, etc.).
- **Mantine** as UI kit: forms, selects, stacks, papers — fits screen/text/dropdown gameplay; art panels stay simple.
- Project path: `/Users/jr/repo/game_little_jamband_tour` with own git repo.
- Context living in root: `ANCHOR.MD`, `CONTEXT.MD`, `DECISIONS.MD` (lightweight, readable).

## 2026-07-14 — MVP shell scope

- Stub phase state machine: crew → tour start → travel → shakedown → location → show → post-show.
- Placeholder generators for band name, tour stops, setlist + basic resource type defs.
- No polished economy, save system, or full event corpus in bootstrap.
- Crew of 1–5 is the long-term design; shell may start easy with solo flow first.

## 2026-07-14 — Content architecture

- Narrative/events as data modules (not hard-coded only in React components) so screens stay thin.
- Generators are swappable placeholders — richer tables later.
