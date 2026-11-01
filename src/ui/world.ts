// Draws the village from WorldState. Presentation only: reads state, never
// changes it. A later Phaser/Godot layer would replace this file.

import { LANTERN_COUNT, type WorldState } from "../logic/world";
import type { HotspotId } from "../logic/facts";
import type { CharacterId, Expression } from "../logic/cast";
import { drawCharacter, svgEl as el, type DrawnCharacter } from "./characters";

const PLAYER_SPOTS = {
  square: { x: 410, y: 300 },
  edge: { x: 600, y: 300 },
  cave: { x: 722, y: 280 },
  lane: { x: 160, y: 304 },
} as const;

/** Where shame's pointing arms aim. */
const TARGET = { x: 410, y: 265 };

interface Placement {
  id: Exclude<CharacterId, "you">;
  x: number;
  y: number;
  /** Check-the-facts hotspot this character belongs to, if any. */
  hotspot?: Exclude<HotspotId, "lanterns" | "you">;
  /** Seen from behind once the facts show they weren't watching. */
  backWhenSeen?: boolean;
}

const PLACEMENTS: Placement[] = [
  { id: "nell", x: 112, y: 302 },
  { id: "ash", x: 208, y: 302 },
  { id: "wren", x: 250, y: 300, hotspot: "bakers", backWhenSeen: true },
  { id: "oda", x: 276, y: 301, hotspot: "bakers", backWhenSeen: true },
  { id: "mara", x: 330, y: 300, hotspot: "mara" },
  { id: "tobin", x: 466, y: 300, hotspot: "tobin" },
  { id: "pip", x: 525, y: 304, hotspot: "kids" },
  { id: "juno", x: 546, y: 304, hotspot: "kids" },
];

const PAPER = ["#e9583c", "#f2b54a", "#e98a3c", "#d9473f"];

function lanternPos(i: number) {
  // Same quadratic as the .string path: M230 120 Q390 175 550 120.
  const t = (i + 0.5) / LANTERN_COUNT;
  const x = (1 - t) ** 2 * 230 + 2 * (1 - t) * t * 390 + t ** 2 * 550;
  const y = (1 - t) ** 2 * 120 + 2 * (1 - t) * t * 175 + t ** 2 * 120;
  return { x, y };
}

/** The player's face follows how they're doing unless the story sets it. */
function playerExpression(w: WorldState, flashback: boolean): Expression {
  if (w.faces.you) return w.faces.you;
  if (flashback || w.faceHot) return "worried";
  if (w.posture === "slumped") return "sad";
  if (w.ended || (w.lanterns === "hung" && w.squareLight === 1)) return "smile";
  return "neutral";
}

export interface WorldView {
  render(w: WorldState): void;
  markSeen(id: HotspotId): void;
  clearSeen(): void;
  onHotspot(handler: ((id: HotspotId) => void) | null): void;
  /** Mark who can be talked to right now; clicking them calls the handler. */
  setTalkable(ids: CharacterId[], handler: ((id: CharacterId) => void) | null): void;
}

export function createWorldView(svg: SVGSVGElement): WorldView {
  const q = <T extends Element>(sel: string) => svg.querySelector(sel) as T;
  let hotspotHandler: ((id: HotspotId) => void) | null = null;
  let talkHandler: ((id: CharacterId) => void) | null = null;

  // Stars
  const stars = q<SVGGElement>(".stars");
  for (let i = 0; i < 40; i++) {
    el("circle", { cx: (i * 97) % 800, cy: (i * 53) % 140, r: i % 3 ? 1 : 1.6 }, stars);
  }

  // Houses, with an invitation slip on each door. The last house is yours.
  const houses = q<SVGGElement>(".houses");
  const houseDefs = [
    { x: 12, w: 62, h: 105, c: "#b9805a" },
    { x: 82, w: 58, h: 92, c: "#9c6a4f" },
    { x: 148, w: 62, h: 100, c: "#c79a6a" },
  ];
  houseDefs.forEach((h, i) => {
    const g = el("g", { class: "house" }, houses);
    el("rect", { x: h.x, y: 300 - h.h, width: h.w, height: h.h, fill: h.c }, g);
    el("path", { d: `M${h.x - 6} ${300 - h.h} L${h.x + h.w / 2} ${270 - h.h} L${h.x + h.w + 6} ${300 - h.h} Z`, class: "roof" }, g);
    el("rect", { x: h.x + 8, y: 300 - h.h + 14, width: 14, height: 14, class: "window" }, g);
    el("rect", { x: h.x + h.w / 2 - 2, y: 262, width: 18, height: 38, class: "door" }, g);
    el("rect", {
      x: h.x + h.w / 2 + 2,
      y: 270,
      width: 10,
      height: 7,
      class: "slip",
      id: i === houseDefs.length - 1 ? "slip-you" : `slip-${i}`,
    }, g);
  });

  // Cobbles
  const cobbles = q<SVGGElement>(".cobbles");
  for (let i = 0; i < 60; i++) {
    el("ellipse", { cx: (i * 71) % 800, cy: 312 + ((i * 37) % 80), rx: 9, ry: 3 }, cobbles);
  }

  // Props: Ash's tea cart, the bakers' stall, Tobin's cart with his cracked lantern, the cart at the edge.
  const props = q<SVGGElement>(".props");
  el("rect", { x: 186, y: 282, width: 34, height: 14, class: "cart tea" }, props);
  el("rect", { x: 196, y: 274, width: 8, height: 8, rx: 2, class: "teapot" }, props);
  el("circle", { cx: 192, cy: 300, r: 4, class: "wheel" }, props);
  el("circle", { cx: 214, cy: 300, r: 4, class: "wheel" }, props);
  el("rect", { x: 236, y: 266, width: 58, height: 34, class: "stall" }, props);
  el("path", { d: "M230 266 L300 266 L292 254 L238 254 Z", class: "awning" }, props);
  el("rect", { x: 482, y: 282, width: 40, height: 14, class: "cart" }, props);
  el("circle", { cx: 490, cy: 302, r: 6, class: "wheel" }, props);
  el("circle", { cx: 514, cy: 302, r: 6, class: "wheel" }, props);
  el("ellipse", { cx: 502, cy: 277, rx: 7, ry: 6, class: "cracked" }, props);
  el("path", { d: "M499 272 L503 278 L500 282", class: "crack" }, props);
  el("rect", { x: 578, y: 278, width: 50, height: 20, class: "cart" }, props);
  el("circle", { cx: 588, cy: 302, r: 7, class: "wheel" }, props);
  el("circle", { cx: 618, cy: 302, r: 7, class: "wheel" }, props);

  // Lanterns on the string, and their glows above the night layer.
  const lanternGroup = q<SVGGElement>(".lanterns");
  const glowGroup = q<SVGGElement>(".lantern-glows");
  const lanterns: SVGGElement[] = [];
  const glows: SVGCircleElement[] = [];
  for (let i = 0; i < LANTERN_COUNT; i++) {
    const { x, y } = lanternPos(i);
    const g = el("g", { class: "lantern", style: `--i:${i}` }, lanternGroup);
    el("line", { x1: x, y1: y, x2: x, y2: y + 8 }, g);
    el("ellipse", { cx: x, cy: y + 16, rx: 8, ry: 9, fill: PAPER[i % PAPER.length], class: "paper" }, g);
    if (i === LANTERN_COUNT - 1) {
      g.classList.add("heirloom");
      el("path", { d: `M${x - 2} ${y + 8} L${x + 2} ${y + 14} L${x - 1} ${y + 19} L${x + 2} ${y + 24}`, class: "tear" }, g);
    }
    lanterns.push(g);
    glows.push(el("circle", { cx: x, cy: y + 16, r: 26, fill: "url(#glow)", class: "lglow", style: `--i:${i}` }, glowGroup));
  }

  // Villagers. Characters in the same check-the-facts hotspot share a group.
  const npcGroup = q<SVGGElement>(".npcs");
  const hotspotGroups = new Map<HotspotId, SVGGElement>();
  const people = new Map<CharacterId, { drawn: DrawnCharacter; wrap: SVGGElement }>();
  for (const p of PLACEMENTS) {
    let parent: SVGGElement = npcGroup;
    if (p.hotspot) {
      if (!hotspotGroups.has(p.hotspot)) {
        const g = el("g", { class: "npc hotspot", "data-hotspot": p.hotspot }, npcGroup);
        hotspotGroups.set(p.hotspot, g);
      }
      parent = hotspotGroups.get(p.hotspot)!;
    } else {
      parent = el("g", { class: "npc bystander" }, npcGroup);
    }
    const wrap = el("g", { class: "person-wrap", "data-character": p.id, transform: `translate(${p.x} ${p.y})` }, parent);
    if (p.backWhenSeen) wrap.classList.add("back-when-seen");
    el("title", {}, wrap).textContent = p.id[0].toUpperCase() + p.id.slice(1);
    const drawn = drawCharacter(p.id, wrap, p.hotspot ? { pointAt: { ...TARGET, fromX: p.x, fromY: p.y } } : {});
    const bubble = el("g", { class: "talk-bubble" }, wrap);
    el("path", { d: "M-9 -86 h18 a4 4 0 0 1 4 4 v8 a4 4 0 0 1 -4 4 h-6 l-3 4 l-3 -4 h-6 a4 4 0 0 1 -4 -4 v-8 a4 4 0 0 1 4 -4 z" }, bubble);
    for (const dx of [-5, 0, 5]) el("circle", { cx: dx, cy: -78, r: 1.5 }, bubble);
    people.set(p.id, { drawn, wrap });
  }

  // Lanterns on the ground: scattered after the fall, or heaped on the fountain steps.
  const groundGroup = q<SVGGElement>(".ground-lanterns");
  const scatter = el("g", { class: "scatter hotspot", "data-hotspot": "lanterns" }, groundGroup);
  el("title", {}, scatter).textContent = "The lanterns";
  const scatterSpots = [
    [372, 330], [392, 344], [430, 336], [452, 350], [356, 352], [415, 360], [470, 328], [340, 334],
  ];
  scatterSpots.forEach(([x, y], i) => {
    el("ellipse", { cx: x, cy: y, rx: 9, ry: 8, fill: PAPER[i % PAPER.length], transform: `rotate(${i * 40} ${x} ${y})` }, scatter);
  });
  const heap = el("g", { class: "heap" }, groundGroup);
  [[362, 296], [378, 294], [394, 297], [370, 286], [386, 285]].forEach(([x, y], i) => {
    el("ellipse", { cx: x, cy: y, rx: 9, ry: 8, fill: PAPER[i % PAPER.length] }, heap);
  });

  // Player: a person who can turn into a shell.
  const player = q<SVGGElement>("#player");
  player.classList.add("hotspot");
  player.dataset.hotspot = "you";
  el("title", {}, player).textContent = "You";
  const person = el("g", { class: "person" }, player);
  const you = drawCharacter("you", person);
  const stack = el("g", { class: "stack" }, person);
  for (let i = 0; i < 4; i++) {
    el("ellipse", { cx: 0, cy: -26 - i * 9, rx: 9, ry: 5, fill: PAPER[i % PAPER.length] }, stack);
  }
  const shell = el("g", { class: "shell" }, player);
  el("path", { d: "M-22 0 Q-22 -30 0 -32 Q22 -30 22 0 Z", class: "dome" }, shell);
  el("path", { d: "M-14 -4 Q-12 -20 0 -24 M14 -4 Q12 -20 0 -24 M0 -24 L0 -2", class: "ridges" }, shell);

  svg.addEventListener("click", (e) => {
    const target = e.target as Element;
    if (hotspotHandler) {
      const spot = target.closest<SVGElement>(".hotspot")?.dataset.hotspot as HotspotId | undefined;
      if (spot) hotspotHandler(spot);
      return;
    }
    const who = target.closest<SVGElement>(".talkable")?.dataset.character as CharacterId | undefined;
    if (who && talkHandler) talkHandler(who);
  });

  return {
    render(w) {
      const flashback = w.lens === "shame";
      const root = svg.dataset;
      root.time = flashback ? "afternoon" : w.time;
      root.lens = flashback ? "shame" : "none";
      root.form = flashback ? "person" : w.form;
      root.posture = flashback ? "slumped" : w.posture;
      root.hot = String(flashback || w.faceHot);
      root.lanterns = flashback ? "scattered" : w.lanterns;
      root.invitation = w.invitation;
      root.heirloom = w.heirloom;

      const spot = PLAYER_SPOTS[flashback ? "square" : w.location];
      player.style.transform = `translate(${spot.x}px, ${spot.y}px)`;

      const night = !flashback && w.time === "night";
      svg.style.setProperty("--square-light", String(night ? w.squareLight : 0));
      svg.style.setProperty("--lane-dark", String(w.darkness * 0.22));
      lanterns.forEach((g, i) => g.classList.toggle("lit", i < w.lanternsHung));
      glows.forEach((c, i) => c.classList.toggle("on", night && w.lanterns === "hung" && i < w.lanternsHung));

      for (const [id, { drawn }] of people) drawn.setExpression(flashback ? "neutral" : w.faces[id] ?? "neutral");
      you.setExpression(playerExpression(w, flashback));
    },
    markSeen(id) {
      if (id === "lanterns") scatter.classList.add("seen");
      else if (id === "you") player.classList.add("seen");
      else hotspotGroups.get(id)?.classList.add("seen");
    },
    clearSeen() {
      svg.querySelectorAll(".seen").forEach((n) => n.classList.remove("seen"));
    },
    onHotspot(handler) {
      hotspotHandler = handler;
      svg.classList.toggle("inspecting", handler !== null);
    },
    setTalkable(ids, handler) {
      talkHandler = handler;
      for (const [id, { wrap }] of people) wrap.classList.toggle("talkable", ids.includes(id));
    },
  };
}
