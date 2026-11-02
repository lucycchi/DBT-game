// Plays the real Ink story through the engine: scripted paths for the key
// branches, plus random walks to check every branch ends, every tag is known,
// and every world choice points at a place, thing or person that exists.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Compiler } from "inkjs/full";
import { Engine, type StoryLine } from "../src/engine";
import { applyEvent, initialState, type GameState } from "../src/logic/state";
import type { Variant } from "../src/logic/facts";
import { USABLES, ZONES } from "../src/game/layout";

const json = new Compiler(readFileSync("story/festival.ink", "utf8")).Compile().ToJson()!;

interface SceneAnswers {
  fit: boolean;
  /** Check-in answer in chapter two: does the guilt about resting fit? */
  guiltFits?: boolean;
  /** Slow breaths taken each time the breathing scene runs. */
  breaths?: number;
  /** Results of each walk back, in order. Defaults to all the way, head up. */
  approaches?: { reached: boolean; headUp: boolean; turnedBack: boolean }[];
}

interface Run {
  lines: StoryLine[];
  state: GameState;
  engine: Engine;
  scenes: string[];
  choicesTaken: string[];
}

/** Mirror what the TS director does for each scene. Returns events the scene itself causes. */
function handleScene(engine: Engine, scene: string, answers: SceneAnswers): { name: string; arg?: string }[] {
  if (scene === "fit") engine.setVar("fit", answers.fit);
  if (scene === "checkin") engine.setVar("guilt_fits", answers.guiltFits ?? false);
  if (scene === "breathe") {
    const n = answers.breaths ?? 3;
    engine.setVar("breaths", n);
    return Array.from({ length: n }, () => ({ name: "calm", arg: "breath" }));
  }
  if (scene === "approach") {
    const a = answers.approaches?.shift() ?? { reached: true, headUp: true, turnedBack: false };
    engine.setVar("reached", a.reached);
    engine.setVar("head_up", a.headUp);
    engine.setVar("turned_back", a.turnedBack);
  }
  return [];
}

/** The director keeps the story's `distress` in step with the meter. */
function applyAll(_engine: Engine, state: GameState, events: { name: string; arg?: string }[]): GameState {
  for (const ev of events) state = applyEvent(state, ev);
  return state;
}

/** Play the story, picking choices by matching text fragments in order. */
function play(variant: Variant, picks: string[], answers: SceneAnswers, from?: string): Run {
  const holder: { run?: Run } = {};
  const engine = new Engine(json, variant, () => holder.run!.state.meter.distress);
  if (from) engine.startAt(from);
  const run: Run = { lines: [], state: initialState(), engine, scenes: [], choicesTaken: [] };
  holder.run = run;
  const queue = [...picks];
  for (let guard = 0; guard < 500; guard++) {
    let last: StoryLine | undefined;
    for (const line of engine.lines()) {
      last = line;
      run.lines.push(line);
      run.state = applyAll(engine, run.state, line.events);
    }
    if (last?.scene) {
      run.scenes.push(last.scene);
      run.state = applyAll(engine, run.state, handleScene(engine, last.scene, answers));
      engine.choose(0);
      continue;
    }
    if (engine.ended) return run;
    const pick = queue.shift();
    if (pick === undefined) throw new Error(`Ran out of picks at: ${engine.choices.map((c) => c.text).join(" | ")}`);
    const choice = engine.choices.find((c) => c.text.toLowerCase().includes(pick.toLowerCase()));
    if (!choice) throw new Error(`No choice matching "${pick}" in: ${engine.choices.map((c) => c.text).join(" | ")}`);
    run.choicesTaken.push(choice.text);
    engine.choose(choice.index);
  }
  throw new Error("Story did not end");
}

function playFrom(knot: string, picks: string[], answers: SceneAnswers): Run {
  return play("main", picks, answers, knot);
}

// Player-facing text describes skills instead of naming them.
const DBT_TERMS = /opposite action|check(ing)? the facts|chain analysis|\bDBT\b|distress tolerance|emotion regulation|prompting event|vulnerabilit|\bTIPP\b|\bPLEASE skills?\b|wise mind|self-soothe|DEAR MAN|radical acceptance/i;

const text = (r: Run) => r.lines.map((l) => l.text).join("\n");

/** Chapter two: say no once, check in, tell Ash, rest. Chapter three: cold water, breathe, help Pip. */
const REST_WELL = ["ask the bakers", "not today", "check in", "tell ash", "wiped out", "hollow"];
const STORM_CALM = ["cold water", "slow your breathing", "pip"];

const FACTS_TRIO = ["ask tobin", "ask the kids", "laughing at me", "cobblestones", "sit on the fountain"];

describe("story: stay, the feeling doesn't fit, all the way back", () => {
  const run = play(
    "main",
    ["talk to tobin", "what happened", "pick up", "carry", "shame", "stay", ...FACTS_TRIO, "spectacular", "talk to mara", "okay", "walk home", ...REST_WELL, ...STORM_CALM],
    { fit: false },
  );

  it("runs every challenge and ends", () => {
    expect(run.scenes).toEqual(["fit", "approach", "hang", "chain", "checkin", "breathe", "secure"]);
    expect(run.state.world.ended).toBe(true);
  });

  it("the pull to hide lets go once you've chosen to stay", () => {
    expect(run.state.world.pull).toBe(false);
  });

  it("finds facts by exploring", () => {
    expect(run.state.world.factsFound).toEqual(["tobin", "kids", "stone"]);
    expect(run.engine.getVar("facts_seen")).toBe(3);
  });

  it("raises distress during the walk back before it falls", () => {
    const h = run.state.meter.history;
    const peak = Math.max(...h);
    expect(h.lastIndexOf(peak)).toBeLessThan(h.length - 1);
    expect(h[h.length - 1]).toBeLessThan(peak - 40);
  });

  it("lights the square and brings the invitation", () => {
    expect(run.engine.getVar("completeness")).toBe("full");
    expect(run.state.world).toMatchObject({ squareLight: 1, darkness: 0, lanternsHung: 12, invitation: "received" });
  });

  it("parses dialogue and gives speakers their expressions", () => {
    const tobin = run.lines.find((l) => l.spoken?.speaker === "tobin" && l.spoken.expression === "sad");
    expect(tobin?.text).toMatch(/Loose cobblestone/);
  });
});

describe("story: hiding", () => {
  const run = play(
    "main",
    ["pick up", "carry", "anger", "look again", "shame", "hide", "rest", "stay quiet", "sleep", "go back to the hollow", "rest", "sleep", "talk to ash", "talk to nell", "angry", "ask the kids", "laughing at me", "ask tobin", "sit on the fountain", "nothing", "walk home", ...REST_WELL, ...STORM_CALM],
    { fit: false, approaches: [{ reached: false, headUp: false, turnedBack: false }] },
  );

  it("gives real relief right away", () => {
    const h = run.state.meter.history;
    const afterTrip = Math.max(...h.slice(0, 14));
    expect(Math.min(...h.slice(0, 20))).toBeLessThan(afterTrip - 40);
  });

  it("shows costs through the world, not text judgment", () => {
    const t = text(run);
    expect(t).toMatch(/Yours doesn't/);
    expect(t).toMatch(/must be angry with me/);
    expect(t).not.toMatch(/\b(bad|wrong|good job|should have|failed)\b/i);
  });

  it("Ash's candle opens the dark lane, where Nell has a fact", () => {
    expect(run.state.world.hasLight).toBe(true);
    expect(run.state.world.factsFound).toContain("mara");
  });

  it("partial execution gives a partial result", () => {
    expect(run.engine.getVar("hide_count")).toBe(2);
    expect(run.engine.getVar("completeness")).toBe("minimal");
    expect(run.scenes).not.toContain("hang");
    expect(run.state.world.squareLight).toBeLessThan(1);
  });
});

describe("story: borrowed lantern, the feeling fits, making it right", () => {
  const run = play("promise", ["pick up", "carry", "guilt", "stay", ...FACTS_TRIO, "i stacked", "fix it together", "let it be done", "talk to mara", "nod", "walk home", ...REST_WELL, ...STORM_CALM], { fit: true });

  it("mends the heirloom and recovers fully", () => {
    expect(run.scenes).toEqual(["fit", "approach", "mend", "hang", "chain", "checkin", "breathe", "secure"]);
    expect(run.engine.getVar("path")).toBe("repair");
    expect(run.engine.getVar("completeness")).toBe("full");
    expect(run.state.world).toMatchObject({ heirloom: "mended", lanternsHung: 12, squareLight: 1 });
  });
});

describe("story: turning back on the walk can still recover", () => {
  const run = play(
    "main",
    ["pick up", "carry", "not sure", "stay", ...FACTS_TRIO, "rest", "here", "sleep", "sit on the fountain", "spectacular", "walk home", ...REST_WELL, ...STORM_CALM],
    { fit: false, approaches: [{ reached: false, headUp: false, turnedBack: true }] },
  );

  it("hides, comes back, and ends fully recovered", () => {
    expect(run.engine.getVar("bailed")).toBe(true);
    expect(run.scenes.filter((s) => s === "approach")).toHaveLength(2);
    expect(run.state.world.squareLight).toBe(1);
  });
});

describe("story: structure", () => {
  it("the afternoon offers people to talk to and the workshop", () => {
    const engine = new Engine(json, "main");
    engine.continueBatch();
    const targets = engine.choices.map((c) => c.target);
    expect(targets).toContainEqual({ kind: "use", id: "lantern_table" });
    expect(targets.filter((t) => t?.kind === "talk").map((t) => t!.id)).toEqual(["nell", "ash", "wren", "tobin", "mara", "pip"]);
  });
});

describe("story: random walks", () => {
  // Seeded so failures reproduce.
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;

  it("every path ends, every tag is known, every world choice exists, no DBT terms reach the player", () => {
    for (let i = 0; i < 300; i++) {
      const variant: Variant = i % 2 ? "main" : "promise";
      let state = initialState();
      const engine = new Engine(json, variant, () => state.meter.distress);
      let steps = 0;
      while (!engine.ended) {
        if (++steps > 600) throw new Error("walk did not end");
        let last: StoryLine | undefined;
        for (const line of engine.lines()) {
          last = line;
          if (/^[a-z]+(\/[a-z]+)?: /.test(line.text)) throw new Error(`Unparsed dialogue: ${line.text}`);
          expect(line.text).not.toMatch(DBT_TERMS);
          state = applyAll(engine, state, line.events);
        }
        if (last?.scene) {
          const extra = handleScene(engine, last.scene, {
            fit: rand() < 0.5,
            guiltFits: rand() < 0.3,
            breaths: Math.floor(rand() * 4),
            approaches: [{ reached: rand() < 0.7, headUp: rand() < 0.6, turnedBack: rand() < 0.15 }],
          });
          state = applyAll(engine, state, extra);
          engine.choose(0);
          continue;
        }
        if (engine.ended) break;
        const choices = engine.choices;
        for (const c of choices) {
          expect(c.text).not.toMatch(DBT_TERMS);
          if (c.target?.kind === "go") expect(ZONES).toHaveProperty(c.target.id);
          if (c.target?.kind === "use") expect(USABLES).toHaveProperty(c.target.id);
        }
        // Lean away from hiding so walks finish in a sensible number of steps.
        const nonHide = choices.filter((c) => !/hollow|hide/i.test(c.text));
        const pool = rand() < 0.85 && nonHide.length ? nonHide : choices;
        engine.choose(pool[Math.floor(rand() * pool.length)].index);
      }
      expect(state.world.ended).toBe(true);
      expect(["full", "partial", "minimal"]).toContain(engine.getVar("completeness"));
    }
  }, 60_000);
});

describe("chapter two: resting on purpose", () => {
  const rested = playFrom("start_day_two", ["ask mara", "on it", "take down the bunting", "check in", "tell mara", "need to rest", "hollow", ...STORM_CALM], { fit: false, guiltFits: false });

  it("an errand wears you down, and telling someone before resting keeps the village easy", () => {
    expect(rested.engine.getVar("tasks_done")).toBe(1);
    expect(rested.engine.getVar("told")).toBe(true);
    expect(rested.engine.getVar("rest_kind")).toBe("full");
    expect(text(rested)).not.toMatch(/I looked everywhere/);
  });

  const pushed = playFrom("start_day_two", ["ask the bakers", "sure", "carry the bread", "ask mara", "on it", "take down the bunting", "ask tobin", "okay", "sort the broken", "let ash take over", ...STORM_CALM], { fit: false });

  it("pushing through every errand ends with the body deciding, and a bigger wave later", () => {
    expect(pushed.engine.getVar("rest_kind")).toBe("partial");
    expect(text(pushed)).toMatch(/When did you last sleep/);
    const restedPeak = Math.max(...rested.state.meter.history.slice(-25));
    const pushedPeak = Math.max(...pushed.state.meter.history.slice(-25));
    expect(pushedPeak).toBeGreaterThan(restedPeak);
  });
});

describe("chapter three: bringing the body down first", () => {
  const run = playFrom("start_storm", ["grab at the lanterns", "cold water", "slow your breathing", "run straight"], { fit: false, breaths: 2 });

  it("can't make a plan until distress comes down, and panicking costs a lantern", () => {
    expect(run.engine.getVar("lost")).toBe(true);
    expect(run.state.world.lanternsLost).toBe(1);
    expect(run.scenes).toEqual(["breathe", "secure"]);
    expect(run.state.world).toMatchObject({ weather: "clear", panic: false, ended: true });
  });

  it("cold water brings distress down faster than one slow breath", () => {
    const t = text(run);
    expect(t).toMatch(/heartbeat drops a notch/);
  });
});
