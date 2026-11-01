import { describe, expect, it } from "vitest";
import { parseTags } from "../src/logic/tags";
import { applyMeterEvent, initialMeter, SETTLE_TARGETS, type MeterState } from "../src/logic/meter";
import { applyWorldEvent, initialWorld, MAX_DARKNESS } from "../src/logic/world";
import { outcome, scoreParts } from "../src/logic/outcome";
import { canDecide, emotionFits, factsSupport, HOTSPOTS, initialFacts, inspect } from "../src/logic/facts";
import { buildChain } from "../src/logic/chain";
import { applyEvent, initialState } from "../src/logic/state";

const run = (m: MeterState, ...names: string[]) =>
  names.reduce((acc, n) => {
    const [name, arg] = n.split(" ");
    return applyMeterEvent(acc, { name, arg });
  }, m);

describe("tags", () => {
  it("parses events with and without args, and scenes", () => {
    expect(parseTags(["event: hide", "event: settle full", "scene: facts", "author: x"])).toEqual({
      events: [{ name: "hide" }, { name: "settle", arg: "full" }],
      scene: "facts",
    });
  });

  it("rejects unknown scenes", () => {
    expect(() => parseTags(["scene: nope"])).toThrow();
  });
});

describe("meter", () => {
  it("hiding gives fast relief after the trip", () => {
    const tripped = run(initialMeter(), "trip", "cue_heat", "cue_slump", "cue_urge");
    const hidden = run(tripped, "hide");
    expect(tripped.distress).toBeGreaterThan(70);
    expect(hidden.distress).toBeLessThan(25);
    expect(hidden.urge).toBeLessThan(10);
  });

  it("opposite action goes up first, then down", () => {
    const start = run(initialMeter(), "trip", "cue_heat");
    const stepped = run(start, "oa_step", "oa_step", "oa_step");
    const settled = run(stepped, "settle full");
    expect(stepped.distress).toBeGreaterThan(start.distress);
    expect(settled.distress).toBe(SETTLE_TARGETS.full.distress);
    expect(settled.history.length).toBe(stepped.history.length + 6);
  });

  it("settles lower the more completely the skill is done", () => {
    expect(SETTLE_TARGETS.full.distress).toBeLessThan(SETTLE_TARGETS.partial.distress);
    expect(SETTLE_TARGETS.partial.distress).toBeLessThan(SETTLE_TARGETS.minimal.distress);
  });

  it("stays in range", () => {
    const m = run(initialMeter(), ...Array(30).fill("oa_step"));
    expect(m.distress).toBe(100);
  });

  it("rejects settle without a level", () => {
    expect(() => run(initialMeter(), "settle")).toThrow();
  });
});

describe("world", () => {
  it("hiding turns you into a shell in the cave", () => {
    const w = applyWorldEvent(initialWorld(), { name: "hide" });
    expect(w).toMatchObject({ form: "shell", location: "cave" });
  });

  it("darkness spreads up to a cap and a full ripple clears it", () => {
    let w = initialWorld();
    for (let i = 0; i < 10; i++) w = applyWorldEvent(w, { name: "darkness_spreads" });
    expect(w.darkness).toBe(MAX_DARKNESS);
    w = applyWorldEvent(w, { name: "ripple", arg: "full" });
    expect(w).toMatchObject({ darkness: 0, squareLight: 1 });
  });

  it("a partial ripple only partly recovers", () => {
    let w = { ...initialWorld(), darkness: 2 };
    w = applyWorldEvent(w, { name: "ripple", arg: "partial" });
    expect(w.darkness).toBe(1);
    expect(w.squareLight).toBeLessThan(1);
  });

  it("validates mood and invitation args", () => {
    expect(() => applyWorldEvent(initialWorld(), { name: "mara", arg: "evil" })).toThrow();
    expect(() => applyWorldEvent(initialWorld(), { name: "invitation", arg: "maybe" })).toThrow();
  });
});

describe("game state", () => {
  it("rejects unknown events so typos in the story surface", () => {
    expect(() => applyEvent(initialState(), { name: "hidee" })).toThrow();
  });
});

describe("outcome", () => {
  it("all three parts is full, two is partial, fewer is minimal", () => {
    expect(outcome(true, true, true)).toBe("full");
    expect(outcome(true, false, true)).toBe("partial");
    expect(outcome(false, false, true)).toBe("minimal");
    expect(scoreParts([false, false, false])).toBe("minimal");
  });
});

describe("check the facts", () => {
  it("needs three inspected details before deciding, ignoring repeats", () => {
    let f = initialFacts();
    f = inspect(inspect(inspect(f, "tobin"), "tobin"), "mara");
    expect(canDecide(f)).toBe(false);
    f = inspect(f, "kids");
    expect(canDecide(f)).toBe(true);
  });

  it("fits when either shame or guilt criteria hold", () => {
    expect(emotionFits({ rejection: false, values: false })).toBe(false);
    expect(emotionFits({ rejection: true, values: false })).toBe(true);
    expect(emotionFits({ rejection: false, values: true })).toBe(true);
  });

  it("the main scenario's facts don't support shame; the promise variant's do", () => {
    expect(emotionFits(factsSupport("main"))).toBe(false);
    expect(emotionFits(factsSupport("promise"))).toBe(true);
  });

  it("every hotspot separates interpretation from fact", () => {
    for (const spots of Object.values(HOTSPOTS)) {
      expect(spots.length).toBeGreaterThanOrEqual(5);
      for (const s of spots) expect(s.shameView).not.toBe(s.fact);
    }
  });
});

describe("chain", () => {
  it("builds the full chain with a reflection on every link", () => {
    const links = buildChain({
      variant: "main",
      label: "shame",
      hideCount: 1,
      bailed: false,
      path: "opposite",
      completeness: "partial",
      fit: false,
      factsSeen: 4,
    });
    expect(links.map((l) => l.id)).toEqual(["vulnerability", "prompt", "emotion", "urge", "action", "facts", "skill", "outcome"]);
    for (const l of links) expect(l.reflection.length).toBeGreaterThan(20);
  });
});
