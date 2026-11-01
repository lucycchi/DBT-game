# Design Brief — DBT Skills Game (working title TBD)

## Concept
A browser game that teaches DBT skills and healthy living. The character and the
world visibly change based on what the player does, and effects ripple across the
world (one lantern hung lights the square; avoidance lets darkness spread).

## Core design principle: dialectical, not moral
- No good/evil or karma meter. DBT is nonjudgmental: behaviors are judged by what
  they do for you and what they cost, not labeled good or bad.
- The "monster" form is **emotion mind made visible**, not a punishment. It gives
  real short-term relief; its costs show up later, through the world.
- The world never shames the player and can always recover.
- Withdrawal is not always wrong (rest is legitimate). Avoid rebuilding a moral
  meter in disguise.

## Differentiation from existing games
- Morality-changes-appearance (Fable, Black & White, inFAMOUS) → we model emotion
  states and their function instead of virtue.
- Restore-the-world games (Okami, Terra Nil, Alba) → restoration comes from skill use.
- Therapy games (SPARX, CBT; Game of Real Life, DBT card game) → no narrative DBT
  video game found. Skills are gameplay mechanics, not collectibles or quizzes.
- Planned signature mechanic: **chain analysis** as gameplay.

## First prototype: opposite action for shame (10–15 min, one area)
Scenario: village preparing a lantern festival. Player trips, drops lanterns,
someone laughs (prompting event).

Loop:
1. **Emotion arrives as body cues** (face heat, slump, rising urge meter). Player
   picks the emotion label; wrong guesses allowed, no penalty (Observe/Describe).
2. **Urge offered, and it works:** "Hide" transforms the character into a shell
   creature, burrows into a cozy cave, distress drops immediately. Not punished.
3. **Delayed, indirect costs:** lanterns never hung, square stays dark, NPC assumes
   player is angry, next-day invitation missing, darkness spreads.
4. **Check the facts as a lens:** scene first rendered as shame sees it (everyone
   pointing). Inspecting details reveals facts (one laugher, most didn't notice,
   the laugher dropped one earlier). Player decides: does the emotion fit?
   - Doesn't fit → opposite action.
   - Fits (variant: you broke something you promised to protect) → repair: own it,
     amends, let it go.
5. **Opposite action all the way:** approach = action (go back) + posture (head up)
   + voice (say something). Partial execution = partial result. Distress meter goes
   UP first, then down. Modeling this curve honestly is the key teaching moment.
6. **Positive ripple:** one lantern lights the square, relationship recovers, light spreads.
7. **Chain review:** short timeline (prompting event → emotion → urge → choice →
   outcome); player taps where a different choice changes things.

## What the prototype must show (playtest 5–8 people, think-aloud)
- Is hiding tempting? (Never chosen → relief too weak. Always chosen and costs not
  connected → costs too hidden.)
- Do players push through the "worse before better" curve?
- Transfer: give a new text-only scenario (coworker ignores you in a meeting). Can
  they say whether opposite action applies and why? This is the real success metric.
- Get a DBT clinician to review skill fidelity before investing in art.

## Tech direction
- Browser-playable.
- Story/branching/state in **Ink**, run with **inkjs**.
- Thin **TypeScript** layer for non-text: meter animation, square dimming, the
  distorted-scene inspection.
- Keep game logic (emotion meter, fit-the-facts outcomes, world state) separate
  from rendering, so a later Phaser/Godot visual layer replaces only presentation.
- First version: one page, inkjs, a meter, a CSS class that dims the background.
  No engine, build pipeline, or asset system until the loop is validated.

## Decisions after the first playthrough (2026-11-01)
- **Plain language:** player-facing text describes what each skill is for, never its DBT
  name ("do the opposite, all the way" rather than "opposite action"). DBT names stay in
  code comments and docs.
- **No typing:** everything is a choice or a click.
- **Villagers are people you talk to:** written dialogue in Ink, never AI-generated, so all
  of it can be reviewed by a clinician. A fuller cast with personalities (CHARACTERS.md),
  expressive faces, and portraits beside their lines.
- **The transfer question is out of the game:** it felt preachy inside the story. Playtest
  facilitators ask the coworker scenario out loud after play instead; it is still the
  success measure.

## Open decisions
- Audience: clinical adjunct (with therapist) vs. general wellness product.
  Affects evidence needs, content review, crisis handling, business model.
- Crisis/safety handling if at-risk players use it.
- Optional second scenario where withdrawing is the effective choice.
