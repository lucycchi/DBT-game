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
// Conversations: which part of the story we're in, and who you've talked to in it
VAR phase = ""            // "afternoon" | "facts" | "festival" | "day2" | "after_storm"
VAR seen_nell = ""
VAR seen_ash = ""
VAR seen_bakers = ""
VAR seen_tobin = ""
VAR seen_mara = ""
VAR seen_kids = ""
// What villagers remember, across chapters
VAR nell_not_me = false   // you told Nell "Not me. Not today."
VAR nell_door = false     // heard the story of Nell's yellow door
VAR ash_shop = false      // Ash told you about the tea shop
VAR ash_cheer = ""        // how you answered: "encourage" | "joke" | "ask"
VAR tobin_fall = false    // Tobin told you about his own fall
VAR tobin_tone = ""       // how you took it: "laughed" | "kind" | "quiet"
VAR tobin_shared = false  // you told Tobin you'd wanted to vanish too
VAR mara_grandma = false  // Mara told you how the festival started
VAR mara_rests = false    // Mara agreed to take an hour off too
VAR wren_back = false     // you noticed Wren's back
VAR juno_counting = false // Juno told you why she counts
VAR carried_bread = false
VAR helped_pip = false

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
~ phase = "afternoon"
- (hub)
+ {not have_lanterns} [Pick up the lanterns in the workshop #use: lantern_table]
    -> pick_up -> hub
+ {seen_nell != phase} [Talk to Nell #talk: nell #new]
    -> talk_nell -> hub
+ {seen_nell == phase} [Talk to Nell #talk: nell]
    -> talk_nell -> hub
+ {seen_ash != phase} [Talk to Ash #talk: ash #new]
    -> talk_ash -> hub
+ {seen_ash == phase} [Talk to Ash #talk: ash]
    -> talk_ash -> hub
+ {seen_bakers != phase} [Talk to the bakers #talk: wren #new]
    -> talk_bakers -> hub
+ {seen_bakers == phase} [Talk to the bakers #talk: wren]
    -> talk_bakers -> hub
+ {seen_tobin != phase} [Talk to Tobin #talk: tobin #new]
    -> talk_tobin -> hub
+ {seen_tobin == phase} [Talk to Tobin #talk: tobin]
    -> talk_tobin -> hub
+ {seen_mara != phase} [Talk to Mara #talk: mara #new]
    -> talk_mara -> hub
+ {seen_mara == phase} [Talk to Mara #talk: mara]
    -> talk_mara -> hub
+ {seen_kids != phase} [Talk to the kids #talk: pip #new]
    -> talk_kids -> hub
+ {seen_kids == phase} [Talk to the kids #talk: pip]
    -> talk_kids -> hub
+ {have_lanterns} [Carry the lanterns to the fountain #go: fountain] -> trip

=== pick_up ===
~ have_lanterns = true
Twelve lanterns. You stack them in your arms, all in one trip, to save time. #event: carry
{ variant == "promise":
    Her grandmother's lantern goes on top. It's just quicker this way.
}
->->

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
~ phase = "facts"
- (hub)
+ {seen_nell != phase} [Talk to Nell #talk: nell #new]
    -> talk_nell -> hub
+ {seen_nell == phase} [Talk to Nell #talk: nell]
    -> talk_nell -> hub
+ {seen_ash != phase} [Talk to Ash #talk: ash #new]
    -> talk_ash -> hub
+ {seen_ash == phase} [Talk to Ash #talk: ash]
    -> talk_ash -> hub
+ {seen_bakers != phase} [Talk to the bakers #talk: wren #new]
    -> talk_bakers -> hub
+ {seen_bakers == phase} [Talk to the bakers #talk: wren]
    -> talk_bakers -> hub
+ {seen_tobin != phase} [Talk to Tobin #talk: tobin #new]
    -> talk_tobin -> hub
+ {seen_tobin == phase} [Talk to Tobin #talk: tobin]
    -> talk_tobin -> hub
+ {seen_kids != phase} [Talk to the kids #talk: pip #new]
    -> talk_kids -> hub
+ {seen_kids == phase} [Talk to the kids #talk: pip]
    -> talk_kids -> hub
+ {not fact_stone} [Look at the cobblestones by the fountain #use: stone]
    -> fact_stone -> hub
+ {not fact_lanterns} [Look at the lanterns #use: heap]
    -> fact_lanterns -> hub
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
~ phase = "festival"
{ completeness:
- "full": The festival is here. The square is full of people and light.
- "partial": The festival is here. The square is lit and busy.
- else: The festival goes on. You can still walk over to anyone you like.
}
Talk to anyone you like. When you're ready, walk home to Lantern Lane.
- (hub)
+ {seen_mara != phase} [Talk to Mara #talk: mara #new]
    -> talk_mara -> hub
+ {seen_mara == phase} [Talk to Mara #talk: mara]
    -> talk_mara -> hub
+ {seen_tobin != phase} [Talk to Tobin #talk: tobin #new]
    -> talk_tobin -> hub
+ {seen_tobin == phase} [Talk to Tobin #talk: tobin]
    -> talk_tobin -> hub
+ {seen_kids != phase} [Talk to the kids #talk: pip #new]
    -> talk_kids -> hub
+ {seen_kids == phase} [Talk to the kids #talk: pip]
    -> talk_kids -> hub
+ {seen_bakers != phase} [Talk to the bakers #talk: wren #new]
    -> talk_bakers -> hub
+ {seen_bakers == phase} [Talk to the bakers #talk: wren]
    -> talk_bakers -> hub
+ {seen_ash != phase} [Talk to Ash #talk: ash #new]
    -> talk_ash -> hub
+ {seen_ash == phase} [Talk to Ash #talk: ash]
    -> talk_ash -> hub
+ {seen_nell != phase} [Talk to Nell #talk: nell #new]
    -> talk_nell -> hub
+ {seen_nell == phase} [Talk to Nell #talk: nell]
    -> talk_nell -> hub
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
~ phase = "day2"
- (hub)
{ tasks_done >= 3 && not rested: -> collapse }
+ {seen_bakers != phase} [Talk to the bakers #talk: wren #new]
    -> talk_bakers -> hub
+ {seen_bakers == phase} [Talk to the bakers #talk: wren]
    -> talk_bakers -> hub
+ {seen_mara != phase} [Talk to Mara #talk: mara #new]
    -> talk_mara -> hub
+ {seen_mara == phase} [Talk to Mara #talk: mara]
    -> talk_mara -> hub
+ {seen_tobin != phase} [Talk to Tobin #talk: tobin #new]
    -> talk_tobin -> hub
+ {seen_tobin == phase} [Talk to Tobin #talk: tobin]
    -> talk_tobin -> hub
+ {seen_ash != phase} [Talk to Ash #talk: ash #new]
    -> talk_ash -> hub
+ {seen_ash == phase} [Talk to Ash #talk: ash]
    -> talk_ash -> hub
+ {seen_nell != phase} [Talk to Nell #talk: nell #new]
    -> talk_nell -> hub
+ {seen_nell == phase} [Talk to Nell #talk: nell]
    -> talk_nell -> hub
+ {seen_kids != phase} [Talk to the kids #talk: pip #new]
    -> talk_kids -> hub
+ {seen_kids == phase} [Talk to the kids #talk: pip]
    -> talk_kids -> hub
+ {task == "bread"} [Carry the bread trays to the fountain #go: fountain]
    -> bread_done -> hub
+ {task == "bunting"} [Take down the bunting on Market Street #use: bunting]
    -> bunting_done -> hub
+ {task == "sort"} [Sort the broken lanterns in the workshop #use: lantern_table]
    -> sort_done -> hub
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
~ carried_bread = true
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
    ~ helped_pip = true
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
Everyone comes out from doorways and from under the bakery awning, soaked and laughing. #event: face you:smile
-> after_storm

=== after_storm ===
~ phase = "after_storm"
- (hub)
+ {seen_mara != phase} [Talk to Mara #talk: mara #new]
    -> talk_mara -> hub
+ {seen_mara == phase} [Talk to Mara #talk: mara]
    -> talk_mara -> hub
+ {seen_tobin != phase} [Talk to Tobin #talk: tobin #new]
    -> talk_tobin -> hub
+ {seen_tobin == phase} [Talk to Tobin #talk: tobin]
    -> talk_tobin -> hub
+ {seen_kids != phase} [Talk to the kids #talk: pip #new]
    -> talk_kids -> hub
+ {seen_kids == phase} [Talk to the kids #talk: pip]
    -> talk_kids -> hub
+ {seen_bakers != phase} [Talk to the bakers #talk: wren #new]
    -> talk_bakers -> hub
+ {seen_bakers == phase} [Talk to the bakers #talk: wren]
    -> talk_bakers -> hub
+ {seen_ash != phase} [Talk to Ash #talk: ash #new]
    -> talk_ash -> hub
+ {seen_ash == phase} [Talk to Ash #talk: ash]
    -> talk_ash -> hub
+ {seen_nell != phase} [Talk to Nell #talk: nell #new]
    -> talk_nell -> hub
+ {seen_nell == phase} [Talk to Nell #talk: nell]
    -> talk_nell -> hub
+ [Walk home #go: home] -> ending


// ===========================================================================
// Conversations. Each villager has a menu of topics that changes with `phase`
// and opens up as you learn things. Story-critical talks (facts, errands,
// telling someone you're resting) are topics here too. Rules: CHARACTERS.md.
// Villagers talk about their own lives; nobody explains a skill.
// ===========================================================================

=== talk_nell ===
{ seen_nell != phase:
    ~ seen_nell = phase
    { phase:
    - "afternoon": nell/smile: Look at you. Off to fetch the lanterns?
    - "facts":
        { hide_count > 0:
            nell/warm: Come here, then.
        - else:
            nell/worried: I heard a clatter from up here. You all right?
        }
    - "festival": nell/smile: Look at that. Sixty-one festivals and they still get me.
    - "day2": nell: Morning.
    - else: nell/laugh: Well! Sixty-two festivals. That was the best storm.
    }
- else:
    nell: Back again? I'm not going anywhere.
}
- (menu)
* {phase == "afternoon"} [Ask how many festivals she's seen]
    nell: Sixty-one, from this step. Somebody always drops something.
    ** ["Not me. Not today."]
        ~ nell_not_me = true
        nell/laugh: That's what they all say.
    ** ["Which one was the best?"]
        nell/warm: The year it poured and not one lantern would light. We all sat in the bakery till morning. Best one.
    -- 
* {phase == "afternoon"} [Ask about her yellow front door]
    -> nell_door_story ->
* {phase == "afternoon"} [Ask what she's watching]
    nell: Everyone. Best show in the village.
    nell/smile: Mara's walked past six times with that list. Tobin twice, limping. Pip once, at a gallop.
* {phase == "facts" && hide_count > 0} [Ask if anyone came looking for you]
    -> fact_mara_nell ->
* {phase == "facts" && hide_count == 0} [Ask if she saw you fall]
    nell: From up here? I saw a lantern rolling and somebody getting up.
    nell/warm: That's all a fall is, from a distance.
* {phase == "facts" && nell_door && hide_count > 0} [Ask about her yellow door again]
    nell/warm: You've been up in that hollow, haven't you.
    nell: Whoever painted my door never knocked. They just made it a bit easier to come out.
* {phase == "festival"} [Ask how this one compares]
    -> nell_evening ->
* {phase == "festival" && nell_not_me} [Remind her what you said this afternoon]
    nell/laugh: "Not me, not today." I remember.
    nell/warm: Somebody always drops something. Doesn't mean it stays dropped.
* {phase == "day2"} [Tell her how you're doing]
    -> nell_day2 ->
* {phase == "day2" && nell_door} [Ask who she thinks painted her door]
    nell: Sixty years of guessing. I've decided it was everybody.
* {phase == "after_storm"} [Talk about the storm]
    nell: Best storm in sixty-two festivals. Nobody went home.
    nell/warm: I saw you by the fountain, mid-storm. Steady as a post, in the end.
* {phase == "after_storm" && nell_door} [Ask if she'll ever repaint her door]
    nell/smile: Never. Yellow's the only color a door should be.
+ [Say goodbye]
    -> bye
- -> menu
= bye
nell/smile: Go on, then.
->->

=== nell_door_story ===
nell: You've noticed my door, then. Yellow as a yolk.
nell: One winter, a long time ago, I lost my place at the mill. I couldn't face anybody. I didn't come out till spring.
+ ["What happened in spring?"]
    nell/warm: I opened the door, and it was yellow. Somebody had painted it while I was in there.
+ [Listen]
    nell/warm: When I finally opened it, it was yellow. Somebody had painted it while I was hiding.
-
nell/smile: Nobody ever owned up. I've never painted over it.
~ nell_door = true
->->

=== talk_ash ===
{ seen_ash != phase:
    ~ seen_ash = phase
    { phase:
    - "afternoon": ash/smile: Tea when you're done? I'm saving you the chipped cup. It's your favorite, don't argue.
    - "facts":
        { hide_count > 0:
            ash/worried: Hey. There you are.
        - else:
            ash: Hey.
        }
    - "festival": ash/smile: There you are.
    - "day2": ash: Morning.
    - else: ash/warm: Here. Hot. Drink it.
    }
- else:
    ash: Still here. Still pouring.
}
- (menu)
* {phase == "afternoon"} [Ask what's in the pot]
    ash: Smoky black with orange peel. I'm calling it Lantern. Very marketable.
    ** ["Save me a cup. I'll be back before sundown."]
        ash: I'll hold you to it.
    ** ["You could help me carry the lanterns."]
        ash/laugh: And leave the tea alone? Wren would drink all of it.
    --
* {phase == "afternoon"} [Ask about the tea cart]
    -> ash_shop_story ->
* {phase == "facts" && hide_count > 0 && not ash_morning} [Ask how last night went]
    -> ash_morning ->
* {phase == "facts" && hide_count == 0} [Ask if anyone said anything about the fall]
    -> fact_mara_ash ->
* {phase == "facts" && ash_shop} [Ask about the tea shop]
    ash: Not now. You first. How are you doing?
    ** ["Embarrassed, honestly."]
        ash/warm: Yeah. That stone has embarrassed half the village this week.
    ** ["I'm fine."]
        ash: Okay. Offer stands, whenever.
    --
* {phase == "festival"} [Have some tea]
    -> ash_evening ->
* {phase == "festival" && ash_shop} [Ask about the tea shop]
    ash/laugh: I put a sign up. Then I took it down. Then I put it back up.
    { ash_cheer == "encourage":
        ash/warm: You said you'd come. I'm holding you to that, too.
    }
* {phase == "day2" && not (rest_ok && not told)} [Ask about the stall]
    -> ash_day2 ->
* {phase == "day2" && rest_ok && not told} [Tell Ash you're taking the afternoon]
    -> tell_ash ->
* {phase == "day2" && ash_shop} [Ask how the shop plans are going]
    ash/worried: I signed the lease this morning. I haven't slept either. Don't tell anyone.
    ** ["That's huge. Well done."]
        ash/warm: It's terrifying. Thank you.
    ** ["You should take a rest too."]
        ash/laugh: After you.
    --
* {phase == "after_storm"} [Drink the tea]
    The tea is terrible. You drink all of it.
    ash/warm: You looked like you were going to bolt for a second, back there. Then you didn't.
* {phase == "after_storm" && ash_shop} [Ask about opening day]
    ash: Next week. I'm terrified. I'm doing it anyway.
    ash/smile: The chipped cup's yours, obviously.
+ [Say goodbye]
    -> bye
- -> menu
= bye
ash: See you.
->->

=== ash_shop_story ===
ash: Can I tell you something? I'm thinking of turning the old mill office into a tea shop. A real one. With chairs.
ash/worried: What if nobody comes? What if I open the door and it's just me and forty cups?
+ ["People will come. I'll come."]
    ~ ash_cheer = "encourage"
    ash/warm: That's one.
+ ["Then you'll have forty cups of tea. Sounds fine to me."]
    ~ ash_cheer = "joke"
    ash/laugh: You're no help at all. Thank you.
+ ["What scares you most about it?"]
    ~ ash_cheer = "ask"
    ash: That I'll try, and it'll be... just okay.
    ash/smile: Huh. Saying it out loud makes it smaller.
-
~ ash_shop = true
->->

=== talk_tobin ===
{ seen_tobin != phase:
    ~ seen_tobin = phase
    { phase:
    - "afternoon":
        { have_lanterns:
            tobin/laugh: Careful with those! Ha. Listen to me, saying careful.
        - else:
            tobin/smile: They're all on the bench. Twelve. I counted, so Juno doesn't have to.
        }
        There's dust on his knees, and a cracked lantern by his elbow.
    - "facts": tobin/worried: Oh. Hi.
    - "festival": tobin/smile: Look at them go.
    - "day2": tobin: Morning. Mind the glue.
    - else: tobin/laugh: Did you SEE that wind?
    }
- else:
    tobin: Back for more?
}
- (menu)
* {phase == "afternoon"} [Ask about his knees]
    tobin/sad: Loose cobblestone by the fountain. Went down in front of everyone this morning. Took a whole string of bunting with me.
    tobin/laugh: I've been laughing about it all day, so nobody else gets to first.
    ~ tobin_fall = true
    ** [Laugh with him]
        ~ tobin_tone = "laughed"
        tobin/laugh: See? Better already.
    ** ["That sounds rough, actually."]
        ~ tobin_tone = "kind"
        tobin/sad: ...Yeah. It was a bit.
    ** [Say nothing]
        ~ tobin_tone = "quiet"
        He fiddles with a twist of wire.
    --
* {phase == "afternoon"} [Ask about the lanterns]
    tobin/smile: Eleven of them are mine. Took me all spring.
    { variant == "promise":
        tobin: The twelfth is Mara's grandmother's. Older than me. Don't drop that one. Ha.
    - else:
        tobin: The red one's Pip's favorite. She's named it. I'm not allowed to say the name.
    }
* {phase == "afternoon"} [Ask about the workshop]
    tobin: Old Hesketh taught me. He retired to the coast. Writes me letters about glue.
    tobin/laugh: Long letters.
* {phase == "facts"} [Ask Tobin what happened]
    -> fact_tobin ->
* {phase == "facts" && fact_tobin} [Ask why he laughs so much]
    tobin: My dad laughed at everything. Even when it hurt. Especially when it hurt.
    tobin/worried: I think I learned that if you laugh first, nobody can laugh at you.
    tobin/sad: Doesn't really work, does it.
    ** ["It's a good laugh, though."]
        tobin/smile: Thanks.
    ** ["No. But I get it."]
        tobin/warm: Yeah.
    --
* {phase == "festival"} [Talk about the stone]
    -> tobin_evening ->
* {phase == "festival"} [Ask if anyone teased him]
    tobin/laugh: Pip asked me to fall again so her cousin could see. Twice.
    { tobin_tone == "kind":
        tobin/warm: You were the only one who said it sounded rough. I thought about that all afternoon.
    }
* {phase == "day2" && task == "" && not sort_ask} [Ask if he needs anything]
    -> sort_ask ->
* {phase == "day2"} [Ask how he's doing]
    tobin/worried: Honestly? Pip's been telling everyone about my fall. With actions. It's a whole show now.
    ** {hide_count > 0} ["I hid in the hollow all night, after mine."]
        ~ tobin_shared = true
        tobin/surprised: You did? Huh.
        tobin/smile: I thought it was just me who wanted to vanish. Two of us, then.
    ** {hide_count == 0} ["I wanted to vanish yesterday, too."]
        ~ tobin_shared = true
        tobin/surprised: You? You looked so... still.
        tobin/smile: Huh. Two of us, then.
    ** ["You'll be old news by tonight."]
        tobin: Promise?
    --
* {phase == "after_storm"} [Talk about the storm]
    tobin/laugh: Best festival in years. Nobody will ever forget that wind.
    { tobin_shared:
        tobin/warm: Neither of us vanished. Look at that.
    }
* {phase == "after_storm" && tobin_evening} [Ask about the stone]
    tobin/smile: Fixed it this morning. With a hammer. Personally. It held through all that.
+ [Say goodbye]
    -> bye
- -> menu
= bye
tobin: Mind the stone.
->->

=== talk_mara ===
{ seen_mara != phase:
    ~ seen_mara = phase
    { phase:
    - "afternoon": mara/worried: There you are. Okay. Okay. Lanterns, then bread, then candles, then... okay.
    - "festival": mara/smile: Hi.
    - "day2": mara/worried: Morning! Sorry. Morning. I've got a list.
    - else: mara/surprised: We're all still here.
    }
- else:
    mara: Hi again.
}
- (menu)
* {phase == "afternoon"} [Ask how she's doing]
    mara/worried: Fine. Great. Everything's fine. Three things are on fire, metaphorically.
    ** ["Breathe. It's going to be lovely."]
        mara/smile: Tell me that again at sundown.
    ** ["Where do you want the lanterns?"]
        mara: By the fountain. Thank you. Really.
    --
* {phase == "afternoon"} [Ask how the festival started]
    mara: My grandmother started it. Sixty-one years ago, with one lantern on her own front step.
    mara/smile: Then a neighbor put one out. Then the whole lane. Then the square.
    { variant == "promise":
        mara/warm: That's her lantern you've got. The first one.
    }
    ~ mara_grandma = true
* {phase == "afternoon"} [Offer to help]
    mara/warm: You already are. Just get them here in one piece.
* {phase == "festival"} [Talk about tonight]
    -> mara_evening ->
* {phase == "festival" && mara_grandma} [Ask about her grandmother]
    mara/warm: She used to say the lanterns aren't for seeing by. They're for seeing each other.
* {phase == "festival"} [Ask what she was worried about]
    mara/worried: Last night? That something had gone wrong and it was my fault. It's always my first guess.
    ** ["It wasn't."]
        mara/smile: I know. Now.
    ** ["That's my first guess, too."]
        mara/laugh: Then we should start a club. We'd blame ourselves for the snacks.
    --
* {phase == "day2" && task == "" && not bunting_ask && not (rest_ok && not told)} [Ask if she needs anything]
    -> bunting_ask ->
* {phase == "day2" && rest_ok && not told} [Tell Mara you're taking the afternoon]
    -> tell_mara ->
* {phase == "day2"} [Ask how she's holding up]
    mara/worried: Fine. Great. I've slept four hours since Tuesday.
    ** {rest_ok} ["I'm going to rest this afternoon. Maybe you could, too."]
        ~ mara_rests = true
        mara: ...An hour. Maybe. If Tobin watches the list.
        mara/laugh: He'll lose the list.
    ** ["You should rest after the festival."]
        mara/laugh: After the festival. I always say that.
    ** [Nod]
        She nods back, already looking at the list.
    --
* {phase == "after_storm"} [Talk about the storm]
    mara/worried: I froze. Everything was flying and I just stood there.
    ** ["You came back, though."]
        mara/smile: We both did.
    ** ["Me too, at first."]
        mara/warm: It was a lot, wasn't it.
    --
    { mara_rests:
        mara/laugh: Good thing I had that nap.
    }
* {phase == "after_storm" && mara_grandma} [Look up at the lanterns with her]
    mara/warm: For seeing each other.
    { lost:
        mara/smile: One's somewhere over the hill. Grandma would say it's lighting somebody else's way.
    }
+ [Say goodbye]
    -> bye
- -> menu
= bye
mara/smile: Thank you. For everything.
->->

=== talk_bakers ===
{ seen_bakers != phase:
    ~ seen_bakers = phase
    { phase:
    - "afternoon":
        wren/worried: Oda. The bread. Sundown.
        oda: The bread will be ready at sundown, because the bread is always ready at sundown.
    - "facts":
        oda: Hello, love.
    - "festival": wren/smile: You made it.
    - "day2": oda: Morning! Mind the flour.
    - else: oda/laugh: Still dry in here. Mostly.
    }
- else:
    oda: Back for more bread?
}
- (menu)
* {phase == "afternoon"} [Ask about the bread]
    wren/worried: You don't know it'll be ready.
    oda/smile: Twenty years, Wren.
    oda: Don't mind us. We do this every year.
    ** ["It smells amazing."]
        oda/warm: Come by later. The burnt ones are free.
    ** [Leave them to it]
        They're already back to arguing.
    --
* {phase == "afternoon"} [Ask how long they've been married]
    oda: Twenty years.
    wren: Nineteen of them arguing about bread.
    oda/smile: And one about the oven.
* {phase == "afternoon"} [Ask Wren why she keeps rubbing her back]
    wren: I'm not.
    oda: She is.
    wren/worried: It's fine. It's always fine.
    ~ wren_back = true
* {phase == "facts"} [Ask if they saw anything]
    -> fact_bakers ->
* {phase == "festival"} [Have some bread]
    -> bakers_evening ->
* {phase == "festival" && wren_back} [Ask Wren about her back]
    oda: Go on. Tell them.
    wren/sad: ...It's sore. It's been sore all week.
    oda/warm: First time in twenty years she's said so out loud.
* {phase == "day2" && task == "" && not bread_ask} [Ask if they need anything]
    -> bread_ask ->
* {phase == "day2"} [Ask how Wren's back is]
    ~ wren_back = true
    { carried_bread:
        wren/warm: Better, for not carrying those trays. Thank you. I wouldn't have asked.
    - else:
        oda/laugh: Pip and Juno carried the trays. Wren supervised. Loudly.
    }
* {phase == "after_storm"} [Ask how they got through the storm]
    oda: Wren let me carry the bread in off the porch. All of it.
    wren: I asked. Out loud.
    oda/laugh: I nearly fainted.
+ [Say goodbye]
    -> bye
- -> menu
= bye
oda: Take a roll for the road.
->->

=== talk_kids ===
{ seen_kids != phase:
    ~ seen_kids = phase
    { phase:
    - "afternoon": pip/surprised: Are you bringing ALL the lanterns?
    - "facts": juno: Oh. Hi.
    - "festival": juno: Hi.
    - "day2": juno: Morning.
    - else: pip/surprised: That was the LOUDEST thing ever.
    }
- else:
    juno: You again.
}
- (menu)
* {phase == "afternoon"} [Ask what they're up to]
    juno: Counting the lanterns. There are twelve. Tobin counted. I counted again.
    ** ["Want to see the red one later?"]
        pip/laugh: YES.
    ** ["Twelve exactly."]
        juno/smile: I know.
    --
* {phase == "afternoon"} [Ask Juno what else she counts]
    juno: Cobblestones. There are four hundred and twelve in the square.
    pip: She counts when it's loud.
    juno: It gives the noise somewhere to go.
    ~ juno_counting = true
* {phase == "afternoon"} [Ask Pip about tonight]
    pip/laugh: I'm staying up the WHOLE night.
    juno: She says that every year.
* {phase == "facts"} [Ask them about the red lantern]
    -> fact_kids ->
* {phase == "facts"} [Ask Juno how many lanterns there are now]
    juno: Still twelve. I checked. Twice.
* {phase == "festival"} [Look at the red lantern]
    -> kids_evening ->
* {phase == "festival"} [Ask Pip if she's tired yet]
    pip: I'm not even tired.
    juno: She's yawning.
    pip/laugh: I'm yawning ON PURPOSE.
* {phase == "day2"} [Ask what they're playing]
    -> kids_day2 ->
* {phase == "day2" && juno_counting} [Ask Juno what she's counting today]
    juno: Bunting flags. Seventy-three. Two are on the wrong way round.
* {phase == "after_storm"} [Ask Pip how she's doing]
    { helped_pip:
        pip/smile: I did the breathing. In, and slow out. I'm going to do it at school.
    - else:
        pip/sad: I was scared.
        juno: I held her hand. And counted.
    }
* {phase == "after_storm" && juno_counting} [Ask Juno how many she counted]
    juno/smile: Four hundred and twelve cobblestones. Twice. It helped.
+ [Say goodbye]
    -> bye
- -> menu
= bye
pip/laugh: BYE!
->->
