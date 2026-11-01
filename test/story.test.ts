// Plays the real Ink story through the engine: scripted paths for the key
// branches, plus random walks to check every branch ends and every tag is known.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Compiler } from "inkjs/full";
import { Engine, type StoryLine } from "../src/engine";
import { applyEvent, initialState, type GameState } from "../src/logic/state";
import type { Variant } from "../src/logic/facts";

const json = new Compiler(readFileSync("story/festival.ink", "utf8")).Compile().ToJson()!;

interface SceneAnswers {
  fit: boolean;
}

interface Run {
  lines: StoryLine[];
  state: GameState;
  engine: Engine;
  scenes: string[];
  choicesTaken: string[];
}

/** Play the story, picking choices by matching text fragments in order. */
function play(variant: Variant, picks: (string | number)[], answers: SceneAnswers): Run {
  const engine = new Engine(json, variant);
  const run: Run = { lines: [], state: initialState(), engine, scenes: [], choicesTaken: [] };
  const queue = [...picks];
  for (let guard = 0; guard < 500; guard++) {
    const batch = engine.continueBatch();
    for (const line of batch) {
      run.lines.push(line);
      for (const ev of line.events) run.state = applyEvent(run.state, ev);
    }
    const last = batch[batch.length - 1];
    if (last?.scene) {
      run.scenes.push(last.scene);
      if (last.scene === "facts") {
        engine.setVar("facts_done", true);
        engine.setVar("facts_seen", 4);
        engine.setVar("fit", answers.fit);
      }
      engine.choose(0);
      continue;
    }
    if (engine.ended) return run;
    const pick = queue.shift();
    if (pick === undefined) {
      throw new Error(`Ran out of picks at: ${engine.choices.map((c) => c.text).join(" | ")}`);
    }
    const choice =
      typeof pick === "number"
        ? engine.choices[pick]
        : engine.choices.find((c) => c.text.toLowerCase().includes(pick.toLowerCase()));
    if (!choice) throw new Error(`No choice matching "${pick}" in: ${engine.choices.map((c) => c.text).join(" | ")}`);
    run.choicesTaken.push(choice.text);
    engine.choose(choice.index);
  }
  throw new Error("Story did not end");
}

// Player-facing text describes skills instead of naming them.
const DBT_TERMS = /opposite action|check(ing)? the facts|chain analysis|\bDBT\b|distress tolerance|emotion regulation|prompting event|vulnerabilit/i;

const text = (r: Run) => r.lines.map((l) => l.text).join("\n");

describe("story: stay, shame does not fit, opposite action all the way", () => {
  const run = play("main", ["talk to tobin", "what happened", "carry", "shame", "stay", "all the way", "keep going", "lift", "spectacular", "talk to mara", "okay", "head home"], { fit: false });

  it("reaches every scene and ends", () => {
    expect(run.scenes).toEqual(["facts", "chain"]);
    expect(run.state.world.ended).toBe(true);
  });

  it("parses dialogue and gives speakers their expressions", () => {
    const tobin = run.lines.find((l) => l.spoken?.speaker === "tobin" && l.spoken.expression === "sad");
    expect(tobin?.text).toMatch(/Loose cobblestone/);
    expect(run.state.world.faces.mara).toBe("smile");
  });

  it("talk choices are tagged with who they're for", () => {
    const engine = new Engine(json, "main");
    engine.continueBatch();
    expect(engine.choices.filter((c) => c.talkTo).map((c) => c.talkTo)).toEqual(["mara", "tobin", "wren", "pip", "nell", "ash"]);
  });

  it("talking is optional and once per character per scene", () => {
    expect(run.choicesTaken.filter((c) => c === "Talk to Tobin")).toHaveLength(1);
  });

  it("raises distress during opposite action before it falls", () => {
    const h = run.state.meter.history;
    const peak = Math.max(...h);
    const peakAt = h.lastIndexOf(peak);
    expect(peak).toBeGreaterThan(80);
    expect(h[h.length - 1]).toBeLessThan(peak - 50);
    expect(peakAt).toBeLessThan(h.length - 1);
  });

  it("lights the square and brings the invitation", () => {
    expect(run.engine.getVar("completeness")).toBe("full");
    expect(run.state.world).toMatchObject({ squareLight: 1, darkness: 0, lanternsHung: 12, invitation: "received" });
  });
});

describe("story: hiding", () => {
  const run = play(
    "main",
    ["carry", "anger", "look again", "shame", "hide", "rest", "stay quiet", "sleep", "talk to the kids", "laughing at me", "go back to the hollow", "rest", "sleep", "think back", "all the way", "keep going", "eyes on the ground", "nothing", "head home"],
    { fit: false },
  );

  it("gives real relief right away", () => {
    const h = run.state.meter.history;
    const afterTrip = Math.max(...h.slice(0, 12));
    expect(Math.min(...h.slice(0, 20))).toBeLessThan(afterTrip - 40);
  });

  it("shows costs through the world, not text judgment", () => {
    const t = text(run);
    expect(t).toMatch(/Yours doesn't/);
    expect(t).toMatch(/must be angry with me/);
    expect(t).toMatch(/We were watching the lantern/);
    expect(t).not.toMatch(/\b(bad|wrong|good job|should have|failed)\b/i);
  });

  it("partial execution gives a partial result", () => {
    expect(run.engine.getVar("hide_count")).toBe(2);
    expect(run.engine.getVar("completeness")).toBe("minimal");
    expect(run.state.world.squareLight).toBeLessThan(1);
  });
});

describe("story: promise variant, emotion fits, repair", () => {
  const run = play("promise", ["carry", "guilt", "stay", "i stacked", "stay", "fix it together", "let it be done", "talk to mara", "nod", "head home"], { fit: true });

  it("mends the heirloom and recovers fully", () => {
    expect(run.engine.getVar("path")).toBe("repair");
    expect(run.engine.getVar("completeness")).toBe("full");
    expect(run.state.world).toMatchObject({ heirloom: "mended", lanternsHung: 12, squareLight: 1 });
  });
});

describe("story: bailing out partway can still recover", () => {
  const run = play(
    "main",
    ["carry", "not sure", "stay", "edge", "hide after all", "rest", "i'm here", "sleep", "think back", "all the way", "keep going", "lift", "spectacular", "head home"],
    { fit: false },
  );

  it("skips the facts scene the second time and ends fully recovered", () => {
    expect(run.scenes).toEqual(["facts", "chain"]);
    expect(run.engine.getVar("bailed")).toBe(true);
    expect(run.state.world.squareLight).toBe(1);
  });
});

describe("story: random walks", () => {
  // Seeded so failures reproduce.
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

  it("every path ends, and every tag is a known event", () => {
    for (let i = 0; i < 300; i++) {
      const variant: Variant = i % 2 ? "main" : "promise";
      const engine = new Engine(json, variant);
      let state = initialState();
      let steps = 0;
      while (!engine.ended) {
        if (++steps > 400) throw new Error("walk did not end");
        const batch = engine.continueBatch();
        for (const line of batch) {
          // Anything shaped like dialogue must be a known speaker.
          if (/^[a-z]+(\/[a-z]+)?: /.test(line.text)) throw new Error(`Unparsed dialogue: ${line.text}`);
          expect(line.text).not.toMatch(DBT_TERMS);
        }
        for (const c of engine.choices) expect(c.text).not.toMatch(DBT_TERMS);
        for (const line of batch) for (const ev of line.events) state = applyEvent(state, ev);
        const last = batch[batch.length - 1];
        if (last?.scene) {
          if (last.scene === "facts") {
            engine.setVar("facts_done", true);
            engine.setVar("fit", rand() < 0.5);
          }
          engine.choose(0);
          continue;
        }
        if (engine.ended) break;
        // Lean away from hiding so walks finish in a sensible number of steps.
        const choices = engine.choices;
        const nonHide = choices.filter((c) => !/hollow|hide/i.test(c.text));
        const pool = rand() < 0.8 && nonHide.length ? nonHide : choices;
        engine.choose(pool[Math.floor(rand() * pool.length)].index);
      }
      expect(state.world.ended).toBe(true);
      expect(["full", "partial", "minimal"]).toContain(engine.getVar("completeness"));
    }
  });
});
