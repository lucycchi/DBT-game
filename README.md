# Lantern Night

A short walkable adventure in three chapters, about 25 minutes, set in a village during its
lantern festival. You promised to bring the lanterns. On the way across the square you trip, they
scatter, and someone laughs. What happens next is up to you.

Underneath, it teaches skills from DBT (dialectical behavior therapy), one per chapter. The
game never names them; it shows what each one is for:
1. **When shame shows up:** if the feeling doesn't match what happened, do the opposite of
   what it urges, all the way. If it does match, make things right.
2. **When pulling back is the right call:** check whether the guilt about stopping fits, then
   rest on purpose: tell someone, and really rest. Saying no is allowed.
3. **When a feeling is too big to think through:** bring your body down first (cold water,
   slow breathing), then make a plan.

**Play it:** https://lucycchi.github.io/DBT-game/ (desktop browser, with sound).

Design decisions are in [DESIGN.md](DESIGN.md), the cast and dialogue rules in
[CHARACTERS.md](CHARACTERS.md), and content that needs a DBT clinician's sign-off in
[CLINICIAN_REVIEW.md](CLINICIAN_REVIEW.md).

## How to play

| | |
|---|---|
| Walk | <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>, or click where you want to go |
| Talk, use things, go through doors | <kbd>E</kbd> or <kbd>Space</kbd> when a prompt appears, or click the person |
| Read on in a conversation | <kbd>Space</kbd>, <kbd>Enter</kbd> or click; number keys pick answers |
| Breathe in, then out (storm) | hold <kbd>Space</kbd> or the on-screen button, then let go |
| Keep your head up (walking back) | hold <kbd>Shift</kbd>, or hold the on-screen Head up button |

The goal and what to do next are always shown in the top left. People with a speech bubble
want to talk.

**On a phone or tablet** (landscape; portrait asks you to turn the phone): tap where you want
to go, tap a person, door, thing or lantern hook to walk over and use it, and tap the text to
read on. Whenever there's something to do, a big button in the bottom right does it (the
floating label over the world is tappable too). During the walk back, hold **Head up** with
your left thumb while tapping toward Mara with your right. Conversations move to the top of
the screen so they don't cover anyone. Add `?touch` to the URL to try the touch layout on a
desktop.

## The journey

Four connected areas you can walk between and come back to: **Lantern Lane** (your house,
Nell), **Market Street** (the bakery, Ash's tea cart, the lantern workshop you can go
inside), **The Square** (the fountain and the lantern string), and **The Hill** with the
hollow at the top.

1. **Afternoon.** Fetch the lanterns from the workshop, talk to anyone you like, carry them
   to the fountain. You trip.
2. **The fall.** Your body reacts; you name the feeling. The pull to hide literally drags you
   toward the hollow. Hiding turns you into a shell creature, and the relief is real.
3. **If you hid:** night falls with the square dark, Ash checks on you, you overhear Mara
   and Tobin each blaming themselves. In the morning your invitation is missing and your
   lane has gone too dark to walk. Ash gives you a candle, and the lane opens again.
4. **Finding out what happened.** The village is drawn the way the feeling sees it: a red
   haze, everyone pointing. Talk to people and look around the fountain. Each fact you find
   frees someone from the haze. After three, sit on the fountain wall and decide whether
   the feeling matches what happened.
5. **Walking back** (it doesn't match). The pull to hide drags you toward the hollow while
   you walk to Mara. Holding your head up makes you stronger against it, and the meter
   climbs before it falls. Then you choose what to say.
   **Making it right** (it matches). Walk back, own what happened, then mend the torn lantern
   in a small puzzle (or straighten the dented ones), then let it be done.
6. **Hanging the lanterns.** Walk under each of the 12 hooks and hang a lantern. At sundown
   they light one by one. How far the light reaches depends on how fully you went back.
7. **The festival.** Everyone has something to say, depending on what you did. Walk home.
8. **Looking back.** A short timeline of your day; tap any moment to see what doing
   something different there would change.

**Chapter two: The morning after.** You slept three hours and everyone has an errand for
you. Each one you take on wears you down, and your body shows it; you can say no to any of
them. Sit on the fountain wall to check in: does the guilt about stopping match what's
happening? Resting on purpose means telling Ash or Mara and going up to the hollow as
yourself, not as the shell. Push through every errand and your body decides for you.

**Chapter three: The storm.** A storm hits the last night of the festival and panic spikes
too high to make a plan. Bring your body down first: splash cold water from the fountain
(a fast, big drop) or play the slow-breathing game (hold to breathe in, let go to breathe out
for longer). Grabbing at the lanterns while panicking loses one to the wind. Once you're
calm, help Pip breathe, then tie every lantern down while gusts shove you around. How well
you rested in chapter two sets how big the wave is.

The title screen can jump straight to chapter two or three.

**Save points.** The end of each chapter is a save point: the game saves your progress in
this browser and offers *Keep playing* or *Take a break*. Next time, the title screen shows
*Continue chapter two* (or three) with when you saved. *Start over* deletes the save, which
is worth doing between participants on a shared playtest computer. Finishing the game clears
the save. Saves hold the story's progress and the village's state only, never playtest notes,
and a save from an older version of the game is ignored rather than loaded.

Nothing is scored. The village shows the costs and the recoveries, and it can always recover.

The borrowed-lantern story (second button on the title screen) changes one thing: you
promised to carry Mara's grandmother's lantern on its own, and it tore. Here the feeling
does match, and making it right is the skill that fits.

## Run it locally

```bash
npm install
npm run dev        # compiles the story, bundles, serves http://localhost:8000
npm test           # logic tests, plus the real story played through every branch
npm run typecheck
```

`npm run build` writes `public/festival.json` and `public/main.js`; `public/` is the whole
site. Pushing to `main` runs the tests and deploys to GitHub Pages
(`.github/workflows/pages.yml`).

Add `?variant=promise` to skip the title screen into the borrowed-lantern story. Add
`?debug` to expose `window.lantern` for automated playtesting.

## How it's put together

| Layer | Where | What it owns |
|---|---|---|
| Story | `story/festival.ink` | All text and dialogue, branching, choice variables. Choices are tagged with where they live in the world (`#talk`, `#go`, `#use`); lines carry `#event` and `#scene` tags. |
| Engine | `src/engine.ts` | Steps inkjs line by line, parses tags and dialogue, binds TS logic as Ink functions. No DOM. |
| Game logic | `src/logic/` | Emotion meter, world state, finding facts and whether the feeling fits, scoring how fully a skill was done, looking back, the cast. Pure functions, no DOM. |
| World | `src/game/` | Phaser 3 scene: walking, camera, doors, villagers, light and dark, the walk-back and lantern-hanging challenges (`WorldScene.ts`); village layout as plain data (`layout.ts`); every image, generated as SVG (`art.ts`). |
| Audio | `src/audio/sound.ts` | Generated music for each mood (day, night, the red haze, the hollow, the festival) and all sound effects, synthesized with the Web Audio API. |
| Overlays | `src/ui/` | Dialogue box with portraits, goal and controls, the meter, the decision, mending and look-back panels, character art (`characters.ts`). |
| Director | `src/main.ts` | Runs the story, applies events to logic, hands state to the world and overlays, routes choices to the world or the dialogue box. |

No asset in the game is pre-made: buildings, characters, lanterns, the sky, music and
sound effects are all generated by the code in `src/game/art.ts`, `src/ui/characters.ts`
and `src/audio/sound.ts`.

## Playtesting

**Download playtest notes** at the end saves a JSON log of every choice, event, fact found,
how the walk back went (reached Mara or not, head up or not, turned back or not), the
decision answers and which moments were tapped when looking back. The log is kept only in
memory; download it before reloading.

After play, ask the transfer question out loud (DESIGN.md): *"In a meeting, you share an
idea and a coworker moves on without responding. Your face goes hot and you want to skip
the team lunch. Would doing the opposite apply here? Why or why not?"*
