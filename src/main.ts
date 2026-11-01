// Glue: runs the Ink story, feeds its events into the game logic, and hands
// the resulting state to the views.

import { Engine } from "./engine";
import { applyEvent, initialState, type GameState } from "./logic/state";
import type { Variant } from "./logic/facts";
import type { ChainRecord } from "./logic/chain";
import type { Completeness } from "./logic/outcome";
import { createWorldView } from "./ui/world";
import { createMeterView } from "./ui/meter";
import { createStoryView } from "./ui/story";
import { runChainScene, runFactsScene } from "./ui/scenes";
import { talkGroup } from "./logic/cast";
import { PlaytestLog } from "./playtest";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const world = createWorldView(document.querySelector<SVGSVGElement>("#world")!);
const meter = createMeterView(document.querySelector<HTMLElement>("#meter")!, reducedMotion);
const story = createStoryView(
  document.querySelector<HTMLElement>("#text")!,
  document.querySelector<HTMLElement>("#choices")!,
  document.querySelector<HTMLElement>("#panel")!,
  reducedMotion,
);

const storyJson = fetch("festival.json").then((r) => {
  if (!r.ok) throw new Error(`Could not load the story (${r.status}). Run "npm run build".`);
  return r.text();
});

function render(state: GameState) {
  world.render(state.world);
  meter.render(state.meter);
}

async function play(variant: Variant) {
  const engine = new Engine(await storyJson, variant);
  const log = new PlaytestLog(variant);
  let state = initialState();
  world.clearSeen();
  render(state);
  story.clear();
  log.record("start", { variant });

  while (true) {
    const batch = engine.continueBatch();
    for (const line of batch) {
      for (const ev of line.events) {
        try {
          state = applyEvent(state, ev);
        } catch (err) {
          console.warn(err);
        }
        log.record("event", ev);
      }
      render(state);
      if (line.spoken) {
        const expression = line.spoken.expression ?? state.world.faces[line.spoken.speaker] ?? "neutral";
        await story.addLine(line.text, { ...line.spoken, expression });
      } else if (line.text) {
        await story.addLine(line.text);
      }
    }

    const scene = batch[batch.length - 1]?.scene;
    if (scene === "facts") {
      const result = await runFactsScene(story.panel, world, variant, (id) => log.record("inspect", id));
      log.record("facts", result);
      engine.setVar("facts_done", true);
      engine.setVar("facts_seen", result.inspected.length);
      engine.setVar("fit", result.fit);
    } else if (scene === "chain") {
      const record: ChainRecord = {
        variant,
        label: String(engine.getVar("label")),
        hideCount: Number(engine.getVar("hide_count")),
        bailed: Boolean(engine.getVar("bailed")),
        path: engine.getVar("path") === "repair" ? "repair" : "opposite",
        completeness: engine.getVar("completeness") as Completeness,
        fit: Boolean(engine.getVar("fit")),
        factsSeen: Number(engine.getVar("facts_seen")),
      };
      log.record("chain_record", record);
      await runChainScene(story.panel, record, (id) => log.record("chain_tap", id));
    }
    if (scene) {
      engine.choose(0);
      continue;
    }

    if (engine.ended) break;
    const choices = engine.choices;
    // Clicking a villager picks the matching "Talk to ..." choice.
    world.setTalkable(
      choices.flatMap((c) => (c.talkTo ? [c.talkTo] : [])).flatMap((id) => [id, ...talkGroup(id)]),
      (id) => {
        const target = choices.find((c) => c.talkTo && (c.talkTo === id || talkGroup(c.talkTo).includes(id)));
        if (target) story.pick(target.index);
      },
    );
    const choice = await story.showChoices(choices);
    world.setTalkable([], null);
    log.record("choice", choice.text);
    engine.choose(choice.index);
    // Spoken choices continue the conversation on screen; anything else starts a fresh page.
    const said = /^"(.*)"$/.exec(choice.text);
    if (said) await story.addLine(said[1], { speaker: "you", expression: null, text: said[1] });
    else story.clear();
  }

  log.record("end");
  showEnd(log);
}

function showEnd(log: PlaytestLog) {
  const wrap = document.createElement("div");
  wrap.className = "scene end";
  const download = document.createElement("button");
  download.className = "ghost";
  download.textContent = "Download playtest notes";
  download.addEventListener("click", () => log.download());
  const again = document.createElement("button");
  again.className = "primary";
  again.textContent = "Play again";
  again.addEventListener("click", () => titleCard.hidden = false);
  wrap.append(again, download);
  story.panel.replaceChildren(wrap);
}

const titleCard = document.querySelector<HTMLElement>("#title")!;
function begin(variant: Variant) {
  titleCard.hidden = true;
  play(variant).catch((err) => {
    console.error(err);
    story.clear();
    void story.addLine(String(err instanceof Error ? err.message : err));
  });
}
document.querySelector("#start-main")!.addEventListener("click", () => begin("main"));
document.querySelector("#start-promise")!.addEventListener("click", () => begin("promise"));

const requested = new URLSearchParams(location.search).get("variant");
if (requested === "main" || requested === "promise") begin(requested);
