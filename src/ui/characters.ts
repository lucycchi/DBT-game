// Character art: one SVG drawing per character, used both in the village and
// as the portrait beside their dialogue. Feet sit at (0, 0); the head is
// centered at (0, -50). Faces change by expression.

import type { CharacterId, Expression } from "../logic/cast";

const NS = "http://www.w3.org/2000/svg";

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
}

type Hair = "bun" | "cap" | "toque" | "curly" | "pigtails" | "short" | "messy" | "grey-bun";
type Extra = "scarf" | "apron" | "shawl-cane" | "glasses" | "satchel";

interface Look {
  skin: string;
  hair: string;
  hairStyle: Hair;
  outfit: string;
  accent: string;
  /** 1 is adult height. */
  scale: number;
  /** Body width multiplier. */
  build: number;
  extras: Extra[];
}

export const LOOKS: Record<CharacterId, Look> = {
  you: { skin: "#e9c39b", hair: "#3b2a20", hairStyle: "messy", outfit: "#e0b04a", accent: "#9c6b1f", scale: 1, build: 1, extras: ["satchel"] },
  mara: { skin: "#f1d3b3", hair: "#6b3b24", hairStyle: "bun", outfit: "#5f95bf", accent: "#e9583c", scale: 1, build: 1, extras: ["scarf"] },
  tobin: { skin: "#c98f63", hair: "#2a1d16", hairStyle: "cap", outfit: "#7f9152", accent: "#b9874d", scale: 1.04, build: 1.05, extras: ["apron"] },
  wren: { skin: "#f0cfae", hair: "#8a8a8a", hairStyle: "toque", outfit: "#c47e52", accent: "#f6f1e7", scale: 1.1, build: 0.95, extras: ["apron"] },
  oda: { skin: "#8d5a3c", hair: "#1e1512", hairStyle: "curly", outfit: "#a3644a", accent: "#f6f1e7", scale: 0.92, build: 1.2, extras: ["apron"] },
  pip: { skin: "#f3d2b5", hair: "#c9893c", hairStyle: "short", outfit: "#d27a8f", accent: "#ffd27a", scale: 0.66, build: 1, extras: [] },
  juno: { skin: "#f3d2b5", hair: "#c9893c", hairStyle: "pigtails", outfit: "#e0b04a", accent: "#5f95bf", scale: 0.74, build: 0.95, extras: [] },
  nell: { skin: "#ecd0b6", hair: "#d9d6d0", hairStyle: "grey-bun", outfit: "#6f5a7e", accent: "#a6455a", scale: 0.92, build: 1, extras: ["shawl-cane"] },
  ash: { skin: "#b07650", hair: "#1c1c22", hairStyle: "short", outfit: "#4f7d72", accent: "#e7c35a", scale: 1, build: 0.95, extras: ["glasses", "scarf"] },
};

function drawHairBack(g: Element, look: Look) {
  // Long hair or buns that sit behind the head.
  if (look.hairStyle === "pigtails") {
    svgEl("circle", { cx: -12, cy: -50, r: 4.5, fill: look.hair }, g);
    svgEl("circle", { cx: 12, cy: -50, r: 4.5, fill: look.hair }, g);
  }
  if (look.hairStyle === "bun" || look.hairStyle === "grey-bun") {
    svgEl("circle", { cx: 0, cy: -63, r: 5.5, fill: look.hair }, g);
  }
}

function drawHairFront(g: Element, look: Look) {
  const cap = "M-11 -50 Q-12 -63 0 -63.5 Q12 -63 11 -50 Q7 -57 0 -57 Q-7 -57 -11 -50 Z";
  switch (look.hairStyle) {
    case "bun":
    case "grey-bun":
    case "short":
    case "pigtails":
      svgEl("path", { d: cap, fill: look.hair }, g);
      break;
    case "messy":
      svgEl("path", { d: cap, fill: look.hair }, g);
      svgEl("path", { d: "M-8 -60 l-3 -4 M-2 -63 l0 -4 M5 -61 l3 -4", stroke: look.hair, "stroke-width": 2.5, "stroke-linecap": "round" }, g);
      break;
    case "curly":
      for (const [x, y] of [[-9, -56], [-5, -61], [0, -63], [5, -61], [9, -56], [-11, -51], [11, -51]]) {
        svgEl("circle", { cx: x, cy: y, r: 4.2, fill: look.hair }, g);
      }
      break;
    case "cap":
      svgEl("path", { d: cap, fill: look.hair }, g);
      svgEl("path", { d: "M-11 -55 Q-10 -66 0 -66 Q10 -66 11 -55 Z", fill: look.accent }, g);
      svgEl("path", { d: "M2 -56 L16 -55 L15 -53 L2 -54 Z", fill: look.accent }, g);
      break;
    case "toque":
      svgEl("path", { d: cap, fill: look.hair }, g);
      svgEl("path", { d: "M-9 -58 L-9 -66 Q-13 -72 -6 -76 Q0 -82 6 -76 Q13 -72 9 -66 L9 -58 Z", fill: look.accent, stroke: "#d8cfbf", "stroke-width": 1 }, g);
      break;
  }
}

const FACES: Record<Expression, { eyes: "dot" | "arc" | "wide"; brows: string; mouth: string; mouthFill?: boolean }> = {
  neutral: { eyes: "dot", brows: "M-6 -55 L-2 -55 M2 -55 L6 -55", mouth: "M-3 -44 L3 -44" },
  smile: { eyes: "dot", brows: "M-6 -55 Q-4 -56.5 -2 -55.5 M2 -55.5 Q4 -56.5 6 -55", mouth: "M-4 -45 Q0 -41 4 -45" },
  warm: { eyes: "arc", brows: "M-6 -55 Q-4 -56.5 -2 -55.5 M2 -55.5 Q4 -56.5 6 -55", mouth: "M-3.5 -44.5 Q0 -42 3.5 -44.5" },
  laugh: { eyes: "arc", brows: "M-6 -56 Q-4 -57.5 -2 -56.5 M2 -56.5 Q4 -57.5 6 -56", mouth: "M-4.5 -45.5 Q0 -38 4.5 -45.5 Z", mouthFill: true },
  worried: { eyes: "dot", brows: "M-6 -54 L-2 -56.5 M2 -56.5 L6 -54", mouth: "M-3.5 -43.5 Q-1.7 -45 0 -43.8 Q1.7 -42.6 3.5 -44" },
  sad: { eyes: "dot", brows: "M-6 -54 L-2 -56 M2 -56 L6 -54", mouth: "M-4 -42.5 Q0 -46 4 -42.5" },
  surprised: { eyes: "wide", brows: "M-6 -57 Q-4 -59 -2 -57.5 M2 -57.5 Q4 -59 6 -57", mouth: "M-2 -44 a2 2.6 0 1 0 4 0 a2 2.6 0 1 0 -4 0", mouthFill: true },
};

function drawFace(face: Element, look: Look, expr: Expression) {
  face.replaceChildren();
  const f = FACES[expr];
  const ink = "#2a2030";
  for (const x of [-3.8, 3.8]) {
    if (f.eyes === "arc") svgEl("path", { d: `M${x - 1.8} -49.5 Q${x} -51.8 ${x + 1.8} -49.5`, stroke: ink, "stroke-width": 1.3, fill: "none", "stroke-linecap": "round" }, face);
    else svgEl("circle", { cx: x, cy: -50, r: f.eyes === "wide" ? 1.9 : 1.45, fill: ink }, face);
  }
  svgEl("path", { d: f.brows, stroke: look.hair === "#d9d6d0" ? "#9b968e" : look.hair, "stroke-width": 1.4, fill: "none", "stroke-linecap": "round" }, face);
  svgEl("path", { d: f.mouth, stroke: ink, "stroke-width": 1.3, fill: f.mouthFill ? "#7a2b2b" : "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, face);
  if (look.extras.includes("glasses")) {
    svgEl("path", { d: "M-7 -50 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M1 -50 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M-1 -50 L1 -50", stroke: "#1e1e24", "stroke-width": 1, fill: "none" }, face);
  }
}

export interface DrawnCharacter {
  root: SVGGElement;
  setExpression(e: Expression): void;
}

export interface DrawOptions {
  /** Draw a pointing arm aimed at this point (in the parent's coordinates). */
  pointAt?: { x: number; y: number; fromX: number; fromY: number };
}

export function drawCharacter(id: CharacterId, parent: Element, opts: DrawOptions = {}): DrawnCharacter {
  const look = LOOKS[id];
  const root = svgEl("g", { class: `character char-${id}` }, parent);
  const g = svgEl("g", { transform: `scale(${look.scale})` }, root);
  const w = 11 * look.build;

  // Legs, body, arms
  svgEl("path", { d: "M-5 -12 L-5.5 0 M5 -12 L5.5 0", stroke: "#3a2c26", "stroke-width": 4, "stroke-linecap": "round" }, g);
  svgEl("path", { d: `M${-w} -6 L${-w * 0.75} -34 Q0 -41 ${w * 0.75} -34 L${w} -6 Q0 -2 ${-w} -6 Z`, fill: look.outfit, class: "body" }, g);
  if (look.extras.includes("apron")) {
    svgEl("path", { d: `M${-w * 0.55} -26 L${w * 0.55} -26 L${w * 0.7} -5 Q0 -2 ${-w * 0.7} -5 Z`, fill: look.accent, opacity: 0.92 }, g);
  }
  if (look.extras.includes("satchel")) {
    svgEl("path", { d: `M${-w * 0.7} -34 L${w * 0.8} -14`, stroke: look.accent, "stroke-width": 2 }, g);
    svgEl("rect", { x: w * 0.45, y: -16, width: 7, height: 6, rx: 1.5, fill: look.accent }, g);
  }
  const armColor = look.outfit;
  svgEl("path", { d: `M${-w * 0.8} -32 L${-w - 3} -14`, stroke: armColor, "stroke-width": 4.5, "stroke-linecap": "round", class: "arm" }, g);
  svgEl("circle", { cx: -w - 3, cy: -13, r: 2.4, fill: look.skin }, g);
  const rest = svgEl("g", { class: "arm-rest" }, g);
  svgEl("path", { d: `M${w * 0.8} -32 L${w + 3} -14`, stroke: armColor, "stroke-width": 4.5, "stroke-linecap": "round" }, rest);
  svgEl("circle", { cx: w + 3, cy: -13, r: 2.4, fill: look.skin }, rest);
  if (opts.pointAt) {
    const { x, y, fromX, fromY } = opts.pointAt;
    const s = look.scale;
    const dx = (x - fromX) / s;
    const dy = (y - (fromY - 32 * s)) / s;
    const len = Math.hypot(dx, dy);
    const ex = w * 0.8 + (dx / len) * 22;
    const ey = -32 + (dy / len) * 22;
    const point = svgEl("g", { class: "arm-point" }, g);
    svgEl("path", { d: `M${w * 0.8} -32 L${ex} ${ey}`, stroke: armColor, "stroke-width": 4.5, "stroke-linecap": "round" }, point);
    svgEl("circle", { cx: ex, cy: ey, r: 2.4, fill: look.skin }, point);
  }
  if (look.extras.includes("shawl-cane")) {
    svgEl("path", { d: `M${-w} -34 Q0 -22 ${w} -34 L${w * 0.6} -20 Q0 -14 ${-w * 0.6} -20 Z`, fill: look.accent }, g);
    svgEl("path", { d: `M${-w - 3} -13 L${-w - 5} 0`, stroke: "#5a3b28", "stroke-width": 2, "stroke-linecap": "round" }, g);
  }

  // Head
  const head = svgEl("g", { class: "head-group" }, g);
  drawHairBack(head, look);
  svgEl("rect", { x: -3, y: -42, width: 6, height: 5, fill: look.skin }, head);
  svgEl("circle", { cx: 0, cy: -50, r: 11, fill: look.skin, class: "head" }, head);
  svgEl("circle", { cx: -6.5, cy: -46, r: 2.4, fill: "#e2493d", opacity: 0.18 }, head);
  svgEl("circle", { cx: 6.5, cy: -46, r: 2.4, fill: "#e2493d", opacity: 0.18 }, head);
  svgEl("circle", { cx: 0, cy: -47, r: 9, class: "blush" }, head);
  const face = svgEl("g", { class: "face" }, head);
  drawHairFront(head, look);
  // Seen from behind: hair covers the face.
  svgEl("circle", { cx: 0, cy: -51, r: 11.5, fill: look.hair, class: "back-of-head" }, head);
  if (look.extras.includes("scarf")) {
    svgEl("path", { d: "M-8 -38 Q0 -33 8 -38 L8 -34 Q0 -29 -8 -34 Z M4 -35 L7 -22 L3 -22 Z", fill: look.accent }, g);
  }

  drawFace(face, look, "neutral");
  let current: Expression = "neutral";
  return {
    root,
    setExpression(e) {
      if (e === current) return;
      current = e;
      drawFace(face, look, e);
    },
  };
}

/** A head-and-shoulders portrait in its own small SVG. */
export function drawPortrait(id: CharacterId, expr: Expression): SVGSVGElement {
  const svg = svgEl("svg", { viewBox: "-20 -80 40 46", class: `portrait portrait-${id}`, "aria-hidden": "true" });
  const look = LOOKS[id];
  // Portraits are drawn at adult scale so kids' faces aren't tiny.
  const wrap = svgEl("g", { transform: `scale(${1 / look.scale})` }, svg);
  drawCharacter(id, wrap).setExpression(expr);
  return svg;
}
