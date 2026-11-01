# Lantern Night (working title)

Browser prototype of a game that teaches the DBT skill **opposite action for shame**.
Design decisions and the prototype spec are in [DESIGN.md](DESIGN.md). Content that needs a
DBT clinician's sign-off is listed in [CLINICIAN_REVIEW.md](CLINICIAN_REVIEW.md). Who the
villagers are, and the rules for writing their dialogue, are in [CHARACTERS.md](CHARACTERS.md).

Player-facing text never names DBT skills; it describes what each one is for (for example,
"when a feeling doesn't match what happened, doing what it says keeps it going"). The DBT
names stay in code comments and these docs. A test fails if a DBT term reaches the player.

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
| Story | `story/festival.ink` | Text, dialogue, branching, choice variables. Emits `#event:` and `#scene:` tags; `#talk:` tags on choices link them to a villager. |
| Engine | `src/engine.ts` | Steps inkjs line by line, parses tags, binds TS logic as Ink external functions. No DOM. |
| Game logic | `src/logic/` | Emotion meter, world state (including each character's face), fit-the-facts, opposite-action scoring, chain review, the cast and dialogue parsing. Pure functions, no DOM. |
| Views | `src/ui/` | SVG village and character art (`characters.ts`), meter bars and curve, story text with portraits, interactive scenes. Read state only. |
| Glue | `src/main.ts` | Feeds story events into logic, logic state into views. |

A later Phaser or Godot front end would replace `src/ui/` and `src/main.ts`; the story and
logic stay as they are.

## Talking to people

Villagers with a speech bubble over their head can be talked to: click them, or pick "Talk to
..." from the list. Conversations are written in Ink (`id: text` or `id/expression: text`
lines), so every line can be reviewed. There are four rounds: the afternoon before the fall,
the night in the hollow (Ash), the morning after hiding, and the festival evening. What people
say depends on what you did.

## The loop (from DESIGN.md)

1. Trip, lanterns scatter, someone laughs. Body cues arrive; the player names the emotion.
   Any label is allowed; non-shame labels get a description of that emotion's urge and the
   option to look again or keep the label.
2. **Hide** turns the player into a shell creature in a hollow. Distress drops right away.
3. Costs arrive through the world: square stays dark, Mara assumes you're angry, the next
   morning's invitation is missing, darkness spreads up your lane. Hiding can repeat.
4. **Check the facts** (shown to the player as "think back over what actually happened"): the square is first drawn as shame sees it (red vignette, everyone
   pointing). Inspecting at least three details flips each one to what actually happened.
   Two questions (would people reject you; did you act against your values) decide fit.
5. Doesn't fit → **opposite action** ("do the opposite, all the way") in three parts: go back, head up, steady voice.
   Fits → **repair** ("make it right"): own it, amends, let it go. Each part done pushes distress up first.
   Leaving a part out gives a partial result. The hollow stays available mid-way.
6. Ripple: lanterns light one by one, light reaches your lane, the invitation arrives. The
   festival evening follows, with everyone to talk to.
7. **Chain review** ("think back over the day"): tap any moment to see what a different
   choice there changes.

There is no typing anywhere in the game. The transfer question (coworker ignores you in a
meeting) is no longer in the game; the facilitator asks it out loud after play. See DESIGN.md.

Variant ("the borrowed lantern"): you promised Mara you'd carry her grandmother's lantern on
its own, stacked it anyway, and it tore. Here the facts support guilt/shame fitting, so
repair is the matching skill.

## Playtesting

At the end, **Download playtest notes** saves a JSON log of every choice, event, inspected
detail, fit answer, and chain tap, with timestamps. The log lives only
in memory, so download it before reloading or starting the next participant. Nothing is
stored in the browser or sent anywhere.

Things the log answers directly (see "What the prototype must show" in DESIGN.md):
- Did they hide, how many times, and did they bail out partway back (`hide_count`, `bailed`
  in `chain_record`)?
- Did they push through the rise in distress (`completeness`)?
- Who did they talk to (`choice` entries starting "Talk to")?
