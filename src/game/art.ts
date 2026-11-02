// Every image in the game, generated here as SVG. Nothing is pre-made.
// One palette and one flat, warm, hand-cut-paper style across all of it.

import { CHARACTER_IDS, EXPRESSIONS, type CharacterId, type Expression } from "../logic/cast";
import { drawCharacter } from "../ui/characters";
import { AREAS, GROUND_Y, HOOKS, POLES, groundY, VIEW_H, type Area } from "./layout";

export const PAPER = ["#e9583c", "#f2b54a", "#e98a3c", "#d9473f", "#f0c75e", "#c94f6d"];

const C = {
  ink: "#2a2030",
  wood: "#6e4a34",
  woodDark: "#4a2e22",
  roof: ["#8e4a3a", "#6e3b2c", "#a65a3f", "#7a4a5a"],
  wall: ["#e8c9a0", "#d9a77c", "#c98e6a", "#e2b98f", "#cfa58a"],
  window: "#3c3a5a",
  frame: "#f3e2c4",
  cobble: "#a8977d",
  stone: "#96866d",
  stoneLight: "#b8a88e",
  grass: "#7d9a5c",
  grassDark: "#647f48",
  leaf: ["#6f8f4e", "#5b7c43", "#86a35f"],
};

export function svgUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

const wrap = (w: number, h: number, body: string, viewBox = `0 0 ${w} ${h}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`;

// Deterministic randomness so the village looks the same every time.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

/** Window glows at night, in world coordinates. Filled in as buildings are drawn. */
export const WINDOW_LIGHTS: { x: number; y: number }[] = [];

function windowRect(x: number, y: number, w: number, h: number, worldX: number) {
  WINDOW_LIGHTS.push({ x: worldX + x + w / 2, y: y + h / 2 });
  return (
    `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="3" fill="${C.frame}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${C.window}"/>` +
    `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="${C.frame}" stroke-width="2.5"/>` +
    `<rect x="${x - 5}" y="${y + h + 2}" width="${w + 10}" height="6" rx="2" fill="${C.wood}"/>`
  );
}

interface HouseOpts {
  x: number;
  w: number;
  h: number;
  wall: string;
  roof: string;
  door?: number; // local x of the door center
  chimney?: boolean;
  flowers?: boolean;
  windows?: number;
}

function house(o: HouseOpts, worldX: number): string {
  const top = GROUND_Y - o.h;
  let s = "";
  if (o.chimney) s += `<rect x="${o.x + o.w * 0.7}" y="${top - 70}" width="26" height="60" fill="#8a5a48"/><rect x="${o.x + o.w * 0.7 - 4}" y="${top - 76}" width="34" height="10" fill="#6e4436"/>`;
  s += `<rect x="${o.x}" y="${top}" width="${o.w}" height="${o.h}" fill="${o.wall}"/>`;
  // timber beams
  s += `<path d="M${o.x} ${top + 8} H${o.x + o.w} M${o.x + 6} ${top} V${GROUND_Y} M${o.x + o.w - 6} ${top} V${GROUND_Y}" stroke="${C.wood}" stroke-width="8" opacity="0.55"/>`;
  s += `<path d="M${o.x - 18} ${top + 4} L${o.x + o.w / 2} ${top - 64} L${o.x + o.w + 18} ${top + 4} Z" fill="${o.roof}"/>`;
  s += `<path d="M${o.x - 18} ${top + 4} L${o.x + o.w / 2} ${top - 64} L${o.x + o.w + 18} ${top + 4}" fill="none" stroke="#00000022" stroke-width="6"/>`;
  const n = o.windows ?? 2;
  for (let i = 0; i < n; i++) {
    const wx = o.x + 24 + i * ((o.w - 48 - 40) / Math.max(1, n - 1));
    if (o.door !== undefined && Math.abs(wx + 20 - o.door) < 40) continue;
    s += windowRect(wx, top + 34, 40, 44, worldX);
    if (o.flowers) s += flowerBox(wx - 5, top + 86);
  }
  if (o.door !== undefined) {
    s += `<rect x="${o.door - 24}" y="${GROUND_Y - 84}" width="48" height="84" rx="22" fill="${C.woodDark}"/>`;
    s += `<rect x="${o.door - 18}" y="${GROUND_Y - 78}" width="36" height="78" rx="17" fill="#6a4030"/>`;
    s += `<circle cx="${o.door + 10}" cy="${GROUND_Y - 38}" r="3" fill="#e7c35a"/>`;
    s += `<rect x="${o.door - 34}" y="${GROUND_Y - 4}" width="68" height="8" rx="2" fill="#8d7c64"/>`;
  }
  return s;
}

function flowerBox(x: number, y: number): string {
  let s = `<rect x="${x}" y="${y}" width="50" height="10" rx="2" fill="#7a5a3c"/>`;
  for (let i = 0; i < 5; i++) s += `<circle cx="${x + 6 + i * 10}" cy="${y - 2}" r="5" fill="${PAPER[(i + 1) % PAPER.length]}"/>`;
  return s;
}

function tree(x: number, ground: number, scale = 1, seed = 1): string {
  const r = rng(seed);
  let s = `<path d="M${x - 8 * scale} ${ground} L${x - 5 * scale} ${ground - 110 * scale} L${x + 5 * scale} ${ground - 110 * scale} L${x + 8 * scale} ${ground} Z" fill="#6b4a33"/>`;
  for (let i = 0; i < 6; i++) {
    const cx = x + (r() - 0.5) * 90 * scale;
    const cy = ground - 130 * scale - r() * 70 * scale;
    s += `<circle cx="${cx}" cy="${cy}" r="${(38 + r() * 22) * scale}" fill="${C.leaf[i % 3]}"/>`;
  }
  return s;
}

function cobbles(w: number, seed: number): string {
  const r = rng(seed);
  let s = `<rect x="0" y="${GROUND_Y}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="${C.cobble}"/>`;
  s += `<rect x="0" y="${GROUND_Y}" width="${w}" height="6" fill="#00000018"/>`;
  for (let row = 0; row < 14; row++) {
    const y = GROUND_Y + 14 + row * 17;
    for (let x = (row % 2) * 16; x < w; x += 32 + r() * 6) {
      s += `<ellipse cx="${x}" cy="${y}" rx="${12 + r() * 3}" ry="5" fill="${r() > 0.5 ? C.stone : C.stoneLight}" opacity="0.8"/>`;
    }
  }
  return s;
}

function bunting(x0: number, x1: number, y: number, sag: number): string {
  let s = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}" fill="none" stroke="#5a4636" stroke-width="2"/>`;
  const n = Math.floor((x1 - x0) / 34);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y + 4 * sag * t * (1 - t);
    s += `<path d="M${x - 10} ${yy} L${x + 10} ${yy} L${x} ${yy + 20} Z" fill="${PAPER[i % PAPER.length]}"/>`;
  }
  return s;
}

function lamppost(x: number): string {
  WINDOW_LIGHTS.push({ x: x, y: GROUND_Y - 170 });
  return (
    `<rect x="${x - 4}" y="${GROUND_Y - 160}" width="8" height="160" fill="#3a3340"/>` +
    `<path d="M${x - 16} ${GROUND_Y - 160} L${x + 16} ${GROUND_Y - 160} L${x + 10} ${GROUND_Y - 186} L${x - 10} ${GROUND_Y - 186} Z" fill="#f2c46a" stroke="#3a3340" stroke-width="4"/>`
  );
}

function sign(x: number, y: number, text: string, color = "#f3e2c4"): string {
  const w = text.length * 15 + 40;
  return (
    `<rect x="${x - w / 2}" y="${y}" width="${w}" height="34" rx="6" fill="${C.wood}"/>` +
    `<text x="${x}" y="${y + 23}" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="${color}" letter-spacing="1">${text}</text>`
  );
}

// --- Areas ------------------------------------------------------------------

function laneSVG(a: Area): string {
  const w = a.x1 - a.x0;
  let s = tree(60, GROUND_Y, 1.1, 3);
  s += house({ x: 150, w: 250, h: 230, wall: C.wall[0], roof: C.roof[0], door: 300, chimney: true, flowers: true, windows: 3 }, a.x0);
  s += `<rect x="260" y="${GROUND_Y - 22}" width="110" height="22" rx="3" fill="#8d7c64"/>`; // Nell's step
  s += house({ x: 430, w: 180, h: 200, wall: C.wall[2], roof: C.roof[1], windows: 2, flowers: true }, a.x0);
  s += house({ x: 640, w: 200, h: 240, wall: C.wall[3], roof: C.roof[2], door: 740, chimney: true, windows: 2 }, a.x0);
  s += `<rect x="752" y="${GROUND_Y - 72}" width="16" height="12" rx="2" fill="${C.frame}"/>`; // house number plate
  s += house({ x: 870, w: 170, h: 210, wall: C.wall[1], roof: C.roof[3], windows: 2, flowers: true }, a.x0);
  s += lamppost(620);
  s += sign(525, GROUND_Y - 330, "LANTERN LANE");
  s += cobbles(w, 11);
  return wrap(w, VIEW_H, s);
}

function streetSVG(a: Area): string {
  const w = a.x1 - a.x0;
  let s = "";
  // Bakery
  s += house({ x: 30, w: 320, h: 250, wall: "#f0d6b0", roof: C.roof[0], windows: 3, chimney: true }, a.x0);
  s += `<path d="M20 ${GROUND_Y - 130} H360 L340 ${GROUND_Y - 96} H40 Z" fill="#e0705a"/>`;
  for (let i = 0; i < 8; i++) s += `<path d="M${40 + i * 40} ${GROUND_Y - 96} h20 l-6 -34 h-20 Z" fill="#f6efe2" opacity="0.9"/>`;
  s += `<rect x="60" y="${GROUND_Y - 70}" width="260" height="70" fill="#c8a36b"/><rect x="60" y="${GROUND_Y - 74}" width="260" height="8" fill="#8a6a44"/>`;
  for (let i = 0; i < 7; i++) s += `<ellipse cx="${84 + i * 36}" cy="${GROUND_Y - 80}" rx="15" ry="9" fill="${i % 2 ? "#c98a4a" : "#b8743c"}"/>`;
  s += sign(190, GROUND_Y - 300, "BAKERY");
  // Workshop
  s += house({ x: 430, w: 340, h: 270, wall: "#cfa58a", roof: C.roof[1], door: 600, windows: 3 }, a.x0);
  s += `<path d="M560 ${GROUND_Y - 292} v26" stroke="#3a3340" stroke-width="3"/>`;
  s += `<ellipse cx="560" cy="${GROUND_Y - 250}" rx="18" ry="22" fill="${PAPER[1]}" stroke="#3a3340" stroke-width="2"/>`;
  s += sign(660, GROUND_Y - 318, "LANTERNS");
  // Filler house
  s += house({ x: 820, w: 170, h: 200, wall: C.wall[4], roof: C.roof[2], windows: 2, flowers: true }, a.x0);
  s += bunting(0, 420, GROUND_Y - 420, 30) + bunting(420, 820, GROUND_Y - 430, 26);
  s += lamppost(395);
  s += cobbles(w, 23);
  return wrap(w, VIEW_H, s);
}

function squareSVG(a: Area): string {
  const w = a.x1 - a.x0;
  const lx = (x: number) => x - a.x0;
  let s = tree(40, GROUND_Y, 1.2, 7) + tree(1100, GROUND_Y, 1.15, 9);
  // Back row of buildings, smaller, for depth
  s += `<g opacity="0.9">` + house({ x: 160, w: 200, h: 180, wall: C.wall[1], roof: C.roof[3], windows: 2 }, a.x0) +
    house({ x: 780, w: 220, h: 190, wall: C.wall[0], roof: C.roof[0], windows: 3, chimney: true }, a.x0) + `</g>`;
  // Lantern poles and string
  for (const p of POLES) {
    s += `<rect x="${lx(p) - 6}" y="${GROUND_Y - 370}" width="12" height="370" fill="${C.wood}"/><circle cx="${lx(p)}" cy="${GROUND_Y - 372}" r="9" fill="${C.woodDark}"/>`;
  }
  const hookPath = HOOKS.map((h, i) => `${i === 0 ? "M" : "L"}${lx(h.x)} ${h.y}`).join(" ");
  s += `<path d="M${lx(POLES[0])} ${GROUND_Y - 364} ${hookPath.replace(/^M/, "L")} L${lx(POLES[1])} ${GROUND_Y - 364}" fill="none" stroke="#4a4036" stroke-width="2.5"/>`;
  // Fountain
  const fx = 500;
  s += `<ellipse cx="${fx}" cy="${GROUND_Y + 2}" rx="150" ry="16" fill="#00000022"/>`;
  s += `<path d="M${fx - 140} ${GROUND_Y} L${fx - 128} ${GROUND_Y - 56} H${fx + 128} L${fx + 140} ${GROUND_Y} Z" fill="#c9c2b4"/>`;
  s += `<rect x="${fx - 140}" y="${GROUND_Y - 64}" width="280" height="14" rx="6" fill="#ddd6c8"/>`;
  s += `<rect x="${fx - 120}" y="${GROUND_Y - 50}" width="240" height="10" fill="#7fb7c9" opacity="0.8"/>`;
  s += `<rect x="${fx - 14}" y="${GROUND_Y - 170}" width="28" height="110" rx="6" fill="#c9c2b4"/>`;
  s += `<path d="M${fx - 62} ${GROUND_Y - 170} Q${fx} ${GROUND_Y - 140} ${fx + 62} ${GROUND_Y - 170} Z" fill="#ddd6c8"/>`;
  s += `<circle cx="${fx}" cy="${GROUND_Y - 196}" r="16" fill="#c9c2b4"/>`;
  s += `<path d="M${fx - 10} ${GROUND_Y - 200} Q${fx - 60} ${GROUND_Y - 230} ${fx - 70} ${GROUND_Y - 168} M${fx + 10} ${GROUND_Y - 200} Q${fx + 60} ${GROUND_Y - 230} ${fx + 70} ${GROUND_Y - 168}" fill="none" stroke="#a6d4e0" stroke-width="5" stroke-linecap="round" opacity="0.85"/>`;
  // Benches
  for (const bx of [260, 760]) s += `<rect x="${bx - 50}" y="${GROUND_Y - 34}" width="100" height="10" rx="3" fill="${C.wood}"/><rect x="${bx - 44}" y="${GROUND_Y - 24}" width="8" height="24" fill="${C.woodDark}"/><rect x="${bx + 36}" y="${GROUND_Y - 24}" width="8" height="24" fill="${C.woodDark}"/>`;
  // Cart at the edge of the square
  const cx = lx(3080);
  s += `<rect x="${cx - 60}" y="${GROUND_Y - 62}" width="120" height="40" rx="4" fill="#7c5a3b"/><path d="M${cx + 60} ${GROUND_Y - 48} l50 -24" stroke="#5a3b28" stroke-width="6"/>`;
  s += `<circle cx="${cx - 34}" cy="${GROUND_Y - 16}" r="17" fill="#3e2d20"/><circle cx="${cx + 34}" cy="${GROUND_Y - 16}" r="17" fill="#3e2d20"/>`;
  s += lamppost(lx(2120)) + lamppost(lx(3000));
  s += cobbles(w, 37);
  // The loose stone
  s += `<ellipse cx="${lx(2470)}" cy="${GROUND_Y + 8}" rx="16" ry="7" fill="${C.stoneLight}" transform="rotate(-12 ${lx(2470)} ${GROUND_Y + 8})" stroke="#6e604c" stroke-width="2"/>`;
  return wrap(w, VIEW_H, s);
}

function hillSVG(a: Area): string {
  const w = a.x1 - a.x0;
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 20) pts.push(`${x} ${groundY(a.x0 + x)}`);
  let s = "";
  s += tree(260, groundY(a.x0 + 260), 1, 13) + tree(620, groundY(a.x0 + 620), 1.25, 17);
  // Rock outcrop and the hollow
  const hx = 1000;
  const gy = groundY(a.x0 + hx);
  s += `<path d="M${hx - 190} ${gy} Q${hx - 170} ${gy - 210} ${hx - 20} ${gy - 230} Q${hx + 150} ${gy - 220} ${hx + 200} ${gy} Z" fill="#8c8478"/>`;
  s += `<path d="M${hx - 150} ${gy - 120} Q${hx - 60} ${gy - 160} ${hx + 40} ${gy - 140}" fill="none" stroke="#a39b8f" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path d="M${hx - 75} ${gy} Q${hx - 80} ${gy - 120} ${hx} ${gy - 128} Q${hx + 80} ${gy - 120} ${hx + 75} ${gy} Z" fill="#241f1c"/>`;
  s += `<path d="M${hx - 60} ${gy} Q${hx - 64} ${gy - 100} ${hx} ${gy - 108}" fill="none" stroke="#3a322c" stroke-width="6"/>`;
  for (let i = 0; i < 7; i++) s += `<circle cx="${hx - 80 + i * 26}" cy="${gy - 132 + (i % 2) * 6}" r="9" fill="${C.leaf[i % 3]}"/>`; // moss
  // Ground
  s += `<path d="M0 ${VIEW_H} L${pts.join(" L")} L${w} ${VIEW_H} Z" fill="${C.grass}"/>`;
  s += `<path d="M${pts.join(" L")}" fill="none" stroke="${C.grassDark}" stroke-width="8"/>`;
  // Path stones up the hill
  for (let x = 40; x < hx - 60; x += 70) s += `<ellipse cx="${x}" cy="${groundY(a.x0 + x) + 10}" rx="20" ry="6" fill="#b5a68a"/>`;
  const r = rng(29);
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    s += `<path d="M${x} ${groundY(a.x0 + x) + 4 + r() * 40} l3 -10 l3 10" stroke="${C.grassDark}" stroke-width="2" fill="none"/>`;
  }
  return wrap(w, VIEW_H, s);
}

function workshopSVG(a: Area): string {
  const w = a.x1 - a.x0;
  // The room is 800 wide in the middle of a wider strip; the rest is dark wall.
  const pad = (w - 800) / 2;
  return wrap(w, VIEW_H, `<rect width="${w}" height="${VIEW_H}" fill="#2a1d16"/><g transform="translate(${pad} 0)">${workshopRoom(a, pad)}</g>`);
}

function workshopRoom(a: Area, pad: number): string {
  const w = 800;
  let s = `<rect width="${w}" height="${VIEW_H}" fill="#7a5640"/>`;
  for (let x = 0; x < w; x += 46) s += `<rect x="${x}" y="0" width="44" height="${GROUND_Y}" fill="${x % 92 ? "#835c44" : "#7a5640"}"/>`;
  s += `<rect x="0" y="${GROUND_Y}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="#5a3e2c"/>`;
  for (let x = 0; x < w; x += 80) s += `<rect x="${x}" y="${GROUND_Y}" width="2" height="${VIEW_H - GROUND_Y}" fill="#4a3222"/>`;
  // Shelves of lanterns
  for (const sy of [GROUND_Y - 400, GROUND_Y - 280]) {
    s += `<rect x="300" y="${sy}" width="440" height="12" fill="${C.woodDark}"/>`;
    for (let i = 0; i < 9; i++) s += `<ellipse cx="${330 + i * 48}" cy="${sy - 20}" rx="16" ry="19" fill="${PAPER[(i + sy) % PAPER.length]}" opacity="0.95"/>`;
  }
  // Window
  s += windowRect(60, GROUND_Y - 420, 140, 150, a.x0 + pad);
  // Door back to the street
  s += `<rect x="${130 - 30}" y="${GROUND_Y - 120}" width="60" height="120" rx="6" fill="${C.woodDark}"/><circle cx="${145}" cy="${GROUND_Y - 60}" r="4" fill="#e7c35a"/>`;
  // Workbench
  s += `<rect x="360" y="${GROUND_Y - 80}" width="260" height="16" fill="${C.wood}"/><rect x="372" y="${GROUND_Y - 64}" width="14" height="64" fill="${C.woodDark}"/><rect x="594" y="${GROUND_Y - 64}" width="14" height="64" fill="${C.woodDark}"/>`;
  return s;
}

function farSVG(): string {
  const w = 1600;
  let s = `<g transform="translate(0 -120)">` + `<path d="M0 470 Q200 380 420 440 T860 420 T1300 430 T1600 460 V720 H0 Z" fill="#a9b98f"/>`;
  s += `<path d="M0 520 Q260 450 520 500 T1040 480 T1600 510 V720 H0 Z" fill="#93a87a"/>`;
  for (let i = 0; i < 9; i++) {
    const x = 80 + i * 180;
    s += `<rect x="${x}" y="${470 - (i % 3) * 14}" width="50" height="60" fill="#b98f73" opacity="0.6"/><path d="M${x - 8} ${470 - (i % 3) * 14} L${x + 25} ${440 - (i % 3) * 14} L${x + 58} ${470 - (i % 3) * 14} Z" fill="#8e5a4a" opacity="0.6"/>`;
  }
  return wrap(w, VIEW_H, s + "</g>");
}

export const SKIES: Record<string, [string, string]> = {
  afternoon: ["#f3c98e", "#fbe8c8"],
  sunset: ["#e88a5a", "#f6cf94"],
  night: ["#0c1130", "#26305e"],
  morning: ["#b9d6e4", "#f2e6d0"],
  storm: ["#1b2030", "#3d4658"],
};

function skySVG(top: string, bottom: string): string {
  return wrap(
    64,
    VIEW_H,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="64" height="${VIEW_H}" fill="url(#g)"/>`,
  );
}

// --- Characters and props ---------------------------------------------------

const CHAR_VIEW = "-34 -98 68 102";
const CHAR_SCALE = 3;

function characterSVG(id: CharacterId, expr: Expression, pointing: boolean): string {
  const holder = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const drawn = drawCharacter(id, holder, pointing ? { pointAt: { x: 60, y: -60, fromX: 0, fromY: 0 } } : {});
  drawn.setExpression(expr);
  drawn.root.querySelector(".back-of-head")?.remove();
  drawn.root.querySelector(".blush")?.remove();
  if (pointing) drawn.root.querySelector(".arm-rest")?.remove();
  else drawn.root.querySelector(".arm-point")?.remove();
  const body = new XMLSerializer().serializeToString(drawn.root);
  return wrap(68 * CHAR_SCALE, 102 * CHAR_SCALE, body, CHAR_VIEW);
}

/** Pixel offset of the feet inside character textures, for sprite origins. */
export const CHAR_ORIGIN = { x: 0.5, y: 98 / 102 };
export const CHAR_DISPLAY_SCALE = 0.55;

function shellSVG(): string {
  return wrap(
    150,
    110,
    `<ellipse cx="75" cy="104" rx="66" ry="6" fill="#00000030"/><path d="M8 100 Q8 14 75 10 Q142 14 142 100 Z" fill="#8a6b4e" stroke="#5b4532" stroke-width="5"/>` +
      `<path d="M40 96 Q42 50 75 34 M110 96 Q108 50 75 34 M75 34 V98 M22 80 Q75 64 128 80" fill="none" stroke="#5b4532" stroke-width="4"/>`,
  );
}

function lanternSVG(color: string, torn: boolean, mended: boolean): string {
  let s = `<path d="M30 0 V10" stroke="#3a3340" stroke-width="3"/><rect x="20" y="8" width="20" height="6" rx="2" fill="#3a3340"/>`;
  s += `<ellipse cx="30" cy="40" rx="22" ry="27" fill="${color}"/>`;
  s += `<path d="M14 26 Q30 18 46 26 M10 40 Q30 34 50 40 M14 54 Q30 62 46 54" fill="none" stroke="#00000030" stroke-width="2"/>`;
  s += `<rect x="22" y="64" width="16" height="6" rx="2" fill="#3a3340"/>`;
  if (torn) s += `<path d="M26 18 L33 30 L27 40 L34 52 L29 62" fill="none" stroke="${mended ? "#ffd76a" : "#2a1a05"}" stroke-width="${mended ? 5 : 3}" stroke-linecap="round"/>`;
  return wrap(60, 72, s);
}

function stackSVG(): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += `<ellipse cx="30" cy="${74 - i * 15}" rx="22" ry="11" fill="${PAPER[i]}" stroke="#00000030" stroke-width="2"/>`;
  return wrap(60, 90, s);
}

function heapSVG(): string {
  let s = "";
  const spots = [[20, 50], [48, 52], [76, 50], [104, 52], [34, 32], [62, 32], [90, 33], [48, 14], [76, 15]];
  spots.forEach(([x, y], i) => (s += `<ellipse cx="${x}" cy="${y}" rx="17" ry="14" fill="${PAPER[i % PAPER.length]}" stroke="#00000030" stroke-width="2"/>`));
  return wrap(124, 68, s);
}

function scatterSVG(): string {
  let s = "";
  const spots = [[20, 20], [70, 34], [130, 16], [190, 30], [250, 22], [310, 34], [372, 18]];
  spots.forEach(([x, y], i) => (s += `<ellipse cx="${x}" cy="${y}" rx="17" ry="14" fill="${PAPER[i % PAPER.length]}" transform="rotate(${i * 37} ${x} ${y})" stroke="#00000030" stroke-width="2"/>`));
  return wrap(392, 52, s);
}

function candleSVG(): string {
  return wrap(40, 50, `<rect x="6" y="10" width="28" height="36" rx="8" fill="#cfe3ec" opacity="0.7" stroke="#8aa" stroke-width="2"/><rect x="15" y="22" width="10" height="20" rx="2" fill="#f6efe2"/><path d="M20 10 Q14 18 20 22 Q26 18 20 10 Z" fill="#ffb347"/>`);
}

function teaCartSVG(): string {
  return wrap(
    150,
    130,
    `<rect x="10" y="50" width="130" height="50" rx="6" fill="#4f7d72"/><rect x="10" y="44" width="130" height="10" rx="3" fill="#3c6158"/>` +
      `<path d="M20 44 V10 H130 V44" fill="none" stroke="#3c6158" stroke-width="5"/><path d="M14 12 H136 L126 0 H24 Z" fill="#e7c35a"/>` +
      `<ellipse cx="50" cy="38" rx="16" ry="10" fill="#e7c35a"/><rect x="62" y="32" width="10" height="4" fill="#e7c35a"/><rect x="88" y="32" width="12" height="12" rx="3" fill="#f6efe2"/><rect x="106" y="32" width="12" height="12" rx="3" fill="#f6efe2"/>` +
      `<circle cx="40" cy="108" r="16" fill="#2e3b38"/><circle cx="110" cy="108" r="16" fill="#2e3b38"/>`,
  );
}

function bubbleSVG(): string {
  return wrap(54, 44, `<path d="M6 2 h42 a5 5 0 0 1 5 5 v20 a5 5 0 0 1 -5 5 h-16 l-5 8 l-5 -8 h-16 a5 5 0 0 1 -5 -5 v-20 a5 5 0 0 1 5 -5 z" fill="#fff8e6" stroke="#2a2030" stroke-width="2"/><circle cx="17" cy="17" r="3.4" fill="#2a2030"/><circle cx="27" cy="17" r="3.4" fill="#2a2030"/><circle cx="37" cy="17" r="3.4" fill="#2a2030"/>`);
}

function sparkleSVG(): string {
  return wrap(32, 32, `<path d="M16 0 L19 13 L32 16 L19 19 L16 32 L13 19 L0 16 L13 13 Z" fill="#fff3c4"/>`);
}

export interface TextureSpec {
  key: string;
  svg: string;
  width?: number;
  height?: number;
}

/** Every texture the game needs, generated. Call in the browser (uses DOM to serialize SVG). */
export function allTextures(): TextureSpec[] {
  WINDOW_LIGHTS.length = 0;
  const specs: TextureSpec[] = [];
  const builders: Record<Area["id"], (a: Area) => string> = {
    lane: laneSVG,
    street: streetSVG,
    square: squareSVG,
    hill: hillSVG,
    workshop: workshopSVG,
  };
  for (const a of AREAS) specs.push({ key: `area-${a.id}`, svg: builders[a.id](a) });
  specs.push({ key: "far", svg: farSVG() });
  for (const [k, [top, bottom]] of Object.entries(SKIES)) specs.push({ key: `sky-${k}`, svg: skySVG(top, bottom) });
  for (const id of CHARACTER_IDS) {
    for (const e of EXPRESSIONS) specs.push({ key: `char-${id}-${e}`, svg: characterSVG(id, e, false) });
    if (id !== "you") specs.push({ key: `char-${id}-point`, svg: characterSVG(id, "neutral", true) });
  }
  PAPER.forEach((p, i) => specs.push({ key: `lantern-${i}`, svg: lanternSVG(p, false, false) }));
  specs.push({ key: "lantern-torn", svg: lanternSVG(PAPER[5], true, false) });
  specs.push({ key: "lantern-mended", svg: lanternSVG(PAPER[5], true, true) });
  specs.push({ key: "shell", svg: shellSVG() });
  specs.push({ key: "stack", svg: stackSVG() });
  specs.push({ key: "heap", svg: heapSVG() });
  specs.push({ key: "scatter", svg: scatterSVG() });
  specs.push({ key: "candle", svg: candleSVG() });
  specs.push({ key: "teacart", svg: teaCartSVG() });
  specs.push({ key: "bubble", svg: bubbleSVG() });
  specs.push({ key: "sparkle", svg: sparkleSVG() });
  return specs;
}
