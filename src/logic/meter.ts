// Emotion meter: distress and the urge to hide, 0..100.
// The shape matters more than the numbers. Hiding gives fast, real relief that
// fades by morning. Opposite action pushes distress UP first, then it comes
// down, further when the action is done all the way.

import type { GameEvent } from "./tags";
import type { Completeness } from "./outcome";

export interface MeterState {
  distress: number;
  urge: number;
  /** Every distress value the meter has passed through, for the curve graph. */
  history: number[];
}

export const MAX_HISTORY = 80;

export function initialMeter(): MeterState {
  return { distress: 10, urge: 0, history: [10] };
}

/** Where distress and urge settle after opposite action or repair. */
export const SETTLE_TARGETS: Record<Completeness, { distress: number; urge: number }> = {
  full: { distress: 15, urge: 5 },
  partial: { distress: 40, urge: 35 },
  minimal: { distress: 58, urge: 55 },
};

const OA_STEP = 8;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Move distress to `target` through the given intermediate fractions. */
function moveTo(m: MeterState, target: number, urge: number, steps = 3): MeterState {
  const start = m.distress;
  const points: number[] = [];
  for (let i = 1; i <= steps; i++) points.push(clamp(start + ((target - start) * i) / steps));
  return {
    distress: clamp(target),
    urge: clamp(urge),
    history: [...m.history, ...points].slice(-MAX_HISTORY),
  };
}

export const METER_EVENTS = new Set([
  "trip",
  "cue_heat",
  "cue_slump",
  "cue_urge",
  "urge_peak",
  "urge_hold",
  "urge_pull",
  "hide",
  "cave_rest",
  "return_distress",
  "oa_step",
  "settle",
]);

export function applyMeterEvent(m: MeterState, ev: GameEvent): MeterState {
  switch (ev.name) {
    case "trip":
      return moveTo(m, 60, 50);
    case "cue_heat":
      return moveTo(m, m.distress + 6, m.urge + 10, 1);
    case "cue_slump":
      return moveTo(m, m.distress + 4, m.urge + 10, 1);
    case "cue_urge":
      return moveTo(m, m.distress + 4, 80, 1);
    case "urge_peak":
      return moveTo(m, m.distress, 90, 1);
    case "urge_hold":
      return moveTo(m, m.distress, 85, 1);
    case "urge_pull":
      return moveTo(m, m.distress, m.urge + 5, 1);
    case "hide":
      return moveTo(m, 22, 5, 3);
    case "cave_rest":
      return moveTo(m, 12, 0, 2);
    case "return_distress":
      return moveTo(m, 58, 70, 3);
    case "oa_step":
      return moveTo(m, m.distress + OA_STEP, m.urge + 6, 1);
    case "settle": {
      const target = SETTLE_TARGETS[ev.arg as Completeness];
      if (!target) throw new Error(`settle needs full|partial|minimal, got ${ev.arg}`);
      return moveTo(m, target.distress, target.urge, 6);
    }
    default:
      return m;
  }
}
