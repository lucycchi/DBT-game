// The village as data: areas, ground height, places you can walk into, things
// you can use, and where everyone stands. No Phaser here, so it can be tested.

import type { CharacterId } from "../logic/cast";
import type { WorldState } from "../logic/world";

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 480;
export const WORLD_W = 4400;

/** The workshop interior sits off to the side of the outdoor world; its door teleports. */
export const INTERIOR = { x0: 4800, x1: 6080 };

export interface Area {
  id: "lane" | "street" | "square" | "hill" | "workshop";
  name: string;
  x0: number;
  x1: number;
}

export const AREAS: Area[] = [
  { id: "lane", name: "Lantern Lane", x0: 0, x1: 1050 },
  { id: "street", name: "Market Street", x0: 1050, x1: 2050 },
  { id: "square", name: "The Square", x0: 2050, x1: 3200 },
  { id: "hill", name: "The Hill", x0: 3200, x1: WORLD_W },
  { id: "workshop", name: "The Lantern Workshop", x0: INTERIOR.x0, x1: INTERIOR.x1 },
];

export function areaAt(x: number): Area {
  return AREAS.find((a) => x >= a.x0 && x < a.x1) ?? AREAS[0];
}

const HILL_START = 3250;
const HILL_TOP = 4100;
const HILL_RISE = 130;

/** Height of the ground (where feet go) at x. */
export function groundY(x: number): number {
  if (x < HILL_START || x >= INTERIOR.x0) return GROUND_Y;
  if (x >= HILL_TOP) return GROUND_Y - HILL_RISE;
  const t = (x - HILL_START) / (HILL_TOP - HILL_START);
  return GROUND_Y - HILL_RISE * t * t * (3 - 2 * t);
}

/** Places a `#go:` choice can name. Auto zones trigger on walking in; others need E. */
export const ZONES: Record<string, { x0: number; x1: number; label: string; auto: boolean }> = {
  fountain: { x0: 2470, x1: 2640, label: "the fountain", auto: true },
  bench: { x0: 2500, x1: 2600, label: "the fountain wall", auto: false },
  hollow: { x0: 4110, x1: 4300, label: "the hollow", auto: true },
  home: { x0: 700, x1: 780, label: "your door", auto: true },
};

/** Things a `#use:` choice can name. */
export const USABLES: Record<string, { x: number; label: string }> = {
  lantern_table: { x: 5530, label: "the lanterns" },
  stone: { x: 2470, label: "the loose stone" },
  heap: { x: 2610, label: "the lanterns" },
};

export const DOORS = [
  { x: 1650, to: 5170, label: "the workshop" },
  { x: 5170, to: 1650, label: "Market Street" },
];

export const FOUNTAIN_X = 2550;
export const EDGE_X = 3080;
export const HOME_X = 740;

/** Hooks on the lantern string across the square. */
export const HOOKS = Array.from({ length: 12 }, (_, i) => {
  const t = (i + 0.5) / 12;
  const x = 2210 + t * 680;
  const sag = 4 * t * (1 - t);
  return { x, y: GROUND_Y - 350 + sag * 60 };
});
export const POLES = [2180, 2920];

export type Phase = "afternoon" | "after" | "night" | "festival" | "approach";

export function phaseOf(w: WorldState, approaching: boolean): Phase {
  if (approaching) return "approach";
  if (w.time === "night") return w.lanterns === "hung" ? "festival" : "night";
  if (w.lanterns === "workshop" || w.lanterns === "carried") return "afternoon";
  return "after";
}

type Spots = Partial<Record<Exclude<CharacterId, "you">, number>>;

const BASE: Spots = { nell: 330, ash: 1880, wren: 1240, oda: 1300, pip: 2820, juno: 2870 };

/** Where each villager stands in each phase. Missing means not around. */
export const NPC_SPOTS: Record<Phase, Spots> = {
  afternoon: { ...BASE, tobin: 5720, mara: 2380 },
  after: { ...BASE, tobin: 2720, mara: 2600 },
  night: {},
  festival: { ...BASE, tobin: 2700, mara: 2420, pip: 2780, juno: 2830 },
  approach: { ...BASE, tobin: 2470, mara: 2400 },
};

/** Where the player stands when the story moves them. */
export const PLAYER_SPOTS: Record<WorldState["location"], number> = {
  square: 2560,
  edge: EDGE_X,
  cave: 4200,
  lane: 600,
};

/** The lane is too dark to walk into without a light after hiding. */
export function laneBlocked(w: WorldState): boolean {
  return w.time === "morning" && w.darkness > 0 && !w.hasLight;
}

export const INTERACT_RANGE = 80;
