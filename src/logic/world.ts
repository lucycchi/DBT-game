// World state: what the village looks like. Costs and recoveries show up here,
// never as a score. The world can always recover: no event makes it permanent.

import type { GameEvent } from "./tags";
import type { Completeness } from "./outcome";

export const LANTERN_COUNT = 12;
export const MAX_DARKNESS = 3;

export type TimeOfDay = "afternoon" | "sunset" | "night" | "morning";
export type Mood = "neutral" | "thinks-angry" | "unsure" | "warm" | "hurt" | "close";

export interface WorldState {
  time: TimeOfDay;
  location: "square" | "edge" | "cave";
  form: "person" | "shell";
  posture: "upright" | "neutral" | "slumped";
  faceHot: boolean;
  lanterns: "carried" | "scattered" | "heaped" | "hung";
  lanternsHung: number;
  /** How lit the square is, 0..1. */
  squareLight: number;
  /** How far darkness has spread into the lanes, 0..MAX_DARKNESS. */
  darkness: number;
  mara: Mood;
  invitation: "none" | "missing" | "pending" | "received";
  heirloom: "whole" | "torn" | "mended";
  /** Which lens the square is drawn through during check the facts. */
  lens: "none" | "shame" | "facts";
  ended: boolean;
}

export function initialWorld(): WorldState {
  return {
    time: "afternoon",
    location: "square",
    form: "person",
    posture: "neutral",
    faceHot: false,
    lanterns: "carried",
    lanternsHung: 0,
    squareLight: 1,
    darkness: 0,
    mara: "neutral",
    invitation: "none",
    heirloom: "whole",
    lens: "none",
    ended: false,
  };
}

const RIPPLE: Record<Completeness, (w: WorldState) => Partial<WorldState>> = {
  full: () => ({ squareLight: 1, darkness: 0 }),
  partial: (w) => ({ squareLight: 0.75, darkness: Math.max(0, w.darkness - 1) }),
  // Other people hang the lanterns; the square lights, the lanes stay as they were.
  minimal: (w) => ({ squareLight: 0.6, darkness: w.darkness }),
};

const MOODS: readonly Mood[] = ["neutral", "thinks-angry", "unsure", "warm", "hurt", "close"];
const INVITES: readonly WorldState["invitation"][] = ["none", "missing", "pending", "received"];

export const WORLD_EVENTS = new Set([
  "afternoon",
  "trip",
  "tear",
  "cue_heat",
  "cue_slump",
  "hide",
  "morning",
  "nightfall",
  "square_dark",
  "darkness_spreads",
  "return_distress",
  "lens",
  "go_back",
  "go_edge",
  "posture",
  "mara",
  "hang",
  "ripple",
  "invitation",
  "mend",
  "end",
]);

export function applyWorldEvent(w: WorldState, ev: GameEvent): WorldState {
  switch (ev.name) {
    case "afternoon":
      return { ...w, time: "afternoon" };
    case "trip":
      return { ...w, lanterns: "scattered", faceHot: true, posture: "slumped" };
    case "tear":
      return { ...w, heirloom: "torn" };
    case "cue_heat":
      return { ...w, faceHot: true };
    case "cue_slump":
      return { ...w, posture: "slumped" };
    case "hide":
      return { ...w, form: "shell", location: "cave", faceHot: false };
    case "nightfall":
      return { ...w, time: "night" };
    case "square_dark":
      return { ...w, lanterns: "heaped", squareLight: 0.1 };
    case "morning":
      return { ...w, time: "morning", form: "person", squareLight: 1 };
    case "darkness_spreads":
      return { ...w, darkness: Math.min(MAX_DARKNESS, w.darkness + 1) };
    case "return_distress":
      return { ...w, faceHot: true, posture: "slumped" };
    case "lens":
      return { ...w, lens: ev.arg === "shame" || ev.arg === "facts" ? ev.arg : "none" };
    case "go_back":
      return { ...w, location: "square", form: "person" };
    case "go_edge":
      return { ...w, location: "edge", form: "person" };
    case "posture":
      return { ...w, posture: ev.arg === "up" ? "upright" : "slumped", faceHot: ev.arg !== "up" };
    case "mara":
      if (!MOODS.includes(ev.arg as Mood)) throw new Error(`Unknown mood: ${ev.arg}`);
      return { ...w, mara: ev.arg as Mood };
    case "hang": {
      const n = Math.max(0, Math.min(LANTERN_COUNT, Number(ev.arg ?? LANTERN_COUNT)));
      return { ...w, lanterns: "hung", lanternsHung: n };
    }
    case "ripple": {
      const apply = RIPPLE[ev.arg as Completeness];
      if (!apply) throw new Error(`ripple needs full|partial|minimal, got ${ev.arg}`);
      return { ...w, time: "night", lens: "none", ...apply(w) };
    }
    case "invitation":
      if (!INVITES.includes(ev.arg as WorldState["invitation"])) {
        throw new Error(`Unknown invitation state: ${ev.arg}`);
      }
      return { ...w, invitation: ev.arg as WorldState["invitation"] };
    case "mend":
      return { ...w, heirloom: "mended" };
    case "end":
      return { ...w, ended: true };
    default:
      return w;
  }
}
