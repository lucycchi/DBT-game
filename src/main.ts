// Director: runs the Ink story, feeds its events into the game logic, and hands
// the resulting state to the walkable world and the overlays. When the story
// offers choices that live in the world (people, places, things), the player
// walks to them; plain choices appear in the dialogue box.

import Phaser from "phaser";
import { Engine, type StoryChoice } from "./engine";
import { applyEvent, initialState, type GameState } from "./logic/state";
import type { HotspotId, Variant } from "./logic/facts";
import type { ChainRecord } from "./logic/chain";
import type { Completeness } from "./logic/outcome";
import type { GameEvent } from "./logic/tags";
import { createSound, type Sfx } from "./audio/sound";
import { WorldScene, type SceneHooks } from "./game/WorldScene";
import { GROUND_Y, VIEW_H, VIEW_W } from "./game/layout";
import { createDialogueBox } from "./ui/dialogue";
import { createHud } from "./ui/hud";
import { createMeterView } from "./ui/meter";
import { factCard, runChainScene, runFitScene, runMendScene } from "./ui/scenes";
import { PlaytestLog } from "./playtest";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const sound = createSound();
const dialogue = createDialogueBox($("#dialogue"), sound, reducedMotion);
const hud = createHud($("#hud"), sound);
const meter = createMeterView($("#meter"), reducedMotion);
const panel = $("#panel");
const titleCard = $("#title");

const storyJson = fetch("festival.json").then((r) => {
  if (!r.ok) throw new Error(`Could not load the story (${r.status}).`);
  return r.text();
});

/** Sound effects that go with story events. */
const EVENT_SFX: Partial<Record<string, Sfx>> = {
  carry: "pickup",
  trip: "trip",
  hide: "shell",
  get: "pickup",
  fact: "fact",
  mend: "mend",
  ripple: "light",
  end: "ending",
};

let world: WorldScene | null = null;
let game: Phaser.Game | null = null;
let state: GameState = initialState();
let variant: Variant = "main";

const hooks: SceneHooks = {
  sound,
  onArea: (a) => hud.showArea(a.name),
  onApproachEvent: (name, arg) => apply({ name, arg }),
};

function apply(ev: GameEvent) {
  try {
    state = applyEvent(state, ev);
  } catch (err) {
    console.warn(err);
    return;
  }
  world?.applyState(state.world);
  meter.render(state.meter);
  const sfx = EVENT_SFX[ev.name];
  if (sfx) sound.play(sfx);
  if (ev.name === "fact" && ev.arg) {
    hud.toast(factCard(variant, ev.arg as HotspotId), 7000);
    world?.sparkle(world.playerX(), GROUND_Y - 180);
  }
}

function bootWorld(): Promise<WorldScene> {
  return new Promise((resolve) => {
    const data = {
      hooks,
      world: state.world,
      ready: (scene: WorldScene) => {
        world = scene;
        resolve(scene);
      },
    };
    if (game && world) {
      world.scene.restart(data);
      return;
    }
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: VIEW_W,
      height: VIEW_H,
      backgroundColor: "#15172b",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    game.scene.add("world", WorldScene, true, data);
  });
}

/** Let the player walk to a world choice, or click a plain one. */
function waitForChoice(choices: StoryChoice[]): Promise<StoryChoice> {
  const inWorld = choices.filter((c) => c.target);
  const plain = choices.filter((c) => !c.target);
  hud.setNext(choices);
  if (inWorld.length === 0) {
    world!.setLocked(true);
    return dialogue.ask(plain, false);
  }
  return new Promise((resolve) => {
    const done = (c: StoryChoice) => {
      world!.clearTargets();
      world!.setLocked(true);
      dialogue.dismiss();
      hud.controls("hidden");
      resolve(c);
    };
    if (plain.length) void dialogue.ask(plain, true).then(done);
    else dialogue.hide();
    hud.controls("walk");
    world!.setTargets(inWorld, done);
    world!.setLocked(false);
  });
}

async function play(chosen: Variant) {
  variant = chosen;
  state = initialState();
  meter.render(state.meter);
  const engine = new Engine(await storyJson, variant);
  const log = new PlaytestLog(variant);
  await bootWorld();
  hud.onHeadUp((on) => world!.setHeadUp(on));
  log.record("start", { variant });

  while (true) {
    const batch = engine.continueBatch();
    for (const line of batch) {
      for (const ev of line.events) {
        apply(ev);
        log.record("event", ev);
      }
      if (!line.text) continue;
      world!.setLocked(true);
      if (line.spoken) {
        const expression = line.spoken.expression ?? state.world.faces[line.spoken.speaker] ?? "neutral";
        await dialogue.say(line.text, { ...line.spoken, expression });
      } else {
        await dialogue.say(line.text, null);
      }
    }

    const scene = batch[batch.length - 1]?.scene;
    if (scene) {
      dialogue.hide();
      hud.setNext([]);
      if (scene === "fit") {
        const r = await runFitScene(panel, variant, state.world.factsFound);
        log.record("fit", r);
        engine.setVar("fit", r.fit);
      } else if (scene === "approach") {
        hud.controls("approach");
        const r = await world!.runApproach();
        log.record("approach", r);
        engine.setVar("reached", r.reached);
        engine.setVar("head_up", r.headUp);
        engine.setVar("turned_back", r.turnedBack);
        hud.controls("hidden");
      } else if (scene === "mend") {
        await runMendScene(panel, variant, sound);
      } else if (scene === "hang") {
        hud.controls("hang");
        await world!.runHang();
        hud.controls("hidden");
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
        await runChainScene(panel, record, (id) => log.record("chain_tap", id));
      }
      engine.choose(0);
      continue;
    }

    if (engine.ended) break;
    const choice = await waitForChoice(engine.choices);
    log.record("choice", choice.text);
    engine.choose(choice.index);
    const said = /^"(.*)"$/.exec(choice.text);
    if (said) await dialogue.say(said[1], { speaker: "you", expression: state.world.faces.you ?? null, text: said[1] });
  }

  log.record("end");
  dialogue.hide();
  showEnd(log);
}

function showEnd(log: PlaytestLog) {
  const card = document.createElement("div");
  card.className = "panel-card end";
  const title = document.createElement("h2");
  title.textContent = "The lanterns burn on into the night.";
  const thanks = document.createElement("p");
  thanks.textContent = "Thank you for playing Lantern Night.";
  const again = document.createElement("button");
  again.className = "primary";
  again.textContent = "Play again";
  again.addEventListener("click", () => {
    panel.hidden = true;
    titleCard.hidden = false;
  });
  const notes = document.createElement("button");
  notes.className = "ghost";
  notes.textContent = "Download playtest notes";
  notes.addEventListener("click", () => log.download());
  const row = document.createElement("div");
  row.className = "row";
  row.append(again, notes);
  card.append(title, thanks, row);
  panel.replaceChildren(card);
  panel.hidden = false;
}

function begin(v: Variant) {
  sound.unlock();
  sound.play("ui");
  titleCard.hidden = true;
  play(v).catch((err) => {
    console.error(err);
    void dialogue.say(String(err instanceof Error ? err.message : err), null);
  });
}

$("#start-main").addEventListener("click", () => begin("main"));
$("#start-promise").addEventListener("click", () => begin("promise"));
window.addEventListener("pointerdown", () => sound.unlock(), { once: true });
window.addEventListener("keydown", () => sound.unlock(), { once: true });

// ?debug exposes the world for automated playtesting (walk the player, read state).
if (new URLSearchParams(location.search).has("debug")) {
  Object.assign(window, { lantern: { world: () => world, state: () => state } });
}

const requested = new URLSearchParams(location.search).get("variant");
if (requested === "main" || requested === "promise") begin(requested);
