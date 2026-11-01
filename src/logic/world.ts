// World state: what the village looks like. Costs and recoveries show up here,
// never as a score. The world can always recover: no event makes it permanent.

import type { GameEvent } from "./tags";
import type { Completeness } from "./outcome";
import { isCharacterId, isExpression, type CharacterId, type Expression } from "./cast";
import { isHotspotId, type HotspotId } from "./facts";

export const LANTERN_COUNT = 12;
export const MAX_DARKNESS = 3;

export type TimeOfDay = "afternoon" | "sunset" | "night" | "morning";

export interface WorldState {
  time: TimeOfDay;
  location: "square" | "edge" | "cave" | "lane";
  form: "person" | "shell";
  posture: "upright" | "neutral" | "slumped";
  faceHot: boolean;
  lanterns: "workshop" | "carried" | "scattered" | "heaped" | "hung";
  lanternsHung: number;
  /** How lit the square is, 0..1. */
  squareLight: number;
  /** How far darkness has spread into the lanes, 0..MAX_DARKNESS. */
  darkness: number;
  /** Each character's current face. Missing means neutral. */
  faces: Partial<Record<CharacterId, Expression>>;
  invitation: "none" | "missing" | "pending" | "received";
  heirloom: "whole" | "torn" | "mended";
  /** Which lens the square is drawn through during check the facts. */
  lens: "none" | "shame" | "facts";
  /** Details found while looking again at what happened. */
  factsFound: HotspotId[];
  /** The pull to hide drags the player toward the hollow. */
  pull: boolean;
  /** Carrying Ash's candle jar: dark lanes can be walked. */
  hasLight: boolean;
  ended: boolean;
}

export function initialWorld(): WorldState {
  return {
    time: "afternoon",
    location: "square",
    form: "person",
    posture: "neutral",
    faceHot: false,
    lanterns: "workshop",
    lanternsHung: 0,
    squareLight: 1,
    darkness: 0,
    faces: {},
    invitation: "none",
    heirloom: "whole",
    lens: "none",
    factsFound: [],
    pull: false,
    hasLight: false,
    ended: false,
  };
}

const RIPPLE: Record<Completeness, (w: WorldState) => Partial<WorldState>> = {
  full: () => ({ squareLight: 1, darkness: 0 }),
  partial: (w) => ({ squareLight: 0.75, darkness: Math.max(0, w.darkness - 1) }),
  // Other people hang the lanterns; the square lights, the lanes stay as they were.
  minimal: (w) => ({ squareLight: 0.6, darkness: w.darkness }),
};

const INVITES: readonly WorldState["invitation"][] = ["none", "missing", "pending", "received"];

export const WORLD_EVENTS = new Set([
  "afternoon",
  "carry",
  "pull",
  "get",
  "fact",
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
  "face",
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
    case "carry":
      return { ...w, lanterns: "carried" };
    case "pull":
      return { ...w, pull: ev.arg === "on" };
    case "get":
      if (ev.arg !== "candle") throw new Error(`Unknown item: ${ev.arg}`);
      return { ...w, hasLight: true };
    case "fact":
      if (!isHotspotId(ev.arg ?? "")) throw new Error(`Unknown fact: ${ev.arg}`);
      return w.factsFound.includes(ev.arg as HotspotId) ? w : { ...w, factsFound: [...w.factsFound, ev.arg as HotspotId] };
    case "trip":
      return { ...w, lanterns: "scattered", faceHot: true, posture: "slumped", pull: false };
    case "tear":
      return { ...w, heirloom: "torn" };
    case "cue_heat":
      return { ...w, faceHot: true };
    case "cue_slump":
      return { ...w, posture: "slumped" };
    case "hide":
      return { ...w, form: "shell", location: "cave", faceHot: false, pull: false };
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
    case "face": {
      // arg is "id:expression", e.g. "mara:sad"
      const [id, expr] = (ev.arg ?? "").split(":");
      if (!isCharacterId(id) || !isExpression(expr)) throw new Error(`Bad face: ${ev.arg}`);
      return { ...w, faces: { ...w.faces, [id]: expr } };
    }
    case "hang": {
      const n = Math.max(0, Math.min(LANTERN_COUNT, Number(ev.arg ?? LANTERN_COUNT)));
      return { ...w, lanterns: "hung", lanternsHung: n };
    }
    case "ripple": {
      const apply = RIPPLE[ev.arg as Completeness];
      if (!apply) throw new Error(`ripple needs full|partial|minimal, got ${ev.arg}`);
      return { ...w, time: "night", lens: "none", pull: false, ...apply(w) };
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
