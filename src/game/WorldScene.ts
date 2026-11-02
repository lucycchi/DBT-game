// The walkable village. Presentation and input only: it reads WorldState, tells
// the director when the player reaches something the story offered, and runs
// the two movement challenges. Game rules stay in src/logic.

import Phaser from "phaser";
import type { StoryChoice } from "../engine";
import { CHARACTER_IDS, talkGroup, type CharacterId, type Expression } from "../logic/cast";
import { heldHeadUp } from "../logic/outcome";
import type { HotspotId } from "../logic/facts";
import type { WorldState } from "../logic/world";
import type { Sound } from "../audio/sound";
import { pickBark } from "./barks";
import { allTextures, CHAR_DISPLAY_SCALE, CHAR_ORIGIN, charKey, charTextureSVG, svgUri, WHEEL, WINDOW_LIGHTS, SKIES } from "./art";
import { Puppet } from "./puppet";
import type { Frame } from "../ui/plush";
import {
  AREAS, DOORS, EDGE_X, FOUNTAIN_X, GROUND_Y, groundY, HOOKS, INTERACT_RANGE, laneBlocked, NPC_SPOTS,
  phaseOf, PLAYER_SPOTS, PROPS, REGIONS, WORLD_W, regionAt, SHED, SHED_ITEMS, USABLES, VIEW_H, VIEW_W, ZONES, areaAt, type Area, type Region,
} from "./layout";

type Npc = Exclude<CharacterId, "you">;
const NPCS = CHARACTER_IDS.filter((id): id is Npc => id !== "you");

/** Which check-the-facts detail frees each villager from the shame lens. */
const NPC_FACT: Partial<Record<Npc, HotspotId>> = {
  tobin: "tobin",
  wren: "bakers",
  oda: "bakers",
  pip: "kids",
  juno: "kids",
  mara: "mara",
};

const WALK_SPEED = 270;
const PULL_DRIFT = 70;

/** Village areas that have a snowy version for chapter five. */
const SNOWY_AREAS = new Set<Area["id"]>(["lane", "street", "square", "hill"]);
/** Chapter six: how long the tide takes to come all the way in, in seconds. */
const TIDE_SECONDS = 38;
const TIDE_TOP = GROUND_Y - 150;

export interface TideResult {
  /** Ids of the things carried out of the shed before the water reached them. */
  saved: string[];
  /** How many times the player heaved at the sandbags against the tide. */
  fought: number;
}

export interface ApproachResult {
  reached: boolean;
  headUp: boolean;
  turnedBack: boolean;
}

export interface SceneHooks {
  sound: Sound;
  onArea(area: Area): void;
  /** The thing the player can do right now (for the on-screen action button), or null. */
  onAction(label: string | null, run: (() => void) | null): void;
  /** Touch screen: prompts drop the keyboard hint. */
  touch: boolean;
  /** Story events caused by the player's body during the approach (posture, effort). */
  onApproachEvent(name: string, arg?: string): void;
}

/** The sky to show: by chapter, place, weather and time of day. */
function skyFor(w: WorldState, region: Region["id"]): string {
  if (w.weather === "storm") return "storm";
  if (w.level === 5) return w.time === "morning" ? "winter-dawn" : w.time === "night" ? "winter-night" : "winter-sunset";
  if (region === "coast") return w.time === "sunset" || w.time === "night" ? "coast-dusk" : "coast";
  if (region === "mill" && w.time === "morning") return "mill";
  return w.time;
}

function farFor(w: WorldState, region: Region["id"]): string {
  if (region === "coast") return "far-coast";
  if (region === "mill") return "far-mill";
  return w.weather === "snow" ? "far-snow" : "far";
}

interface Target {
  choice: StoryChoice;
  x: number;
  label: string;
  auto: boolean;
}

/** Hook of the red lantern the kids call the brightest. */
const BRIGHTEST = 11;

export class WorldScene extends Phaser.Scene {
  private hooks!: SceneHooks;
  private world!: WorldState;
  private player!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Image;
  private shell!: Phaser.GameObjects.Image;
  private stack!: Phaser.GameObjects.Image;
  private candle!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private npcs = new Map<Npc, { img: Phaser.GameObjects.Image; puppet: Puppet; shadow: Phaser.GameObjects.Ellipse; bubble: Phaser.GameObjects.Image; bark: Phaser.GameObjects.Text; barkedAt: number }>();
  private you!: Puppet;
  /** Character frames being made on demand (talking and blinking for each feeling). */
  private pendingTextures = new Set<string>();
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /** When anyone last made a passing remark, so they don't all talk at once. */
  private lastBark = -99999;
  private hookLanterns: Phaser.GameObjects.Image[] = [];
  private hookGlows: Phaser.GameObjects.Image[] = [];
  private hookMarkers: Phaser.GameObjects.Arc[] = [];
  private scatter!: Phaser.GameObjects.Image;
  private heap!: Phaser.GameObjects.Image;
  private tablePile!: Phaser.GameObjects.Image;
  private skyA!: Phaser.GameObjects.Image;
  private skyB!: Phaser.GameObjects.Image;
  private far!: Phaser.GameObjects.TileSprite;
  private dark!: Phaser.GameObjects.RenderTexture;
  private laneFog!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Text;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private locked = true;
  private targets: Target[] = [];
  private insideZones = new Set<string>();
  private onPick: ((c: StoryChoice) => void) | null = null;
  private moveTo: number | null = null;
  /** What to do on arriving where the player tapped. */
  private pendingAction: (() => void) | null = null;
  /** What the prompt (and the action button) does right now. */
  private promptAction: (() => void) | null = null;
  private actionLabel: string | null = null;
  /** In the lantern challenges: hang or tie the lantern at the nearest hook. */
  private hookAction: (() => void) | null = null;
  private facing = 1;
  private walking = false;
  private stepClock = 0;
  private area: Area = AREAS[0];
  private lastLocation: WorldState["location"] | null = null;
  private lastLevel = 1;
  private currentSky = "";
  private headUpButton = false;
  private approaching = false;
  private hanging = false;
  private rain!: Phaser.GameObjects.Particles.ParticleEmitter;
  private snow!: Phaser.GameObjects.Particles.ParticleEmitter;
  private areaImages = new Map<Area["id"], Phaser.GameObjects.Image>();
  private props = new Map<string, Phaser.GameObjects.Image>();
  private wheel!: Phaser.GameObjects.Image;
  private shedItems = new Map<string, Phaser.GameObjects.Image>();
  private water!: Phaser.GameObjects.Rectangle;
  private region: Region = REGIONS[0];
  private tiding = false;
  private tideAction: (() => void) | null = null;
  private gust = 0;
  /** Ignore the key press that closed the dialogue, which Phaser sees a moment later. */
  private unlockedAt = 0;

  constructor() {
    super("world");
  }

  private ready: ((scene: WorldScene) => void) | undefined;

  init(data: { hooks: SceneHooks; world: WorldState; ready?: (scene: WorldScene) => void }) {
    this.hooks = data.hooks;
    this.world = data.world;
    this.ready = data.ready;
    this.lastLocation = null;
    this.currentSky = "";
    this.npcs = new Map();
    this.pendingTextures = new Set();
    this.hookLanterns = [];
    this.hookGlows = [];
    this.hookMarkers = [];
    this.targets = [];
    this.approaching = false;
    this.hanging = false;
    this.locked = true;
    this.pendingAction = null;
    this.promptAction = null;
    this.actionLabel = null;
    this.hookAction = null;
    this.lastBark = -99999;
    this.areaImages = new Map();
    this.props = new Map();
    this.shedItems = new Map();
    this.region = REGIONS[0];
    this.tiding = false;
    this.tideAction = null;
  }

  preload() {
    // On "Play again" the scene restarts; textures from the first run are reused.
    if (this.textures.exists("sky-afternoon")) return;
    for (const t of allTextures()) this.load.svg(t.key, svgUri(t.svg));
  }

  create() {
    this.makeLightTextures();

    this.skyA = this.add.image(0, 0, "sky-afternoon").setOrigin(0).setScrollFactor(0).setDisplaySize(VIEW_W, VIEW_H).setDepth(-30);
    this.skyB = this.add.image(0, 0, "sky-afternoon").setOrigin(0).setScrollFactor(0).setDisplaySize(VIEW_W, VIEW_H).setDepth(-29).setAlpha(0);
    this.far = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, "far").setOrigin(0).setScrollFactor(0).setDepth(-20);
    for (const a of AREAS) this.areaImages.set(a.id, this.add.image(a.x0, 0, `area-${a.id}`).setOrigin(0).setDepth(-10));
    this.wheel = this.add.image(WHEEL.x, WHEEL.y, "waterwheel").setDepth(-9);
    // Scenery the story switches on and off, and the light some of it gives.
    for (const [name, p] of Object.entries(PROPS)) {
      this.props.set(name, this.add.image(p.x, p.y, `prop-${name}`).setOrigin(0.5, p.center ? 0.5 : 1).setDepth(p.depth ?? -3).setVisible(false));
    }
    for (const item of SHED_ITEMS) this.shedItems.set(item.id, this.add.image(item.x, item.y, `shed-item-${item.id}`).setOrigin(0.5, 1).setDepth(-2));
    this.water = this.add.rectangle(SHED.x0 - 60, VIEW_H, 13800 - SHED.x0 + 60, 0, 0x5f9fc4, 0.72).setOrigin(0, 1).setDepth(6).setVisible(false);

    // Ambient life: chimney smoke, fountain spray, fireflies on the hill.
    for (const [x, y] of [[332, GROUND_Y - 300], [666, GROUND_Y - 262], [1600, GROUND_Y - 280]]) {
      this.add.particles(x, y, "dot", { speedY: { min: -30, max: -18 }, speedX: { min: 4, max: 14 }, scale: { start: 0.5, end: 1.6 }, alpha: { start: 0.35, end: 0 }, lifespan: 4000, frequency: 500, tint: 0xd8d2c8 }).setDepth(-9);
    }
    this.add.particles(FOUNTAIN_X, GROUND_Y - 200, "dot", { speedX: { min: -70, max: 70 }, speedY: { min: -90, max: -40 }, gravityY: 220, scale: { start: 0.25, end: 0.1 }, alpha: { start: 0.8, end: 0 }, lifespan: 900, frequency: 60, tint: 0xa6d4e0 }).setDepth(-5);

    this.add.image(1880, GROUND_Y, "teacart").setOrigin(0.5, 1).setDepth(-4);
    this.tablePile = this.add.image(USABLES.lantern_table.x, GROUND_Y - 78, "heap").setOrigin(0.5, 1).setScale(0.9).setDepth(-4);
    this.scatter = this.add.image(FOUNTAIN_X + 10, GROUND_Y + 40, "scatter").setDepth(-3).setVisible(false);
    this.heap = this.add.image(USABLES.heap.x, GROUND_Y + 4, "heap").setOrigin(0.5, 1).setDepth(-3).setVisible(false);

    HOOKS.forEach((h, i) => {
      this.hookGlows.push(this.add.image(h.x, h.y + 30, "light").setScale(0.55).setTint(0xff9a3c).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(30));
      this.hookLanterns.push(this.add.image(h.x, h.y, `lantern-${i % 6}`).setOrigin(0.5, 0).setScale(0.75).setVisible(false).setDepth(-2));
      this.hookMarkers.push(this.add.circle(h.x, h.y + 6, 7, 0xfff3c4, 0.9).setVisible(false).setDepth(-2));
    });

    for (const id of NPCS) {
      const shadow = this.add.ellipse(0, 0, 60, 12, 0x000000, 0.18).setDepth(1);
      const img = this.add.image(0, 0, `char-${id}-neutral`).setOrigin(CHAR_ORIGIN.x, CHAR_ORIGIN.y).setScale(CHAR_DISPLAY_SCALE).setDepth(2);
      const bubble = this.add.image(0, 0, "bubble").setDepth(40).setVisible(false);
      const bark = this.add
        .text(0, 0, "", { fontFamily: "Georgia, serif", fontSize: "17px", fontStyle: "italic", color: "#2a2030", backgroundColor: "#fff8e6", padding: { x: 9, y: 5 } })
        .setOrigin(0.5, 1)
        .setDepth(42)
        .setAlpha(0);
      img.setInteractive({ useHandCursor: true }).on("pointerdown", (_: unknown, __: unknown, ___: unknown, ev: Phaser.Types.Input.EventData) => {
        ev?.stopPropagation?.();
        this.walkToAndInteract(img.x);
      });
      const puppet = new Puppet(this, id, img, this.ensureCharTexture, this.reducedMotion);
      this.npcs.set(id, { img, puppet, shadow, bubble, bark, barkedAt: -99999 });
    }

    this.playerShadow = this.add.ellipse(0, 0, 64, 12, 0x000000, 0.2).setDepth(3);
    this.body = this.add.image(0, 0, "char-you-neutral").setOrigin(CHAR_ORIGIN.x, CHAR_ORIGIN.y).setScale(CHAR_DISPLAY_SCALE);
    this.stack = this.add.image(0, -40, "stack").setOrigin(0.5, 1).setScale(0.9);
    this.candle = this.add.image(22, -40, "candle").setScale(0.7);
    this.shell = this.add.image(0, 0, "shell").setOrigin(0.5, 1).setScale(0.8).setVisible(false);
    this.player = this.add.container(600, 600, [this.body, this.stack, this.candle, this.shell]).setDepth(5);
    this.you = new Puppet(this, "you", this.body, this.ensureCharTexture, this.reducedMotion);

    this.laneFog = this.add.image(0, 0, "fog").setOrigin(0).setDisplaySize(1250, VIEW_H).setDepth(20).setAlpha(0);
    this.dark = this.add.renderTexture(0, 0, VIEW_W, VIEW_H).setOrigin(0).setScrollFactor(0).setDepth(25);
    this.vignette = this.add.image(0, 0, "vignette").setOrigin(0).setScrollFactor(0).setDisplaySize(VIEW_W, VIEW_H).setDepth(35).setAlpha(0);
    this.rain = this.add.particles(0, -20, "dot", {
      x: { min: -100, max: VIEW_W + 200 },
      speedY: { min: 700, max: 900 },
      speedX: { min: -260, max: -180 },
      scaleX: 0.12,
      scaleY: 0.9,
      alpha: { start: 0.45, end: 0.2 },
      lifespan: 1100,
      frequency: 6,
      quantity: 3,
      tint: 0xb8c8e0,
      emitting: false,
    }).setScrollFactor(0).setDepth(36);
    this.snow = this.add.particles(0, -20, "dot", {
      x: { min: -100, max: VIEW_W + 100 },
      speedY: { min: 40, max: 90 },
      speedX: { min: -30, max: 20 },
      scale: { min: 0.15, max: 0.45 },
      alpha: { start: 0.9, end: 0.5 },
      lifespan: 9000,
      frequency: 40,
      tint: 0xffffff,
      emitting: false,
    }).setScrollFactor(0).setDepth(36);
    this.prompt = this.add.text(0, 0, "", { fontFamily: "Georgia, serif", fontSize: "20px", color: "#2a1a05", backgroundColor: "#f6e7c8", padding: { x: 10, y: 6 } }).setOrigin(0.5, 1).setDepth(50).setVisible(false);
    // Tapping the prompt does what it says.
    this.prompt.setInteractive({ useHandCursor: true }).on("pointerdown", (_: unknown, __: unknown, ___: unknown, ev: Phaser.Types.Input.EventData) => {
      if (!this.promptAction) return;
      ev?.stopPropagation?.();
      this.promptAction();
    });
    // Hold Head up with one finger while tapping where to walk with another.
    this.input.addPointer(2);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("LEFT,RIGHT,A,D,E,SPACE,ENTER,SHIFT,UP,W") as Record<string, Phaser.Input.Keyboard.Key>;
    for (const k of ["E", "SPACE", "ENTER", "UP", "W"]) this.keys[k].on("down", () => this.interact());

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.locked && !this.approaching && !this.hanging && !this.tiding) return;
      this.hooks.sound.unlock();
      this.moveTo = p.worldX;
      this.pendingAction = null;
      if (this.approaching) return;
      // In the shed: tapping something walks there and saves it (or heaves at the sandbags).
      if (this.tiding) {
        const spots = [...SHED_ITEMS.map((i) => i.x), PROPS.sandbags.x];
        const near = spots.find((x) => Math.abs(x - p.worldX) < 50);
        if (near !== undefined) {
          this.moveTo = near;
          this.pendingAction = () => this.tideAction?.();
        }
        return;
      }
      // Tapping a hook (lantern challenges), or something you can use, walks there and does it.
      if (this.hanging) {
        const i = HOOKS.findIndex((h) => Math.abs(h.x - p.worldX) < 45 && p.worldY < groundY(h.x));
        if (i >= 0) {
          this.moveTo = HOOKS[i].x;
          this.pendingAction = () => this.hookAction?.();
        }
        return;
      }
      const spots = [...this.targets.filter((t) => !t.auto).map((t) => t.x), ...DOORS.filter((d) => !d.when || d.when(this.world)).map((d) => d.x)];
      const near = spots.find((x) => Math.abs(x - p.worldX) < 70);
      if (near !== undefined) this.walkToAndInteract(near);
    });

    this.cameras.main.setBounds(this.region.x0, 0, this.region.x1 - this.region.x0, VIEW_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.applyState(this.world);
    // A new game starts on Lantern Lane; a resumed one where its chapter is.
    this.teleport(this.world.level === 1 ? 600 : PLAYER_SPOTS[this.world.location]);
    // applyState skips work until the scene is running, so note where the player starts here;
    // the next change of place (a chapter starting, say) then moves them.
    this.lastLocation = this.world.location;
    this.lastLevel = this.world.level;
    this.ready?.(this);
  }

  // --- Called by the director ------------------------------------------------

  applyState(w: WorldState) {
    this.world = w;
    if (!this.sys?.isActive()) return;
    // A new place, or a new chapter, puts the player where that starts.
    if (w.location !== this.lastLocation || w.level !== this.lastLevel) {
      if (this.lastLocation !== null) this.teleport(PLAYER_SPOTS[w.location]);
      this.lastLocation = w.location;
      this.lastLevel = w.level;
    }
    const flashback = w.lens === "shame";
    this.setSky(skyFor(w, this.region.id));
    this.far.setTexture(farFor(w, this.region.id));
    const storm = w.weather === "storm";
    if (storm && !this.rain.emitting) this.rain.start();
    if (!storm && this.rain.emitting) this.rain.stop();
    this.updateSnowfall();
    for (const [id, img] of this.areaImages) img.setTexture(w.weather === "snow" && SNOWY_AREAS.has(id) ? `area-${id}-snow` : `area-${id}`);
    for (const [name, img] of this.props) img.setVisible(w.props.includes(name));

    // Lanterns: on the table, in your arms, on the ground, or on the string.
    this.tablePile.setVisible(w.lanterns === "workshop");
    this.stack.setVisible(w.lanterns === "carried" && w.form === "person");
    this.scatter.setVisible(w.lanterns === "scattered");
    this.heap.setVisible(w.lanterns === "heaped");
    const night = w.time === "night";
    this.hookLanterns.forEach((img, i) => {
      if (!this.hanging) img.setVisible(w.lanterns === "hung" && i >= w.lanternsLost);
      // In the storm, untied lanterns swing; tied ones (or calm weather) hang still.
      if (storm && !img.getData("tied")) {
        if (!img.getData("swing")) img.setData("swing", this.tweens.add({ targets: img, angle: { from: -18, to: 18 }, yoyo: true, repeat: -1, duration: 380 + i * 23, ease: "Sine.inOut" }));
      } else if (img.getData("swing")) {
        (img.getData("swing") as Phaser.Tweens.Tween).stop();
        img.setData("swing", null).setAngle(0);
      }
      const lit = night && i < w.lanternsHung;
      if (i === BRIGHTEST && w.heirloom !== "whole") img.setTexture(w.heirloom === "mended" ? "lantern-mended" : "lantern-torn");
      img.setTint(lit || !night ? 0xffffff : 0x8a8098);
      // The red lantern at the end of the string (dented, or Mara's grandmother's) burns brightest.
      const glow = i === BRIGHTEST ? 0.8 : 0.45;
      this.hookGlows[i].setScale(i === BRIGHTEST ? 0.8 : 0.55);
      this.tweens.add({ targets: this.hookGlows[i], alpha: lit && w.lanterns === "hung" && i >= w.lanternsLost ? glow : 0, duration: 700, delay: i * 220 });
    });

    // Player
    this.body.setVisible(w.form === "person");
    this.shell.setVisible(w.form === "shell");
    this.candle.setVisible(w.hasLight && w.form === "person");
    this.you.setFeeling(this.playerFace(w));

    // Villagers
    const spots = NPC_SPOTS[phaseOf(w, this.approaching)];
    for (const [id, n] of this.npcs) {
      const moved = w.placed[id];
      const x = moved === null ? undefined : moved ?? spots[id];
      const here = x !== undefined;
      n.img.setVisible(here);
      n.shadow.setVisible(here);
      if (!here) continue;
      n.img.setPosition(x, groundY(x));
      n.shadow.setPosition(x, groundY(x));
      const fact = NPC_FACT[id];
      const pointing = flashback && fact !== undefined && !w.factsFound.includes(fact);
      n.puppet.setFeeling(w.faces[id] ?? "neutral", pointing);
      n.img.setTint(pointing ? 0xd9a0a0 : 0xffffff);
      n.img.setFlipX(pointing ? x > this.player.x : false);
    }

    this.tweens.add({ targets: this.vignette, alpha: flashback ? 0.85 : 0, duration: 900 });
    this.hooks.sound.setMood(this.moodFor(w));
  }

  /** Snow falls outdoors in chapter five, not inside the house. */
  private updateSnowfall() {
    const on = this.world.weather === "snow" && this.region.id === "village";
    if (on && !this.snow.emitting) this.snow.start();
    if (!on && this.snow.emitting) this.snow.stop();
  }

  /** Offer story choices that live in the world. Picking one calls onPick. */
  setTargets(choices: StoryChoice[], onPick: (c: StoryChoice) => void) {
    this.targets = [];
    for (const c of choices) {
      const t = c.target;
      if (!t) continue;
      if (t.kind === "talk") {
        const ids = [t.id, ...talkGroup(t.id)] as Npc[];
        for (const id of ids) {
          const n = this.npcs.get(id);
          if (n?.img.visible) this.targets.push({ choice: c, x: n.img.x, label: `Talk to ${c.text.replace(/^(Talk to|Ask) /, "")}`, auto: false });
        }
      } else if (t.kind === "use") {
        const u = USABLES[t.id];
        if (u) this.targets.push({ choice: c, x: u.x, label: c.text, auto: false });
      } else {
        const z = ZONES[t.id];
        if (z) this.targets.push({ choice: c, x: (z.x0 + z.x1) / 2, label: c.text, auto: z.auto });
      }
    }
    this.onPick = onPick;
    // Zones you're already standing in only trigger once you've stepped out and back in.
    this.insideZones = new Set(Object.keys(ZONES).filter((id) => this.inZone(id)));
    this.refreshBubbles();
  }

  private inZone(id: string) {
    const z = ZONES[id];
    return this.player.x >= z.x0 && this.player.x <= z.x1;
  }

  clearTargets() {
    this.targets = [];
    this.onPick = null;
    this.refreshBubbles();
    this.hidePrompt();
  }

  setLocked(locked: boolean) {
    if (this.locked && !locked) this.unlockedAt = this.time.now;
    this.locked = locked;
    if (locked) {
      this.moveTo = null;
      this.hidePrompt();
    }
  }

  setHeadUp(on: boolean) {
    this.headUpButton = on;
  }

  /** Open or close a character's mouth while their line is being typed out. */
  setMouth(id: CharacterId, open: boolean) {
    if (id === "you") this.you.setMouth(open);
    else this.npcs.get(id as Npc)?.puppet.setMouth(open);
  }

  /** Make a character frame on first use; false until it's ready. */
  private ensureCharTexture = (id: CharacterId, expr: Expression, frame: Frame): boolean => {
    const key = charKey(id, expr, frame);
    if (this.textures.exists(key)) return true;
    if (!this.pendingTextures.has(key)) {
      this.pendingTextures.add(key);
      this.load.svg(key, svgUri(charTextureSVG(id, expr, frame)));
      this.load.once(`filecomplete-svg-${key}`, () => this.pendingTextures.delete(key));
      if (!this.load.isLoading()) this.load.start();
    }
    return false;
  };

  /** Face a character the player just started talking to. */
  faceCharacter(id: CharacterId) {
    const n = this.npcs.get(id as Npc);
    if (!n) return;
    this.facing = n.img.x >= this.player.x ? 1 : -1;
    this.body.setFlipX(this.facing < 0);
    n.img.setFlipX(n.img.x > this.player.x);
  }

  /** Walk back to Mara while the pull to hide drags toward the hollow. */
  runApproach(): Promise<ApproachResult> {
    this.approaching = true;
    this.applyState(this.world);
    this.teleport(3150);
    const mara = this.npcs.get("mara")!.img;
    const startX = this.player.x;
    let walk = 0;
    let headUp = 0;
    let stillAtEdge = 0;
    let milestones = 0;
    let wasUp = false;
    let beat = 0;
    this.setLocked(false);
    return new Promise((resolve) => {
      const finish = (r: ApproachResult) => {
        this.events.off("update", tick);
        this.approaching = false;
        this.hidePrompt();
        this.keys.E.off("down", stay);
        this.setLocked(true);
        this.applyState(this.world);
        resolve(r);
      };
      const stay = () => {
        if (stillAtEdge > 2.5) finish({ reached: false, headUp: heldHeadUp(headUp, walk), turnedBack: false });
      };
      this.keys.E.on("down", stay);
      const tick = (_t: number, dms: number) => {
        const dt = dms / 1000;
        const up = this.keys.SHIFT.isDown || this.headUpButton;
        const left = this.keys.LEFT.isDown || this.keys.A.isDown || (this.moveTo !== null && this.moveTo < this.player.x - 10);
        const right = this.keys.RIGHT.isDown || this.keys.D.isDown || (this.moveTo !== null && this.moveTo > this.player.x + 10);
        if (up !== wasUp) {
          wasUp = up;
          this.hooks.onApproachEvent("posture", up ? "up" : "down");
          if (up && milestones === 0) {
            milestones = 1;
            this.hooks.onApproachEvent("oa_step");
          }
        }
        // Behind the cart at the edge of the square the pull is weak, so you can choose to stay there.
        const sheltered = this.player.x > 2980 && this.player.x < 3250;
        let vx = PULL_DRIFT * (sheltered ? 0.15 : 1.6);
        if (left) {
          vx -= up ? 330 : 190;
          walk += dt;
          if (up) headUp += dt;
        } else if (right) vx += 160;
        this.facing = left ? -1 : 1;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 2100, WORLD_W - 60);
        this.walking = left || right;

        const progress = (startX - this.player.x) / (startX - (mara.x + 90));
        if (progress > 0.4 && milestones < 2) {
          milestones = 2;
          this.hooks.onApproachEvent("oa_step");
        }
        beat -= dt;
        if (beat <= 0) {
          this.hooks.sound.play("heartbeat", { volume: 0.5 + progress * 0.5 });
          beat = up ? 0.55 : 0.8;
        }
        if (!left && !right && this.player.x > 2980 && this.player.x < 3250) stillAtEdge += dt;
        else stillAtEdge = 0;
        if (stillAtEdge > 2.5) this.showPrompt(this.player.x, "Stay here, at the edge", stay);
        else this.showPrompt(mara.x, up ? "Keep going" : this.hooks.touch ? "Hold Head up" : "Hold Shift: head up");

        if (this.player.x <= mara.x + 90) finish({ reached: true, headUp: heldHeadUp(headUp, walk), turnedBack: false });
        else if (this.player.x >= ZONES.hollow.x0) finish({ reached: false, headUp: false, turnedBack: true });
      };
      this.events.on("update", tick);
    });
  }

  /** Hang lanterns on each hook along the string. */
  runHang(): Promise<void> {
    this.hanging = true;
    let hung = 0;
    this.hookLanterns.forEach((l) => l.setVisible(false));
    this.hookMarkers.forEach((m) => m.setVisible(true));
    this.setLocked(false);
    return new Promise((resolve) => {
      const tryHang = () => {
        const i = this.nearestHook();
        if (i < 0 || this.hookLanterns[i].visible) return;
        this.hookLanterns[i].setVisible(true).setScale(0.2);
        this.tweens.add({ targets: this.hookLanterns[i], scale: 0.75, duration: 300, ease: "Back.out" });
        this.hookMarkers[i].setVisible(false);
        this.hooks.sound.play("hang", { pitch: 0.9 + i * 0.03 });
        hung++;
        if (hung === HOOKS.length) {
          this.events.off("update", tick);
          for (const k of ["E", "SPACE", "ENTER", "UP", "W"]) this.keys[k].off("down", tryHang);
          this.hookAction = null;
          this.hanging = false;
          this.hidePrompt();
          this.setLocked(true);
          resolve();
        }
      };
      const tick = () => {
        const i = this.nearestHook();
        if (i >= 0 && !this.hookLanterns[i].visible) this.showPrompt(HOOKS[i].x, "Hang a lantern", tryHang);
        else this.showPrompt(this.player.x, `${HOOKS.length - hung} lanterns left`);
        this.player.x = Phaser.Math.Clamp(this.player.x, 2150, 2950);
      };
      for (const k of ["E", "SPACE", "ENTER", "UP", "W"]) this.keys[k].on("down", tryHang);
      this.hookAction = tryHang;
      this.events.on("update", tick);
    });
  }

  /** Tie each lantern down before the wind takes it, while gusts shove you around. */
  runSecure(): Promise<void> {
    const todo = this.hookLanterns.map((_, i) => i).filter((i) => i >= this.world.lanternsLost);
    let tied = 0;
    this.hanging = true;
    todo.forEach((i) => this.hookMarkers[i].setVisible(true));
    this.setLocked(false);
    return new Promise((resolve) => {
      const tryTie = () => {
        const i = this.nearestHook();
        if (i < 0 || !todo.includes(i) || this.hookLanterns[i].getData("tied")) return;
        const img = this.hookLanterns[i].setData("tied", true);
        (img.getData("swing") as Phaser.Tweens.Tween | null)?.stop();
        img.setData("swing", null);
        this.tweens.add({ targets: img, angle: 0, duration: 250, ease: "Back.out" });
        this.hookMarkers[i].setVisible(false);
        this.hooks.sound.play("hang", { pitch: 0.9 + i * 0.03 });
        tied++;
        if (tied === todo.length) {
          this.events.off("update", tick);
          for (const k of ["E", "SPACE", "ENTER", "UP", "W"]) this.keys[k].off("down", tryTie);
          this.hookAction = null;
          this.hanging = false;
          this.hidePrompt();
          this.setLocked(true);
          resolve();
        }
      };
      const tick = (_t: number, dms: number) => {
        const dt = dms / 1000;
        // Gusts come and go, blowing one way and then the other.
        this.gust = Math.sin(this.time.now / 900) * 140 + Math.sin(this.time.now / 370) * 60;
        if (this.moveTo === null) this.player.x += this.gust * dt;
        this.player.x = Phaser.Math.Clamp(this.player.x, 2150, 2950);
        const i = this.nearestHook();
        if (i >= 0 && todo.includes(i) && !this.hookLanterns[i].getData("tied")) this.showPrompt(HOOKS[i].x, "Tie it down", tryTie);
        else this.showPrompt(this.player.x, `${todo.length - tied} to tie down`);
      };
      for (const k of ["E", "SPACE", "ENTER", "UP", "W"]) this.keys[k].on("down", tryTie);
      this.hookAction = tryTie;
      this.events.on("update", tick);
    });
  }

  /**
   * Chapter six: the tide comes back into Hesketh's shed. Carry out what you can
   * before the water reaches it, or heave at the sandbags (the water comes anyway).
   */
  runTide(onFight: () => void): Promise<TideResult> {
    this.tiding = true;
    this.teleport(12720);
    this.water.setVisible(true).setSize(this.water.width, 0);
    const saved: string[] = [];
    const lost = new Set<string>();
    let fought = 0;
    let heaving = 0;
    let elapsed = 0;
    const level = () => VIEW_H - (VIEW_H - TIDE_TOP) * Math.min(1, elapsed / TIDE_SECONDS);
    const crate = PROPS.crate;
    this.setLocked(false);
    return new Promise((resolve) => {
      const finish = () => {
        this.events.off("update", tick);
        this.tiding = false;
        this.tideAction = null;
        this.hidePrompt();
        this.setLocked(true);
        this.tweens.add({ targets: this.water, alpha: 0, duration: 1500, onComplete: () => this.water.setVisible(false).setAlpha(0.72) });
        resolve({ saved, fought });
      };
      const nearest = () => {
        const item = SHED_ITEMS.find((i) => Math.abs(i.x - this.player.x) < 45 && !saved.includes(i.id) && !lost.has(i.id));
        if (item) return { kind: "item" as const, item };
        if (Math.abs(PROPS.sandbags.x - this.player.x) < 55) return { kind: "bags" as const };
        return null;
      };
      this.tideAction = () => {
        if (heaving > 0) return;
        const n = nearest();
        if (!n) return;
        if (n.kind === "item") {
          saved.push(n.item.id);
          this.hooks.sound.play("pickup");
          const img = this.shedItems.get(n.item.id)!;
          this.tweens.add({ targets: img, x: crate.x - 30 + (saved.length % 3) * 30, y: crate.y - 40 - Math.floor((saved.length - 1) / 3) * 26, duration: 600, ease: "Quad.out" });
        } else {
          fought++;
          heaving = 1.1;
          onFight();
          this.hooks.sound.play("trip", { volume: 0.4 });
          this.cameras.main.shake(180, 0.004);
        }
      };
      const tick = (_t: number, dms: number) => {
        const dt = dms / 1000;
        elapsed += dt;
        if (heaving > 0) {
          heaving -= dt;
          this.moveTo = null;
        }
        const top = level();
        this.water.setSize(this.water.width, VIEW_H - top);
        for (const item of SHED_ITEMS) {
          if (saved.includes(item.id) || lost.has(item.id) || top > item.y - 12) continue;
          lost.add(item.id);
          this.hooks.sound.play("shell", { volume: 0.4 });
          this.tweens.add({ targets: this.shedItems.get(item.id)!, alpha: 0, y: item.y + 30, duration: 900 });
        }
        const n = nearest();
        if (heaving > 0) this.showPrompt(PROPS.sandbags.x, "Heaving...");
        else if (n?.kind === "item") this.showPrompt(n.item.x, `Carry out ${n.item.label}`, () => this.tideAction?.());
        else if (n?.kind === "bags") this.showPrompt(PROPS.sandbags.x, "Hold back the water", () => this.tideAction?.());
        else this.hidePrompt();
        if (elapsed >= TIDE_SECONDS + 2) finish();
      };
      this.events.on("update", tick);
    });
  }

  sparkle(x: number, y: number) {
    this.add.particles(x, y, "sparkle", { speed: { min: 60, max: 160 }, scale: { start: 0.6, end: 0 }, lifespan: 700, quantity: 14, emitting: false }).setDepth(45).explode(14);
  }

  playerX() {
    return this.player.x;
  }

  /** Testing aid: jump the player to x. */
  debugTeleport(x: number) {
    this.teleport(x);
  }

  /** Testing aid: walk the player to x as if they had clicked there. */
  debugWalkTo(x: number, interact = false) {
    this.moveTo = x;
    this.pendingAction = interact ? () => this.interact() : null;
  }

  // --- Frame loop -------------------------------------------------------------

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    if (!this.locked && !this.approaching && !(this.tiding && this.moveTo === null && !this.keyHeld())) this.move(dt);
    this.wheel.angle += dt * 18;
    this.player.y = groundY(this.player.x);
    this.playerShadow.setPosition(this.player.x, this.player.y);
    this.body.setFlipX(this.facing < 0);
    this.candle.x = 22 * this.facing;
    this.stack.x = 10 * this.facing;
    let bob = 0;
    if (this.walking && this.world.form === "person") {
      this.stepClock += dt;
      bob = -Math.abs(Math.sin(this.stepClock * 11)) * 5;
      if (this.stepClock > 0.3) {
        this.stepClock = 0;
        this.hooks.sound.play("step");
      }
    }
    // The player's posture (slumped, upright) plus their feeling's movement.
    const now = this.time.now;
    const posture = this.world.posture;
    this.you.update(now);
    this.you.apply(CHAR_DISPLAY_SCALE, posture === "slumped" ? 0.94 : posture === "upright" ? 1.04 : 1, posture === "slumped" ? 7 * this.facing : 0);
    this.body.y = bob + this.you.m.dy;
    for (const [, n] of this.npcs) {
      if (!n.img.visible) continue;
      n.puppet.update(now);
      n.puppet.apply(CHAR_DISPLAY_SCALE);
      n.img.y = groundY(n.img.x) + n.puppet.m.dy;
    }

    const area = areaAt(this.player.x);
    if (area !== this.area) {
      this.area = area;
      this.hooks.onArea(area);
    }
    const region = regionAt(this.player.x);
    if (region !== this.region) {
      this.region = region;
      this.cameras.main.setBounds(region.x0, 0, region.x1 - region.x0, VIEW_H);
      this.setSky(skyFor(this.world, region.id));
      this.far.setTexture(farFor(this.world, region.id));
      this.updateSnowfall();
    }
    this.far.tilePositionX = this.cameras.main.scrollX * 0.25;
    const fog = this.world.time === "morning" || this.world.time === "night" ? Math.min(0.92, 0.5 + this.world.darkness * 0.2) * Math.sign(this.world.darkness) * (this.world.hasLight ? 0.55 : 1) : 0;
    this.laneFog.setAlpha(Phaser.Math.Linear(this.laneFog.alpha, fog, 0.05));
    for (const [, n] of this.npcs) {
      n.bubble.setPosition(n.img.x, groundY(n.img.x) - 135);
      n.bark.setPosition(n.img.x, groundY(n.img.x) - 175);
    }
    if (!this.locked && !this.approaching && !this.hanging && !this.tiding) this.maybeBark();
    if (!this.approaching && !this.hanging && !this.tiding && !this.locked) this.updatePrompt();
    this.drawDarkness();
  }

  private move(dt: number) {
    const left = this.keys.LEFT.isDown || this.keys.A.isDown;
    const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
    let vx = 0;
    if (left || right) {
      this.moveTo = null;
      vx = left ? -WALK_SPEED : WALK_SPEED;
    } else if (this.moveTo !== null) {
      const d = this.moveTo - this.player.x;
      if (Math.abs(d) < 8) {
        this.moveTo = null;
        const arrived = this.pendingAction;
        this.pendingAction = null;
        arrived?.();
      } else vx = Math.sign(d) * WALK_SPEED;
    }
    if (this.world.pull && !this.hanging) vx += PULL_DRIFT;
    if (vx !== 0) this.facing = vx < 0 ? -1 : 1;
    this.walking = vx !== 0 && (left || right || this.moveTo !== null);
    const region = regionAt(this.player.x);
    let minX: number = region.min;
    const maxX: number = region.max;
    const interior = region.id !== "village";
    if (!interior && laneBlocked(this.world)) minX = 1080;
    const before = this.player.x;
    this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, minX, maxX);
    if (laneBlocked(this.world) && before > 1080 && this.player.x <= 1080 && left) this.showPrompt(1100, "Too dark to go on without a light");
    this.checkAutoZones();
  }

  private checkAutoZones() {
    for (const id of [...this.insideZones]) if (!this.inZone(id)) this.insideZones.delete(id);
    for (const t of this.targets) {
      if (!t.auto || !this.onPick) continue;
      const id = t.choice.target!.id;
      if (this.inZone(id) && !this.insideZones.has(id)) {
        this.pick(t.choice);
        return;
      }
    }
  }

  private nearestTarget(): Target | null {
    let best: Target | null = null;
    for (const t of this.targets) {
      if (t.auto) continue;
      const d = Math.abs(t.x - this.player.x);
      if (d <= INTERACT_RANGE && (!best || d < Math.abs(best.x - this.player.x))) best = t;
    }
    return best;
  }

  private keyHeld() {
    return this.keys.LEFT.isDown || this.keys.A.isDown || this.keys.RIGHT.isDown || this.keys.D.isDown;
  }

  private nearestDoor() {
    return DOORS.find((d) => Math.abs(d.x - this.player.x) < 60 && (!d.when || d.when(this.world))) ?? null;
  }

  private nearestHook(): number {
    let best = -1;
    HOOKS.forEach((h, i) => {
      if (Math.abs(h.x - this.player.x) < 40 && (best < 0 || Math.abs(h.x - this.player.x) < Math.abs(HOOKS[best].x - this.player.x))) best = i;
    });
    return best;
  }

  private updatePrompt() {
    const t = this.nearestTarget();
    if (t) return this.showPrompt(t.x, t.label, () => this.interact());
    const door = this.nearestDoor();
    if (door) return this.showPrompt(door.x, `Go into ${door.label}`, () => this.interact());
    this.hidePrompt();
  }

  /** A label over the world. With an action, it's tappable and drives the action button. */
  private showPrompt(x: number, text: string, action?: () => void) {
    const shown = action && !this.hooks.touch ? `E  ${text}` : text;
    this.prompt.setText(shown).setPosition(x, groundY(x) - 165).setVisible(true);
    this.promptAction = action ?? null;
    this.setActionButton(action ? text : null);
  }

  private hidePrompt() {
    this.prompt.setVisible(false);
    this.promptAction = null;
    this.setActionButton(null);
  }

  private setActionButton(label: string | null) {
    if (label === this.actionLabel) return;
    this.actionLabel = label;
    this.hooks.onAction(label, label ? () => this.promptAction?.() : null);
  }

  private interact() {
    if (this.tiding) return this.tideAction?.();
    if (this.locked || this.approaching || this.hanging) return;
    if (this.time.now - this.unlockedAt < 600) return;
    this.hooks.sound.unlock();
    const t = this.nearestTarget();
    if (t) return this.pick(t.choice);
    const door = this.nearestDoor();
    if (door) {
      this.hooks.sound.play("door");
      this.cameras.main.fadeOut(180, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.teleport(door.to);
        this.cameras.main.fadeIn(220, 0, 0, 0);
      });
    }
  }

  private walkToAndInteract(x: number) {
    if (this.locked) return;
    this.hooks.sound.unlock();
    this.moveTo = x + (x > this.player.x ? -50 : 50);
    this.pendingAction = () => this.interact();
  }

  private pick(choice: StoryChoice) {
    const cb = this.onPick;
    if (!cb) return;
    this.clearTargets();
    if (choice.target?.kind === "talk") this.faceCharacter(choice.target.id);
    cb(choice);
  }

  /** Someone nearby says something in passing, now and then. */
  private maybeBark() {
    const now = this.time.now;
    if (now - this.lastBark < 6000) return;
    for (const [id, n] of this.npcs) {
      if (!n.img.visible || Math.abs(n.img.x - this.player.x) > 170 || now - n.barkedAt < 30000) continue;
      const line = pickBark(this.world, id, Math.random());
      if (!line) continue;
      n.barkedAt = now;
      this.lastBark = now;
      n.bark.setText(line).setAlpha(0);
      this.tweens.add({ targets: n.bark, alpha: 1, duration: 250, yoyo: true, hold: 2800 });
      return;
    }
  }

  /** Speech bubbles: bright and bobbing for someone with something new to say, faint otherwise. */
  private refreshBubbles() {
    const talkable = new Map<Npc, boolean>();
    for (const t of this.targets) {
      if (t.choice.target?.kind !== "talk") continue;
      for (const id of [t.choice.target.id, ...talkGroup(t.choice.target.id)]) talkable.set(id as Npc, t.choice.fresh);
    }
    for (const [id, n] of this.npcs) {
      const on = talkable.has(id) && n.img.visible;
      const fresh = talkable.get(id) ?? false;
      this.tweens.killTweensOf(n.bubble);
      n.bubble.setVisible(on).setAlpha(fresh ? 1 : 0.4).setScale(fresh ? 1 : 0.75);
      if (on && fresh) this.tweens.add({ targets: n.bubble, y: "-=6", yoyo: true, repeat: -1, duration: 700, ease: "Sine.inOut" });
    }
  }

  private teleport(x: number) {
    this.player.x = x;
    this.moveTo = null;
    // Moving to another place: set its camera limits before centering on it.
    const region = regionAt(x);
    if (region !== this.region) {
      this.region = region;
      this.cameras.main.setBounds(region.x0, 0, region.x1 - region.x0, VIEW_H);
      this.setSky(skyFor(this.world, region.id));
      this.far.setTexture(farFor(this.world, region.id));
      this.updateSnowfall();
    }
    this.cameras.main.centerOn(x, VIEW_H / 2);
  }

  /** The player's face follows how they're doing unless the story sets it. */
  private playerFace(w: WorldState): Expression {
    if (w.faces.you) return w.faces.you;
    if (w.panic) return "scared";
    if (w.lens === "shame" || w.faceHot) return "embarrassed";
    if (w.posture === "slumped") return "sad";
    if (w.ended || (w.lanterns === "hung" && w.squareLight === 1)) return "happy";
    return "neutral";
  }

  private moodFor(w: WorldState) {
    if (w.weather === "storm") return w.panic ? ("shame" as const) : ("night" as const);
    if (w.level === 5) return w.time === "morning" ? ("day" as const) : ("night" as const);
    if (w.level === 4 && w.time === "night") return "festival" as const;
    if (w.form === "shell" || (w.location === "cave" && w.level === 2)) return "hollow" as const;
    if (w.lens === "shame") return "shame" as const;
    if (w.time === "night") return w.lanterns === "hung" ? ("festival" as const) : ("night" as const);
    return "day" as const;
  }

  private setSky(time: string) {
    const key = `sky-${time in SKIES ? time : "afternoon"}`;
    if (key === this.currentSky) return;
    this.currentSky = key;
    this.skyB.setTexture(key).setAlpha(0);
    this.tweens.add({
      targets: this.skyB,
      alpha: 1,
      duration: 1500,
      onComplete: () => {
        this.skyA.setTexture(key);
        this.skyB.setAlpha(0);
      },
    });
    const tint = /night|storm/.test(time) ? 0x55608a : /morning|dawn/.test(time) ? 0xdde8ee : /sunset|dusk/.test(time) ? 0xf0b8a0 : 0xffffff;
    this.far.setTint(tint);
  }

  // --- Light and dark -----------------------------------------------------------

  private makeLightTextures() {
    if (this.textures.exists("light")) return;
    const size = 256;
    const c = this.textures.createCanvas("light", size, size)!;
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    c.refresh();

    const v = this.textures.createCanvas("vignette", 640, 360)!;
    const vctx = v.getContext();
    const vg = vctx.createRadialGradient(320, 190, 80, 320, 190, 380);
    vg.addColorStop(0, "rgba(122,11,28,0)");
    vg.addColorStop(1, "rgba(122,11,28,0.85)");
    vctx.fillStyle = vg;
    vctx.fillRect(0, 0, 640, 360);
    v.refresh();

    // Darkness over the lane: solid, then fading out toward Market Street.
    const f = this.textures.createCanvas("fog", 250, 8)!;
    const fctx = f.getContext();
    const fg = fctx.createLinearGradient(0, 0, 250, 0);
    fg.addColorStop(0, "rgba(5,6,26,0.95)");
    fg.addColorStop(0.72, "rgba(5,6,26,0.9)");
    fg.addColorStop(1, "rgba(5,6,26,0)");
    fctx.fillStyle = fg;
    fctx.fillRect(0, 0, 250, 8);
    f.refresh();

    const d = this.textures.createCanvas("dot", 16, 16)!;
    const dctx = d.getContext();
    dctx.fillStyle = "#ffffff";
    dctx.beginPath();
    dctx.arc(8, 8, 7, 0, Math.PI * 2);
    dctx.fill();
    d.refresh();
  }

  private drawDarkness() {
    const w = this.world;
    const festival = w.time === "night" && w.lanterns === "hung" && w.level <= 3;
    const r = this.region.id;
    let alpha = w.time === "night" ? (festival ? 0.72 - w.squareLight * 0.2 + (w.weather === "storm" ? 0.1 : 0) : 0.8) : w.form === "shell" ? 0.35 : w.time === "sunset" ? 0.2 : 0;
    // Later chapters: the tea room's party is lantern-lit; the house in the power cut is candle-lit.
    if (w.level === 4 && w.time === "night") alpha = 0.5;
    if (r === "home" && w.time === "night") alpha = 0.72;
    if (r === "home" && w.time === "sunset") alpha = 0.3;
    if (r === "coast" && w.time === "sunset") alpha = 0.22;
    this.dark.clear();
    if (alpha <= 0) return;
    const cam = this.cameras.main;
    this.dark.fill(0x070a1f, alpha);
    const erase = (x: number, y: number, scale: number) => {
      const sx = x - cam.scrollX;
      const sy = y - cam.scrollY;
      if (sx < -200 || sx > VIEW_W + 200) return;
      this.dark.erase("light", sx - 128 * scale, sy - 128 * scale);
    };
    // Rendering a scaled erase: draw the brush several times for bigger lights.
    for (const l of WINDOW_LIGHTS) erase(l.x, l.y, 1);
    for (const [name, p] of Object.entries(PROPS)) {
      if (!p.glow || !w.props.includes(name)) continue;
      const img = this.props.get(name)!;
      const cy = p.center ? p.y : p.y - img.height / 2;
      // A wide prop (a string of lanterns) lights several spots along its length.
      for (let i = 0; i < p.glow; i++) erase(p.x + (p.glow === 1 ? 0 : (i / (p.glow - 1) - 0.5) * img.width * 0.8), cy, 1);
    }
    if (festival) HOOKS.forEach((h, i) => i < w.lanternsHung && (i % 2 === 0 || i === BRIGHTEST) && erase(h.x, h.y + 90, 1));
    if (w.hasLight || festival) erase(this.player.x, this.player.y - 70, 1);
  }
}
