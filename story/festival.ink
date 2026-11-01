// Lantern festival: doing the opposite of what shame urges, when shame doesn't fit.
// (DBT: opposite action, check the facts, repair. Player-facing text never uses
// those names; it describes what each skill is for.)
//
// Tags drive the TypeScript layer:
//   #event: name [arg]   world and meter changes (src/logic/world.ts, meter.ts)
//   #scene: name         interactive TS scene; the TS layer picks the single
//                        placeholder choice that follows when the scene is done.
//   [Choice #talk: id]   inside the brackets: clicking that character picks it.
// Dialogue lines are `id: text` or `id/expression: text` (src/logic/cast.ts).
// Choice text in quotes is shown as the player's own spoken line.
// Characters and dialogue rules: CHARACTERS.md. Never frame choices as good or bad.

VAR variant = "main"      // "main" | "promise", set by the TS layer before start
VAR label = ""
VAR hide_count = 0
VAR stayed = false
VAR bailed = false
VAR answered_ash = false
VAR facts_done = false    // set by the facts scene
VAR facts_seen = 0        // set by the facts scene
VAR fit = false           // set by the facts scene
VAR path = ""             // "opposite" | "repair"
VAR part_a = false        // opposite: go back    | repair: own it
VAR part_b = false        // opposite: head up    | repair: make it right
VAR part_c = false        // opposite: voice      | repair: let it go
VAR completeness = ""     // "full" | "partial" | "minimal"

EXTERNAL outcome(a, b, c)

-> start

=== start ===
The village is getting ready for the lantern festival. #event: afternoon
Tonight is the first night. At sundown, every lantern in the square gets lit at once.
You offered to bring the twelve lanterns from the workshop. They're stacked in your arms, all in one trip, to save time.
{ variant == "promise":
    This morning Mara put her grandmother's paper lantern in your hands. "Carry this one on its own," she said. "It's the oldest thing I have." You promised you would.
    It's balanced on top of the stack now. It's just quicker this way.
}
The square is busy. You can stop and talk, or head straight across.
-> before

=== before ===
- (hub)
+ {not mara_before} [Talk to Mara #talk: mara]
    -> mara_before -> hub
+ {not tobin_before} [Talk to Tobin #talk: tobin]
    -> tobin_before -> hub
+ {not bakers_before} [Talk to the bakers #talk: wren]
    -> bakers_before -> hub
+ {not kids_before} [Talk to the kids #talk: pip]
    -> kids_before -> hub
+ {not nell_before} [Talk to Nell, on her front step #talk: nell]
    -> nell_before -> hub
+ {not ash_before} [Talk to Ash, at the tea cart #talk: ash]
    -> ash_before -> hub
+ [Carry the lanterns across the square] -> trip

=== mara_before ===
mara/worried: There you are. Okay. Okay. Lanterns, then bread, then candles, then... okay.
{ variant == "promise":
    She's too busy to look at the stack. Her grandmother's lantern sways on top.
}
+ ["Breathe. It's going to be lovely."]
    mara/smile: Tell me that again at sundown.
+ ["Where do you want them?"]
    mara: Middle of the square, by the fountain. Thank you. Really.
- ->->

=== tobin_before ===
tobin/laugh: Careful with those! Ha. Listen to me, saying careful.
There's dust on his knees, and a cracked lantern on his cart.
+ ["What happened to you?"]
    tobin/sad: Loose cobblestone by the fountain. Went down in front of everyone this morning. Took a whole string of bunting with me.
    tobin/laugh: I've been laughing about it all day, so nobody else gets to first.
+ ["Your lantern's cracked."]
    tobin/sad: Yeah. One of mine. Don't tell Mara.
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

=== kids_before ===
pip/surprised: Are those ALL the lanterns?
juno: There are twelve. I counted them yesterday. Twice.
+ ["Want to see the red one?"]
    You tilt the stack. Pip gasps like it's treasure.
+ ["Twelve exactly."]
    juno/smile: I know.
- ->->

=== nell_before ===
nell/smile: Look at you. A walking lantern shop.
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
+ ["You could help me carry these."]
    ash/laugh: And leave the tea alone? Wren would drink all of it.
- ->->

=== trip ===
You head across the square.
Halfway, your foot catches a loose cobblestone. #event: trip
The lanterns scatter across the stones. One rolls all the way to the fountain.
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
Up the path at the edge of the square there's a hollow in the rocks where you used to hide as a kid. It's dry and quiet in there. Nobody can see in.
The pull is loud now: get out of sight. #event: urge_peak
+ [Hide] -> hide
+ [Stay where you are] -> stay

=== stay ===
~ stayed = true
You stay on the cobblestones. Your face is burning. The pull to run doesn't go anywhere. It just sits there, loud. #event: urge_hold
-> check

=== hide ===
~ hide_count++
You let the shell come. #event: hide
{ hide_count == 1:
    Your back curves and hardens. Your arms fold in. In three heartbeats you're something round and armored, rolling up the hill path.
- else:
    The shell closes over you, easy as breathing. Up the path, into the dark.
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
Someone puts candles in jars along the fountain. It isn't the same. The square stays mostly dark.
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
}
You go down the hill toward your lane. The lanterns sit in a heap on the fountain steps. Tonight is the festival's {hide_count == 1: second|next} night.
{ hide_count == 1:
    Every door on your lane has a paper invitation tucked in the frame: supper at Mara's tonight. Yours doesn't. #event: invitation missing
    The shadow past your house looks longer than it did yesterday. #event: darkness_spreads
}
The relief from last night is gone. Thinking about the square, your face heats up all over again. #event: return_distress
-> morning_hub

=== morning_hub ===
- (hub)
+ {not nell_morning} [Talk to Nell #talk: nell]
    -> nell_morning -> hub
+ {not ash_morning} [Talk to Ash #talk: ash]
    -> ash_morning -> hub
+ {not bakers_morning} [Talk to the bakers #talk: wren]
    -> bakers_morning -> hub
+ {not kids_morning} [Talk to the kids #talk: pip]
    -> kids_morning -> hub
+ [Go back to the hollow] -> hide
+ [Think back over what actually happened] -> check

=== nell_morning ===
nell: Your lane went dim last night. Did you notice?
+ ["I noticed."]
    nell: Mm.
+ ["That was me. I hid."]
    nell/warm: I hid for a whole winter once. Came out in spring and they'd painted my door yellow.
- nell/smile: Lanes go dark sometimes. They light back up. Usually somebody has to walk down them with a lantern first.
->->

=== ash_morning ===
{ answered_ash:
    ash/warm: You didn't drink the tea. Fair. It was terrible tea.
- else:
    ash/worried: I left tea on the rock. Wasn't sure you were in there.
}
ash: Mara thinks you're angry with her. She's been asking everyone.
+ ["I'm not angry. I was embarrassed."]
    ash: She's in the square, sorting lanterns. In case that's useful.
+ ["I don't want to talk about it."]
    ash/warm: Okay. I'm around.
- ->->

=== bakers_morning ===
oda: There you are. We missed you at the candles last night.
wren/smile: The bread was ready at sundown. Exactly at sundown.
oda/smile: Told you.
+ ["Did you see me fall?"]
    wren/surprised: You fell? When?
    oda: We were up to our elbows in dough, love. We didn't see a thing.
+ ["Sorry I missed it."]
    oda/warm: There's tonight.
- ->->

=== kids_morning ===
pip/laugh: Did you SEE the red lantern yesterday? It rolled ALL the way to the fountain!
juno: It went around the fountain twice. I counted.
+ ["I saw."]
    pip/smile: Best thing that happened all day.
+ ["You weren't laughing at me?"]
    juno/surprised: At you? We were watching the lantern.
- ->->

=== check ===
{ facts_done:
    You already know what actually happened. #event: lens facts
    -> decided
}
{ hide_count > 0:
    You sit on the wall at the edge of the square and let yesterday play back.
- else:
    You make yourself look up.
}
At first the square looks the way the feeling sees it. #event: lens shame
Everyone is staring. Everyone is pointing. Everyone saw.
Look closer. Tap the people and things in the square to see what actually happened. #scene: facts
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
{ hide_count > 0:
    Mara and Tobin are in the square, sorting the lanterns for tonight.
- else:
    The lanterns are still lying by the fountain, a few steps away. Mara is already picking one up.
}
+ [Walk all the way back into the square]
    ~ part_a = true
    You walk into the middle of the square. #event: go_back
    Every step, the heat climbs. It's worse, not better. #event: oa_step
+ [Stay at the edge, where it's safer]
    You stop at the edge, half behind a cart. #event: go_edge
-
The hollow is still right there. You know exactly how fast the relief would come. #event: urge_pull
+ [Keep going] -> posture
+ [Hide after all]
    ~ bailed = true
    -> hide

= posture
Your head wants to drop. Your shoulders want to curl in.
+ [Lift your head, pull your shoulders back, look at people]
    ~ part_b = true
    You lift your chin. It's like holding a door open in a strong wind. #event: posture up
    Your heart is pounding. #event: oa_step
+ [Keep your eyes on the ground]
    You watch the cobblestones. #event: posture down
-
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
    At sundown the lanterns go up. Eleven glow. The twelfth hangs dark, torn down one side. #event: hang 11
- else:
    Together you check the lanterns. Ten are fine. Two are dented.
    tobin/smile: Dents give them character.
    Your heart is still going fast, but it's coming down, faster than you expected.
    At sundown all twelve lanterns go up. #event: hang 12
}
One catches, then the next, then the whole string. The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
There's an invitation tucked in your door frame. #event: invitation received
-> festival

= partial
{ part_a:
    mara/worried: Are you... okay? #event: settle partial
- else:
    From the edge, you catch Mara's eye. She waves, a little unsure. #event: settle partial
}
You help a bit, mostly with your hands, not your eyes. The heat in your face hangs around all evening.
{ variant == "promise":
    Nobody mentions the torn lantern. It hangs at the end of the string, dark. #event: hang 11
- else:
    At sundown the lanterns go up. #event: hang 12
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
{ variant == "promise":
    #event: hang 11
- else:
    #event: hang 12
}
At sundown the lanterns go up. You watch the square light up from where you stand. #event: ripple minimal
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
You go find Mara. { hide_count > 0: She's in the square, sorting lanterns for tonight. | She's by the fountain, gathering lanterns. } #event: go_back
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
The hollow is still up the hill. Relief is right there. #event: urge_pull
+ [Stay] -> make_right
+ [Hide after all]
    ~ bailed = true
    -> hide

= make_right
+ { variant == "promise" } ["Can we fix it together? Now, before sundown?"]
    ~ part_b = true
    Your voice wobbles. #event: oa_step
    mara/sad: ...Okay. Yes.
    You find glue and a sheet of gold paper, and you work on it side by side. #event: mend
+ { variant == "promise" } ["I'll buy you a new one."]
    mara/sad: That's kind. It wouldn't be hers, though.
+ { variant == "main" } [Help bend the two dented lanterns back into shape]
    ~ part_b = true
    You bend the wire back while Mara holds them steady. #event: oa_step
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
+ [Let it be done. Pick up a lantern and help hang them.]
    ~ part_c = true
    You let the apology stand. You climb the ladder.
+ [Keep apologizing all evening]
    You say sorry again, and again later. Mara keeps saying it's fine. She starts to look tired.
-
~ completeness = outcome(part_a, part_b, part_c)
-> repair_result

=== repair_result ===
{ completeness:
- "full":
    { variant == "promise":
        At sundown the lanterns go up. Her grandmother's lantern glows with a gold seam down one side. #event: hang 12
        mara/warm: I think I like it better.
    - else:
        At sundown all twelve go up, dents and all. #event: hang 12
    }
    Your heart was racing an hour ago. Now it's slow. #event: settle full
    The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
    There's an invitation tucked in your door frame. #event: invitation received
- "partial":
    #event: settle partial
    { variant == "promise" && not part_b:
        At sundown the lanterns go up. One hangs dark, torn down its side. #event: hang 11
    - else:
        At sundown the lanterns go up. #event: hang 12
    }
    The square is lit. Things with Mara feel a little unfinished. #event: ripple partial
    She hands you an invitation herself. #event: invitation pending
- else:
    #event: settle minimal
    { variant == "promise":
        #event: hang 11
    - else:
        #event: hang 12
    }
    The lanterns go up. You and Mara don't quite look at each other. #event: ripple minimal
    The light stops at the end of your lane.
}
-> festival

=== festival ===
{ completeness:
- "full": The square is full of people and light. Everyone you know is here somewhere.
- "partial": The square is lit and busy. You drift around the edges of it.
- else: The festival goes on. You can still walk over to anyone you like.
}
- (hub)
+ {not mara_evening} [Talk to Mara #talk: mara]
    -> mara_evening -> hub
+ {not tobin_evening} [Talk to Tobin #talk: tobin]
    -> tobin_evening -> hub
+ {not bakers_evening} [Talk to the bakers #talk: wren]
    -> bakers_evening -> hub
+ {not kids_evening} [Talk to the kids #talk: pip]
    -> kids_evening -> hub
+ {not nell_evening} [Talk to Nell #talk: nell]
    -> nell_evening -> hub
+ {not ash_evening} [Talk to Ash #talk: ash]
    -> ash_evening -> hub
+ [Head home for the night] -> chain_review

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
    ash/warm: The chipped cup's still on the rock up there, by the way. I'll let you fetch it.
- else:
    ash/smile: You never came back for your tea.
}
ash: Fresh pot. Sit.
+ [Sit]
    The tea is terrible. You drink all of it.
+ ["Tomorrow. I promise. On its own trip."]
    ash/laugh: I'll hold you to it.
- ->->

=== chain_review ===
At home, you think back over the day, one moment at a time. #scene: chain
+ [·] -> ending

=== ending ===
That's the end of this prototype. Thank you for playing. #event: end
-> END
