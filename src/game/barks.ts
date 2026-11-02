// Passing remarks: one-liners villagers say when you walk by. Flavor only;
// they never carry story or teach anything. Rules: CHARACTERS.md.

import type { CharacterId } from "../logic/cast";
import type { HotspotId } from "../logic/facts";
import type { WorldState } from "../logic/world";

type Npc = Exclude<CharacterId, "you">;
export type BarkPhase = "afternoon" | "facts" | "festival" | "day2" | "after_storm";

export const BARKS: Record<BarkPhase, Record<Npc, string[]>> = {
  afternoon: {
    nell: ["Mind the step.", "Lovely day for it.", "Somebody always drops something."],
    ash: ["Tea's on!", "Chipped cup's waiting for you."],
    wren: ["Sundown. SUNDOWN.", "Is that the oven?"],
    oda: ["It's always ready at sundown.", "Mind the flour, love."],
    tobin: ["Mind the stone by the fountain!", "Twelve lanterns. I counted."],
    mara: ["Lanterns, bread, candles...", "Okay. Okay. Okay."],
    pip: ["Is it sundown yet?", "I'm staying up ALL night!"],
    juno: ["Four hundred and twelve.", "Pip, that's not sundown."],
  },
  facts: {
    nell: ["Lanes go dark sometimes.", "Take your time."],
    ash: ["Tea's here when you want it."],
    wren: ["Bread's nearly ready."],
    oda: ["Come by later, love."],
    tobin: ["Sorry again. About the laugh."],
    mara: [],
    pip: ["It went round TWICE!"],
    juno: ["Still twelve."],
  },
  festival: {
    nell: ["Sixty-one festivals!", "Look at that light."],
    ash: ["Fresh pot!"],
    wren: ["They're not burnt. They're well done."],
    oda: ["Burnt ones! Free!"],
    tobin: ["Two falls, one stone!"],
    mara: ["It's lovely. It's actually lovely."],
    pip: ["LOOK at the red one!"],
    juno: ["Twelve. All lit."],
  },
  day2: {
    nell: ["A lie-in. Highly recommended."],
    ash: ["Offer stands!"],
    wren: ["My back is FINE."],
    oda: ["Trays, trays, trays."],
    tobin: ["Glue. Everywhere."],
    mara: ["Bunting, tables, chairs..."],
    pip: ["Lantern tag! Who's it?"],
    juno: ["Seventy-three flags."],
  },
  after_storm: {
    nell: ["Best storm yet!"],
    ash: ["Tea's hot!"],
    wren: ["I asked for help. Out loud."],
    oda: ["Dry in here. Mostly."],
    tobin: ["The stone held!"],
    mara: ["We're all still here."],
    pip: ["In, and slow out!"],
    juno: ["I counted the whole time."],
  },
};

/** Which details free each villager from the shame haze; they only chat once freed. */
const FREED_BY: Partial<Record<Npc, HotspotId>> = {
  tobin: "tobin",
  wren: "bakers",
  oda: "bakers",
  pip: "kids",
  juno: "kids",
  mara: "mara",
};

/** Which set of remarks fits the moment, or null when nobody should chat (storm, night, hiding). */
export function barkPhase(w: WorldState): BarkPhase | null {
  if (w.weather === "storm" || w.form === "shell" || w.ended) return null;
  if (w.level === 3) return w.time === "night" ? "after_storm" : null;
  if (w.level === 2) return w.time === "night" ? null : "day2";
  if (w.time === "night") return w.lanterns === "hung" ? "festival" : null;
  if (w.lens === "shame") return "facts";
  if (w.lanterns === "workshop" || w.lanterns === "carried") return "afternoon";
  return null;
}

/** A remark for this villager right now, or null. `roll` is 0..1. */
export function pickBark(w: WorldState, id: Npc, roll: number): string | null {
  const phase = barkPhase(w);
  if (!phase) return null;
  if (phase === "facts") {
    const fact = FREED_BY[id];
    if (fact && !w.factsFound.includes(fact)) return null;
  }
  const lines = BARKS[phase][id];
  if (!lines.length) return null;
  return lines[Math.min(lines.length - 1, Math.floor(roll * lines.length))];
}
