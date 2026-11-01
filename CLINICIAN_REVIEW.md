# Items for DBT clinician review

Choices made while building the prototype that a DBT clinician should confirm or correct
before playtesting with real players. Each points to where it lives.

1. **Shame and guilt share one fit check and one repair path.** Standard DBT (Emotion
   Regulation handouts) says shame fits when you'd be rejected by a group you care about if
   something became known, and guilt fits when your own behavior violates your values. The
   game asks both questions and treats "yes" to either as "fits", leading to repair (own it,
   make amends, let it go). Is merging them acceptable for teaching, or should guilt and
   shame be separated? (`src/logic/facts.ts`, `story/festival.ink` knot `fits`)

2. **Intensity is not checked.** Check the facts also asks whether the *intensity* fits.
   The prototype only asks whether the emotion fits. (`src/logic/facts.ts`)

3. **Opposite action scoring.** Three parts: go all the way back into the square, posture
   of pride (head up, shoulders back, eye contact), and a steady voice. Over-apologizing
   counts as not doing the voice part, based on "don't apologize for things that don't
   violate your values". All three is "all the way"; two is partial; fewer is minimal.
   (`src/logic/outcome.ts`, knot `opposite`)

4. **Repair scoring.** Own it plainly, make amends that address the actual harm (mending,
   not buying a replacement), and let it go (stop apologizing once repaired). In the main
   scenario, a player can decide shame fits; they then get the repair path, and Mara tells
   them they don't owe her anything. Is that the right response to an unjustified
   "fits"? (knots `repair`, `repair_result`)

5. **Emotion label feedback.** Text for anger, fear, sadness, guilt, embarrassment (folded
   into shame), and "not sure". Embarrassment is described as "in the shame family".
   (knot `trip`, stitch `body`)

6. **Distress curve numbers.** Hiding drops distress from ~74 to ~22 within a beat, and it
   returns to ~58 the next morning. Each opposite-action part adds 8, then distress settles
   to 15 / 40 / 58 for full / partial / minimal. The shape is meant to be honest; the
   numbers are invented. (`src/logic/meter.ts`)

7. **Chain review wording.** Includes a vulnerability link ("rushing, all twelve in one
   trip") before the prompting event. Reflections are in `src/logic/chain.ts`.

8. **Transfer answer key.** The "one way to look at it" text after the coworker scenario.
   (`src/ui/scenes.ts`, `runTransferScene`)

9. **Safety.** The footer says the prototype is not therapy or a crisis resource and points
   to emergency services and 988 (US). No crisis detection or in-game handling exists.
   DESIGN.md lists crisis handling as an open decision.
