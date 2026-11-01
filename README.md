# Lantern Night (working title)

Browser prototype of a game that teaches the DBT skill **opposite action for shame**.
Design decisions and the prototype spec are in [DESIGN.md](DESIGN.md). Content that needs a
DBT clinician's sign-off is listed in [CLINICIAN_REVIEW.md](CLINICIAN_REVIEW.md).

## Run it

```bash
npm install
npm run dev        # compiles the Ink story, bundles TS, serves http://localhost:8000
```

`npm run build` writes `public/festival.json` and `public/main.js`; `public/` is then a static
site. `npm test` runs the logic tests and plays the real story through every branch.
`npm run typecheck` runs `tsc`.

Open with `?variant=promise` to skip the title card and start the variant.

## How it's put together

| Layer | Where | What it owns |
|---|---|---|
| Story | `story/festival.ink` | Text, branching, choice variables. Emits `#event:` and `#scene:` tags. |
| Engine | `src/engine.ts` | Steps inkjs line by line, parses tags, binds TS logic as Ink external functions. No DOM. |
| Game logic | `src/logic/` | Emotion meter, world state, fit-the-facts, opposite-action scoring, chain review. Pure functions, no DOM. |
| Views | `src/ui/` | SVG village, meter bars and curve, story text, interactive scenes. Read state only. |
| Glue | `src/main.ts` | Feeds story events into logic, logic state into views. |

A later Phaser or Godot front end would replace `src/ui/` and `src/main.ts`; the story and
logic stay as they are.

## The loop (from DESIGN.md)

1. Trip, lanterns scatter, someone laughs. Body cues arrive; the player names the emotion.
   Any label is allowed; non-shame labels get a description of that emotion's urge and the
   option to look again or keep the label.
2. **Hide** turns the player into a shell creature in a hollow. Distress drops right away.
3. Costs arrive through the world: square stays dark, Mara assumes you're angry, the next
   morning's invitation is missing, darkness spreads up your lane. Hiding can repeat.
4. **Check the facts**: the square is first drawn as shame sees it (red vignette, everyone
   pointing). Inspecting at least three details flips each one to what actually happened.
   Two questions (would people reject you; did you act against your values) decide fit.
5. Doesn't fit → **opposite action** in three parts: go back, head up, steady voice.
   Fits → **repair**: own it, amends, let it go. Each part done pushes distress up first.
   Leaving a part out gives a partial result. The hollow stays available mid-way.
6. Ripple: lanterns light one by one, light reaches your lane, the invitation arrives.
7. **Chain review**: tap any link to see what a different choice there changes.
8. **Transfer**: text-only scenario (coworker ignores you in a meeting) answered in the
   player's own words. This is the success metric.

Variant ("the borrowed lantern"): you promised Mara you'd carry her grandmother's lantern on
its own, stacked it anyway, and it tore. Here the facts support guilt/shame fitting, so
repair is the matching skill.

## Playtesting

At the end, **Download playtest notes** saves a JSON log of every choice, event, inspected
detail, fit answer, chain tap, and the transfer answers, with timestamps. The latest session
is also kept in the browser's localStorage. Nothing is sent anywhere.

Things the log answers directly (see "What the prototype must show" in DESIGN.md):
- Did they hide, how many times, and did they bail out partway back (`hide_count`, `bailed`
  in `chain_record`)?
- Did they push through the rise in distress (`completeness`)?
- Transfer answers (`transfer`).
