# Characters

Everyone in the village has their own worries. Nobody exists to teach the player a lesson.

## How they look

Round, plush animals (`src/ui/plush.ts`): You are a red panda, Mara a deer, Tobin an otter,
Wren a goat, Oda a badger, Pip and Juno mice (Juno has a bow), Nell a sheep, Ash a bear. Each
has their own face (eyes, brows, mouth, head shape) that fits who they are, and keeps their
outfit colors and props (Mara's clipboard and scarf, Tobin's cap and apron, Wren's baker's
hat, Nell's shawl, cane and flower, Ash's glasses).

**Feelings.** Eleven, each changing eyes, brows, mouth and cheeks, adding a small sign by the
head, and moving the body: calm (breathing), happy (sparkles, a bounce), laughing (a wobble),
warm, surprised ("!", a hop), worried (a sweat drop, a sway), sad (a tear, a sink), upset (a
puff of steam, a stomp), scared (a sweat drop, a shiver), embarrassed (blush lines, eyes down,
shrinking smaller), tired ("zzz", a droop). While someone speaks, their mouth opens and closes
with the words, in the village and in their portrait; everyone blinks.

## Rules for writing dialogue

- **No lectures:** no character explains a skill or tells the player what they should have done.
- **Costs come from people's own lives:** Mara thinks *she* upset you; Tobin thinks his laugh drove you
  off. Nobody blames or shames the player.
- **Characters notice different things:** most of them missed the fall entirely. That is what the
  facts are made of.
- **Speaking lines** are written in Ink as `id: text` or `id/feeling: text`. Feelings:
  `neutral`, `happy`, `laughing`, `warm`, `surprised`, `worried`, `sad`, `upset`, `scared`,
  `embarrassed`, `tired` (the older `smile` and `laugh` still work).

## The square

**Mara** (`mara`): runs the festival. Thirties, scarf, clipboard energy. Kind, organized, a worrier.
When things go quiet she assumes she caused it, which is the player's pattern seen from the outside.
Her grandmother started the festival, and her grandmother's paper lantern is the oldest thing Mara
owns. Says "okay, okay" when stressed.

**Tobin** (`tobin`): the lantern-maker's apprentice, early twenties, cap and apron full of wire.
Laughs when nervous or surprised, never to be cruel. He tripped on the same loose stone this
morning, broke one of his own lanterns, and has been joking about it all day so nobody else can
first. The one laugh the player hears is his.

**Wren and Oda** (`wren`, `oda`): the bakers, married, fifties. Wren (tall, baker's hat) frets
that the bread won't be ready by sundown. Oda (short, flour on everything) says it always is. They
bicker fondly and notice almost nothing outside their oven.

**Pip and Juno** (`pip`, `juno`): siblings, about seven and nine. Pip is delighted by everything;
Juno counts things and corrects people kindly. They think the red lantern rolling across the
square was the best thing that happened all day.

## Your lane

**Nell** (`nell`): the neighbor on your lane, in her eighties, shawl and cane, always on her step.
Has watched sixty-one festivals. Dry humor. Doesn't give advice; tells a story instead, usually
one where she was the one who got it wrong. Notices when the lane goes dark and isn't worried
by it.

**Ash** (`ash`): your friend, runs the tea cart, glasses and a long scarf. Steady and doesn't
push. If you hide, Ash comes up the hill, calls into the hollow once, and leaves tea on the
rock. Ash treats rest as allowed and is still glad when you come back.

## Who you can talk to, and when

| When | Who | What changes |
|---|---|---|
| Afternoon, before the fall | Nell (lane), Ash and the bakers (street), Tobin (inside the workshop), Mara and the kids (square) | Sets up who people are. Tobin mentions his own fall. |
| Night, if you hid | Ash at the hollow; Mara and Tobin overheard | Ash checks on you; Mara and Tobin each think it was their fault. |
| Finding out what happened | Tobin, the bakers, the kids, plus Nell (if you hid; behind the dark lane) or Ash (if you stayed) | Each conversation is a fact: Tobin fell too, the bakers didn't see, the kids watched the lantern, Mara was worried. Ash gives you a candle if you hid. |
| Festival evening | Everyone | Reactions depend on what you did and how fully you did it. |
| Chapter two, the morning after | The bakers, Mara and Tobin ask for help; Nell, Ash and the kids | Each errand wears you down. Everyone takes "no" well. Ash offers to cover your stall; telling Ash or Mara before resting is how resting works. |
| Chapter three, the storm | Pip (scared), Mara, Tobin, Nell, Ash | Pip panics too; once you're calm you can breathe with her. Mara asks for help tying the lanterns down. |

## Conversations

Talking to someone opens a menu of topics you can come back to (`talk_*` knots at the end of
`story/festival.ink`). Topics change with the part of the story (`phase`: afternoon, finding out
what happened, festival, the morning after, after the storm) and open up as you learn things.
The conversations the story depends on (finding out what happened, the morning errands,
telling someone you're resting) are topics too. A bright, bobbing speech bubble means someone
you haven't talked to yet in this part of the story; a faint one means you have, and can again.

## Their own stories

Each villager's story runs quietly through all three chapters. None of them is a lesson; they
mirror the player's situation from the outside.

| Who | Their story | What they remember |
|---|---|---|
| Tobin | Fell on the same stone that morning. Laughs first so nobody can laugh at him, a habit from his dad. In chapter two Pip is acting out his fall for everyone; you can tell him you wanted to vanish too. He fixes the stone. | Whether you laughed with him, were kind ("that sounds rough"), or said nothing; whether you told him about your own fall. |
| Mara | Her grandmother started the festival 61 years ago with one lantern on her step. When things go quiet she assumes it's her fault. Overcommits; in chapter two, if you're resting, you can suggest she does too. Freezes in the storm. | Whether you heard about her grandmother; whether she took an hour off. |
| Wren and Oda | Wren's back hurts and she won't say so; Oda knows. By the storm, Wren asks for help out loud. | Whether you noticed Wren's back; whether you carried the bread trays. |
| Pip and Juno | Pip wants to stay up all night and is scared in the storm. Juno counts things (412 cobblestones, 73 flags) when it's loud: "It gives the noise somewhere to go." | Whether you helped Pip breathe; whether you know about Juno's counting. |
| Nell | One winter, after losing her place at the mill, she didn't come out till spring. When she did, someone had painted her door yellow. Nobody owned up. | What you told her ("Not me. Not today."); whether you heard about the door. |
| Ash | Wants to open a tea shop in the old mill office and is scared nobody will come. Signs the lease in chapter two, opens next week. | How you reacted (encouraged, joked, or asked what scared them). |

## Passing remarks

One-liners villagers say as you walk by (`src/game/barks.ts`), different in each part of the
story. Under the shame haze, only people you've found out about make friendly remarks. Nobody
chats during the storm or on the night you hid.
