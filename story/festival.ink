// Lantern festival: doing the opposite of what shame urges, when shame doesn't fit.
// (DBT: opposite action, check the facts, repair. Player-facing text never uses
// those names; it describes what each skill is for.)
//
// The player walks a side-scrolling village. Ink is the authority on what can
// happen next; the game maps choices onto the world:
//   [Text #talk: id]     walk up to that character and talk
//   [Text #go: place]    walk into that place (fountain, hollow, bench, home)
//   [Text #use: thing]   walk up to that thing and use it (lantern_table, stone, heap)
//   [Text]               a plain choice, shown as a button in the dialogue box
// Line tags:
//   #event: name [arg]   world and meter changes (src/logic/world.ts, meter.ts)
//   #scene: name         a TS challenge (fit, approach, mend, hang, chain); the TS
//                        layer picks the single placeholder choice that follows.
// Dialogue lines are `id: text` or `id/expression: text` (src/logic/cast.ts).
// Choice text in quotes is shown as the player's own spoken line.
// Characters and dialogue rules: CHARACTERS.md. Never frame choices as good or bad.

VAR variant = "main"      // "main" | "promise", set by the TS layer before start
VAR label = ""
VAR have_lanterns = false
VAR hide_count = 0
VAR stayed = false
VAR bailed = false
VAR answered_ash = false
VAR facts_seen = 0
VAR fit = false           // set by the fit scene
VAR reached = false       // set by the approach scene: got all the way to Mara
VAR head_up = false       // set by the approach scene: kept head up most of the way
VAR turned_back = false   // set by the approach scene: walked into the hollow instead
VAR path = ""             // "opposite" | "repair"
VAR part_a = false        // opposite: go back    | repair: own it
VAR part_b = false        // opposite: head up    | repair: make it right
VAR part_c = false        // opposite: voice      | repair: let it go
VAR completeness = ""     // "full" | "partial" | "minimal"
// Chapter two: the morning after
VAR task = ""             // errand in progress: "bread" | "bunting" | "sort"
VAR tasks_done = 0
VAR said_no = 0
VAR rest_ok = false       // the check-in found the tiredness real and the guilt not matching
VAR guilt_fits = false    // set by the check-in scene
VAR told = false          // told someone before going to rest
VAR rested = false
VAR rest_kind = ""        // "full" | "partial"
// Chapter three: the storm
VAR breaths = 0           // set by the breathing scene: slow breaths taken
VAR lost = false
VAR next_chapter = 0      // which chapter a save point leads into

EXTERNAL outcome(a, b, c)
EXTERNAL distress()       // the meter's current distress, read live from the TS layer

-> start

=== start ===
Lantern Lane, the afternoon of the festival. #event: afternoon
Tonight at sundown, every lantern in the square gets lit at once. You promised to bring them.
{ variant == "promise":
    This morning Mara asked you to carry her grandmother's paper lantern on its own. "It's the oldest thing I have." You promised.
}
They're waiting on the bench in the lantern workshop, on Market Street.
-> afternoon

=== afternoon ===
- (hub)
+ {not have_lanterns} [Pick up the lanterns in the workshop #use: lantern_table]
    -> pick_up -> hub
+ {not nell_before} [Talk to Nell #talk: nell]
    -> nell_before -> hub
+ {not ash_before} [Talk to Ash #talk: ash]
    -> ash_before -> hub
+ {not bakers_before} [Talk to the bakers #talk: wren]
    -> bakers_before -> hub
+ {not tobin_before} [Talk to Tobin #talk: tobin]
    -> tobin_before -> hub
+ {not mara_before} [Talk to Mara #talk: mara]
    -> mara_before -> hub
+ {not kids_before} [Talk to the kids #talk: pip]
    -> kids_before -> hub
+ {have_lanterns} [Carry the lanterns to the fountain #go: fountain] -> trip

=== pick_up ===
~ have_lanterns = true
Twelve lanterns. You stack them in your arms, all in one trip, to save time. #event: carry
{ variant == "promise":
    Her grandmother's lantern goes on top. It's just quicker this way.
}
->->

=== nell_before ===
nell/smile: Look at you. Off to fetch the lanterns?
nell: Sixty-one festivals I've watched from this step. Somebody always drops something.
+ ["Not me. Not today."]
    nell/laugh: That's what they all say.
+ ["Sixty-one? Which was the best?"]
    nell/warm: The year it poured and not one lantern would light. We all sat in the bakery till morning. Best one.
- ->->

=== ash_before ===
ash/smile: Tea when you're done? I'm saving you the chipped cup. It's your favorite, don't argue.
+ ["Save it. I'll be back before sundown."]
    ash: I'll hold you to it.
+ ["You could help me carry them."]
    ash/laugh: And leave the tea alone? Wren would drink all of it.
- ->->

=== bakers_before ===
wren/worried: Oda. The bread. Sundown.
oda: The bread will be ready at sundown, because the bread is always ready at sundown.
wren/worried: You don't know that.
oda/smile: Twenty years, Wren.
Oda turns to you.
oda: Don't mind us. We do this every year.
+ ["It smells amazing."]
    oda/warm: Come by later. The burnt ones are free.
+ [Leave them to it]
    They're already back to arguing.
- ->->

=== tobin_before ===
{ have_lanterns:
    tobin/laugh: Careful with those! Ha. Listen to me, saying careful.
- else:
    tobin/smile: They're all on the bench. Twelve. I counted, so Juno doesn't have to.
}
There's dust on his knees, and a cracked lantern by his elbow.
+ ["What happened to you?"]
    tobin/sad: Loose cobblestone by the fountain. Went down in front of everyone this morning. Took a whole string of bunting with me.
    tobin/laugh: I've been laughing about it all day, so nobody else gets to first.
+ ["Your lantern's cracked."]
    tobin/sad: Yeah. One of mine. Don't tell Mara.
- ->->

=== mara_before ===
mara/worried: There you are. Okay. Okay. Lanterns, then bread, then candles, then... okay.
+ ["Breathe. It's going to be lovely."]
    mara/smile: Tell me that again at sundown.
+ ["Where do you want them?"]
    mara: By the fountain. Thank you. Really.
- ->->

=== kids_before ===
pip/surprised: Are you bringing ALL the lanterns?
juno: There are twelve. Tobin counted. I counted again.
+ ["Want to see the red one later?"]
    pip/laugh: YES.
+ ["Twelve exactly."]
    juno/smile: I know.
- ->->

=== trip ===
Halfway to the fountain, your foot catches a loose cobblestone. #event: trip
The lanterns scatter across the stones. One rolls all the way around the fountain.
{ variant == "promise":
    You hear paper tear. #event: tear
}
Somebody laughs.
-> body

= body
Before any thought, your body answers.
Your face goes hot. #event: cue_heat
Your shoulders curl forward. Your eyes drop to the ground. #event: cue_slump
Something in you wants to be very small, very fast. #event: cue_urge
- (naming)
What is this feeling?
+ [Anger]
    ~ label = "anger"
    Anger can make your face hot too. It usually comes with a push forward: snap back, confront, fight.
    Is that the pull right now? Or is it to disappear?
    -> keep_or_look
+ [Fear]
    ~ label = "fear"
    Fear makes you want to get away from danger. Close. Is there danger here, or is it more about being seen?
    -> keep_or_look
+ [Sadness]
    ~ label = "sadness"
    Sadness can make you want to pull away, too. It usually comes after losing something. Did you lose something just now, or is it more about being seen?
    -> keep_or_look
+ [Embarrassment]
    ~ label = "shame"
    Embarrassment is a lighter kind of shame: the same heat, the same eyes-down, the same wish to vanish. Here, call it shame.
    -> urge
+ [Shame]
    ~ label = "shame"
    Hot face, eyes down, wanting to drop out of sight. That's what shame often feels like.
    -> urge
+ [Guilt]
    ~ label = "guilt"
    { variant == "promise":
        Guilt is the feeling of having gone against something you care about. You did make a promise about that lantern. Guilt and shame are tangled up here.
    - else:
        Guilt is the feeling of having gone against something you care about. Did you? Or is this more about being seen?
        -> keep_or_look
    }
    -> urge
+ [Not sure]
    ~ label = ""
    That's all right. You can notice it without a name: heat, eyes down, wanting to vanish.
    -> urge

= keep_or_look
+ [Look again] -> body.naming
+ [Stay with "{label}"]
    Okay. Notice what it wants you to do, too. Not fight. Not run from danger. Hide. That pull usually comes with shame.
    -> urge

=== urge ===
Up the hill, past the edge of the square, there's a hollow in the rocks where you used to hide as a kid. Nobody can see in.
The pull is loud now: get out of sight. You can feel it dragging at your feet. #event: pull on
+ [Hide in the hollow, up the hill #go: hollow] -> hide
+ [Stay where you are] -> stay

=== stay ===
~ stayed = true
You stay on the cobblestones. Your face is burning. The pull to run doesn't go anywhere. It just sits there, loud. #event: urge_hold
You don't follow it. Your feet stay where they are. #event: pull off
-> facts

=== hide ===
~ hide_count++
You let the shell come. #event: hide
{ hide_count == 1:
    Your back curves and hardens. Your arms fold in. In three heartbeats you're something round and armored, tucked into the hollow.
- else:
    The shell closes over you, easy as breathing.
}
The hollow is exactly the right size. Cool stone, moss, the festival far away and muffled. #event: cave_rest
Your breathing slows. The heat drains out of your face. Nobody is looking at you in here.
It works. It really does.
+ [Rest] -> costs

=== costs ===
{ hide_count == 1: -> first_night }
-> another_night

= first_night
The sun goes down. #event: nightfall
In the square, people wait for the lanterns. They're still lying where they fell. #event: square_dark
Footsteps on the hill path. They stop outside the hollow.
ash/worried: You in there?
ash: I brought the chipped cup. I'll leave it here.
+ ["I'm here. I just can't right now."]
    ~ answered_ash = true
    ash/warm: Okay. That's allowed. Tea's on the rock.
+ [Stay quiet]
    A pause. The cup clinks down on the rock. The footsteps go away.
-
Later, voices on the path below. Mara and Tobin, walking home.
mara/worried: Did I do something? They just left. They must be angry with me.
{ variant == "promise":
    mara/sad: And my grandmother's lantern...
}
tobin/sad: Maybe it was me. I laughed. I always laugh at the worst times.
You stay very still inside your shell.
+ [Sleep] -> morning

= another_night
Another night in the hollow. #event: nightfall
Down in the square, the festival goes on with a handful of candles. You can just see them from here.
The shadow has crept further up your lane. #event: darkness_spreads
+ [Sleep] -> morning

= morning
Morning. You uncurl. #event: morning
{ hide_count == 1:
    There's a cup of cold tea on the rock outside.
    Down the hill, every door on Lantern Lane has a paper invitation for tonight's supper at Mara's. Yours doesn't. #event: invitation missing
    The shadow has spread down your lane. It's too dark to walk there without a light. #event: darkness_spreads
}
{ hide_count > 1:
    #event: darkness_spreads
}
The relief from last night is gone. Thinking about the square, your face heats up all over again. #event: return_distress
-> facts

=== facts ===
The village looks the way the feeling sees it. Everyone is staring. Everyone is pointing. Everyone saw. #event: lens shame
But is that what actually happened? Talk to people. Look around the fountain. Find out.
-> facts_hub

=== facts_hub ===
- (hub)
+ {not fact_tobin} [Ask Tobin #talk: tobin]
    -> fact_tobin -> hub
+ {not fact_bakers} [Ask the bakers #talk: wren]
    -> fact_bakers -> hub
+ {not fact_kids} [Ask the kids #talk: pip]
    -> fact_kids -> hub
+ {not fact_stone} [Look at the cobblestones by the fountain #use: stone]
    -> fact_stone -> hub
+ {not fact_lanterns} [Look at the lanterns #use: heap]
    -> fact_lanterns -> hub
+ {hide_count > 0} {not ash_morning} [Talk to Ash #talk: ash]
    -> ash_morning -> hub
+ {hide_count > 0} {not fact_mara_nell} [Talk to Nell #talk: nell]
    -> fact_mara_nell -> hub
+ {hide_count == 0} {not fact_mara_ash} [Talk to Ash #talk: ash]
    -> fact_mara_ash -> hub
+ {hide_count > 0} [Go back to the hollow #go: hollow] -> hide
+ {facts_seen >= 3} [Sit on the fountain wall and think it over #go: bench] -> decide

=== fact_tobin ===
~ facts_seen++
tobin/sad: Hey. I'm sorry I laughed. I went down on that same stone this morning. Took out a whole string of bunting.
tobin/worried: I laugh when I'm nervous. It wasn't about you. #event: fact tobin
->->

=== fact_bakers ===
~ facts_seen++
{ hide_count > 0:
    oda: There you are. We missed you at the candles last night.
- else:
    wren/worried: Is it sundown? It feels like sundown.
}
+ ["Did you see me fall?"]
    wren/surprised: You fell? When?
+ ["Did you hear anyone laughing?"]
    wren/surprised: Laughing? At what?
-
oda: We were up to our elbows in dough, love. We didn't see a thing. #event: fact bakers
->->

=== fact_kids ===
~ facts_seen++
pip/laugh: Did you SEE the red lantern? It rolled ALL the way around the fountain!
+ ["You weren't laughing at me?"]
    juno/surprised: At you? We were watching the lantern.
+ ["I saw."]
    juno: It went around twice. I counted.
-
pip/smile: Best thing that happened all day. #event: fact kids
->->

=== fact_stone ===
~ facts_seen++
You crouch by the fountain. One cobblestone sticks up at an angle, loose under your hand. #event: fact stone
Anyone could catch a foot on it.
->->

=== fact_lanterns ===
~ facts_seen++
{ variant == "promise":
    You count them. Eleven are fine. Her grandmother's lantern has a long tear down one side. #event: fact lanterns
- else:
    You count them. Ten are fine. Two are dented. Paper and wire bend back. #event: fact lanterns
}
->->

=== ash_morning ===
{ answered_ash:
    ash/warm: You didn't drink the tea. Fair. It was terrible tea.
- else:
    ash/worried: I left tea on the rock. Wasn't sure you were in there.
}
ash: Mara thinks you're angry with her. She's been asking everyone.
ash: And your lane's gone dark. Here. Take this.
Ash hands you a candle in a jar. It's warm in your hands. #event: get candle
->->

=== fact_mara_nell ===
~ facts_seen++
nell: There you are. Mara came down this lane last night with a candle, asking after you.
+ ["Was she angry?"]
    nell/laugh: Angry? She was worried sick. She kept saying, "Are they okay? That looked like it hurt."
+ ["What did you tell her?"]
    nell: That you'd turn up. People do. She kept asking if you were hurt.
-
nell/warm: Lanes go dark sometimes. They light back up. Usually somebody has to walk down them with a lantern first. #event: fact mara
->->

=== fact_mara_ash ===
~ facts_seen++
ash/worried: You okay? Mara was asking if you were hurt. She saw you go down.
+ ["Was she upset?"]
    ash: Upset? She looked worried. About you, not the lanterns.
+ ["I'm fine."]
    ash/warm: Okay.
-
ash: Tea's here when you want it. #event: fact mara
->->

=== decide ===
You sit on the edge of the fountain. You found out {facts_seen} things about what actually happened. #scene: fit
+ [·] -> decided

= decided
{ fit: -> fits }
-> not_fits

=== not_fits ===
~ path = "opposite"
The feeling is real. It just doesn't match what happened. #event: lens facts
When a feeling doesn't match what happened, doing what it says keeps it going. Every time you hide, your body learns there was something to hide from.
Doing the opposite is how the feeling settles. Halfway doesn't do much: the feeling is watching how you walk, where you look, and how you sound.
The opposite of hiding is to go back, keep your head up, and say something.
-> opposite

=== opposite ===
~ part_a = false
~ part_b = false
~ part_c = false
Mara is by the fountain with the lanterns. Walk back to her. The pull to hide will drag at you. Hold Shift (or the Head up button) to keep your head up. #event: pull on #scene: approach
+ [·] -> walked

= walked
{ turned_back:
    ~ bailed = true
    -> hide
}
~ part_a = reached
~ part_b = head_up
{ reached:
    You're standing in front of Mara. Every part of you is loud. #event: pull off
- else:
    You stop at the edge of the square, half behind a cart. #event: pull off
}
-> voice

= voice
Mara looks over. Tobin is next to her.
+ ["Well. That was a spectacular fall. Want help checking which ones still work?"]
    ~ part_c = true
    Your voice shakes on the first word and steadies by the last. #event: oa_step
+ ["Sorry. I'm so sorry. I ruin everything."]
    The sorries keep coming, one after another.
+ [Say nothing]
    You don't trust your voice. You stay quiet.
-
~ completeness = outcome(part_a, part_b, part_c)
-> opposite_result

=== opposite_result ===
{ completeness:
- "full": -> full
- "partial": -> partial
- else: -> minimal
}

= full
mara/surprised: There you are! #event: settle full
mara/worried: Are you okay? That looked like it hurt.
tobin/sad: Sorry I laughed. I went down on that same stone this morning. Laughing is what I do instead of hiding.
tobin/laugh: Mostly.
{ variant == "promise":
    Then Mara picks up her grandmother's lantern and turns it over.
    mara/sad: It was my grandmother's.
    You keep your head up. It doesn't close the tear.
- else:
    tobin/smile: Two are dented. Dents give them character.
}
mara/smile: Help me get them up before sundown?
Hang the lanterns along the string. #scene: hang
+ [·] -> lit

= lit
{ variant == "promise":
    At sundown the lanterns are lit. Eleven glow. The twelfth hangs dark, torn down one side. #event: hang 11
- else:
    At sundown all twelve lanterns are lit. #event: hang 12
}
One catches, then the next, then the whole string. The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
Later you find an invitation tucked in your door frame. #event: invitation received
-> festival

= partial
{ part_a:
    mara/worried: Are you... okay? #event: settle partial
- else:
    From the edge, you catch Mara's eye. She waves, a little unsure. #event: settle partial
}
mara: Could you help hang them?
Hang the lanterns along the string. #scene: hang
+ [·] -> partial_lit

= partial_lit
You help, mostly with your hands, not your eyes. The heat in your face hangs around all evening.
{ variant == "promise":
    The lanterns are lit. The torn one hangs at the end of the string, dark. #event: hang 11
- else:
    The lanterns are lit. #event: hang 12
}
The square lights up, mostly. The shadow on your lane pulls back a little. #event: ripple partial
Mara hands you an invitation herself. She doesn't stay to talk. #event: invitation pending
-> festival

= minimal
{ part_a:
    Mara starts toward you, then stops, not sure you want company. #event: settle minimal
- else:
    From behind the cart, you watch Mara and Tobin sort the lanterns without you. #event: settle minimal
}
Mara and Tobin hang the lanterns without you.
{ variant == "promise":
    At sundown they're lit. Eleven glow. #event: hang 11
- else:
    At sundown they're lit. #event: hang 12
}
You watch the square light up from where you stand. #event: ripple minimal
The light stops at the end of your lane. The heat in your face fades slowly, and stays longer than you'd like.
-> festival

=== fits ===
~ path = "repair"
The feeling matches what happened. { variant == "promise": You did promise to carry that lantern on its own. You didn't. | You've decided this one fits. } #event: lens facts
When a feeling like this fits, it's pointing at something to fix. So fix it: say plainly what happened, make it right as best you can, and then put it down instead of carrying it around.
-> repair

=== repair ===
~ part_a = false
~ part_b = false
~ part_c = false
Mara is by the fountain with the lanterns. Go to her. The pull to hide will drag at you. Hold Shift (or the Head up button) to keep your head up. #event: pull on #scene: approach
+ [·] -> walked

= walked
{ turned_back:
    ~ bailed = true
    -> hide
}
You're with Mara. #event: pull off
+ { variant == "promise" } ["I stacked your grandmother's lantern with the others to save a trip. It tore when I fell. I'm sorry."]
    ~ part_a = true
    Saying it out loud makes your face burn hotter. #event: oa_step
    mara/sad: Thank you for telling me.
+ { variant == "main" } ["I dropped them. I'm sorry."]
    ~ part_a = true
    Saying it out loud makes your face burn hotter. #event: oa_step
    mara/warm: Hey. It was an accident. You don't owe me anything.
+ ["That stone. Someone should fix that stone."]
    mara: Mm. Someone should.
+ [Don't bring it up]
    You start gathering lanterns and don't mention it. Neither does she.
-
-> make_right

= make_right
+ { variant == "promise" } ["Can we fix it together? Now, before sundown?"]
    ~ part_b = true
    mara/sad: ...Okay. Yes.
    She finds glue and a sheet of gold paper. Patch the tear. #scene: mend
    ++ [·]
    You work on it side by side until the last seam is down. #event: mend
+ { variant == "promise" } ["I'll buy you a new one."]
    mara/sad: That's kind. It wouldn't be hers, though.
+ { variant == "main" } [Help fix the two dented lanterns]
    ~ part_b = true
    Mara holds them steady. Bend the wire back into shape. #scene: mend
    ++ [·]
    Good as new. Nearly. #event: oa_step
+ [Leave it]
    { variant == "promise":
        The torn lantern stays on the fountain step.
    - else:
        You set the dented ones aside.
    }
-
-> let_go

= let_go
Afterward, you want to keep apologizing, just in case.
+ [Let it be done. Help hang the lanterns.]
    ~ part_c = true
    You let the apology stand.
+ [Keep apologizing all evening]
    You say sorry again, and again later. Mara keeps saying it's fine. She starts to look tired.
-
~ completeness = outcome(part_a, part_b, part_c)
-> repair_result

=== repair_result ===
{ completeness == "minimal":
    #event: settle minimal
    Mara and Tobin hang the lanterns.
    { variant == "promise":
        At sundown they're lit. One hangs dark. #event: hang 11
    - else:
        At sundown they're lit. #event: hang 12
    }
    You and Mara don't quite look at each other. #event: ripple minimal
    The light stops at the end of your lane.
    -> festival
}
Hang the lanterns along the string. #scene: hang
+ [·] -> lit

= lit
{ completeness:
- "full":
    { variant == "promise":
        At sundown the lanterns are lit. Her grandmother's lantern glows with a gold seam down one side. #event: hang 12
        mara/warm: I think I like it better.
    - else:
        At sundown all twelve are lit, dents and all. #event: hang 12
    }
    Your heart was racing an hour ago. Now it's slow. #event: settle full
    The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
    Later you find an invitation tucked in your door frame. #event: invitation received
- else:
    #event: settle partial
    { variant == "promise" && not part_b:
        At sundown the lanterns are lit. One hangs dark, torn down its side. #event: hang 11
    - else:
        At sundown the lanterns are lit. #event: hang 12
    }
    The square is lit. Things with Mara feel a little unfinished. #event: ripple partial
    She hands you an invitation herself. #event: invitation pending
}
-> festival

=== festival ===
{ completeness:
- "full": The festival is here. The square is full of people and light.
- "partial": The festival is here. The square is lit and busy.
- else: The festival goes on. You can still walk over to anyone you like.
}
Talk to anyone you like. When you're ready, walk home to Lantern Lane.
- (hub)
+ {not mara_evening} [Talk to Mara #talk: mara]
    -> mara_evening -> hub
+ {not tobin_evening} [Talk to Tobin #talk: tobin]
    -> tobin_evening -> hub
+ {not kids_evening} [Talk to the kids #talk: pip]
    -> kids_evening -> hub
+ {not bakers_evening} [Talk to the bakers #talk: wren]
    -> bakers_evening -> hub
+ {not ash_evening} [Talk to Ash #talk: ash]
    -> ash_evening -> hub
+ {not nell_evening} [Talk to Nell #talk: nell]
    -> nell_evening -> hub
+ [Walk home #go: home] -> chain_review

=== mara_evening ===
{ completeness:
- "full":
    { variant == "promise":
        { path == "repair":
            mara/warm: I keep looking at that gold seam. Grandma would have loved it. She fixed everything with whatever was nearby.
        - else:
            mara/sad: I'm glad you came back. I'm still sad about the lantern. Both of those are true.
        }
    - else:
        mara/smile: Supper's at mine tomorrow too. You're coming. That's not a question.
    }
- "partial":
    mara/worried: I'm glad you're here. Are we... okay?
- else:
    mara/worried: I didn't know if you wanted company. I still don't, really.
}
+ ["We're okay."]
    mara/smile: Okay. Good. Okay.
+ [Nod]
    She nods back.
- ->->

=== tobin_evening ===
{ completeness == "full":
    tobin/laugh: Two falls on one stone in one day. They should name it after us.
- else:
    tobin/worried: Hey. About yesterday. I laugh when I'm nervous. It wasn't about you.
}
+ ["Somebody should fix that stone."]
    tobin/smile: I'm fixing it tomorrow. With a hammer. Personally.
+ ["Thanks for saying that."]
    tobin/warm: Yeah. Thanks for listening to it.
- ->->

=== bakers_evening ===
oda/smile: Burnt ones, as promised.
wren: They're not burnt. They're well done.
+ [Take one]
    It's warm and a little bitter at the edges. It's perfect.
+ ["What do I owe you?"]
    oda/laugh: Owe us? Eat the bread.
- ->->

=== kids_evening ===
pip/laugh: The red one is the brightest! Look! LOOK!
juno: It's the same as the others. It just has a dent.
pip/smile: That's why it's the best.
+ ["It's my favorite too."]
    pip/laugh: I KNEW it.
+ [Look up at it]
    It is, actually, the brightest.
- ->->

=== nell_evening ===
{ completeness == "full":
    nell/smile: Your lane's lit all the way to my step. I can see my own feet. Haven't seen them in years.
- else:
    nell: Lane's still a bit dim. It'll come.
}
+ ["Sixty-two festivals now."]
    nell/laugh: Don't count for me. I'll get ideas.
+ [Sit on the step with her for a minute]
    She doesn't say anything. It's nice.
- ->->

=== ash_evening ===
{ hide_count > 0:
    ash/warm: The chipped cup's still on the rock up the hill, by the way. I'll let you fetch it.
- else:
    ash/smile: You never came back for your tea.
}
ash: Fresh pot. Sit.
+ [Sit]
    The tea is terrible. You drink all of it.
+ ["Tomorrow. I promise."]
    ash/laugh: I'll hold you to it.
- ->->

=== chain_review ===
At home, you think back over the day, one moment at a time. #scene: chain
+ [·] -> chapter_one_done

// Save points between chapters. The TS layer saves the story here and offers
// a break; resuming picks up at the start of the next chapter.
=== chapter_one_done ===
~ next_chapter = 2
Chapter one is done. #scene: save
+ [·] -> day_two

=== chapter_two_done ===
~ next_chapter = 3
Chapter two is done. #scene: save
+ [·] -> storm

=== ending ===
The lanterns burn on into the night. #event: end
-> END

// ---------------------------------------------------------------------------
// Chapter two: the morning after. When pulling back is the right call.
// (DBT: checking the facts on guilt; resting and saying no as effective action,
// not avoidance. Player-facing text never names these.)

=== start_day_two ===
// Entry point for "jump to chapter two" on the title screen.
~ completeness = "full"
-> day_two

=== day_two ===
Chapter two: The morning after. #event: chapter 2
You slept badly. Three hours, maybe. Your eyes feel full of sand.
Outside, the whole village is already up. Tonight is the last night of the festival, and everyone has something that needs doing.
-> day_two_hub

=== day_two_hub ===
- (hub)
{ tasks_done >= 3 && not rested: -> collapse }
+ {task == "" && not bread_ask} [Ask the bakers if they need anything #talk: wren]
    -> bread_ask -> hub
+ {task == "bread"} [Carry the bread trays to the fountain #go: fountain]
    -> bread_done -> hub
+ {task == "" && not bunting_ask && not (rest_ok && not told)} [Ask Mara if she needs anything #talk: mara]
    -> bunting_ask -> hub
+ {task == "bunting"} [Take down the bunting on Market Street #use: bunting]
    -> bunting_done -> hub
+ {task == "" && not sort_ask} [Ask Tobin if he needs anything #talk: tobin]
    -> sort_ask -> hub
+ {task == "sort"} [Sort the broken lanterns in the workshop #use: lantern_table]
    -> sort_done -> hub
+ {rest_ok && not told} [Tell Ash you're taking the afternoon #talk: ash]
    -> tell_ash -> hub
+ {rest_ok && not told} [Tell Mara you're taking the afternoon #talk: mara]
    -> tell_mara -> hub
+ {not nell_day2} [Talk to Nell #talk: nell]
    -> nell_day2 -> hub
+ {not ash_day2 && not (rest_ok && not told)} [Talk to Ash #talk: ash]
    -> ash_day2 -> hub
+ {not kids_day2} [Talk to the kids #talk: pip]
    -> kids_day2 -> hub
+ {not check_in} [Sit on the fountain wall and check in with yourself #go: bench] -> check_in
+ [Go up to the hollow #go: hollow] -> hollow_choice

=== bread_ask ===
oda: Morning! Could you carry the bread trays to the square? Wren's back is acting up.
wren/worried: My back is fine. My back has never been better.
+ ["Sure, I'll take them."]
    ~ task = "bread"
    oda/smile: You're a treasure.
+ ["Not today, sorry. I'm running on empty."]
    ~ said_no++
    oda/warm: Then don't run. Pip and Juno can carry the small ones.
- ->->

=== bunting_ask ===
mara: Could you take the bunting down on Market Street? Tobin says the wind's picking up tonight.
+ ["On it."]
    ~ task = "bunting"
    mara/smile: Thank you. Really.
+ ["I can't today. I'm wiped out."]
    ~ said_no++
    mara/warm: Of course. Tobin can do it. He likes ladders. He says he doesn't, but he does.
- ->->

=== sort_ask ===
tobin: Help me sort the broken lanterns? Two piles: fixable and not.
+ ["Okay."]
    ~ task = "sort"
    tobin/smile: Great. They're on the bench.
+ ["Can it wait? I'm exhausted."]
    ~ said_no++
    tobin/laugh: It's waited a year. It can wait a day.
- ->->

=== bread_done ===
~ task = ""
~ tasks_done++
You set the trays down by the fountain. They were heavier than they looked. #event: tire
-> body_notice ->
->->

=== bunting_done ===
~ task = ""
~ tasks_done++
You climb the ladder and unhook the bunting, one flag at a time. Your arms ache by the last one. #event: tire
-> body_notice ->
->->

=== sort_done ===
~ task = ""
~ tasks_done++
You sort lanterns into two piles until the colors start to blur together. #event: tire
-> body_notice ->
->->

=== body_notice ===
{ tasks_done:
- 1: You yawn so hard your jaw clicks. Your arms feel heavy.
- 2: Your hands are shaking a little. A headache is starting behind your eyes.
- else: Everything is too bright and too loud.
}
->->

=== nell_day2 ===
nell/smile: You look like a candle burned at both ends.
+ ["I'm fine."]
    nell: Mm. That's what candles say.
+ ["I'm exhausted."]
    nell/warm: In my day we called it a lie-in. I recommend it highly. I've had about sixty of them.
- ->->

=== ash_day2 ===
ash/smile: You look terrible. Lovingly.
ash: If you need someone to take your stall shift this afternoon, I'm free.
+ ["I might take you up on that."]
    ash/warm: Offer stands.
+ ["I'll be fine."]
    ash: Offer still stands.
- ->->

=== kids_day2 ===
pip/laugh: Will you play lantern tag with us?
{ tasks_done >= 2:
    You hear yourself say "Not NOW" much louder than you meant to.
    pip/sad: ...Okay.
    juno: She was only asking.
    ->->
}
+ ["Maybe later. I'm really tired."]
    juno: Later counts. I'm writing it down.
+ ["One round."]
    You play one round. You're it the whole time. #event: tire
- ->->

=== check_in ===
You sit on the fountain wall and check in. Not with the list. With yourself. #scene: checkin
+ [·] -> checked

= checked
{ guilt_fits:
    Okay. Then do what's needed, and keep an eye on how you're doing.
    -> day_two_hub
}
~ rest_ok = true
The tiredness matches what's happening: three hours of sleep, and you've been going since dawn. The guilt about stopping doesn't.
Resting isn't the same as hiding. Hiding gets you away from a feeling. Resting looks after the person who's having it.
The difference is how you go: tell someone, say when you'll be back, and then really rest.
-> day_two_hub

=== tell_ash ===
+ ["I'm wiped out. Could you take my stall this afternoon? I'll be back for the last night."]
    ~ told = true
    ash/warm: Finally. Go. I've got it.
- ->->

=== tell_mara ===
+ ["I need to rest this afternoon. I'll be back for the last night."]
    ~ told = true
    mara/smile: Of course. Thank you for telling me. I'd have worried.
- ->->

=== hollow_choice ===
{ told:
    -> rest
}
The hollow is right there. Nobody knows you're up here.
+ [Rest here anyway] -> rest
+ [Go back down first] -> day_two_hub

=== collapse ===
You sit down on the edge of the fountain and can't make yourself stand back up. #event: tire
ash/worried: Hey. Hey. When did you last sleep?
ash: Go. Up the hill, home, anywhere. I've got your stall.
~ told = true
+ [Let Ash take over] -> rest

=== rest ===
~ rested = true
{ tasks_done >= 3:
    ~ rest_kind = "partial"
- else:
    ~ rest_kind = "full"
}
You don't let the shell come this time. You just sit, back against the cool stone, and close your eyes. #event: rest {rest_kind}
{ told:
    Down below, someone knows where you are. Nothing needs you for a few hours.
}
The afternoon goes by without you. It turns out that's allowed.
You wake as the sun is going down. #event: sunset
{ rest_kind == "full":
    Your head is clear. Your hands are steady.
- else:
    You feel better. Not all the way. Your body is still catching up.
}
{ not told:
    mara/worried: There you are! I looked everywhere.
    mara/smile: You look better, though. Good.
}
-> chapter_two_done

// ---------------------------------------------------------------------------
// Chapter three: the storm. When a feeling is too big to think through,
// bring the body down first. (DBT: TIPP: cold water and paced breathing.)

=== start_storm ===
// Entry point for "jump to chapter three" on the title screen.
~ completeness = "full"
~ rested = true
~ rest_kind = "full"
-> storm

=== storm ===
Chapter three: The storm. #event: chapter 3
The last night of the festival. The lanterns are lit and the square is full.
Then the wind changes. #event: storm on
A gust tears across the square. The lantern string bucks and snaps. Someone's hat cartwheels past the fountain.
pip/worried: The lanterns!
Your heart slams. Your breath goes short and high. Everything is too loud at once. #event: wave
-> storm_hub

=== storm_hub ===
- (hub)
{ distress() < 50: -> clear_head }
{ storm_hub.hub > 1:
    Your thoughts are still racing too fast to make a plan.
- else:
    You can't think. There's no plan in your head, just noise. First, your body has to come down.
}
+ {not cold_water} [Splash cold water from the fountain on your face #use: fountain_water]
    -> cold_water -> hub
+ [Slow your breathing]
    -> breathe -> hub
+ {not grab} [Grab at the lanterns now]
    -> grab -> hub

=== cold_water ===
You plunge your hands into the fountain and press the cold water to your face. You hold your breath for a few seconds, face wet. #event: calm cold
Your heartbeat drops a notch. Then another.
->->

=== breathe ===
Breathe in through your nose, and out slower than in. #scene: breathe
+ [·]
- { breaths:
- 0: It's hard to slow down. Your breath keeps catching.
- 1: One slow breath. A little room opens up.
- else: {breaths} slow breaths. Your shoulders come down from around your ears.
}
->->

=== grab ===
~ lost = true
You lunge for the nearest lantern. Your hands are shaking too hard. It slips, and the wind takes it up over the rooftops. #event: lose_lantern
It's gone. The others are still there.
->->

=== clear_head ===
The storm is just as loud. But you can think again. #event: clear
Pip is crouched behind the fountain, crying. The lantern string whips back and forth.
+ ["Pip. Breathe with me. In... and slowly out."]
    pip/sad: I can't.
    "In," you say, and breathe in. "And out, slow." You do it again. Then she does it with you.
    pip/worried: Okay. Okay. I'm okay.
+ [Run straight to the lanterns]
    You leave Pip with Juno and run for the string.
-
mara/worried: Help me tie them down!
Tie each lantern to the string before the wind takes it. #scene: secure
+ [·] -> storm_end

=== storm_end ===
The wind drops as fast as it came. The rain stops. #event: storm off #event: settle full
{ lost:
    One lantern is somewhere over the hill. The rest still glow.
- else:
    Every lantern still glows.
}
tobin/laugh: Best festival in years. Nobody will ever forget that wind.
nell/smile: Sixty-two festivals. That was the best storm.
ash/warm: You looked like you were going to bolt for a second. Then you didn't.
You stand in the square with everyone, soaked through, under the lanterns. #event: face you:smile
-> ending
