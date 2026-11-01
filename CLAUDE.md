# Project context for Claude Code

Browser game teaching DBT skills. Read `DESIGN.md` before doing design or
gameplay work. It holds the decisions made so far and the first prototype spec.

## Current goal
Build the first playable prototype (opposite action for shame, lantern festival
scenario) as described in DESIGN.md.

## Stack
- Ink for story/branching/state, run in the browser with inkjs
- TypeScript for the meter, world-state visuals, and the check-the-facts scene
- Keep it minimal: no game engine or heavy build tooling until the loop is playtested

## Rules
- Keep game logic (emotion meter, fit-the-facts outcomes, world state) separate
  from rendering code.
- Never frame player behavior as good/bad or moral. No karma meters, no shaming
  feedback text. Costs show up through the world, not through judgment.
- DBT skill content must stay faithful to standard DBT; flag anything that
  needs clinician review instead of improvising.
- Player-facing text uses plain language: describe what a skill does, never its
  DBT name. A test enforces this.
- Dialogue is written in Ink by hand (see CHARACTERS.md), not generated at runtime.

## Working style
- Be direct and point out flaws in ideas; no flattery.
- Complete multi-step tasks end to end without pausing for approval checkpoints.
