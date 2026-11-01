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

3. **Walking back as a movement challenge.** The pull to hide is a force dragging the player
   toward the hollow. Holding Shift ("head up") makes walking against it stronger, and
   distress rises when the player first lifts their head and again partway there. "Head up"
   counts if held for at least 60% of the walk (`src/logic/outcome.ts`). Turning back into
   the hollow is allowed and leads to another night of hiding. Does this embodiment
   represent opposite action faithfully (action + posture), without implying the urge is
   bad?

4. **Opposite action scoring.** Three parts: go all the way back into the square, posture
   of pride (head up, shoulders back, eye contact), and a steady voice. Over-apologizing
   counts as not doing the voice part, based on "don't apologize for things that don't
   violate your values". All three is "all the way"; two is partial; fewer is minimal.
   (`src/logic/outcome.ts`, knot `opposite`)

5. **Repair scoring.** Own it plainly, make amends that address the actual harm (mending,
   not buying a replacement), and let it go (stop apologizing once repaired). In the main
   scenario, a player can decide shame fits; they then get the repair path, and Mara tells
   them they don't owe her anything. Is that the right response to an unjustified
   "fits"? (knots `repair`, `repair_result`)

6. **Emotion label feedback.** Text for anger, fear, sadness, guilt, embarrassment (folded
   into shame), and "not sure". Embarrassment is described as "in the shame family".
   (knot `trip`, stitch `body`)

7. **Distress curve numbers.** Hiding drops distress from ~74 to ~22 within a beat, and it
   returns to ~58 the next morning. Each opposite-action part adds 8, then distress settles
   to 15 / 40 / 58 for full / partial / minimal. The shape is meant to be honest; the
   numbers are invented. (`src/logic/meter.ts`)

8. **Chain review wording.** Includes a vulnerability link ("rushing, all twelve in one
   trip") before the prompting event. Reflections are in `src/logic/chain.ts`.

9. **Plain-language descriptions of skills.** The game no longer names DBT skills. These
   lines carry the teaching and need checking for accuracy:
   - Why to do the opposite: "When a feeling doesn't match what happened, doing what it says
     keeps it going. Every time you hide, your body learns there was something to hide from.
     Doing the opposite is how the feeling settles. Halfway doesn't do much: the feeling is
     watching how you walk, where you look, and how you sound." (knot `not_fits`)
   - Why to repair: "When a feeling like this fits, it's pointing at something to fix. Say
     plainly what happened, make it right as best you can, and then put it down." (knot `fits`)
   - Emotion descriptions on the naming screen (stitch `trip.body`) and the look-back
     reflections (`src/logic/chain.ts`).

10. **Villager dialogue.** All conversations follow the rules in CHARACTERS.md (no lectures,
   no shaming). Nell's "lanes go dark sometimes; usually somebody has to walk down them with a
   lantern first" and Ash's "That's allowed" (about hiding) carry the most meaning.

11. **Safety.** The title screen says the game is not therapy or a crisis resource and points
   to emergency services and 988 (US). No crisis detection or in-game handling exists.
   DESIGN.md lists crisis handling as an open decision.
