// Lantern festival: opposite action for shame.
// Tags drive the TypeScript layer:
//   #event: name [arg]   world and meter changes (see src/logic/world.ts, meter.ts)
//   #scene: name         interactive TS scene; the TS layer picks the single
//                        placeholder choice that follows when the scene is done.
// Never frame choices as good or bad. Costs show up in the world.

VAR variant = "main"      // "main" | "promise", set by the TS layer before start
VAR label = ""
VAR hide_count = 0
VAR stayed = false
VAR bailed = false
VAR facts_done = false    // set by the facts scene
VAR facts_seen = 0        // set by the facts scene
VAR fit = false           // set by the facts scene
VAR path = ""             // "opposite" | "repair"
VAR part_a = false        // opposite: go back    | repair: own it
VAR part_b = false        // opposite: head up    | repair: amends
VAR part_c = false        // opposite: voice      | repair: let it go
VAR completeness = ""     // "full" | "partial" | "minimal"

EXTERNAL outcome(a, b, c)

-> start

=== start ===
The village is getting ready for the lantern festival. #event: afternoon
Tonight is the first night. When the sun goes down, every lantern in the square is lit at once.
{ variant == "promise":
    This morning Mara, who runs the festival, put her grandmother's paper lantern in your hands. "Carry this one on its own," she said. "It's the oldest thing I have." You promised you would.
}
You said you'd bring the twelve lanterns for the square. You're carrying them all in one trip, to save time.
{ variant == "promise":
    Her grandmother's lantern is balanced on top of the stack.
}
+ [Cross the square] -> trip

=== trip ===
Halfway across, your foot catches a loose cobblestone. #event: trip
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
    Anger can run hot in the face too. It usually comes with an urge to push forward: confront, snap, fight back.
    Is the urge here to push, or to disappear?
    -> keep_or_look
+ [Fear]
    ~ label = "fear"
    Fear comes with an urge to escape a threat. Close. Is there danger here, or is it more about being seen?
    -> keep_or_look
+ [Sadness]
    ~ label = "sadness"
    Sadness can come with an urge to withdraw, too. It usually follows a loss. Did you lose something just now, or is it more about being seen?
    -> keep_or_look
+ [Embarrassment]
    ~ label = "shame"
    Embarrassment is in the shame family: the same heat, the same eyes-down, the same urge to hide. Here, call it shame.
    -> urge
+ [Shame]
    ~ label = "shame"
    Hot face, eyes down, wanting to drop out of sight. Shame often feels exactly like this.
    -> urge
+ [Guilt]
    ~ label = "guilt"
    { variant == "promise":
        Guilt shows up when you've acted against your own values. You did make a promise about that lantern. Guilt and shame are tangled up here.
    - else:
        Guilt shows up when you've acted against your own values. Did you? Or is this more about being seen?
        -> keep_or_look
    }
    -> urge
+ [Not sure]
    ~ label = ""
    That's allowed. You can notice it without a name: heat, eyes down, wanting to vanish.
    -> urge

= keep_or_look
+ [Look again] -> body.naming
+ [Stay with "{label}"]
    Okay. Notice the urge, too. It isn't to push or fight. It's to hide. The urge to hide usually travels with shame.
    -> urge

=== urge ===
Up the path at the edge of the square there's a hollow in the rocks where you used to hide as a kid. It's dry and quiet in there. Nobody can see in.
The urge is loud now: get out of sight. #event: urge_peak
+ [Hide] -> hide
+ [Stay where you are] -> stay

=== stay ===
~ stayed = true
You stay on the cobblestones. Your face is burning. The urge to run doesn't go anywhere. It just sits there, loud. #event: urge_hold
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
-> another_day

= first_night
The sun goes down. #event: nightfall
In the square, people wait for the lanterns. They're still lying where they fell. #event: square_dark
Someone puts candles in jars along the fountain. It isn't the same. The square stays mostly dark.
Later, voices on the path below the hill. Mara and Tobin, walking home.
"Did I do something?" Mara is saying. "They just left. They must be angry with me." #event: mara thinks-angry
{ variant == "promise":
    "And my grandmother's lantern..." She doesn't finish.
}
You stay very still inside your shell.
+ [Sleep] -> morning

= another_day
Another night in the hollow. #event: nightfall
Down in the square, the festival goes on with a handful of lanterns. You can just see them from here.
The shadow has crept further up your lane. #event: darkness_spreads
+ [Sleep] -> morning

= morning
Morning. You uncurl. #event: morning
On the way down the hill you pass the square. Someone has heaped the lanterns on the fountain steps. Tonight is the festival's {hide_count == 1: second|next} night.
A note on the board: festival supper tonight, at Mara's.
{ hide_count == 1:
    Every door on your lane has a paper invitation tucked in the frame. Yours doesn't. #event: invitation missing
    Maybe she thinks you're angry. Maybe she didn't think you'd come.
    The shadow in the lane past your house looks longer than it did yesterday. #event: darkness_spreads
}
The relief from last night is gone. Thinking about the square, your face heats up all over again. #event: return_distress
+ [Go back to the hollow] -> hide
+ [Look at what actually happened] -> check

=== check ===
{ facts_done:
    You already know what the facts were. #event: lens facts
    -> decided
}
{ hide_count > 0:
    You sit on the hill and let yesterday play back.
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
The feeling is real. It just doesn't match these facts. #event: lens facts
There's a skill for this, called opposite action: find what the urge wants you to do, and do the opposite, all the way.
The urge says hide. The opposite is to go back, let yourself be seen with your head up, and say something.
-> opposite

=== opposite ===
~ part_a = false
~ part_b = false
~ part_c = false
{ hide_count > 0:
    Mara and Tobin are in the square, sorting the lanterns for tonight. The square is a short walk down the hill.
- else:
    The lanterns are still lying by the fountain, a few steps away. Mara is already picking one up.
}
+ [Go all the way back into the square]
    ~ part_a = true
    You walk {hide_count > 0: down the hill and} into the middle of the square. #event: go_back
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
+ [Lift your head, shoulders back, look at people]
    ~ part_b = true
    You lift your chin. It's like holding a door open in a strong wind. #event: posture up
    Your heart is pounding. #event: oa_step
+ [Keep your eyes on the ground]
    You watch the cobblestones. #event: posture down
-
-> voice

= voice
Mara looks over. Tobin is next to her.
+ [Say, steady: "Well. That was a spectacular fall. Want help checking which ones still work?"]
    ~ part_c = true
    Your voice shakes on the first word and steadies by the last. #event: oa_step
+ [Apologize over and over: "Sorry. I'm so sorry. I ruin everything."]
    The words tumble out, one sorry after another.
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
Mara's whole face changes. "There you are. Are you okay? That looked like it hurt." #event: settle full
Tobin rubs the back of his neck. "Sorry I laughed. I went down on that same stone this morning. Took out a whole string of bunting."
{ variant == "promise":
    Then Mara picks up her grandmother's lantern and turns it over, and goes quiet. #event: mara hurt
    "It was my grandmother's," she says. You keep your head up. It doesn't close the tear.
    Your heart is still going fast, but it's coming down.
    At sunset the lanterns go up. Eleven glow. The twelfth hangs dark, torn down one side. #event: hang 11
- else:
    #event: mara close
    Together you check the lanterns. Ten are fine. Two are dented, and Tobin says dents give them character.
    Your heart is still going fast. But it's coming down, faster than you expected.
    At sunset all twelve lanterns go up. #event: hang 12
}
One catches, then the next, then the whole string. The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
That night there's an invitation tucked in your door frame. #event: invitation received
-> chain_review

= partial
{ part_a:
    Mara looks at you, unsure. "Are you... okay?" #event: settle partial
- else:
    From the edge, Mara spots you. She waves, a little unsure. #event: settle partial
}
#event: mara unsure
You help a bit, mostly with your hands, not your eyes. The heat in your face hangs around all evening.
{ variant == "promise":
    Nobody mentions the torn lantern. It hangs at the end of the string, dark. #event: hang 11
- else:
    At sunset the lanterns go up. #event: hang 12
}
The square lights up, mostly. The shadow in your lane pulls back a little. #event: ripple partial
Later, Mara knocks and hands you an invitation herself. She doesn't stay to talk. #event: invitation pending
-> chain_review

= minimal
{ part_a:
    Mara starts toward you, then stops, not sure if you want company. #event: settle minimal
- else:
    From behind the cart, you watch Mara and Tobin sort the lanterns without you. #event: settle minimal
}
#event: mara unsure
{ variant == "promise":
    #event: hang 11
- else:
    #event: hang 12
}
At sunset the lanterns go up. You watch the square light from where you stand. #event: ripple minimal
The light stops at the end of your lane. Your distress drifts down, slowly, and stays higher than you'd like.
-> chain_review

=== fits ===
~ path = "repair"
The feeling fits the facts. { variant == "promise": You did promise to carry that lantern on its own. You didn't. | You've decided this one fits. } #event: lens facts
When shame or guilt fits, the skill isn't to push the feeling away. It's repair: own what happened, make amends, and then let it go.
-> repair

=== repair ===
~ part_a = false
~ part_b = false
~ part_c = false
You go find Mara. { hide_count > 0: She's in the square, sorting lanterns for tonight. | She's by the fountain, gathering lanterns. } #event: go_back
+ { variant == "promise" } [Tell her plainly: "I stacked your grandmother's lantern with the others to save a trip. It tore when I fell. I'm sorry."]
    ~ part_a = true
    Saying it out loud makes your face burn hotter. #event: oa_step
    Mara closes her eyes for a second. "Thank you for telling me."
+ { variant == "main" } [Tell her plainly: "I dropped them. I'm sorry."]
    ~ part_a = true
    Saying it out loud makes your face burn hotter. #event: oa_step
    "Hey," Mara says. "It was an accident. You don't owe me anything."
+ [Say the loose stone did it]
    "That stone," you say. "Someone should fix that stone." Mara nods slowly.
+ [Don't bring it up]
    You start gathering lanterns and don't mention it. Neither does she.
-
The hollow is still up the hill. Relief is right there. #event: urge_pull
+ [Stay] -> amends
+ [Hide after all]
    ~ bailed = true
    -> hide

= amends
+ { variant == "promise" } [Offer to mend it with her, now, before sunset]
    ~ part_b = true
    "I'm good with paper. Can we fix it together?" #event: oa_step
    She hesitates, then nods. You find glue and a sheet of gold paper, and you work on it side by side. #event: mend
+ { variant == "promise" } [Offer to buy her a new one]
    "I'll get you a new one." Mara smiles a little, but a new one wouldn't be her grandmother's.
+ { variant == "main" } [Help fix the two dented lanterns]
    ~ part_b = true
    You bend the wire back into shape while Mara holds them steady. #event: oa_step
+ [Leave it]
    { variant == "promise":
        The torn lantern stays on the fountain step.
    - else:
        You set the dented ones aside.
    }
-
-> let_go

= let_go
Afterward, the urge is to keep apologizing, just in case.
+ [Let it go: it's been repaired, and you help hang the lanterns]
    ~ part_c = true
    You let the apology stand. You pick up a lantern and climb the ladder.
+ [Keep apologizing all evening]
    "I'm really sorry," you say again, and again later. Mara keeps saying it's fine. She starts to look tired.
-
~ completeness = outcome(part_a, part_b, part_c)
-> repair_result

=== repair_result ===
{ completeness:
- "full":
    { variant == "promise":
        At sunset the lanterns go up. Her grandmother's lantern glows with a gold seam down one side. #event: hang 12
        "I think I like it better," Mara says, and you believe her. #event: mara close
    - else:
        At sunset all twelve go up, dents and all. #event: hang 12
        #event: mara close
    }
    Your heart was racing an hour ago. Now it's slow. #event: settle full
    The square fills with light, and it spills down the lanes as far as your door. #event: ripple full
    That night there's an invitation tucked in your door frame. #event: invitation received
- "partial":
    #event: settle partial
    { variant == "promise" && not part_b:
        At sunset the lanterns go up. One hangs dark, torn down its side. #event: hang 11
    - else:
        At sunset the lanterns go up. #event: hang 12
    }
    #event: mara unsure
    The square is lit. Things with Mara feel a little unfinished. #event: ripple partial
    Later, she hands you an invitation herself. #event: invitation pending
- else:
    #event: settle minimal
    { variant == "promise":
    #event: hang 11
- else:
    #event: hang 12
}
    #event: mara unsure
    The lanterns go up. You and Mara don't quite look at each other. #event: ripple minimal
    The light stops at the end of your lane.
}
-> chain_review

=== chain_review ===
Before the night is over, look back at how it went, link by link. #scene: chain
+ [·] -> transfer

=== transfer ===
One more, without lanterns. #scene: transfer
+ [·] -> ending

=== ending ===
That's the end of this prototype. Thank you for playing. #event: end
-> END
