// Every image in the game, generated here as SVG. Nothing is pre-made.
// One style throughout: a soft, pastel cottage village in a sunny meadow,
// rounded shapes, no outlines, warm light at night.

import { CHARACTER_IDS, EXPRESSIONS, type CharacterId, type Expression } from "../logic/cast";
import { characterSVG as plushSVG, FEET, type Frame } from "../ui/plush";
import { AREAS, GROUND_Y, HOME_DOOR, HOOKS, POLES, PROPS, SHED_ITEMS, groundY, VIEW_H, type Area } from "./layout";
import { G as HOME_GROUND, homeMarkup } from "./homes";
import { DEFAULT_HOME, type HomeChoice } from "../logic/appearance";

export const PAPER = ["#e9583c", "#f2b54a", "#e98a3c", "#d9473f", "#f0c75e", "#c94f6d"];
const FLAGS = ["#f08a6a", "#f6d36a", "#8fcc76", "#7fc4dc", "#e98fb4"];
const FONT = "Trebuchet MS, Verdana, sans-serif";
// Winter: soft white with blue-grey shadows.
const SNOW = "#fbfdff";
const SNOW_SH = "#dbe5f1";
const SNOW_DEEP = "#c6d4e6";
const ICE = "#dcf0fa";
// Autumn leaves for the mill.
const AUTUMN: [string, string, string][] = [
  ["#e98a3c", "#f2b54a", "#c9573a"],
  ["#d9673a", "#f0a050", "#f6d36a"],
  ["#c99a3a", "#f0d06a", "#e9583c"],
  ["#c9573a", "#e98a5c", "#f2b54a"],
];
const WOOD = "#9b6b43";
const WOOD_DARK = "#7a5340";
const WOOD_LIGHT = "#c98a5e";

const f = (n: number) => Math.round(n * 100) / 100;

export function svgUri(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

const wrap = (w: number, h: number, body: string, viewBox = `0 0 ${w} ${h}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`;

// Deterministic randomness so the village looks the same every time.
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
}

/** Window and lamp glows at night, in world coordinates. Filled in as buildings are drawn. */
export const WINDOW_LIGHTS: { x: number; y: number }[] = [];

/**
 * Builders draw in an area's own coordinates; `ox` is the area's world x, for lights.
 * `snow` draws the winter version; `quiet` skips lights (a second drawing of the same place).
 */
interface Ctx {
  ox: number;
  snow?: boolean;
  quiet?: boolean;
}
const light = (c: Ctx, x: number, y: number) => {
  if (!c.quiet) WINDOW_LIGHTS.push({ x: c.ox + x, y });
};

// --- Small parts ----------------------------------------------------------------

/** Snow resting on a ledge from x to x + w, its underside at y. */
function ledgeSnow(x: number, y: number, w: number, h = 7) {
  return `<path d="M${f(x)} ${f(y)} Q${f(x)} ${f(y - h)} ${f(x + h)} ${f(y - h)} H${f(x + w - h)} Q${f(x + w)} ${f(y - h)} ${f(x + w)} ${f(y)} Z" fill="${SNOW}"/>`;
}

/** Little icicles hanging under an edge. */
function icicles(x0: number, x1: number, y: number, seed: number) {
  const r = rng(seed);
  let s = "";
  for (let x = x0 + 6; x < x1 - 4; x += 11 + r() * 10) {
    const len = 6 + r() * 14;
    s += `<path d="M${f(x - 3)} ${f(y)} L${f(x + 3)} ${f(y)} L${f(x + 0.5)} ${f(y + len)} Z" fill="${ICE}"/>`;
  }
  return s;
}

/** A roof shape. In snow, a white copy sits a little higher so a soft cap shows along the top edges. */
function roof(c: Ctx, d: string, color: string, sw = 0, lift = 11) {
  const attrs = (fill: string) => `d="${d}" fill="${fill}"${sw ? ` stroke="${fill}" stroke-width="${sw}" stroke-linejoin="round"` : ""}`;
  let s = "";
  if (c.snow) s += `<path ${attrs(SNOW)} transform="translate(0 ${-lift})"/><path ${attrs(SNOW_SH)} transform="translate(0 ${f(-lift * 0.3)})"/>`;
  return s + `<path ${attrs(color)}/>`;
}

function chimney(c: Ctx, x: number, y: number, w: number, h: number) {
  let s = `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${f(h)}" rx="5" fill="#b9775a"/>`;
  if (c.snow) s += ledgeSnow(x - 2, y + 4, w + 4, 9);
  return s;
}

function sqWindow(c: Ctx, x: number, y: number, w: number, h: number, shutters?: string) {
  light(c, x + w / 2, y + h / 2);
  let s = "";
  if (shutters) s += `<rect x="${f(x - 12)}" y="${f(y)}" width="10" height="${h}" rx="3" fill="${shutters}"/><rect x="${f(x + w + 2)}" y="${f(y)}" width="10" height="${h}" rx="3" fill="${shutters}"/>`;
  s += `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="6" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(x + w / 2)} ${f(y + 2)} V${f(y + h - 2)} M${f(x + 2)} ${f(y + h / 2)} H${f(x + w - 2)}" stroke="#ffffff" stroke-width="3"/>`;
  if (c.snow) s += ledgeSnow(x - 4, y + h + 3, w + 8) + `<path d="M${f(x + 3)} ${f(y + h - 3)} q5 -9 12 -2 q-5 -1 -12 2 Z" fill="${SNOW}" opacity=".8"/>`;
  return s;
}

function archWindow(c: Ctx, x: number, y: number, w: number, h: number) {
  light(c, x + w / 2, y + h / 2);
  let s = `<path d="M${f(x)} ${f(y + h)} V${f(y + w / 2)} A${w / 2} ${w / 2} 0 0 1 ${f(x + w)} ${f(y + w / 2)} V${f(y + h)} Z" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(x + w / 2)} ${f(y + 3)} V${f(y + h - 2)}" stroke="#ffffff" stroke-width="3"/>`;
  if (c.snow) s += ledgeSnow(x - 4, y + h + 3, w + 8);
  return s;
}

function porthole(c: Ctx, cx: number, cy: number, r: number) {
  light(c, cx, cy);
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(cx - r + 3)} ${f(cy)} H${f(cx + r - 3)} M${f(cx)} ${f(cy - r + 3)} V${f(cy + r - 3)}" stroke="#ffffff" stroke-width="2.5"/>`;
  if (c.snow) s += `<path d="M${f(cx - r - 3)} ${f(cy - r * 0.45)} Q${f(cx - r)} ${f(cy - r - 6)} ${f(cx)} ${f(cy - r - 6)} Q${f(cx + r)} ${f(cy - r - 6)} ${f(cx + r + 3)} ${f(cy - r * 0.45)} Q${f(cx)} ${f(cy - r + 2)} ${f(cx - r - 3)} ${f(cy - r * 0.45)} Z" fill="${SNOW}"/>`;
  return s;
}

function flowerBox(c: Ctx, x: number, y: number, w: number) {
  let s = `<rect x="${f(x - 4)}" y="${y}" width="${w + 8}" height="9" rx="4" fill="#a8674a"/>`;
  if (c.snow) return s + ledgeSnow(x - 5, y + 2, w + 10, 9);
  for (let i = 0; i < 4; i++) s += `<circle cx="${f(x + 3 + (i * (w - 6)) / 3)}" cy="${y - 1}" r="5" fill="${["#f08a6a", "#f6d36a", "#e98fb4", "#f6d36a"][i]}"/>`;
  return s;
}

function roundDoor(cx: number, w: number, color: string) {
  const x = cx - w / 2;
  return `<path d="M${f(x)} ${GROUND_Y + 4} L${f(x)} ${f(GROUND_Y + 4 - w * 0.7)} A${w / 2} ${w / 2} 0 0 1 ${f(x + w)} ${f(GROUND_Y + 4 - w * 0.7)} L${f(x + w)} ${GROUND_Y + 4} Z" fill="${color}"/><circle cx="${f(x + w - 9)}" cy="${GROUND_Y - 20}" r="3" fill="#f6d36a"/>`;
}

function squareDoor(cx: number, w: number, h: number, color: string) {
  return `<rect x="${f(cx - w / 2)}" y="${GROUND_Y + 4 - h}" width="${w}" height="${h}" rx="5" fill="${color}" stroke="#ffffff" stroke-width="3"/><rect x="${f(cx - w / 2 + 6)}" y="${GROUND_Y + 10 - h}" width="${w - 12}" height="${f(h * 0.35)}" rx="3" fill="#ffffff" opacity=".18"/><circle cx="${f(cx + w / 2 - 8)}" cy="${f(GROUND_Y + 4 - h / 2)}" r="3" fill="#f6d36a"/>`;
}

/** A winter tree: bare branches with snow along their tops. */
function bareTree(x: number, base: number, size: number, r: () => number) {
  const trunkTop = base - size * 1.5;
  let s = `<path d="M${x - 9} ${base + 2} Q${x - 6} ${f(base - size * 0.8)} ${x - 4} ${f(trunkTop)} L${x + 4} ${f(trunkTop)} Q${x + 6} ${f(base - size * 0.8)} ${x + 9} ${base + 2} Z" fill="#8a6a52"/>`;
  const branches: string[] = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const y0 = base - size * (0.95 + i * 0.12);
    const x1 = x + side * size * (0.55 + r() * 0.45) * (1 - i * 0.08);
    const y1 = y0 - size * (0.55 + r() * 0.35);
    branches.push(`M${x} ${f(y0)} Q${f((x + x1) / 2)} ${f(y0 - size * 0.08)} ${f(x1)} ${f(y1)}`);
    if (i < 4) {
      const xm = x + (x1 - x) * 0.6;
      const ym = y0 + (y1 - y0) * 0.55;
      branches.push(`M${f(xm)} ${f(ym)} L${f(xm + side * size * 0.12)} ${f(ym - size * 0.3)}`);
    }
  }
  branches.push(`M${x} ${f(trunkTop)} L${f(x + (r() - 0.5) * 8)} ${f(base - size * 2.35)}`);
  const d = branches.join(" ");
  s += `<path d="${d}" fill="none" stroke="#8a6a52" stroke-width="6" stroke-linecap="round"/>`;
  s += `<path d="${d}" fill="none" stroke="${SNOW}" stroke-width="3.2" stroke-linecap="round" transform="translate(0 -3)"/>`;
  s += `<ellipse cx="${x}" cy="${f(trunkTop + 4)}" rx="9" ry="4" fill="${SNOW}"/>`;
  s += `<ellipse cx="${x}" cy="${base + 6}" rx="${f(size * 0.7)}" ry="7" fill="${SNOW_SH}"/>`;
  return s;
}

/** A round tree. In snow, a bare tree; `leaves` gives other colors (autumn by the mill). */
function lollipop(c: Ctx, x: number, base: number, size: number, r: () => number, leaves?: [string, string, string]) {
  if (c.snow) return bareTree(x, base, size, r);
  const [leaf, hi, dot] = leaves ?? ["#6db35f", "#8fcc76", "#f08a6a"];
  let s = `<rect x="${x - 8}" y="${f(base - size * 1.3)}" width="16" height="${f(size * 1.3)}" rx="6" fill="#9b6b43"/><circle cx="${x}" cy="${f(base - size * 1.55)}" r="${size}" fill="${leaf}"/><circle cx="${f(x - size * 0.32)}" cy="${f(base - size * 1.8)}" r="${f(size * 0.42)}" fill="${hi}"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${f(x - size * 0.5 + r() * size)}" cy="${f(base - size * 1.9 + r() * size * 0.9)}" r="4.5" fill="${dot}"/>`;
  return s;
}

function lamppost(c: Ctx, x: number) {
  light(c, x, GROUND_Y - 108);
  let s = `<rect x="${x - 4}" y="${GROUND_Y - 96}" width="8" height="100" rx="3" fill="#6b5a6a"/><path d="M${x - 14} ${GROUND_Y - 120} h28 l-4 22 h-20 Z" fill="#fde6a8" stroke="#6b5a6a" stroke-width="4" stroke-linejoin="round"/><circle cx="${x}" cy="${GROUND_Y - 124}" r="4" fill="#6b5a6a"/>`;
  if (c.snow) s += `<path d="M${x - 19} ${GROUND_Y - 119} Q${x - 18} ${GROUND_Y - 132} ${x} ${GROUND_Y - 133} Q${x + 18} ${GROUND_Y - 132} ${x + 19} ${GROUND_Y - 119} Z" fill="${SNOW}"/>` + icicles(x - 16, x + 16, GROUND_Y - 120, x);
  return s;
}

function sign(x: number, y: number, text: string, snowy = false) {
  const w = text.length * 13 + 36;
  let s = `<rect x="${f(x - w / 2)}" y="${y}" width="${f(w)}" height="32" rx="16" fill="#a8674a"/><text x="${x}" y="${y + 22}" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="bold" fill="#fff6e6" letter-spacing="1">${text}</text>`;
  if (snowy) s += ledgeSnow(x - w / 2 + 8, y + 3, w - 16, 7);
  return s;
}

/** A string of flags tied between two points (eaves, posts), each end on a little hook. */
function bunting(x0: number, y0: number, x1: number, y1: number, sag: number) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + sag * 2;
  let s = `<path d="M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}" fill="none" stroke="#8a6a52" stroke-width="2.5"/>`;
  for (const [hx, hy] of [[x0, y0], [x1, y1]]) s += `<circle cx="${hx}" cy="${hy}" r="4.5" fill="#7a5a44"/>`;
  const n = Math.max(2, Math.floor((x1 - x0) / 34));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    // A point on the same curve as the string, so every flag hangs from it.
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1;
    const yy = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t * t * y1;
    s += `<path d="M${f(x - 10)} ${f(yy)} L${f(x + 10)} ${f(yy)} L${f(x)} ${f(yy + 20)} Z" fill="${FLAGS[i % FLAGS.length]}"/>`;
  }
  return s;
}

/** Market Street's bunting, tied between the shops' eaves. Taken down in chapter two. */
function streetBuntingSVG(): string {
  const y = GROUND_Y;
  // Bakery's right eave to the workshop's left eave, and the workshop's right eave to the townhouse.
  const s = bunting(352, y - 196, 456, y - 204, 10) + bunting(744, y - 204, 846, y - 218, 10);
  return wrap(1000, 400, `<g transform="translate(0 ${400 - GROUND_Y})">${s}</g>`);
}

/** Rows of soft cobbles from just below the ground line down to the bottom. */
function cobbles(w: number, r: () => number, a: string, b: string, hi: string) {
  let s = "";
  for (let row = 0; row < 12; row++) {
    const y = GROUND_Y + 22 + row * 20;
    for (let x = (row % 2) * 22; x < w + 30; x += 44 + r() * 6) {
      s += `<ellipse cx="${f(x)}" cy="${y}" rx="${f(18 + r() * 3)}" ry="7" fill="${r() > 0.5 ? a : b}"/><ellipse cx="${f(x - 3)}" cy="${y - 2}" rx="10" ry="2.5" fill="${hi}" opacity=".7"/>`;
    }
  }
  return s;
}

/** Fresh snow over the ground: a soft white edge, then gentle drifts with blue-grey shade. */
function snowGround(w: number, r: () => number, top = GROUND_Y) {
  let s = `<rect x="0" y="${top - 10}" width="${w}" height="${VIEW_H - top + 10}" fill="#eef3f9"/>`;
  s += `<rect x="0" y="${top - 10}" width="${w}" height="20" fill="${SNOW}"/>`;
  for (let x = 10; x < w; x += 34 + r() * 20) s += `<ellipse cx="${f(x)}" cy="${top - 8}" rx="${f(16 + r() * 10)}" ry="${f(4 + r() * 3)}" fill="${SNOW}"/>`;
  s += `<rect x="0" y="${top + 10}" width="${w}" height="10" fill="${SNOW_SH}" opacity=".55"/>`;
  // Soft, uneven drifts: wide low shadows with a bright crest, bigger toward the front.
  for (let i = 0; i < w / 60; i++) {
    const depth = r();
    const y = top + 34 + depth * 190;
    const rx = (40 + r() * 90) * (0.6 + depth);
    const cx = rx + r() * Math.max(1, w - rx * 2);
    if (cx - rx < 0 || cx + rx > w) continue;
    const ry = 4 + depth * 8;
    s += `<ellipse cx="${f(cx)}" cy="${f(y + ry * 0.6)}" rx="${f(rx)}" ry="${f(ry)}" fill="${SNOW_SH}" opacity=".45"/><ellipse cx="${f(cx - rx * 0.15)}" cy="${f(y - ry * 0.2)}" rx="${f(rx * 0.7)}" ry="${f(ry * 0.55)}" fill="${SNOW}" opacity=".9"/>`;
  }
  return s;
}

/** The street: a flowery grass edge, then a sandy path or soft cobbles. */
function ground(c: Ctx, w: number, seed: number, cobbled: boolean) {
  const r = rng(seed);
  if (c.snow) return snowGround(w, r);
  let s = `<rect x="0" y="${GROUND_Y - 8}" width="${w}" height="18" fill="#9fd07a"/>`;
  for (let i = 0; i < w / 30; i++) s += `<circle cx="${f(r() * w)}" cy="${f(GROUND_Y - 2 + r() * 10)}" r="3.5" fill="${FLAGS[i % FLAGS.length]}"/>`;
  s += `<rect x="0" y="${GROUND_Y + 8}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="${cobbled ? "#ecd3a6" : "#f2d7a2"}"/>`;
  if (cobbled) {
    s += cobbles(w, r, "#e0c08c", "#e6c99a", "#fbecd0");
  } else {
    for (let row = 0; row < 4; row++) {
      const y = GROUND_Y + 48 + row * 44;
      const sz = 22 + row * 7;
      for (let x = (row % 2) * 60 + 20; x < w + 40; x += 120 + row * 20) {
        const cx = x + r() * 20;
        // Big stones cut in half at the edge of an area would draw a hard line where two areas meet.
        if (cx - sz * 1.5 < 0 || cx + sz * 1.5 > w) continue;
        s += `<ellipse cx="${f(cx)}" cy="${y}" rx="${sz * 1.5}" ry="${f(sz * 0.55)}" fill="#e6c38b"/><ellipse cx="${f(cx - 4)}" cy="${y - 3}" rx="${f(sz * 0.9)}" ry="${f(sz * 0.25)}" fill="#f8e6c2" opacity=".7"/>`;
      }
    }
  }
  return s;
}

/** A wall of rounded stones in a rectangle. */
function stoneWall(x: number, y: number, w: number, h: number, seed: number, mortar: string, shades: string[], rowH = 26) {
  const r = rng(seed);
  let s = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${mortar}"/>`;
  for (let yy = y + 2, row = 0; yy < y + h - 2; yy += rowH, row++) {
    let xx = x + 2 - (row % 2) * 22;
    while (xx < x + w - 2) {
      const bw = 38 + r() * 34;
      const x0 = Math.max(xx, x + 2);
      const x1 = Math.min(xx + bw - 4, x + w - 2);
      const hh = Math.min(rowH - 4, y + h - 2 - yy);
      if (x1 - x0 > 6 && hh > 4) s += `<rect x="${f(x0)}" y="${f(yy)}" width="${f(x1 - x0)}" height="${f(hh)}" rx="${f(Math.min(7, hh / 2))}" fill="${shades[Math.floor(r() * shades.length)]}"/>`;
      xx += bw;
    }
  }
  return s;
}

/** Upright wooden planks filling a rectangle. */
function planks(x: number, y: number, w: number, h: number, gap: string, cols: string[], pw = 46) {
  let s = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${gap}"/>`;
  for (let xx = x, i = 0; xx < x + w - 2; xx += pw, i++) s += `<rect x="${f(xx + 1.5)}" y="${f(y)}" width="${f(Math.min(pw - 3, x + w - xx - 1.5))}" height="${f(h)}" rx="3" fill="${cols[i % cols.length]}"/>`;
  return s;
}

/** Floorboards seen from the side: bands with staggered joints. */
function floorboards(w: number, base: string, line: string, seed: number) {
  const r = rng(seed);
  let s = `<rect x="0" y="${GROUND_Y}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="${base}"/>`;
  let y = GROUND_Y;
  for (let row = 0; row < 8; row++) {
    const hh = 18 + row * 6;
    y += hh;
    s += `<rect x="0" y="${y}" width="${w}" height="3" fill="${line}"/>`;
    for (let x = r() * 120; x < w; x += 140 + r() * 140) s += `<rect x="${f(x)}" y="${y - hh}" width="3" height="${hh}" fill="${line}"/>`;
  }
  return s;
}

// --- Houses: five kinds, so the village reads as a place where different people live

interface HouseOpts {
  door?: number;
  doorColor?: string;
}

function gableCottage(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string, o: HouseOpts = {}) {
  const t = GROUND_Y - h;
  const rh = w * 0.45;
  let s = chimney(c, x + w * 0.66, t - rh * 0.8, 22, rh * 0.7);
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="16" fill="${wall}"/>`;
  s += roof(c, `M${x - 14} ${t + 10} L${x + w / 2} ${f(t - rh)} L${x + w + 14} ${t + 10} Z`, roofCol, 18);
  s += `<path d="M${x + 8} ${t - 4} L${x + w / 2 - 8} ${f(t - rh + 18)}" stroke="#ffffff" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"/>`;
  if (c.snow) s += icicles(x - 20, x + w + 20, t + 18, x);
  s += porthole(c, x + w / 2, t - rh * 0.38, 13);
  const door = o.door ?? x + w / 2;
  for (const wx of [x + 22, x + w - 56]) {
    if (Math.abs(wx + 17 - door) < 45) continue;
    s += sqWindow(c, wx, t + 34, 34, 38) + flowerBox(c, wx, t + 74, 34);
  }
  return s + roundDoor(door, 42, o.doorColor ?? "#a8674a");
}

function townhouse(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string) {
  const t = GROUND_Y - h;
  // Walls first, then the roof over them, so the eaves sit in front of the wall.
  let s = `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="8" fill="${wall}"/>`;
  s += roof(c, `M${x - 10} ${t + 6} C${x - 6} ${t - 50} ${f(x + w * 0.2)} ${t - 60} ${x + w / 2} ${t - 74} C${f(x + w * 0.8)} ${t - 60} ${x + w + 6} ${t - 50} ${x + w + 10} ${t + 6} Z`, roofCol);
  s += `<path d="M${x + w / 2} ${t - 74} V${t - 110}" stroke="#7a5a44" stroke-width="3"/><path d="M${x + w / 2} ${t - 110} l26 8 l-26 8 Z" fill="#f6d36a"/>`;
  if (c.snow) s += icicles(x - 6, x + w + 6, t + 4, x + 1);
  for (let i = 0; i < 7; i++) s += `<rect x="${f(x + 10 + ((i * 37) % (w - 30)))}" y="${f(t + 20 + i * 26)}" width="16" height="7" rx="3" fill="#000" opacity=".06"/>`;
  s += archWindow(c, x + w / 2 - 15, t - 46, 30, 40);
  for (const fy of [t + 22, t + 86]) s += sqWindow(c, x + 16, fy, 28, 36, "#7fb0c9") + sqWindow(c, x + w - 44, fy, 28, 36, "#7fb0c9");
  return s + squareDoor(x + w / 2, 36, 58, "#5f8fb0");
}

function bakery(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string) {
  const t = GROUND_Y - h;
  let s = chimney(c, x + w * 0.75, t - 70, 24, 56);
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="12" fill="${wall}"/>`;
  s += roof(c, `M${x - 12} ${t + 8} Q${x - 12} ${t - 62} ${x + w / 2} ${t - 64} Q${x + w + 12} ${t - 62} ${x + w + 12} ${t + 8} Z`, roofCol, 0, 13);
  for (let i = 1; i < 6; i++) {
    const rx = x - 12 + (i * (w + 24)) / 6;
    s += `<path d="M${f(rx)} ${t + 6} Q${f(rx)} ${t - 40} ${f(rx + (i - 3) * 6)} ${t - 56}" stroke="#ffffff" stroke-opacity=".22" stroke-width="5" fill="none"/>`;
  }
  if (c.snow) s += icicles(x - 8, x + w + 8, t + 6, x + 2);
  s += `<rect x="${x + w / 2 - 64}" y="${t + 14}" width="128" height="32" rx="16" fill="#a8674a"/><text x="${x + w / 2}" y="${t + 36}" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="18" fill="#fff6e6" letter-spacing="1">BAKERY</text>`;
  if (c.snow) s += ledgeSnow(x + w / 2 - 56, t + 17, 112, 7);
  const ay = t + 62;
  for (let i = 0; i < 8; i++) s += `<path d="M${f(x + 6 + (i * (w - 12)) / 8)} ${ay} h${f((w - 12) / 8)} v26 q${f(-(w - 12) / 16)} 12 ${f(-(w - 12) / 8)} 0 Z" fill="${i % 2 ? "#ffffff" : "#ef7a6a"}"/>`;
  if (c.snow) s += ledgeSnow(x + 2, ay + 4, w - 4, 9) + icicles(x + 6, x + w - 6, ay + 30, x + 3);
  light(c, x + 18 + w * 0.25, ay + 70);
  s += `<rect x="${x + 18}" y="${ay + 44}" width="${f(w * 0.5)}" height="54" rx="8" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/>`;
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${f(x + 36 + i * w * 0.11)}" cy="${ay + 88}" rx="13" ry="8" fill="${i % 2 ? "#d9984f" : "#c47e3f"}"/>`;
  if (c.snow) s += ledgeSnow(x + 14, ay + 101, w * 0.5 + 8);
  return s + squareDoor(x + w - 50, 42, 66, "#a8674a");
}

function turretCottage(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string) {
  const t = GROUND_Y - h;
  const tx = x + w - 62;
  const tw = 74;
  const tt = t - 60;
  let s = `<rect x="${x}" y="${t}" width="${tx - x + 10}" height="${h + 14}" rx="14" fill="${wall}"/>`;
  s += roof(c, `M${x - 14} ${t + 10} L${x + 30} ${t - 52} L${tx - 10} ${t - 52} L${tx + 10} ${t + 10} Z`, roofCol, 14);
  if (c.snow) s += icicles(x - 18, tx, t + 16, x + 4);
  s += `<rect x="${tx}" y="${tt}" width="${tw}" height="${GROUND_Y - tt + 14}" rx="${tw / 2}" fill="${wall}"/><rect x="${tx}" y="${tt + 30}" width="${tw}" height="${GROUND_Y - tt - 16}" fill="${wall}"/>`;
  s += roof(c, `M${tx - 10} ${tt + 12} L${tx + tw / 2} ${tt - 70} L${tx + tw + 10} ${tt + 12} Z`, "#7a9fd0", 10, 9);
  if (c.snow) s += icicles(tx - 14, tx + tw + 14, tt + 17, x + 5);
  s += `<path d="M${tx + tw / 2} ${tt - 70} V${tt - 96}" stroke="#7a5a44" stroke-width="3"/><path d="M${tx + tw / 2 - 14} ${tt - 92} h28 M${tx + tw / 2 + 10} ${tt - 96} l6 4 l-6 4" stroke="#7a5a44" stroke-width="3" fill="none"/>`;
  s += porthole(c, tx + tw / 2, tt + 34, 14) + archWindow(c, tx + tw / 2 - 14, t + 50, 28, 46);
  s += sqWindow(c, x + 24, t + 36, 40, 40) + flowerBox(c, x + 24, t + 80, 40);
  return s + roundDoor(f(x + (tx - x) * 0.62), 44, "#7a9a5a");
}

function porchHouse(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string) {
  const t = GROUND_Y - h;
  let s = chimney(c, x + w * 0.2, t - 90, 18, 40);
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="12" fill="${wall}"/>`;
  s += roof(c, `M${x - 16} ${t + 10} L${f(x + w * 0.22)} ${t - 60} L${f(x + w * 0.78)} ${t - 60} L${x + w + 16} ${t + 10} Z`, roofCol, 14);
  s += `<rect x="${f(x + w * 0.38)}" y="${t - 52}" width="${f(w * 0.24)}" height="40" rx="6" fill="${wall}"/>`;
  s += roof(c, `M${f(x + w * 0.35)} ${t - 48} L${f(x + w * 0.5)} ${t - 74} L${f(x + w * 0.65)} ${t - 48} Z`, roofCol, 8, 8);
  s += sqWindow(c, x + w * 0.5 - 14, t - 46, 28, 28);
  if (c.snow) s += icicles(x - 20, x + w + 20, t + 16, x + 6);
  for (let yy = t + 14; yy < GROUND_Y - 6; yy += 16) s += `<path d="M${x + 6} ${yy} H${x + w - 6}" stroke="#000" stroke-opacity=".05" stroke-width="2"/>`;
  s += sqWindow(c, x + 22, t + 30, 46, 40, "#c97b6a") + sqWindow(c, x + w - 68, t + 30, 46, 40, "#c97b6a");
  s += roof(c, `M${f(x + w * 0.3)} ${t + 84} H${f(x + w * 0.7)} L${f(x + w * 0.74)} ${t + 98} H${f(x + w * 0.26)} Z`, roofCol, 0, 8);
  if (c.snow) s += icicles(x + w * 0.26, x + w * 0.74, t + 98, x + 7);
  for (const px of [x + w * 0.3, x + w * 0.68]) s += `<rect x="${f(px)}" y="${t + 96}" width="7" height="${GROUND_Y - t - 96}" fill="#ffffff"/>`;
  s += `<rect x="${f(x + w * 0.28)}" y="${GROUND_Y - 2}" width="${f(w * 0.44)}" height="8" rx="3" fill="#c9a37a"/>`;
  return s + squareDoor(x + w / 2, 40, 58, "#c97b6a");
}

/** The lantern workshop: a wide shop with a big arched double door and a lantern sign. */
function workshopFront(c: Ctx, x: number, w: number, h: number, wall: string, roofCol: string, door: number) {
  const t = GROUND_Y - h;
  let s = `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="14" fill="${wall}"/>`;
  s += roof(c, `M${x - 18} ${t + 10} L${x + w / 2} ${f(t - w * 0.32)} L${x + w + 18} ${t + 10} Z`, roofCol, 18);
  if (c.snow) s += icicles(x - 24, x + w + 24, t + 18, x + 8);
  s += `<path d="M${x + 6} ${t + 8} V${GROUND_Y} M${x + w - 6} ${t + 8} V${GROUND_Y}" stroke="#d8b48a" stroke-width="10" stroke-linecap="round"/>`;
  s += archWindow(c, x + 34, t + 44, 46, 64) + archWindow(c, x + w - 80, t + 44, 46, 64);
  s += sign(x + w / 2, t + 8, "LANTERNS", c.snow);
  // A paper lantern hanging from a bracket
  s += `<path d="M${x + w - 20} ${t + 60} h34 v10" stroke="#7a5a44" stroke-width="4" fill="none"/><rect x="${x + w + 2}" y="${t + 70}" width="24" height="30" rx="10" fill="${PAPER[1]}"/>`;
  if (c.snow) s += ledgeSnow(x + w - 22, t + 59, 38, 5);
  light(c, x + w + 14, t + 85);
  // Big arched double door
  s += `<path d="M${door - 34} ${GROUND_Y + 4} V${GROUND_Y - 56} A34 34 0 0 1 ${door + 34} ${GROUND_Y - 56} V${GROUND_Y + 4} Z" fill="#8a5a3a"/><path d="M${door} ${GROUND_Y - 88} V${GROUND_Y + 4}" stroke="#6b4430" stroke-width="3"/><circle cx="${door - 8}" cy="${GROUND_Y - 34}" r="3" fill="#f6d36a"/><circle cx="${door + 8}" cy="${GROUND_Y - 34}" r="3" fill="#f6d36a"/>`;
  return s;
}

// --- Areas ------------------------------------------------------------------------

/** The player's home on Lantern Lane. Set from the title screen and at save points. */
let playerHome: HomeChoice = DEFAULT_HOME;
export function setPlayerHome(home: HomeChoice): void {
  playerHome = home;
}

/** Home units to lane pixels: a little bigger than the panels, a starter home beside taller neighbors. */
const HOME_SCALE = 1.15;

function yourHouse(c: Ctx): string {
  // Draw once to find the door, then place it so the door lands on HOME_DOOR.
  const at = homeMarkup(playerHome, { gardenInFront: true }).door;
  const ox = HOME_DOOR - at * HOME_SCALE;
  const oy = GROUND_Y - HOME_GROUND * HOME_SCALE;
  const { svg } = homeMarkup(playerHome, {
    gardenInFront: true,
    snow: c.snow,
    light: (x, y) => light(c, ox + x * HOME_SCALE, oy + y * HOME_SCALE),
  });
  return `<g transform="translate(${f(ox)} ${f(oy)}) scale(${HOME_SCALE})">${svg}</g>`;
}

/** Lantern Lane again after your home changes, and its window lights. */
export function laneTextures(): TextureSpec[] {
  const lane = AREAS.find((a) => a.id === "lane")!;
  for (let i = WINDOW_LIGHTS.length - 1; i >= 0; i--) if (WINDOW_LIGHTS[i].x >= lane.x0 && WINDOW_LIGHTS[i].x < lane.x1) WINDOW_LIGHTS.splice(i, 1);
  return [{ key: "area-lane", svg: laneSVG(lane) }, { key: "area-lane-snow", svg: laneSVG(lane, true) }];
}

function laneSVG(a: Area, snowy = false): string {
  const c: Ctx = { ox: a.x0, snow: snowy, quiet: snowy };
  const w = a.x1 - a.x0;
  const r = rng(11);
  let s = lollipop(c, 60, GROUND_Y, 40, r) + lollipop(c, 1030, GROUND_Y, 36, r);
  // Nell's cottage: someone painted her door yellow one spring, long ago. Her step is out front.
  s += gableCottage(c, 150, 250, 190, "#fff1d6", "#e57b5f", { door: 300, doorColor: "#f2c43a" });
  s += `<rect x="260" y="${GROUND_Y - 6}" width="100" height="14" rx="5" fill="#d8c4a8"/>`;
  s += townhouse(c, 440, 130, 236, "#dcefe1", "#6fa7c9");
  // Your house, the one you chose, with its front door at x 740. Its plot runs to the
  // tree at the end of the lane, so there's room for it to grow.
  s += yourHouse(c);
  s += lamppost(c, 415);
  s += sign(300, GROUND_Y - 372, "LANTERN LANE", snowy);
  s += ground(c, w, 3, false);
  return wrap(w, VIEW_H, s);
}

function streetSVG(a: Area, snowy = false): string {
  const c: Ctx = { ox: a.x0, snow: snowy, quiet: snowy };
  const w = a.x1 - a.x0;
  const r = rng(23);
  let s = lollipop(c, 410, GROUND_Y, 34, r);
  s += bakery(c, 30, 320, 200, "#ffe1d4", "#8bbf74");
  // The workshop door is at world x 1650 (local 600).
  s += workshopFront(c, 470, 260, 210, "#fde6a8", "#b986c9", 600);
  s += townhouse(c, 850, 130, 220, "#e3ecf7", "#e57b5f");
  s += lamppost(c, 380) + lamppost(c, 810);
  s += ground(c, w, 29, false);
  return wrap(w, VIEW_H, s);
}

function squareSVG(a: Area, snowy = false): string {
  const c: Ctx = { ox: a.x0, snow: snowy, quiet: snowy };
  const w = a.x1 - a.x0;
  const lx = (x: number) => x - a.x0;
  const r = rng(37);
  let s = lollipop(c, 30, GROUND_Y, 40, r) + lollipop(c, 1120, GROUND_Y, 42, r);
  // Houses stand to either side so the fountain has open sky behind it.
  s += gableCottage(c, 150, 190, 170, "#ffe1d4", "#e57b5f");
  s += porchHouse(c, 680, 200, 150, "#fff1d6", "#8bbf74");
  s += turretCottage(c, 905, 225, 170, "#e3ecf7", "#b986c9");
  // Lantern poles and the string between them
  for (const p of POLES) {
    s += `<rect x="${lx(p) - 7}" y="${GROUND_Y - 370}" width="14" height="374" rx="6" fill="#b98a5e"/><circle cx="${lx(p)}" cy="${GROUND_Y - 372}" r="10" fill="#9b6b43"/>`;
    if (snowy) s += `<path d="M${lx(p) - 12} ${GROUND_Y - 372} Q${lx(p) - 11} ${GROUND_Y - 388} ${lx(p)} ${GROUND_Y - 388} Q${lx(p) + 11} ${GROUND_Y - 388} ${lx(p) + 12} ${GROUND_Y - 372} Z" fill="${SNOW}"/>`;
  }
  const hookPath = HOOKS.map((h) => `L${f(lx(h.x))} ${f(h.y)}`).join(" ");
  s += `<path d="M${lx(POLES[0])} ${GROUND_Y - 364} ${hookPath} L${lx(POLES[1])} ${GROUND_Y - 364}" fill="none" stroke="#8a6a52" stroke-width="2.5"/>`;
  // Fountain: a round pastel basin with a little tiered top
  const fx = 500;
  s += `<ellipse cx="${fx}" cy="${GROUND_Y + 4}" rx="152" ry="16" fill="#000" opacity=".08"/>`;
  s += `<path d="M${fx - 140} ${GROUND_Y + 2} Q${fx - 140} ${GROUND_Y - 58} ${fx - 120} ${GROUND_Y - 58} H${fx + 120} Q${fx + 140} ${GROUND_Y - 58} ${fx + 140} ${GROUND_Y + 2} Z" fill="#e8e2f0"/>`;
  s += `<rect x="${fx - 146}" y="${GROUND_Y - 66}" width="292" height="16" rx="8" fill="#f6f2fa"/><rect x="${fx - 124}" y="${GROUND_Y - 52}" width="248" height="10" rx="5" fill="${snowy ? "#d8ecf5" : "#9fd6ea"}"/>`;
  s += `<rect x="${fx - 16}" y="${GROUND_Y - 168}" width="32" height="104" rx="14" fill="#e8e2f0"/>`;
  s += `<path d="M${fx - 64} ${GROUND_Y - 166} Q${fx} ${GROUND_Y - 132} ${fx + 64} ${GROUND_Y - 166} Z" fill="#f6f2fa"/><circle cx="${fx}" cy="${GROUND_Y - 190}" r="18" fill="#e8e2f0"/>`;
  if (snowy) {
    // Frozen still: snow on the rim and the tiers, icicles where the water used to spill.
    s += ledgeSnow(fx - 148, GROUND_Y - 62, 296, 10) + ledgeSnow(fx - 68, GROUND_Y - 163, 136, 8);
    s += `<path d="M${fx - 18} ${GROUND_Y - 194} Q${fx - 18} ${GROUND_Y - 214} ${fx} ${GROUND_Y - 214} Q${fx + 18} ${GROUND_Y - 214} ${fx + 18} ${GROUND_Y - 194} Z" fill="${SNOW}"/>`;
    s += icicles(fx - 62, fx + 62, GROUND_Y - 160, 77) + icicles(fx - 140, fx + 140, GROUND_Y - 50, 78);
  } else {
    s += `<path d="M${fx - 10} ${GROUND_Y - 196} Q${fx - 60} ${GROUND_Y - 226} ${fx - 72} ${GROUND_Y - 166} M${fx + 10} ${GROUND_Y - 196} Q${fx + 60} ${GROUND_Y - 226} ${fx + 72} ${GROUND_Y - 166}" fill="none" stroke="#9fd6ea" stroke-width="6" stroke-linecap="round" opacity=".9"/>`;
  }
  // Benches
  for (const bx of [270, 760]) {
    s += `<rect x="${bx - 50}" y="${GROUND_Y - 34}" width="100" height="12" rx="6" fill="#c98a5e"/><rect x="${bx - 42}" y="${GROUND_Y - 24}" width="8" height="26" rx="3" fill="#9b6b43"/><rect x="${bx + 34}" y="${GROUND_Y - 24}" width="8" height="26" rx="3" fill="#9b6b43"/>`;
    if (snowy) s += ledgeSnow(bx - 52, GROUND_Y - 30, 104, 10);
  }
  // The cart at the edge of the square
  const cx = lx(3080);
  s += `<rect x="${cx - 60}" y="${GROUND_Y - 62}" width="120" height="40" rx="10" fill="#c98a5e"/><path d="M${cx + 60} ${GROUND_Y - 48} l46 -22" stroke="#9b6b43" stroke-width="6" stroke-linecap="round"/>`;
  if (snowy) s += ledgeSnow(cx - 62, GROUND_Y - 58, 124, 14);
  s += `<circle cx="${cx - 34}" cy="${GROUND_Y - 16}" r="17" fill="#7a5a44"/><circle cx="${cx - 34}" cy="${GROUND_Y - 16}" r="6" fill="#c98a5e"/><circle cx="${cx + 34}" cy="${GROUND_Y - 16}" r="17" fill="#7a5a44"/><circle cx="${cx + 34}" cy="${GROUND_Y - 16}" r="6" fill="#c98a5e"/>`;
  s += lamppost(c, lx(2120)) + lamppost(c, lx(3000));
  s += ground(c, w, 41, true);
  if (!snowy) {
    // Market Street's paving fades into the square's cobbles, instead of stopping in a straight line.
    s += `<defs><linearGradient id="pave-fade"><stop offset="0" stop-color="#f2d7a2"/><stop offset="1" stop-color="#f2d7a2" stop-opacity="0"/></linearGradient></defs><rect x="0" y="${GROUND_Y + 8}" width="220" height="${VIEW_H - GROUND_Y}" fill="url(#pave-fade)"/>`;
    // The loose cobblestone, tipped up by the fountain
    s += `<ellipse cx="${lx(2470)}" cy="${GROUND_Y + 12}" rx="18" ry="8" fill="#d8b582" transform="rotate(-14 ${lx(2470)} ${GROUND_Y + 12})"/><ellipse cx="${lx(2470) - 3}" cy="${GROUND_Y + 9}" rx="9" ry="3" fill="#fbecd0" transform="rotate(-14 ${lx(2470)} ${GROUND_Y + 12})"/>`;
  }
  return wrap(w, VIEW_H, s);
}

function hillSVG(a: Area, snowy = false): string {
  const c: Ctx = { ox: a.x0, snow: snowy, quiet: snowy };
  const w = a.x1 - a.x0;
  const r = rng(29);
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 20) pts.push(`${x} ${f(groundY(a.x0 + x))}`);
  let s = lollipop(c, 240, groundY(a.x0 + 240), 40, r) + lollipop(c, 560, groundY(a.x0 + 560), 46, r) + lollipop(c, 1150, groundY(a.x0 + 1150), 40, r);
  // A soft rock with the hollow in it
  const hx = 1000;
  const gy = groundY(a.x0 + hx);
  s += roof(c, `M${hx - 190} ${gy + 4} Q${hx - 180} ${gy - 220} ${hx - 10} ${gy - 232} Q${hx + 170} ${gy - 220} ${hx + 196} ${gy + 4} Z`, "#d6cbd9", 0, 14);
  s += `<path d="M${hx - 140} ${gy - 130} Q${hx - 60} ${gy - 190} ${hx + 50} ${gy - 168}" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/>`;
  s += `<path d="M${hx - 74} ${gy + 4} Q${hx - 80} ${gy - 124} ${hx} ${gy - 130} Q${hx + 80} ${gy - 124} ${hx + 74} ${gy + 4} Z" fill="#4a3f52"/>`;
  s += `<path d="M${hx - 58} ${gy + 2} Q${hx - 62} ${gy - 100} ${hx} ${gy - 108}" fill="none" stroke="#5e5268" stroke-width="7"/>`;
  if (snowy) {
    for (let i = 0; i < 8; i++) s += `<circle cx="${hx - 90 + i * 26}" cy="${gy - 134 + (i % 2) * 7}" r="11" fill="${[SNOW, SNOW_SH][i % 2]}"/>`;
    s += icicles(hx - 70, hx + 70, gy - 126, 91);
  } else {
    for (let i = 0; i < 8; i++) s += `<circle cx="${hx - 90 + i * 26}" cy="${gy - 134 + (i % 2) * 7}" r="10" fill="${["#8fcc76", "#6db35f"][i % 2]}"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${hx - 70 + i * 34}" cy="${gy - 144 + (i % 2) * 6}" r="4" fill="${FLAGS[i]}"/>`;
  }
  // Grass, or snow
  s += `<path d="M0 ${VIEW_H} L${pts.join(" L")} L${w} ${VIEW_H} Z" fill="${snowy ? "#eef3f9" : "#9fd07a"}"/>`;
  s += `<path d="M${pts.join(" L")}" fill="none" stroke="${snowy ? SNOW : "#8cc26a"}" stroke-width="${snowy ? 18 : 10}"/>`;
  if (snowy) {
    s += `<path d="M${pts.join(" L")}" fill="none" stroke="${SNOW_SH}" stroke-width="8" stroke-opacity=".55" transform="translate(0 16)"/>`;
    for (let i = 0; i < 26; i++) {
      const x = 40 + r() * (w - 80);
      const y = groundY(a.x0 + x) + 40 + r() * 150;
      if (y > VIEW_H - 10) continue;
      s += `<ellipse cx="${f(x)}" cy="${f(y + 4)}" rx="${f(40 + r() * 30)}" ry="9" fill="${SNOW_SH}" opacity=".6"/><ellipse cx="${f(x - 6)}" cy="${f(y - 1)}" rx="34" ry="6" fill="${SNOW}"/>`;
    }
    return wrap(w, VIEW_H, s);
  }
  // The square's cobbles run on a little way and fade into the grass, instead of stopping in a straight line.
  s += `<path d="M0 ${GROUND_Y + 8} C90 ${GROUND_Y + 14} 170 ${GROUND_Y + 70} 260 ${VIEW_H} L0 ${VIEW_H} Z" fill="#ecd3a6"/>`;
  for (let row = 0; row < 11; row++) {
    const y = GROUND_Y + 22 + row * 20;
    const reach = 40 + row * 20;
    for (let x = (row % 2) * 22; x < reach; x += 44) s += `<ellipse cx="${x}" cy="${y}" rx="18" ry="7" fill="${(row + x) % 3 ? "#e0c08c" : "#e6c99a"}"/>`;
  }
  for (let x = 40; x < hx - 60; x += 70) s += `<ellipse cx="${x}" cy="${f(groundY(a.x0 + x) + 12)}" rx="22" ry="7" fill="#f2d7a2"/>`;
  for (let i = 0; i < 50; i++) {
    const x = r() * w;
    s += `<circle cx="${f(x)}" cy="${f(groundY(a.x0 + x) + 10 + r() * 60)}" r="3.5" fill="${FLAGS[i % FLAGS.length]}"/>`;
  }
  return wrap(w, VIEW_H, s);
}

function workshopSVG(a: Area): string {
  const w = a.x1 - a.x0;
  // The room is 800 wide in the middle of a wider strip; the rest is wall in shadow.
  const pad = (w - 800) / 2;
  const c: Ctx = { ox: a.x0 + pad };
  let s = `<rect width="800" height="${VIEW_H}" fill="#f6e3c4"/>`;
  for (let x = 0; x < 800; x += 50) s += `<rect x="${x}" y="0" width="48" height="${GROUND_Y}" rx="4" fill="${x % 100 ? "#f2dcba" : "#f6e3c4"}"/>`;
  s += `<rect x="0" y="${GROUND_Y}" width="800" height="${VIEW_H - GROUND_Y}" fill="#d9a77c"/>`;
  for (let x = 0; x < 800; x += 80) s += `<rect x="${x}" y="${GROUND_Y}" width="3" height="${VIEW_H - GROUND_Y}" fill="#c9966b"/>`;
  for (const sy of [GROUND_Y - 400, GROUND_Y - 280]) {
    s += `<rect x="300" y="${sy}" width="440" height="14" rx="6" fill="#b98a5e"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${314 + i * 48}" y="${sy - 38}" width="28" height="36" rx="12" fill="${PAPER[(i + sy) % PAPER.length]}"/>`;
  }
  s += sqWindow(c, 60, GROUND_Y - 420, 140, 150);
  s += squareDoor(130, 60, 120, "#a8674a");
  s += `<rect x="360" y="${GROUND_Y - 80}" width="260" height="18" rx="8" fill="#c98a5e"/><rect x="374" y="${GROUND_Y - 64}" width="14" height="66" rx="4" fill="#9b6b43"/><rect x="592" y="${GROUND_Y - 64}" width="14" height="66" rx="4" fill="#9b6b43"/>`;
  return wrap(w, VIEW_H, `<rect width="${w}" height="${VIEW_H}" fill="#7a5c4c"/><g transform="translate(${pad} 0)">${s}</g>`);
}

// --- Furniture and small things used in the new rooms ----------------------------

/** A teapot sitting with its bottom at y. */
function teapot(cx: number, by: number, r: number, col: string) {
  const cy = by - r * 0.78;
  let s = `<path d="M${f(cx + r * 0.7)} ${f(cy + r * 0.1)} Q${f(cx + r * 1.25)} ${f(cy)} ${f(cx + r * 1.45)} ${f(cy - r * 0.6)} L${f(cx + r * 1.6)} ${f(cy - r * 0.56)} Q${f(cx + r * 1.35)} ${f(cy + r * 0.5)} ${f(cx + r * 0.6)} ${f(cy + r * 0.55)} Z" fill="${col}"/>`;
  s += `<path d="M${f(cx - r * 0.75)} ${f(cy - r * 0.4)} C${f(cx - r * 1.5)} ${f(cy - r * 0.5)} ${f(cx - r * 1.5)} ${f(cy + r * 0.5)} ${f(cx - r * 0.7)} ${f(cy + r * 0.4)}" fill="none" stroke="${col}" stroke-width="${f(r * 0.2)}" stroke-linecap="round"/>`;
  s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * 0.78)}" fill="${col}"/><rect x="${f(cx - r * 0.6)}" y="${f(by - r * 0.2)}" width="${f(r * 1.2)}" height="${f(r * 0.2)}" rx="2" fill="${col}"/>`;
  s += `<ellipse cx="${f(cx)}" cy="${f(cy - r * 0.72)}" rx="${f(r * 0.48)}" ry="${f(r * 0.16)}" fill="#ffffff" opacity=".35"/><circle cx="${f(cx)}" cy="${f(cy - r * 0.92)}" r="${f(r * 0.15)}" fill="${col}"/>`;
  s += `<ellipse cx="${f(cx - r * 0.38)}" cy="${f(cy - r * 0.28)}" rx="${f(r * 0.22)}" ry="${f(r * 0.12)}" fill="#ffffff" opacity=".45"/>`;
  return s;
}

/** A teacup sitting with its bottom at y. */
function cup(cx: number, by: number, w: number, h: number, col: string, band?: string) {
  let s = `<path d="M${f(cx + w * 0.4)} ${f(by - h * 0.85)} q${f(w * 0.45)} 0 ${f(w * 0.3)} ${f(h * 0.45)} q${f(-w * 0.08)} ${f(h * 0.25)} ${f(-w * 0.38)} ${f(h * 0.25)}" fill="none" stroke="${col}" stroke-width="2.6"/>`;
  s += `<path d="M${f(cx - w / 2)} ${f(by - h)} H${f(cx + w / 2)} L${f(cx + w * 0.36)} ${f(by - 1)} Q${f(cx)} ${f(by + 1.5)} ${f(cx - w * 0.36)} ${f(by - 1)} Z" fill="${col}"/>`;
  if (band) s += `<rect x="${f(cx - w * 0.45)}" y="${f(by - h * 0.72)}" width="${f(w * 0.9)}" height="${f(Math.max(2, h * 0.16))}" fill="${band}"/>`;
  s += `<ellipse cx="${f(cx)}" cy="${f(by - h)}" rx="${f(w / 2)}" ry="1.6" fill="#ffffff" opacity=".5"/>`;
  return s;
}

function steam(x: number, y: number, h = 22) {
  return `<path d="M${f(x)} ${f(y)} q-5 ${f(-h * 0.25)} 0 ${f(-h * 0.5)} q5 ${f(-h * 0.25)} 0 ${f(-h * 0.5)}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
}

/** A round cafe table whose top is at y `top`. */
function cafeTable(x: number, top: number, rx: number, col: string) {
  return `<rect x="${x - rx}" y="${top}" width="${rx * 2}" height="10" rx="5" fill="${col}"/><rect x="${x - rx + 6}" y="${top + 9}" width="${rx * 2 - 12}" height="4" rx="2" fill="#000" opacity=".12"/>` +
    `<rect x="${x - 5}" y="${top + 10}" width="10" height="${GROUND_Y - top - 12}" fill="${WOOD_DARK}"/><ellipse cx="${x}" cy="${GROUND_Y}" rx="26" ry="6" fill="${WOOD_DARK}"/>`;
}

/** A chair seen from the side; `face` is the way a sitter would face (+1 right, -1 left). */
function chair(x: number, face: 1 | -1, col: string, style: number) {
  const seat = GROUND_Y - 46;
  const bx = x - face * 17;
  let s = `<rect x="${x - 20}" y="${seat}" width="40" height="8" rx="3" fill="${col}"/>`;
  s += `<rect x="${x - 18}" y="${seat + 6}" width="5" height="${GROUND_Y - seat - 4}" rx="2" fill="${col}"/><rect x="${x + 13}" y="${seat + 6}" width="5" height="${GROUND_Y - seat - 4}" rx="2" fill="${col}"/>`;
  if (style === 0) {
    // Ladder back
    s += `<rect x="${bx - 3}" y="${seat - 62}" width="6" height="64" rx="3" fill="${col}"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${bx - 5}" y="${seat - 56 + i * 18}" width="10" height="5" rx="2" fill="${col}"/>`;
  } else if (style === 1) {
    // Round spindle back
    s += `<path d="M${bx} ${seat + 2} V${seat - 40} Q${bx} ${seat - 58} ${bx + face * 6} ${seat - 58}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/><circle cx="${bx}" cy="${seat - 46}" r="9" fill="${col}"/>`;
  } else {
    // A padded back, a little worn
    s += `<rect x="${bx - 4}" y="${seat - 50}" width="8" height="52" rx="3" fill="${col}"/><rect x="${bx - 7}" y="${seat - 54}" width="14" height="30" rx="6" fill="${col}"/><rect x="${bx - 4}" y="${seat - 50}" width="8" height="22" rx="4" fill="#ffffff" opacity=".18"/>`;
  }
  return s;
}

// --- Chapter five: inside your house, a winter night -------------------------------

function homeSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(53);
  // Warm plank walls, a darker wainscot, beams across the ceiling.
  let s = planks(0, 0, w, GROUND_Y, "#d9b285", ["#ebcb9f", "#e6c496", "#efd2a8"], 44);
  s += `<rect x="0" y="${GROUND_Y - 112}" width="${w}" height="112" fill="#c99a6c"/>`;
  for (let x = 0; x < w; x += 64) s += `<rect x="${x + 6}" y="${GROUND_Y - 100}" width="52" height="88" rx="6" fill="#d4a87a"/>`;
  s += `<rect x="0" y="${GROUND_Y - 118}" width="${w}" height="10" rx="4" fill="${WOOD}"/>`;
  s += `<rect x="0" y="0" width="${w}" height="40" fill="${WOOD_DARK}"/><rect x="0" y="34" width="${w}" height="8" fill="#000" opacity=".1"/>`;
  for (const bx of [10, 540, 1180]) s += `<rect x="${bx}" y="0" width="22" height="${GROUND_Y}" fill="${WOOD}"/><rect x="${bx + 3}" y="0" width="5" height="${GROUND_Y}" fill="#ffffff" opacity=".12"/>`;
  s += floorboards(w, "#c98a5e", "#b37a52", 54);
  s += `<rect x="0" y="${GROUND_Y - 6}" width="${w}" height="10" fill="${WOOD_DARK}"/>`;

  // Front door at local 70, with a mat and a little snow blown in.
  s += `<rect x="30" y="${GROUND_Y - 140}" width="80" height="144" rx="6" fill="${WOOD_DARK}"/>`;
  s += squareDoor(70, 62, 130, "#a8674a");
  s += `<rect x="54" y="${GROUND_Y - 110}" width="32" height="24" rx="5" fill="#bfe3ef" stroke="#ffffff" stroke-width="3"/>`;
  s += `<rect x="30" y="${GROUND_Y + 8}" width="84" height="12" rx="5" fill="#8fae6a"/><ellipse cx="44" cy="${GROUND_Y + 6}" rx="16" ry="4" fill="${SNOW}" opacity=".9"/>`;

  // Coat hooks with a scarf and your satchel, between the door and the hearth.
  s += `<rect x="114" y="${GROUND_Y - 206}" width="52" height="10" rx="4" fill="${WOOD}"/>`;
  for (const hx of [124, 154]) s += `<rect x="${hx - 3}" y="${GROUND_Y - 200}" width="6" height="14" rx="3" fill="${WOOD_DARK}"/>`;
  s += `<path d="M120 ${GROUND_Y - 190} Q113 ${GROUND_Y - 140} 118 ${GROUND_Y - 104} L130 ${GROUND_Y - 104} Q132 ${GROUND_Y - 150} 130 ${GROUND_Y - 190} Z" fill="#7fb0c9"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="117" y="${GROUND_Y - 176 + i * 22}" width="14" height="6" fill="#e3ecf7" opacity=".8"/>`;
  s += `<path d="M150 ${GROUND_Y - 192} Q142 ${GROUND_Y - 166} 144 ${GROUND_Y - 154} M158 ${GROUND_Y - 192} Q166 ${GROUND_Y - 166} 164 ${GROUND_Y - 154}" fill="none" stroke="#8a5a3a" stroke-width="4"/>`;
  s += `<rect x="136" y="${GROUND_Y - 160}" width="32" height="34" rx="8" fill="#a8674a"/><path d="M136 ${GROUND_Y - 155} H168 V${GROUND_Y - 140} Q152 ${GROUND_Y - 133} 136 ${GROUND_Y - 140} Z" fill="#8a5a3a"/><rect x="148" y="${GROUND_Y - 141}" width="8" height="7" rx="2" fill="#f6d36a"/>`;
  // A basket of logs by the stove
  s += `<rect x="120" y="${GROUND_Y - 30}" width="44" height="32" rx="8" fill="#c9a37a"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${129 + i * 13}" cy="${GROUND_Y - 34}" r="7" fill="#9b6b43"/><circle cx="${129 + i * 13}" cy="${GROUND_Y - 34}" r="3" fill="#d9b285"/>`;

  // The woodstove at local 240, on a tiled hearth, its pipe up to the ceiling.
  s += `<rect x="168" y="${GROUND_Y - 214}" width="146" height="214" rx="12" fill="#d98a6a"/>`;
  for (let ty = GROUND_Y - 206; ty < GROUND_Y - 8; ty += 22) for (let tx = 174; tx < 306; tx += 22) s += `<rect x="${tx}" y="${ty}" width="19" height="19" rx="4" fill="${(tx + ty) % 44 ? "#e59a78" : "#e9a888"}"/>`;
  s += `<rect x="160" y="${GROUND_Y - 4}" width="162" height="14" rx="5" fill="#b7a8a0"/>`;
  s += `<rect x="229" y="40" width="22" height="${GROUND_Y - 176}" fill="#3a3340"/><rect x="225" y="190" width="30" height="8" rx="3" fill="#2e2834"/><rect x="225" y="${GROUND_Y - 150}" width="30" height="10" rx="3" fill="#2e2834"/>`;
  s += `<rect x="192" y="${GROUND_Y - 20}" width="10" height="22" rx="3" fill="#2e2834"/><rect x="278" y="${GROUND_Y - 20}" width="10" height="22" rx="3" fill="#2e2834"/>`;
  s += `<rect x="184" y="${GROUND_Y - 130}" width="112" height="112" rx="16" fill="#4a4250"/><rect x="178" y="${GROUND_Y - 140}" width="124" height="14" rx="5" fill="#3a3340"/>`;
  s += `<rect x="190" y="${GROUND_Y - 124}" width="20" height="96" rx="8" fill="#ffffff" opacity=".07"/>`;
  // The door opening, dark until the fire is lit (the fire is its own picture).
  s += `<path d="M210 ${GROUND_Y - 32} V${GROUND_Y - 70} A30 30 0 0 1 270 ${GROUND_Y - 70} V${GROUND_Y - 32} Z" fill="#5a4a50"/><path d="M215 ${GROUND_Y - 35} V${GROUND_Y - 70} A25 25 0 0 1 265 ${GROUND_Y - 70} V${GROUND_Y - 35} Z" fill="#1e1820"/>`;
  s += `<path d="M270 ${GROUND_Y - 32} L284 ${GROUND_Y - 40} L284 ${GROUND_Y - 92} L270 ${GROUND_Y - 100} Z" fill="#3a3340"/><circle cx="279" cy="${GROUND_Y - 66}" r="3" fill="#b9a497"/>`;
  s += `<path d="M216 ${GROUND_Y - 112} h48" stroke="#2e2834" stroke-width="4" stroke-linecap="round"/>`;

  // Kitchen counter at local 400 with the kettle, shelves above, and the chipped teacup.
  s += `<rect x="342" y="${GROUND_Y - 82}" width="126" height="84" rx="4" fill="#b07a50"/>`;
  for (const dx of [348, 408]) s += `<rect x="${dx}" y="${GROUND_Y - 74}" width="54" height="68" rx="5" fill="#bf8a5e"/><circle cx="${dx + (dx === 348 ? 46 : 8)}" cy="${GROUND_Y - 42}" r="3" fill="#f6d36a"/>`;
  s += `<rect x="334" y="${GROUND_Y - 92}" width="142" height="12" rx="4" fill="${WOOD_LIGHT}"/>`;
  // The kettle
  s += `<path d="M380 ${GROUND_Y - 112} Q362 ${GROUND_Y - 118} 360 ${GROUND_Y - 130} L366 ${GROUND_Y - 131} Q370 ${GROUND_Y - 120} 384 ${GROUND_Y - 118} Z" fill="#e57b5f"/>`;
  s += `<path d="M380 ${GROUND_Y - 92} Q376 ${GROUND_Y - 132} 400 ${GROUND_Y - 132} Q424 ${GROUND_Y - 132} 420 ${GROUND_Y - 92} Z" fill="#e57b5f"/>`;
  s += `<path d="M386 ${GROUND_Y - 130} Q400 ${GROUND_Y - 156} 414 ${GROUND_Y - 130}" fill="none" stroke="#3a3340" stroke-width="4" stroke-linecap="round"/><circle cx="400" cy="${GROUND_Y - 135}" r="4" fill="#3a3340"/>`;
  s += `<ellipse cx="390" cy="${GROUND_Y - 116}" rx="5" ry="9" fill="#ffffff" opacity=".35"/>`;
  // Jars and a plate on the counter
  s += `<rect x="434" y="${GROUND_Y - 118}" width="22" height="26" rx="6" fill="#cfe3ec" opacity=".85"/><rect x="434" y="${GROUND_Y - 122}" width="22" height="6" rx="2" fill="#c97b6a"/>`;
  // Two wall shelves
  for (const sy of [GROUND_Y - 214, GROUND_Y - 286]) s += `<rect x="340" y="${sy}" width="130" height="10" rx="4" fill="${WOOD}"/><path d="M352 ${sy + 10} l0 14 l12 -14 Z M458 ${sy + 10} l0 14 l-12 -14 Z" fill="${WOOD_DARK}"/>`;
  s += `<ellipse cx="362" cy="${GROUND_Y - 236}" rx="4" ry="22" fill="#f6efe2"/><ellipse cx="370" cy="${GROUND_Y - 236}" rx="4" ry="22" fill="#e3ecf7"/>`;
  s += `<rect x="384" y="${GROUND_Y - 244}" width="18" height="30" rx="5" fill="#f6d36a"/><rect x="408" y="${GROUND_Y - 238}" width="18" height="24" rx="5" fill="#8fcc76"/>`;
  // The chipped teacup and its saucer.
  s += `<ellipse cx="448" cy="${GROUND_Y - 216}" rx="15" ry="3" fill="#e3ecf7"/>`;
  s += cup(448, GROUND_Y - 217, 20, 17, "#f6efe2", "#7fc4dc");
  s += `<path d="M440 ${GROUND_Y - 234.5} l3 5 l4 -5 Z" fill="${WOOD}"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${352 + i * 28}" y="${GROUND_Y - 314}" width="20" height="${22 + (i % 2) * 6}" rx="6" fill="${["#c97b6a", "#cfe3ec", "#f2b54a", "#b986c9"][i]}"/>`;
  // Dried herbs hanging from the beam
  for (const hx of [366, 404, 442]) s += `<path d="M${hx} 40 V62" stroke="#8a6a52" stroke-width="2"/><path d="M${hx - 8} 62 Q${hx} 96 ${hx + 8} 62 Z" fill="#8fae6a"/>`;

  // The rug, with floor cushions; the kids sleep here under the quilt.
  s += `<ellipse cx="585" cy="${GROUND_Y + 26}" rx="178" ry="28" fill="#c96a6a"/><ellipse cx="585" cy="${GROUND_Y + 26}" rx="140" ry="20" fill="#e9a06a"/><ellipse cx="585" cy="${GROUND_Y + 26}" rx="96" ry="12" fill="#f2c46a"/>`;
  for (let i = 0; i < 18; i++) s += `<rect x="${f(410 + i * 20)}" y="${GROUND_Y + 50}" width="3" height="8" fill="#c96a6a"/>`;
  s += `<path d="M430 ${GROUND_Y + 22} Q428 ${GROUND_Y - 6} 456 ${GROUND_Y - 6} Q484 ${GROUND_Y - 6} 482 ${GROUND_Y + 22} Z" fill="#7fc4dc"/><circle cx="456" cy="${GROUND_Y + 6}" r="3" fill="#ffffff" opacity=".6"/>`;
  s += `<path d="M688 ${GROUND_Y + 24} Q686 ${GROUND_Y - 4} 714 ${GROUND_Y - 4} Q742 ${GROUND_Y - 4} 740 ${GROUND_Y + 24} Z" fill="#f6d36a"/><circle cx="714" cy="${GROUND_Y + 8}" r="3" fill="#ffffff" opacity=".6"/>`;

  // The side table at local 760, top at GROUND_Y - 96, with the music box.
  s += `<rect x="694" y="${GROUND_Y - 286}" width="56" height="64" rx="6" fill="${WOOD}"/><rect x="700" y="${GROUND_Y - 280}" width="44" height="52" rx="4" fill="#f6efe2"/>`;
  s += `<path d="M706 ${GROUND_Y - 236} Q722 ${GROUND_Y - 262} 738 ${GROUND_Y - 236} Z" fill="#8fcc76"/><circle cx="730" cy="${GROUND_Y - 266}" r="6" fill="#f6d36a"/>`;
  s += `<rect x="700" y="${GROUND_Y - 86}" width="10" height="88" rx="3" fill="${WOOD_DARK}"/><rect x="830" y="${GROUND_Y - 86}" width="10" height="88" rx="3" fill="${WOOD_DARK}"/>`;
  s += `<rect x="704" y="${GROUND_Y - 34}" width="132" height="8" rx="3" fill="${WOOD}"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="${716 + i * 18}" y="${GROUND_Y - 58 + i * 2}" width="14" height="${24 - i * 2}" rx="2" fill="${["#7fb0c9", "#e98fb4", "#8fae6a"][i]}"/>`;
  s += `<rect x="690" y="${GROUND_Y - 96}" width="160" height="12" rx="5" fill="${WOOD_LIGHT}"/>`;
  // Music box: a small wooden box, its lid open, a gold key on the side.
  s += `<path d="M800 ${GROUND_Y - 122} L834 ${GROUND_Y - 122} L842 ${GROUND_Y - 148} L808 ${GROUND_Y - 148} Z" fill="#8a5a3a"/><path d="M803 ${GROUND_Y - 124} L831 ${GROUND_Y - 124} L837 ${GROUND_Y - 144} L810 ${GROUND_Y - 144} Z" fill="#e98fb4" opacity=".75"/>`;
  s += `<rect x="798" y="${GROUND_Y - 122}" width="38" height="26" rx="4" fill="#a8674a"/><rect x="798" y="${GROUND_Y - 112}" width="38" height="4" fill="#f6d36a"/>`;
  s += `<path d="M836 ${GROUND_Y - 110} h7 M843 ${GROUND_Y - 116} v12" stroke="#f6d36a" stroke-width="3" stroke-linecap="round"/>`;

  // The big window at local 930: snow falling outside, piled on the sill, frost in the corners.
  const wx0 = 812, wx1 = 1048, wy0 = GROUND_Y - 360, wy1 = GROUND_Y - 140;
  light(c, 930, GROUND_Y - 250);
  s += `<defs><linearGradient id="home-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3866"/><stop offset="1" stop-color="#7f8fc0"/></linearGradient></defs>`;
  s += `<rect x="${wx0 - 14}" y="${wy0 - 14}" width="${wx1 - wx0 + 28}" height="${wy1 - wy0 + 28}" rx="12" fill="${WOOD}"/>`;
  s += `<rect x="${wx0}" y="${wy0}" width="${wx1 - wx0}" height="${wy1 - wy0}" rx="6" fill="url(#home-win)"/>`;
  // Snowy roofs across the lane, a lit window far off.
  s += `<path d="M${wx0} ${wy1 - 50} L${wx0 + 50} ${wy1 - 92} L${wx0 + 110} ${wy1 - 50} L${wx0 + 130} ${wy1 - 64} L${wx0 + 170} ${wy1 - 100} L${wx0 + 210} ${wy1 - 64} L${wx1} ${wy1 - 70} V${wy1} H${wx0} Z" fill="#9aa6cf"/>`;
  s += `<path d="M${wx0} ${wy1 - 50} L${wx0 + 50} ${wy1 - 92} L${wx0 + 110} ${wy1 - 50} M${wx0 + 130} ${wy1 - 64} L${wx0 + 170} ${wy1 - 100} L${wx0 + 210} ${wy1 - 64}" fill="none" stroke="${SNOW}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<rect x="${wx0 + 40}" y="${wy1 - 44}" width="14" height="16" rx="3" fill="#ffd98a"/><rect x="${wx0 + 162}" y="${wy1 - 58}" width="12" height="14" rx="3" fill="#ffd98a" opacity=".85"/>`;
  for (let i = 0; i < 46; i++) s += `<circle cx="${f(wx0 + 6 + r() * (wx1 - wx0 - 12))}" cy="${f(wy0 + 6 + r() * (wy1 - wy0 - 40))}" r="${f(1.6 + r() * 2.4)}" fill="#ffffff" opacity="${f(0.6 + r() * 0.4)}"/>`;
  s += `<path d="M${wx0} ${wy1} V${wy1 - 18} Q${wx0 + 40} ${wy1 - 30} ${wx0 + 80} ${wy1 - 22} Q${wx0 + 130} ${wy1 - 12} ${wx0 + 170} ${wy1 - 26} Q${wx0 + 210} ${wy1 - 34} ${wx1} ${wy1 - 20} V${wy1} Z" fill="${SNOW}"/>`;
  s += `<path d="M${wx0 + 20} ${wy1 - 18} Q${wx0 + 80} ${wy1 - 14} ${wx0 + 120} ${wy1 - 10}" fill="none" stroke="${SNOW_SH}" stroke-width="3"/>`;
  // Frost creeping in from the corners
  for (const [fx, fy, sx, sy] of [[wx0, wy0, 1, 1], [wx1, wy0, -1, 1], [wx0, wy1, 1, -1], [wx1, wy1, -1, -1]]) {
    s += `<path d="M${fx} ${fy} h${sx * 44} Q${fx + sx * 20} ${fy + sy * 18} ${fx} ${fy + sy * 44} Z" fill="#ffffff" opacity=".45"/>`;
    for (let k = 0; k < 4; k++) s += `<circle cx="${f(fx + sx * (8 + k * 9))}" cy="${f(fy + sy * (30 - k * 7))}" r="${f(3.5 - k * 0.5)}" fill="#ffffff" opacity=".6"/>`;
    s += `<path d="M${fx + sx * 4} ${fy + sy * 4} l${sx * 22} ${sy * 22} M${fx + sx * 14} ${fy + sy * 4} l${sx * 4} ${sy * 12} M${fx + sx * 4} ${fy + sy * 14} l${sx * 12} ${sy * 4}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
  }
  s += `<path d="M930 ${wy0} V${wy1} M${wx0} ${(wy0 + wy1) / 2} H${wx1}" stroke="${WOOD}" stroke-width="8"/>`;
  s += `<rect x="${wx0 - 22}" y="${wy1 + 8}" width="${wx1 - wx0 + 44}" height="12" rx="5" fill="${WOOD_LIGHT}"/>`;
  // Curtains and their rod
  s += `<rect x="${wx0 - 40}" y="${wy0 - 30}" width="${wx1 - wx0 + 80}" height="6" rx="3" fill="${WOOD_DARK}"/>`;
  s += `<path d="M${wx0 - 36} ${wy0 - 26} H${wx0 + 8} Q${wx0 - 4} ${wy0 + 110} ${wx0 - 6} ${wy1 + 4} H${wx0 - 36} Z" fill="#e98f9a"/><path d="M${wx1 + 36} ${wy0 - 26} H${wx1 - 8} Q${wx1 + 4} ${wy0 + 110} ${wx1 + 6} ${wy1 + 4} H${wx1 + 36} Z" fill="#e98f9a"/>`;
  for (const cx of [wx0 - 22, wx1 + 22]) s += `<path d="M${cx} ${wy0 - 20} V${wy1}" stroke="#ffffff" stroke-opacity=".25" stroke-width="4"/>`;
  s += `<rect x="${wx0 - 38}" y="${wy0 + 128}" width="30" height="8" rx="4" fill="#f6d36a"/><rect x="${wx1 + 8}" y="${wy0 + 128}" width="30" height="8" rx="4" fill="#f6d36a"/>`;

  // The craft table at local 1100, top at GROUND_Y - 92: paper and scissors, room for the toast.
  s += `<rect x="1028" y="${GROUND_Y - 82}" width="10" height="84" rx="3" fill="${WOOD_DARK}"/><rect x="1162" y="${GROUND_Y - 82}" width="10" height="84" rx="3" fill="${WOOD_DARK}"/>`;
  s += `<rect x="1020" y="${GROUND_Y - 92}" width="160" height="12" rx="5" fill="${WOOD_LIGHT}"/>`;
  s += `<rect x="1026" y="${GROUND_Y - 97}" width="42" height="5" rx="1" fill="#f6efe2"/><rect x="1030" y="${GROUND_Y - 101}" width="38" height="4" rx="1" fill="#7fc4dc"/><rect x="1024" y="${GROUND_Y - 104}" width="40" height="4" rx="1" fill="#e98fb4" transform="rotate(-4 1044 ${GROUND_Y - 102})"/>`;
  s += `<path d="M1040 ${GROUND_Y - 104} l8 -10 l8 10 l-4 -2 l-4 6 l-4 -6 Z" fill="#ffffff"/>`;
  // Scissors, lying open
  s += `<path d="M1136 ${GROUND_Y - 96} L1170 ${GROUND_Y - 104} M1136 ${GROUND_Y - 96} L1168 ${GROUND_Y - 94}" stroke="#b9c4cc" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<circle cx="1130" cy="${GROUND_Y - 101}" r="5.5" fill="none" stroke="#e9583c" stroke-width="3.5"/><circle cx="1130" cy="${GROUND_Y - 94}" r="5" fill="none" stroke="#e9583c" stroke-width="3.5"/>`;
  s += `<rect x="1100" y="${GROUND_Y - 60}" width="40" height="8" rx="3" fill="${WOOD}"/>`;
  // A stool by the craft table
  s += `<rect x="1030" y="${GROUND_Y - 40}" width="50" height="9" rx="4" fill="#c97b6a"/><rect x="1036" y="${GROUND_Y - 32}" width="6" height="34" rx="2" fill="${WOOD_DARK}"/><rect x="1068" y="${GROUND_Y - 32}" width="6" height="34" rx="2" fill="${WOOD_DARK}"/>`;

  // The bookshelf at the far end.
  s += `<rect x="1196" y="${GROUND_Y - 300}" width="80" height="304" rx="6" fill="${WOOD}"/><rect x="1204" y="${GROUND_Y - 292}" width="64" height="288" rx="3" fill="${WOOD_DARK}"/>`;
  for (let k = 0; k < 4; k++) {
    const sy = GROUND_Y - 222 + k * 72;
    s += `<rect x="1200" y="${sy}" width="72" height="8" rx="2" fill="${WOOD}"/>`;
    let bx = 1206;
    while (bx < 1262) {
      const bw = 7 + r() * 6;
      const bh = 40 + r() * 22;
      if (bx + bw > 1266) break;
      s += `<rect x="${f(bx)}" y="${f(sy - bh)}" width="${f(bw)}" height="${f(bh)}" rx="2" fill="${["#c97b6a", "#7fb0c9", "#f2b54a", "#8fae6a", "#b986c9", "#e3ecf7"][Math.floor(r() * 6)]}"/>`;
      bx += bw + 1.5;
    }
  }
  return wrap(w, VIEW_H, s);
}

// --- Chapter four: the mill race path, an autumn morning ---------------------------

/** Where the waterwheel turns, in world coordinates (the wheel is its own texture). */
export const WHEEL = { x: 8760, y: GROUND_Y - 140, r: 150 };

function millpathSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(61);
  const wx = WHEEL.x - a.x0;
  const wy = WHEEL.y;
  let s = "";
  // Trees along the path, gold and rust.
  s += lollipop(c, 330, GROUND_Y, 44, r, AUTUMN[3]) + lollipop(c, 40, GROUND_Y, 48, r, AUTUMN[0]) + lollipop(c, 210, GROUND_Y, 60, r, AUTUMN[1]);
  s += lollipop(c, 520, GROUND_Y, 38, r, AUTUMN[2]);
  // A post for the lantern string at local 100.
  s += `<rect x="94" y="${GROUND_Y - 290}" width="12" height="294" rx="5" fill="#b98a5e"/><circle cx="100" cy="${GROUND_Y - 292}" r="8" fill="${WOOD}"/><circle cx="100" cy="${GROUND_Y - 283}" r="3" fill="#6b5a6a"/>`;

  // The stone housing the wheel turns against, with its lean-to roof and the axle block.
  s += `<path d="M576 ${GROUND_Y - 372} L890 ${GROUND_Y - 420} L890 ${GROUND_Y - 380} L576 ${GROUND_Y - 336} Z" fill="#7a8a96"/>`;
  s += stoneWall(590, GROUND_Y - 370, 300, 370, 67, "#b3a594", ["#cfc2b0", "#c6b8a4", "#d8ccba"]);
  s += `<path d="M590 ${GROUND_Y - 372} L890 ${GROUND_Y - 414}" stroke="#6a7a86" stroke-width="10" stroke-linecap="round"/>`;
  s += `<rect x="${wx - 34}" y="${wy - 34}" width="68" height="68" rx="10" fill="#a89a88"/><circle cx="${wx}" cy="${wy}" r="18" fill="#4a4250"/><circle cx="${wx}" cy="${wy}" r="8" fill="#6b5a6a"/>`;
  // Damp stain where the spray reaches
  s += `<ellipse cx="${wx}" cy="${GROUND_Y - 60}" rx="150" ry="40" fill="#6b7f86" opacity=".18"/>`;
  // The flume bringing water from upstream to drop over the top of the wheel.
  s += `<rect x="470" y="${wy - 156}" width="8" height="${GROUND_Y - wy + 160}" fill="${WOOD_DARK}"/><rect x="606" y="${wy - 156}" width="8" height="70" fill="${WOOD_DARK}"/>`;
  s += `<path d="M466 ${GROUND_Y} L478 ${wy - 120} L490 ${GROUND_Y}" fill="none" stroke="${WOOD_DARK}" stroke-width="6"/>`;
  s += `<rect x="350" y="${wy - 176}" width="${wx - 350 - 50}" height="22" rx="4" fill="${WOOD}"/><rect x="350" y="${wy - 180}" width="${wx - 350 - 50}" height="8" rx="3" fill="#7fbfd6"/>`;
  s += `<path d="M${wx - 52} ${wy - 172} Q${wx - 34} ${wy - 170} ${wx - 30} ${wy - 148}" fill="none" stroke="#9fd6ea" stroke-width="10" stroke-linecap="round" opacity=".9"/>`;
  // The race trough under the wheel
  s += stoneWall(596, GROUND_Y - 34, 290, 42, 71, "#9a8c7c", ["#b8aa98", "#c2b4a2"], 20);
  s += `<rect x="600" y="${GROUND_Y - 40}" width="282" height="10" rx="4" fill="#7fbfd6"/>`;
  // A hook on the wall for the far end of the lantern string.
  s += `<path d="M898 ${GROUND_Y - 314} v6 a4 4 0 0 1 -8 0" fill="none" stroke="#4a4250" stroke-width="3"/>`;

  // The mill's front, from local 880: stone, an open doorway, a bracket for the sign.
  s += `<path d="M872 ${GROUND_Y - 436} L1000 ${GROUND_Y - 478} V${GROUND_Y - 420} H872 Z" fill="#6a7a86"/>`;
  s += stoneWall(880, GROUND_Y - 430, 120, VIEW_H - GROUND_Y + 430, 73, "#c4b8a6", ["#e6dccb", "#ddd2bf", "#ece3d4"]);
  s += `<rect x="880" y="${GROUND_Y - 434}" width="120" height="12" fill="#a89a88"/>`;
  s += porthole(c, 940, GROUND_Y - 360, 18);
  // Doorway: an arch with warm light inside.
  s += `<defs><linearGradient id="mill-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a36"/><stop offset="1" stop-color="#c98a5e"/></linearGradient></defs>`;
  s += `<path d="M898 ${GROUND_Y + 6} V${GROUND_Y - 116} A52 52 0 0 1 1002 ${GROUND_Y - 116} V${GROUND_Y + 6} Z" fill="#a89a88"/>`;
  s += `<path d="M906 ${GROUND_Y + 6} V${GROUND_Y - 112} A44 44 0 0 1 994 ${GROUND_Y - 112} V${GROUND_Y + 6} Z" fill="url(#mill-door)"/>`;
  s += `<rect x="900" y="${GROUND_Y - 4}" width="100" height="12" rx="3" fill="#b3a594"/>`;
  // The sign bracket at GROUND_Y - 262, with two eyes for chains.
  s += `<rect x="884" y="${GROUND_Y - 268}" width="116" height="8" rx="4" fill="#4a4250"/><path d="M890 ${GROUND_Y - 260} q10 22 26 2" fill="none" stroke="#4a4250" stroke-width="4"/>`;
  for (const ex of [915, 985]) s += `<circle cx="${ex}" cy="${GROUND_Y - 258}" r="4" fill="none" stroke="#4a4250" stroke-width="3"/>`;

  // The path along the bank: packed earth with a grassy edge and fallen leaves.
  s += `<rect x="0" y="${GROUND_Y - 8}" width="880" height="18" fill="#b9c46a"/>`;
  s += `<rect x="0" y="${GROUND_Y + 8}" width="880" height="${560 - GROUND_Y}" fill="#e2c08e"/>`;
  for (let i = 0; i < 26; i++) {
    const x = 20 + r() * 840;
    const y = GROUND_Y + 18 + r() * 60;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(14 + r() * 16)}" ry="5" fill="#d6b07e" opacity=".8"/>`;
  }
  for (let i = 0; i < 44; i++) {
    const x = r() * 880;
    const y = GROUND_Y - 4 + r() * 70;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="5" ry="3" fill="${AUTUMN[i % 4][i % 3]}" transform="rotate(${Math.floor(r() * 180)} ${f(x)} ${f(y)})"/>`;
  }
  // The river below the bank.
  s += `<defs><linearGradient id="river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fbfd6"/><stop offset="1" stop-color="#4f8fb0"/></linearGradient></defs>`;
  s += `<rect x="0" y="560" width="880" height="${VIEW_H - 560}" fill="url(#river)"/>`;
  s += `<path d="M0 556 Q120 568 240 558 T480 560 T720 558 T880 562 V572 H0 Z" fill="#c9b07a"/>`;
  for (let i = 0; i < 18; i++) {
    const x = r() * 840;
    const y = 590 + r() * 120;
    s += `<path d="M${f(x)} ${f(y)} q14 -5 28 0 q14 5 28 0" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`;
  }
  for (let i = 0; i < 5; i++) s += `<ellipse cx="${f(80 + r() * 700)}" cy="${f(620 + r() * 80)}" rx="6" ry="3" fill="${AUTUMN[i % 4][0]}"/>`;
  // Reeds and cattails at the water's edge
  for (const rx of [40, 66, 300, 322, 560, 584, 760]) {
    s += `<path d="M${rx} 576 Q${rx - 4} 540 ${rx - 2} 520 M${rx + 6} 576 Q${rx + 10} 546 ${rx + 14} 530" fill="none" stroke="#8fae6a" stroke-width="3.5" stroke-linecap="round"/><rect x="${rx - 5}" y="514" width="6" height="16" rx="3" fill="#8a5a3a"/>`;
  }
  // The mill's foundation runs down into the river.
  s += `<rect x="878" y="${GROUND_Y + 8}" width="6" height="${VIEW_H - GROUND_Y}" fill="#a89a88"/>`;
  return wrap(w, VIEW_H, s);
}

// --- Chapter four: Mae's Tea Room, in the old mill office --------------------------

const CUP_COLS = ["#f6efe2", "#7fc4dc", "#e98fb4", "#f6d36a", "#8fcc76", "#f08a6a", "#b986c9", "#e3ecf7", "#c97b6a", "#6fa7c9", "#fde6a8", "#a8d8c8"];

function teashopSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(83);
  // Old plaster above, stone below, timber framing.
  let s = `<rect width="${w}" height="${GROUND_Y}" fill="#efdcc0"/>`;
  for (let i = 0; i < 30; i++) s += `<ellipse cx="${f(r() * w)}" cy="${f(80 + r() * 200)}" rx="${f(20 + r() * 40)}" ry="${f(8 + r() * 14)}" fill="#e3ccaa" opacity=".6"/>`;
  s += stoneWall(0, GROUND_Y - 150, w, 150, 89, "#b3a594", ["#d6cab8", "#cdbfac", "#ddd2c0"]);
  s += `<rect x="0" y="${GROUND_Y - 160}" width="${w}" height="14" fill="${WOOD}"/>`;
  for (const px of [350, 830, 1236]) s += `<rect x="${px}" y="40" width="26" height="${GROUND_Y - 200}" fill="${WOOD}"/><rect x="${px + 4}" y="40" width="6" height="${GROUND_Y - 200}" fill="#ffffff" opacity=".1"/>`;
  // Diagonal braces beside the posts
  s += `<path d="M376 120 L440 64 M830 120 L766 64 M1236 120 L1172 64" stroke="${WOOD}" stroke-width="14"/>`;
  // Ceiling and the big beam, with MILL OFFICE still faintly painted on it.
  s += `<rect width="${w}" height="26" fill="#6b4a36"/><rect x="0" y="24" width="${w}" height="42" fill="#8a5a3a"/><rect x="0" y="60" width="${w}" height="6" fill="#000" opacity=".12"/>`;
  s += `<text x="220" y="54" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="bold" fill="#f6e6c8" opacity=".38" letter-spacing="4">MILL OFFICE</text>`;
  s += `<rect x="150" y="49" width="18" height="8" fill="#8a5a3a" opacity=".6"/><rect x="262" y="34" width="14" height="10" fill="#8a5a3a" opacity=".55"/>`;
  // The stone edge of the thick front wall, where you came in.
  s += stoneWall(0, 0, 30, GROUND_Y, 97, "#b3a594", ["#e6dccb", "#ddd2bf"], 30);

  // The window over the river at local 200, and the little table where the desk used to be.
  s += `<path d="M104 ${GROUND_Y - 120} V${GROUND_Y - 290} A96 60 0 0 1 296 ${GROUND_Y - 290} V${GROUND_Y - 120} Z" fill="#c4b8a6"/>`;
  s += `<defs><linearGradient id="tea-river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaf4"/><stop offset=".55" stop-color="#f6e4b6"/><stop offset=".56" stop-color="#7fbfd6"/><stop offset="1" stop-color="#5f9fc0"/></linearGradient></defs>`;
  s += `<path d="M116 ${GROUND_Y - 132} V${GROUND_Y - 286} A84 50 0 0 1 284 ${GROUND_Y - 286} V${GROUND_Y - 132} Z" fill="url(#tea-river)"/>`;
  s += `<path d="M116 ${GROUND_Y - 214} Q150 ${GROUND_Y - 236} 180 ${GROUND_Y - 222} Q220 ${GROUND_Y - 240} 250 ${GROUND_Y - 220} Q270 ${GROUND_Y - 230} 284 ${GROUND_Y - 220} V${GROUND_Y - 206} H116 Z" fill="#e9a050"/>`;
  s += `<circle cx="150" cy="${GROUND_Y - 226}" r="16" fill="#e98a3c"/><circle cx="236" cy="${GROUND_Y - 232}" r="18" fill="#f2b54a"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${130 + i * 30} ${GROUND_Y - 170 + (i % 2) * 18} q10 -4 20 0" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".6" stroke-linecap="round"/>`;
  s += `<path d="M200 ${GROUND_Y - 336} V${GROUND_Y - 132} M116 ${GROUND_Y - 232} H284" stroke="${WOOD_DARK}" stroke-width="6"/>`;
  s += `<rect x="96" y="${GROUND_Y - 132}" width="208" height="14" rx="5" fill="#d6cab8"/>`;
  // No light from the river window: it looks out on the dark river at night.
  s += `<path d="M180 ${GROUND_Y - 130} q4 -12 12 -16 m-6 16 q6 -16 18 -18" fill="none" stroke="#8fae6a" stroke-width="3"/><rect x="176" y="${GROUND_Y - 136}" width="20" height="8" rx="3" fill="#7fb0c9"/>`;
  s += chair(130, 1, "#7fb0c9", 1) + chair(274, -1, "#c97b6a", 0);
  s += cafeTable(200, GROUND_Y - 70, 44, "#c98a5e");
  s += `<path d="M190 ${GROUND_Y - 70} q4 -14 10 -16 q-2 -6 4 -8" fill="none" stroke="#8fae6a" stroke-width="2.5"/><rect x="186" y="${GROUND_Y - 82}" width="10" height="12" rx="3" fill="#cfe3ec"/><circle cx="204" cy="${GROUND_Y - 94}" r="4" fill="#e98fb4"/>`;

  // The old cog from the mill's works, kept on the back wall.
  const gx = 1040, gy = GROUND_Y - 290, gr = 96;
  let teeth = "";
  for (let i = 0; i < 20; i++) {
    const t = (i / 20) * Math.PI * 2;
    const x0 = gx + Math.cos(t) * (gr - 4), y0 = gy + Math.sin(t) * (gr - 4);
    teeth += `<rect x="${f(x0 - 9)}" y="${f(y0 - 12)}" width="18" height="24" rx="4" fill="#8a7a6a" transform="rotate(${f((t * 180) / Math.PI + 90)} ${f(x0)} ${f(y0)})"/>`;
  }
  s += teeth + `<circle cx="${gx}" cy="${gy}" r="${gr}" fill="#8a7a6a"/><circle cx="${gx}" cy="${gy}" r="${gr - 18}" fill="#efdcc0"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${gx - 8}" y="${gy - gr + 14}" width="16" height="${gr - 14}" rx="6" fill="#8a7a6a" transform="rotate(${i * 60} ${gx} ${gy})"/>`;
  s += `<circle cx="${gx}" cy="${gy}" r="22" fill="#7a6a5c"/><circle cx="${gx}" cy="${gy}" r="9" fill="#5a4c42"/>`;
  s += `<path d="M${gx - 60} ${gy - 50} A78 78 0 0 1 ${gx + 20} ${gy - 78}" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="${f(gx - 70 + r() * 140)}" cy="${f(gy - 70 + r() * 140)}" r="${f(3 + r() * 4)}" fill="#b9774a" opacity=".45"/>`;

  // Pendant lamps from the beam
  for (const lx of [420, 900, 1120]) {
    s += `<path d="M${lx} 66 V112" stroke="#4a4250" stroke-width="2.5"/><path d="M${lx - 18} 130 Q${lx - 16} 110 ${lx} 110 Q${lx + 16} 110 ${lx + 18} 130 Z" fill="#7fa79a"/><ellipse cx="${lx}" cy="132" rx="8" ry="5" fill="#fde6a8"/>`;
    light(c, lx, 136);
  }

  // The shelf of forty cups behind the counter: four rows of ten, every one different.
  s += `<rect x="514" y="${GROUND_Y - 352}" width="292" height="190" rx="8" fill="#c99a6c"/><rect x="522" y="${GROUND_Y - 344}" width="276" height="174" rx="5" fill="#d9ac7c"/>`;
  for (let row = 0; row < 4; row++) {
    const ry = GROUND_Y - 336 + row * 44;
    s += `<rect x="520" y="${ry}" width="280" height="6" rx="3" fill="${WOOD}"/>`;
    for (let k = 0; k < 10; k++) {
      const cx = 540 + k * 27 + (row % 2) * 4;
      const cw = 15 + r() * 6;
      const ch = 12 + r() * 7;
      const col = CUP_COLS[(row * 10 + k * 7) % CUP_COLS.length];
      const band = r() > 0.55 ? CUP_COLS[(row * 3 + k) % CUP_COLS.length] : undefined;
      s += `<path d="M${cx + 7} ${ry + 5} v6" stroke="#6b5a6a" stroke-width="2"/>`;
      s += cup(cx, ry + 13 + ch, cw, ch, col, band === col ? undefined : band);
    }
  }
  // The counter and the big teapot.
  s += `<rect x="560" y="${GROUND_Y - 96}" width="200" height="98" rx="6" fill="#a8674a"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${570 + i * 48}" y="${GROUND_Y - 84}" width="40" height="74" rx="6" fill="#b97a54"/>`;
  s += `<rect x="550" y="${GROUND_Y - 106}" width="220" height="14" rx="5" fill="${WOOD_LIGHT}"/>`;
  s += teapot(714, GROUND_Y - 106, 30, "#7fb0a0");
  s += steam(744, GROUND_Y - 168, 26);
  // A cake under a glass dome and a tin of tea
  s += `<ellipse cx="604" cy="${GROUND_Y - 108}" rx="26" ry="4" fill="#e3ecf7"/><rect x="586" y="${GROUND_Y - 124}" width="36" height="16" rx="4" fill="#f2c46a"/><rect x="586" y="${GROUND_Y - 128}" width="36" height="6" rx="3" fill="#fff1d6"/>`;
  s += `<path d="M580 ${GROUND_Y - 108} V${GROUND_Y - 128} Q580 ${GROUND_Y - 150} 604 ${GROUND_Y - 150} Q628 ${GROUND_Y - 150} 628 ${GROUND_Y - 128} V${GROUND_Y - 108}" fill="#e3f1fb" opacity=".45"/>`;
  s += `<rect x="644" y="${GROUND_Y - 134}" width="24" height="28" rx="4" fill="#c94f6d"/><rect x="644" y="${GROUND_Y - 138}" width="24" height="6" rx="3" fill="#f6d36a"/>`;

  // Tables at local 420, 900 and 1120 (tops at GROUND_Y - 70), with chairs that don't match.
  s += chair(340, 1, "#8fae6a", 0) + chair(500, -1, "#e98fb4", 2);
  s += cafeTable(420, GROUND_Y - 70, 52, "#c98a5e");
  s += chair(820, 1, "#f6d36a", 1) + chair(980, -1, "#7fb0c9", 0);
  s += cafeTable(900, GROUND_Y - 70, 52, "#b98a5e");
  s += chair(1040, 1, "#c97b6a", 2);
  s += cafeTable(1120, GROUND_Y - 70, 52, "#d9a77c");
  // Bunches of dried flowers on the wall by the chalkboard spot
  s += `<path d="M1300 ${GROUND_Y - 300} l-14 60 M1300 ${GROUND_Y - 300} l0 62 M1300 ${GROUND_Y - 300} l14 60" stroke="#8fae6a" stroke-width="3"/><circle cx="1286" cy="${GROUND_Y - 236}" r="7" fill="#e98fb4"/><circle cx="1300" cy="${GROUND_Y - 232}" r="7" fill="#f6d36a"/><circle cx="1314" cy="${GROUND_Y - 236}" r="7" fill="#b986c9"/><rect x="1292" y="${GROUND_Y - 304}" width="16" height="8" rx="3" fill="#c97b6a"/>`;

  // Wide old floorboards.
  s += floorboards(w, "#b98a5e", "#a47750", 101);
  s += `<rect x="0" y="${GROUND_Y - 4}" width="${w}" height="8" fill="${WOOD_DARK}"/>`;
  return wrap(w, VIEW_H, s);
}

// --- Chapter six: Saltmouth harbour, a bright cold spring day -----------------------

const HORIZON = 330;

function seaBand(w: number, r: () => number, y1 = GROUND_Y) {
  let s = `<defs><linearGradient id="sea-${w}-${y1}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd2e4"/><stop offset="1" stop-color="#5fa6c4"/></linearGradient></defs>`;
  s += `<rect x="0" y="${HORIZON}" width="${w}" height="${y1 - HORIZON}" fill="url(#sea-${w}-${y1})"/>`;
  for (let i = 0; i < w / 40; i++) {
    const x = r() * w;
    const y = HORIZON + 8 + r() * (y1 - HORIZON - 16);
    const len = 14 + ((y - HORIZON) / (y1 - HORIZON)) * 26;
    s += `<path d="M${f(x)} ${f(y)} q${f(len / 2)} -4 ${f(len)} 0" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`;
  }
  return s;
}

function boat(x: number, water: number, hull: string, stripe: string, cabin: string, flip = false) {
  const k = flip ? -1 : 1;
  let s = `<path d="M${x} ${water - 104} V${water - 28}" stroke="${WOOD_DARK}" stroke-width="4"/><path d="M${x} ${water - 104} l${k * 22} 7 l${k * -22} 7 Z" fill="#f6d36a"/>`;
  s += `<rect x="${x - k * 14 - (flip ? 0 : 30)}" y="${water - 50}" width="30" height="26" rx="5" fill="${cabin}"/><rect x="${x - k * 14 - (flip ? -6 : 24)}" y="${water - 44}" width="12" height="10" rx="2" fill="#bfe3ef"/>`;
  s += `<path d="M${x - 64} ${water - 28} H${x + 64} Q${x + 58} ${water + 6} ${x + 30} ${water + 8} H${x - 34} Q${x - 60} ${water + 6} ${x - 64} ${water - 28} Z" fill="${hull}"/>`;
  s += `<path d="M${x - 62} ${water - 20} H${x + 62}" stroke="${stripe}" stroke-width="5"/>`;
  s += `<path d="M${x - 70} ${water + 6} q12 -5 24 0 q12 5 24 0 q12 -5 24 0 q12 5 24 0 q12 -5 24 0 q12 5 24 0" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".6"/>`;
  return s;
}

function gull(x: number, y: number, s = 1) {
  return `<path d="M${x - 12 * s} ${y} q${6 * s} ${-7 * s} ${12 * s} 0 q${6 * s} ${-7 * s} ${12 * s} 0" fill="none" stroke="#ffffff" stroke-width="${f(3 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function sittingGull(x: number, y: number) {
  return `<ellipse cx="${x}" cy="${y - 10}" rx="14" ry="9" fill="#ffffff"/><circle cx="${x + 10}" cy="${y - 20}" r="7" fill="#ffffff"/><path d="M${x + 16} ${y - 20} l7 2 l-7 2 Z" fill="#f2b54a"/><circle cx="${x + 12}" cy="${y - 22}" r="1.5" fill="#2a2030"/><path d="M${x - 14} ${y - 12} Q${x - 4} ${y - 18} ${x + 6} ${y - 10}" fill="none" stroke="#b9c4cc" stroke-width="5" stroke-linecap="round"/><path d="M${x - 2} ${y - 2} v4 M${x + 4} ${y - 2} v4" stroke="#f2b54a" stroke-width="2"/>`;
}

function quaySVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(107);
  let s = seaBand(w, r);
  // Boats moored behind the harbour wall, one out past its end.
  s += boat(840, GROUND_Y - 58, "#e9583c", "#ffffff", "#f6efe2") + boat(1000, GROUND_Y - 62, "#4f86c6", "#f6d36a", "#ffe1d4", true);
  s += boat(1250, GROUND_Y - 12, "#f2b54a", "#4f86c6", "#ffffff");
  s += gull(640, 170) + gull(676, 190, 0.8) + gull(1010, 140) + gull(1330, 210, 0.7) + gull(250, 120, 0.8);
  // Cottages along the quay; Fen's has the blue door at local 300.
  s += gableCottage(c, 20, 150, 150, "#ffe1d4", "#e57b5f");
  s += gableCottage(c, 200, 200, 172, "#f4f0e6", "#7fa0b8", { door: 300, doorColor: "#4f86c6" });
  s += `<rect x="278" y="${GROUND_Y - 4}" width="44" height="10" rx="4" fill="#c9bfb5"/>`;
  s += townhouse(c, 438, 118, 200, "#dcefe1", "#6fa7c9");
  // Nets drying on poles, and a pot of flowers by Fen's door
  s += `<circle cx="340" cy="${GROUND_Y - 10}" r="10" fill="#e98fb4"/><rect x="330" y="${GROUND_Y - 8}" width="20" height="12" rx="4" fill="#c97b6a"/>`;
  // The harbour wall along the back, ending at local 1100.
  s += stoneWall(586, GROUND_Y - 44, 514, 52, 109, "#9a9590", ["#c9c4bc", "#bdb7ae", "#d4cfc7"], 20);
  s += `<path d="M1100 ${GROUND_Y - 44} q14 0 14 14 V${GROUND_Y + 8} H1100 Z" fill="#bdb7ae"/>`;
  s += `<rect x="580" y="${GROUND_Y - 52}" width="534" height="12" rx="6" fill="#d9d4cc"/>`;
  s += lamppost(c, 590);
  for (const px of [620, 720]) s += `<rect x="${px - 4}" y="${GROUND_Y - 150}" width="8" height="154" rx="3" fill="${WOOD}"/>`;
  s += `<path d="M620 ${GROUND_Y - 146} Q670 ${GROUND_Y - 110} 720 ${GROUND_Y - 146} L716 ${GROUND_Y - 40} Q670 ${GROUND_Y - 20} 624 ${GROUND_Y - 40} Z" fill="#8a9a8a" opacity=".55"/>`;
  let net = "";
  for (let i = 0; i < 8; i++) net += `M${628 + i * 12} ${GROUND_Y - 138 + Math.abs(4 - i) * 3} L${626 + i * 12} ${GROUND_Y - 34}`;
  for (let j = 0; j < 7; j++) net += ` M624 ${GROUND_Y - 124 + j * 14} Q670 ${GROUND_Y - 100 + j * 12} 716 ${GROUND_Y - 124 + j * 14}`;
  s += `<path d="${net}" fill="none" stroke="#5f6f66" stroke-width="1.6" opacity=".7"/><circle cx="646" cy="${GROUND_Y - 44}" r="6" fill="#f2b54a"/><circle cx="696" cy="${GROUND_Y - 46}" r="6" fill="#e9583c"/>`;
  // Fish crates, some full
  const crate = (x: number, y: number, full: boolean) =>
    `<rect x="${x}" y="${y}" width="56" height="34" rx="4" fill="#c98a5e"/><rect x="${x}" y="${y + 10}" width="56" height="4" fill="#a8674a"/><rect x="${x}" y="${y + 22}" width="56" height="4" fill="#a8674a"/>` +
    (full ? `<ellipse cx="${x + 16}" cy="${y}" rx="12" ry="5" fill="#b9c4cc"/><ellipse cx="${x + 36}" cy="${y - 1}" rx="13" ry="5" fill="#9fb0bc"/><circle cx="${x + 26}" cy="${y - 4}" r="5" fill="#d0d8de"/>` : "");
  s += crate(746, GROUND_Y - 30, true) + crate(806, GROUND_Y - 30, false) + crate(774, GROUND_Y - 64, true);
  // A coil of rope
  for (let i = 0; i < 4; i++) s += `<ellipse cx="910" cy="${GROUND_Y - 4 - i * 6}" rx="${30 - i * 3}" ry="9" fill="none" stroke="${i % 2 ? "#d9b98a" : "#c9a36a"}" stroke-width="6"/>`;
  s += `<path d="M938 ${GROUND_Y - 6} q20 6 34 2" fill="none" stroke="#c9a36a" stroke-width="6" stroke-linecap="round"/>`;
  // Bollards, one with a gull on it
  for (const bx of [1030, 1180, 1320]) s += `<path d="M${bx - 12} ${GROUND_Y + 6} V${GROUND_Y - 30} Q${bx} ${GROUND_Y - 38} ${bx + 12} ${GROUND_Y - 30} V${GROUND_Y + 6} Z" fill="#4a4250"/><ellipse cx="${bx}" cy="${GROUND_Y - 32}" rx="17" ry="6" fill="#5a5260"/>`;
  s += sittingGull(1028, GROUND_Y - 36);
  // The post at the wall's end with a hook: the lantern hangs from x 1100.
  s += `<rect x="1072" y="${GROUND_Y - 186}" width="12" height="190" rx="4" fill="${WOOD}"/><path d="M1078 ${GROUND_Y - 182} H1100 V${GROUND_Y - 176}" fill="none" stroke="#4a4250" stroke-width="4" stroke-linecap="round"/><path d="M1100 ${GROUND_Y - 176} a3 3 0 1 1 -3 3" fill="none" stroke="#4a4250" stroke-width="2.5"/>`;
  // Cobbled quay with a stone kerb at the back.
  s += `<rect x="0" y="${GROUND_Y - 8}" width="${w}" height="18" fill="#c9c4bc"/>`;
  s += `<rect x="0" y="${GROUND_Y + 8}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="#ddd6ca"/>`;
  s += cobbles(w, r, "#cbc2b4", "#d4ccbf", "#f2ede4");
  // The cobbles give way to sand toward the shore.
  s += `<defs><linearGradient id="quay-sand"><stop offset="0" stop-color="#f2dfb4" stop-opacity="0"/><stop offset="1" stop-color="#f2dfb4"/></linearGradient></defs><rect x="1180" y="${GROUND_Y - 8}" width="220" height="${VIEW_H - GROUND_Y + 8}" fill="url(#quay-sand)"/>`;
  return wrap(w, VIEW_H, s);
}

// --- Chapter six: the shore and Hesketh's shed, after the storm surge --------------

function shoreSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(131);
  let s = seaBand(w, r);
  s += `<path d="M0 ${GROUND_Y - 10} q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V${GROUND_Y} H0 Z" fill="#ffffff" opacity=".6"/>`;
  s += gull(300, 160) + gull(1180, 120, 0.8);
  // A low dune at the back, where the dry sand sits a little higher (around local 160).
  s += `<path d="M30 ${GROUND_Y + 4} Q70 ${GROUND_Y - 34} 160 ${GROUND_Y - 38} Q250 ${GROUND_Y - 34} 300 ${GROUND_Y + 4} Z" fill="#f8ebc8"/>`;
  for (const tx of [70, 120, 210, 260]) s += `<path d="M${tx} ${GROUND_Y - 20} q-4 -18 -10 -26 M${tx + 4} ${GROUND_Y - 20} q2 -20 8 -30 M${tx + 2} ${GROUND_Y - 20} V${GROUND_Y - 48}" fill="none" stroke="#a8b46a" stroke-width="3" stroke-linecap="round"/>`;

  // Hesketh's shed: a cutaway from local 480 to 1300, its front wall gone, floor at GROUND_Y.
  const x0 = 480, x1 = 1300;
  // Roof
  s += `<path d="M392 ${GROUND_Y - 318} L430 ${GROUND_Y - 402} H1320 L1330 ${GROUND_Y - 318} Z" fill="#7a8a96"/>`;
  for (let k = 0; k < 4; k++) s += `<path d="M${400 + k * 9} ${GROUND_Y - 336 - k * 20} H${1324 - k * 2}" stroke="#6a7a86" stroke-width="3"/>`;
  s += `<rect x="1150" y="${GROUND_Y - 384}" width="34" height="14" rx="2" fill="#5f6f7a"/><rect x="760" y="${GROUND_Y - 398}" width="26" height="12" rx="2" fill="#8a9aa6"/>`;
  // Back wall planks, weathered
  s += planks(x0, GROUND_Y - 318, x1 - x0, 318, "#8f7a64", ["#b89a7c", "#b0927a", "#bea284"], 40);
  s += `<rect x="${x0}" y="${GROUND_Y - 318}" width="${x1 - x0}" height="318" fill="#2a1c16" opacity=".1"/>`;
  // Empty mould hooks along a rail, each with the pale shape of the mould that used to hang there.
  s += `<rect x="${x0 + 20}" y="${GROUND_Y - 304}" width="${x1 - x0 - 40}" height="8" rx="3" fill="${WOOD_DARK}"/>`;
  for (let k = 0; k < 12; k++) {
    const hx = 530 + k * 64;
    const big = k % 3 === 1;
    const mw = big ? 34 : 26, mh = big ? 42 : 34;
    s += `<path d="M${hx - mw / 2 + 3} ${GROUND_Y - 286} Q${hx - mw / 2} ${GROUND_Y - 286 + mh / 2} ${hx - mw / 2 + 4} ${GROUND_Y - 286 + mh} H${hx + mw / 2 - 4} Q${hx + mw / 2} ${GROUND_Y - 286 + mh / 2} ${hx + mw / 2 - 3} ${GROUND_Y - 286} Z" fill="#e6d6bc" opacity=".55"/>`;
    s += `<rect x="${hx - 6}" y="${GROUND_Y - 290}" width="12" height="5" rx="2" fill="#e6d6bc" opacity=".55"/>`;
    s += `<path d="M${hx} ${GROUND_Y - 298} v8 a4 4 0 0 0 8 0" fill="none" stroke="#4a4250" stroke-width="3" stroke-linecap="round"/>`;
  }
  // The broken window, high on the back wall at local 1220.
  s += `<rect x="1168" y="${GROUND_Y - 254}" width="104" height="80" rx="6" fill="${WOOD_DARK}"/><rect x="1176" y="${GROUND_Y - 246}" width="88" height="64" rx="3" fill="#bfe3ef"/>`;
  s += `<path d="M1200 ${GROUND_Y - 246} L1214 ${GROUND_Y - 222} L1196 ${GROUND_Y - 206} L1222 ${GROUND_Y - 196} L1232 ${GROUND_Y - 220} L1244 ${GROUND_Y - 246} Z" fill="#3a3340"/>`;
  s += `<path d="M1214 ${GROUND_Y - 222} L1180 ${GROUND_Y - 236} M1222 ${GROUND_Y - 196} L1248 ${GROUND_Y - 184} M1232 ${GROUND_Y - 220} L1262 ${GROUND_Y - 210}" stroke="#ffffff" stroke-width="2" opacity=".85"/>`;
  s += `<path d="M1220 ${GROUND_Y - 246} V${GROUND_Y - 182} M1176 ${GROUND_Y - 214} H1264" stroke="${WOOD_DARK}" stroke-width="5"/>`;
  s += `<rect x="1160" y="${GROUND_Y - 224}" width="122" height="14" rx="3" fill="#c9a37a" transform="rotate(-18 1220 ${GROUND_Y - 217})"/><circle cx="1172" cy="${GROUND_Y - 200}" r="2.5" fill="#4a4250"/><circle cx="1268" cy="${GROUND_Y - 232}" r="2.5" fill="#4a4250"/>`;
  // The high shelf (GROUND_Y - 220) and the middle shelf (GROUND_Y - 120).
  const shelf = (sx0: number, sx1: number, top: number) => {
    let t = `<rect x="${sx0}" y="${top}" width="${sx1 - sx0}" height="10" rx="3" fill="${WOOD}"/>`;
    for (const bx of [sx0 + 18, sx1 - 24]) t += `<path d="M${bx} ${top + 10} v22 l14 -22 Z" fill="${WOOD_DARK}"/>`;
    return t;
  };
  s += shelf(890, 1010, GROUND_Y - 220) + shelf(640, 1140, GROUND_Y - 120);
  // Water stain and tide line, about 90 px up the walls.
  let tide = `M${x0} ${GROUND_Y - 90}`;
  for (let x = x0; x <= x1; x += 20) tide += ` L${x} ${f(GROUND_Y - 90 + Math.sin(x * 0.07) * 4 + (r() - 0.5) * 4)}`;
  s += `<path d="${tide} V${GROUND_Y} H${x0} Z" fill="#5f6f74" opacity=".32"/>`;
  s += `<path d="${tide}" fill="none" stroke="#efe6d4" stroke-width="3" opacity=".75"/>`;
  s += `<path d="${tide}" fill="none" stroke="#6a5a4a" stroke-width="2" opacity=".5" transform="translate(0 5)"/>`;
  // Seaweed: left on the floor, caught on the shelf brackets, draped over things.
  const weed = (x: number, y: number, len: number, col: string) =>
    `<path d="M${x} ${y} q-6 ${f(len * 0.3)} 2 ${f(len * 0.5)} q8 ${f(len * 0.25)} -2 ${f(len * 0.5)}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  s += weed(664, GROUND_Y - 110, 40, "#6f8a4a") + weed(1116, GROUND_Y - 110, 34, "#5f7a3a") + weed(510, GROUND_Y - 288, 50, "#6f8a4a");
  for (const [sx, col] of [[530, "#6f8a4a"], [700, "#5f7a3a"], [1010, "#7a8a4a"], [1270, "#5f7a3a"]] as [number, string][]) {
    s += `<path d="M${sx - 26} ${GROUND_Y + 2} q10 -16 22 -4 q8 -14 20 -2 q10 -10 18 4 Z" fill="${col}"/>`;
  }
  // A low plank deck along the floor (things on the floor sit on it, at GROUND_Y - 18).
  s += `<rect x="${x0}" y="${GROUND_Y - 18}" width="${x1 - x0}" height="24" fill="#a8927a"/><rect x="${x0}" y="${GROUND_Y - 18}" width="${x1 - x0}" height="5" fill="#c9b496"/>`;
  for (let x = x0 + 60; x < x1; x += 110) s += `<rect x="${x}" y="${GROUND_Y - 13}" width="3" height="19" fill="#8f7a64"/>`;
  // Wall ends: the corner post, and the jagged stubs of the missing front wall.
  s += `<rect x="${x1 - 6}" y="${GROUND_Y - 320}" width="20" height="324" fill="${WOOD_DARK}"/>`;
  for (let k = 0; k < 6; k++) {
    const sx = 520 + k * 140 + r() * 30;
    const sh = 14 + r() * 22;
    s += `<path d="M${f(sx)} ${GROUND_Y + 8} V${f(GROUND_Y - sh)} l8 6 l6 -10 l8 8 V${GROUND_Y + 8} Z" fill="#c9b496"/>`;
  }
  // The remaining front wall section with the doorway at local 460, its door hanging off one hinge.
  s += planks(400, GROUND_Y - 320, 100, 324, "#a8927a", ["#c9b496", "#d1bd9f"], 34);
  s += `<path d="M500 ${GROUND_Y - 320} l-8 40 l8 30 l-10 50 l10 40 l-6 60 l6 50 l-8 54" fill="none" stroke="#a8927a" stroke-width="4"/>`;
  s += `<path d="M${400} ${GROUND_Y - 90} H500" stroke="#efe6d4" stroke-width="3" opacity=".7"/><rect x="400" y="${GROUND_Y - 88}" width="100" height="88" fill="#5f6f74" opacity=".25"/>`;
  s += `<rect x="426" y="${GROUND_Y - 136}" width="68" height="142" rx="4" fill="${WOOD_DARK}"/><rect x="432" y="${GROUND_Y - 130}" width="56" height="134" fill="#3a3038"/>`;
  s += `<path d="M426 ${GROUND_Y - 120} L384 ${GROUND_Y - 104} L388 ${GROUND_Y + 2} L426 ${GROUND_Y - 6} Z" fill="#b89a7c"/><path d="M406 ${GROUND_Y - 110} L408 ${GROUND_Y - 4}" stroke="#8f7a64" stroke-width="3"/>`;
  s += `<rect x="420" y="${GROUND_Y - 120}" width="10" height="6" rx="2" fill="#4a4250"/>`;
  // The faded sign along the eaves.
  s += `<rect x="610" y="${GROUND_Y - 360}" width="500" height="36" rx="8" fill="#b9775a" opacity=".75"/>`;
  s += `<text x="860" y="${GROUND_Y - 334}" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="bold" fill="#f6e6c8" opacity=".62" letter-spacing="3">HESKETH &#183; LANTERNS</text>`;
  s += `<rect x="700" y="${GROUND_Y - 352}" width="30" height="8" fill="#b9775a" opacity=".6"/><rect x="960" y="${GROUND_Y - 340}" width="24" height="10" fill="#b9775a" opacity=".5"/>`;

  // Sand, wet and darker toward the sea at the right, where the water laps in.
  s += `<rect x="0" y="${GROUND_Y - 6}" width="${w}" height="${VIEW_H - GROUND_Y + 6}" fill="#f2dfb4"/>`;
  s += `<rect x="0" y="${GROUND_Y - 6}" width="${w}" height="10" fill="#f8ebc8"/>`;
  for (let i = 0; i < 30; i++) {
    const x = r() * w;
    const y = GROUND_Y + 20 + r() * 200;
    s += `<path d="M${f(x)} ${f(y)} q16 -5 32 0" fill="none" stroke="#e2c99a" stroke-width="3" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 18; i++) s += `<ellipse cx="${f(r() * w)}" cy="${f(GROUND_Y + 14 + r() * 200)}" rx="${f(3 + r() * 4)}" ry="${f(2 + r() * 2)}" fill="${["#c9bfb5", "#e98fb4", "#fff6e6", "#b9a497"][i % 4]}"/>`;
  // The shed floor: a few boards on the sand, puddles from the surge.
  s += `<rect x="${x0}" y="${GROUND_Y - 4}" width="${x1 - x0}" height="12" fill="#a8927a"/>`;
  s += `<ellipse cx="760" cy="${GROUND_Y + 22}" rx="60" ry="8" fill="#9fd2e4" opacity=".7"/><ellipse cx="1100" cy="${GROUND_Y + 30}" rx="44" ry="6" fill="#9fd2e4" opacity=".6"/>`;
  s += `<defs><linearGradient id="wet"><stop offset="0" stop-color="#d9c08e" stop-opacity="0"/><stop offset="1" stop-color="#d9c08e"/></linearGradient></defs><rect x="1150" y="${GROUND_Y}" width="250" height="${VIEW_H - GROUND_Y}" fill="url(#wet)"/>`;
  s += `<path d="M1400 ${GROUND_Y - 8} H1352 Q1330 ${GROUND_Y + 40} 1362 ${GROUND_Y + 110} Q1390 ${GROUND_Y + 170} 1372 ${VIEW_H} H1400 Z" fill="#6fb3cc"/>`;
  s += `<path d="M1352 ${GROUND_Y - 8} Q1330 ${GROUND_Y + 40} 1362 ${GROUND_Y + 110} Q1390 ${GROUND_Y + 170} 1372 ${VIEW_H}" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`;
  return wrap(w, VIEW_H, s);
}

// --- Far backgrounds and skies ---------------------------------------------------

function farSVG(): string {
  const w = 1600;
  const r = rng(5);
  let s = `<path d="M0 360 Q200 300 420 340 T860 330 T1300 335 T1600 350 V720 H0 Z" fill="#c4e2ad"/>`;
  s += `<path d="M0 400 Q260 350 520 390 T1040 375 T1600 395 V720 H0 Z" fill="#acd794"/>`;
  for (let i = 0; i < 9; i++) {
    const x = 80 + i * 180 + r() * 30;
    const y = 352 - (i % 3) * 12;
    s += `<rect x="${f(x)}" y="${y}" width="44" height="40" rx="6" fill="#fff1d6" opacity=".75"/><path d="M${f(x - 8)} ${y + 2} L${f(x + 22)} ${y - 24} L${f(x + 52)} ${y + 2} Z" fill="${FLAGS[i % FLAGS.length]}" opacity=".75"/>`;
  }
  return wrap(w, VIEW_H, s);
}

function farSnowSVG(): string {
  const w = 1600;
  const r = rng(5);
  let s = `<path d="M0 360 Q200 300 420 340 T860 330 T1300 335 T1600 350 V720 H0 Z" fill="#e4ebf4"/>`;
  s += `<path d="M0 400 Q260 350 520 390 T1040 375 T1600 395 V720 H0 Z" fill="#f2f6fb"/>`;
  s += `<path d="M0 404 Q260 354 520 394 T1040 379 T1600 399" fill="none" stroke="${SNOW_SH}" stroke-width="6" opacity=".6"/>`;
  for (let i = 0; i < 9; i++) {
    const x = 80 + i * 180 + r() * 30;
    const y = 352 - (i % 3) * 12;
    s += `<rect x="${f(x)}" y="${y}" width="44" height="40" rx="6" fill="#fff1d6" opacity=".7"/><path d="M${f(x - 8)} ${y + 2} L${f(x + 22)} ${y - 24} L${f(x + 52)} ${y + 2} Z" fill="${FLAGS[i % FLAGS.length]}" opacity=".6"/>`;
    s += `<path d="M${f(x - 8)} ${y + 2} L${f(x + 22)} ${y - 24} L${f(x + 52)} ${y + 2} L${f(x + 44)} ${y - 4} L${f(x + 22)} ${y - 18} L${f(x)} ${y - 4} Z" fill="${SNOW}" opacity=".95"/>`;
    s += `<rect x="${f(x + 8)}" y="${y + 12}" width="10" height="10" rx="2" fill="#fde6a8" opacity=".8"/>`;
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    const y = 330 + r() * 30;
    s += `<path d="M${f(x)} ${f(y + 30)} V${f(y)} M${f(x)} ${f(y + 8)} l-8 -8 M${f(x)} ${f(y + 14)} l9 -9" stroke="#b9b0c4" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`;
  }
  return wrap(w, VIEW_H, s);
}

function farMillSVG(): string {
  const w = 1600;
  const r = rng(7);
  let s = `<path d="M0 330 Q240 270 480 310 T960 300 T1440 300 T1600 330 V720 H0 Z" fill="#d9c890"/>`;
  // Woods on the far ridge
  for (let x = -20; x < w + 40; x += 34 + r() * 20) {
    const y = 318 - Math.sin((x / w) * Math.PI * 4) * 18 + r() * 10;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(22 + r() * 14)}" fill="${AUTUMN[Math.floor(r() * 4)][Math.floor(r() * 2)]}" opacity=".7"/>`;
  }
  s += `<path d="M0 380 Q260 340 520 372 T1040 360 T1600 380 V720 H0 Z" fill="#c9b878"/>`;
  for (let x = 10; x < w; x += 60 + r() * 40) {
    const y = 372 - Math.sin((x / w) * Math.PI * 2) * 8;
    s += `<rect x="${f(x - 3)}" y="${f(y - 34)}" width="6" height="34" fill="#9b6b43" opacity=".7"/><circle cx="${f(x)}" cy="${f(y - 44)}" r="${f(16 + r() * 8)}" fill="${AUTUMN[Math.floor(r() * 4)][0]}" opacity=".8"/>`;
  }
  // The river winding through the valley
  s += `<path d="M0 410 Q200 396 400 412 T800 406 T1200 412 T1600 410 V428 Q1400 436 1200 426 T800 424 T400 430 T0 428 Z" fill="#9fd2e4" opacity=".85"/>`;
  s += `<path d="M0 450 Q260 420 520 444 T1040 436 T1600 450 V720 H0 Z" fill="#c9c27a"/>`;
  return wrap(w, VIEW_H, s);
}

function farCoastSVG(): string {
  const w = 1600;
  const r = rng(9);
  let s = `<rect x="0" y="${HORIZON}" width="${w}" height="${VIEW_H - HORIZON}" fill="#8fc8de"/>`;
  s += `<rect x="0" y="${HORIZON}" width="${w}" height="6" fill="#c9e8f2"/>`;
  // Cliffs (kept away from the edges so the strip tiles)
  s += `<path d="M180 ${HORIZON + 2} L210 250 Q260 214 360 220 Q470 226 520 262 L560 ${HORIZON + 2} Z" fill="#d8c4b0"/><path d="M206 256 Q260 210 360 216 Q470 222 524 266 L530 252 Q470 206 360 202 Q250 200 200 244 Z" fill="#9fd07a"/>`;
  s += `<path d="M960 ${HORIZON + 2} L990 240 Q1080 196 1200 200 Q1320 206 1380 250 L1420 ${HORIZON + 2} Z" fill="#d8c4b0"/><path d="M986 246 Q1080 192 1200 196 Q1320 202 1384 256 L1388 238 Q1320 186 1200 182 Q1070 182 982 234 Z" fill="#9fd07a"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${f(1000 + r() * 360)} ${f(260 + r() * 50)} q8 10 4 24" fill="none" stroke="#c4ae98" stroke-width="3"/>`;
  // The lighthouse
  const lx = 1290;
  s += `<path d="M${lx - 18} 200 L${lx - 12} 120 H${lx + 12} L${lx + 18} 200 Z" fill="#ffffff"/>`;
  for (const y of [180, 150]) s += `<path d="M${f(lx - 17 + (200 - y) * 0.07)} ${y} H${f(lx + 17 - (200 - y) * 0.07)} L${f(lx + 16 - (200 - y + 12) * 0.07)} ${y - 12} H${f(lx - 16 + (200 - y + 12) * 0.07)} Z" fill="#e9583c"/>`;
  s += `<rect x="${lx - 16}" y="112" width="32" height="8" rx="2" fill="#4a4250"/><rect x="${lx - 9}" y="96" width="18" height="16" rx="3" fill="#fde6a8"/><path d="M${lx - 12} 96 Q${lx} 80 ${lx + 12} 96 Z" fill="#e9583c"/>`;
  s += `<rect x="${lx + 20}" y="186" width="30" height="16" rx="3" fill="#fff1d6"/><path d="M${lx + 16} 188 L${lx + 35} 174 L${lx + 54} 188 Z" fill="#e57b5f"/>`;
  // Little sails far out
  for (const [sx, sc] of [[700, "#ffffff"], [820, "#f6d36a"], [1520, "#ffffff"], [80, "#e98fb4"]] as [number, string][]) s += `<path d="M${sx} ${HORIZON - 2} V${HORIZON - 26} L${sx + 14} ${HORIZON - 4} Z" fill="${sc}" opacity=".85"/><rect x="${sx - 8}" y="${HORIZON - 4}" width="24" height="5" rx="2" fill="#6b5a6a" opacity=".7"/>`;
  return wrap(w, VIEW_H, s);
}

export const SKIES: Record<string, [string, string]> = {
  afternoon: ["#9fd8e6", "#fdf0c4"],
  sunset: ["#f09a7a", "#ffd593"],
  night: ["#24204e", "#4a3d78"],
  morning: ["#bfe6ef", "#fff4d6"],
  storm: ["#1b2030", "#3d4658"],
  "winter-sunset": ["#b98fb8", "#ffcfa8"],
  "winter-night": ["#1c2246", "#3f4c80"],
  "winter-dawn": ["#b7c6e6", "#fde2d4"],
  coast: ["#86cbe8", "#eaf7f6"],
  "coast-dusk": ["#d9818e", "#fbc995"],
  mill: ["#a6d3ea", "#fbe7c0"],
};

function skySVG(top: string, bottom: string): string {
  return wrap(
    64,
    VIEW_H,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="64" height="${VIEW_H}" fill="url(#g)"/>`,
  );
}

/** Character textures: the plush villagers from src/ui/plush.ts. */
const CHAR_PX = 2; // texture pixels per drawing unit
export const CHAR_ORIGIN = FEET;
/** On screen, about 1.4 pixels per drawing unit: adults stand about 105 px tall. */
export const CHAR_DISPLAY_SCALE = 0.7;

export function charKey(id: CharacterId, expr: Expression, frame: Frame = "closed"): string {
  return frame === "closed" ? `char-${id}-${expr}` : `char-${id}-${expr}-${frame}`;
}

/** The walk cycle: which foot is lifted in each of its eight frames. */
export const WALK_STEPS = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];

export function walkKey(id: CharacterId, expr: Expression, i: number): string {
  return `char-${id}-${expr}-walk${i}`;
}

/** One walking frame: turned toward the direction of travel, arms swinging against the legs. */
export function walkTextureSVG(id: CharacterId, expr: Expression, i: number): string {
  return plushSVG(id, expr, { step: WALK_STEPS[i], turn: 1, swing: true }, CHAR_PX);
}

/** SVG for one character frame; frames other than the calm face are made on demand. */
export function charTextureSVG(id: CharacterId, expr: Expression, frame: Frame = "closed"): string {
  return plushSVG(id, expr, { frame }, CHAR_PX);
}

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

// --- Props: story things that come and go (see PROPS in layout.ts) ----------------

/** The tea room's sign board, centered at (cx, cy). */
function maeBoard(cx: number, cy: number, w: number, h: number) {
  let s = `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${w}" height="${h}" rx="${f(h / 2.4)}" fill="#7fa79a"/>`;
  s += `<rect x="${f(cx - w / 2 + 5)}" y="${f(cy - h / 2 + 5)}" width="${w - 10}" height="${h - 10}" rx="${f(h / 3)}" fill="none" stroke="#fff1d6" stroke-width="2.5" opacity=".8"/>`;
  s += `<text x="${f(cx - 12)}" y="${f(cy + h * 0.14)}" text-anchor="middle" font-family="${FONT}" font-size="${f(h * 0.4)}" font-weight="bold" fill="#fff6e6" letter-spacing="1.5" textLength="${f(w * 0.54)}" lengthAdjust="spacingAndGlyphs">MAE'S</text>`;
  // A little teacup with steam
  const tx = cx + w / 2 - 20;
  s += `<path d="M${f(tx - 9)} ${f(cy - 2)} H${f(tx + 9)} L${f(tx + 6)} ${f(cy + 9)} H${f(tx - 6)} Z" fill="#f6d36a"/><path d="M${f(tx + 8)} ${f(cy)} q6 0 4 5 q-1 3 -6 3" fill="none" stroke="#f6d36a" stroke-width="2.2"/>`;
  s += `<path d="M${f(tx - 2)} ${f(cy - 5)} q-3 -4 0 -8 M${f(tx + 3)} ${f(cy - 5)} q-3 -4 0 -8" fill="none" stroke="#fff6e6" stroke-width="1.8" stroke-linecap="round"/>`;
  return s;
}

function signDownSVG(): string {
  let s = `<ellipse cx="58" cy="78" rx="52" ry="4" fill="#000" opacity=".15"/>`;
  s += `<g transform="rotate(-6 58 76)">${maeBoard(58, 50, 100, 50)}</g>`;
  return wrap(116, 82, s);
}

function signUpSVG(): string {
  let s = "";
  for (const x of [30, 100]) {
    for (let y = 2; y < 30; y += 8) s += `<ellipse cx="${x}" cy="${y + 3}" rx="2.6" ry="4" fill="none" stroke="#4a4250" stroke-width="2"/>`;
  }
  s += maeBoard(65, 60, 128, 56);
  return wrap(130, 90, s);
}

function aFrame(lines: { t: string; size: number; y: number; col?: string }[], heart: boolean) {
  const w = 96, h = 124;
  let s = `<path d="M14 ${h} L28 4 M82 ${h} L68 4" stroke="${WOOD}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M12 ${h - 18} L17 12 H79 L84 ${h - 18} Z" fill="${WOOD_LIGHT}"/><path d="M17 ${h - 23} L21 17 H75 L79 ${h - 23} Z" fill="#3f4a46"/>`;
  s += `<path d="M16 ${h - 10} H80" stroke="${WOOD}" stroke-width="4"/>`;
  for (const l of lines) {
    // Long lines are squeezed to fit the board instead of running off it.
    const est = l.t.length * l.size * 0.62;
    const fit = est > 52 ? ` textLength="52" lengthAdjust="spacingAndGlyphs"` : "";
    s += `<text x="48" y="${l.y}" text-anchor="middle" font-family="${FONT}" font-size="${l.size}" font-weight="bold" fill="${l.col ?? "#f6f2ea"}"${fit}>${l.t}</text>`;
  }
  if (heart) s += `<path d="M48 ${h - 30} l-6 -6 a3.6 3.6 0 0 1 6 -4 a3.6 3.6 0 0 1 6 4 Z" fill="#e98fb4"/>`;
  s += `<path d="M30 ${h - 26} q4 -2 8 0" stroke="#ffffff" stroke-width="1.5" opacity=".4" fill="none"/>`;
  return wrap(w, h, s);
}

function millLanternsSVG(): string {
  // The right end climbs to a hook high on the mill wall, so the string passes over the waterwheel;
  // the lanterns hang along the stretch over the path.
  const w = 800, h = 86;
  const yAt = (u: number) => 30 * (1 - u) + 2 * u + 200 * u * (1 - u) * (1 - u);
  const pts: string[] = [];
  for (let u = 0; u <= 1.0001; u += 0.025) pts.push(`${f(2 + u * 796)} ${f(yAt(u))}`);
  let s = `<path d="M${pts.join(" L")}" fill="none" stroke="#8a6a52" stroke-width="2.5" stroke-linejoin="round"/>`;
  for (let i = 0; i < 10; i++) {
    const t = 0.04 + (i / 9) * 0.63;
    const x = 2 + t * 796;
    const y = yAt(t);
    const col = PAPER[i % PAPER.length];
    s += `<path d="M${f(x)} ${f(y)} v5" stroke="#3a3340" stroke-width="2"/><rect x="${f(x - 6)}" y="${f(y + 4)}" width="12" height="4" rx="1.5" fill="#3a3340"/>`;
    s += `<ellipse cx="${f(x)}" cy="${f(y + 20)}" rx="12" ry="14" fill="${col}"/><path d="M${f(x - 9)} ${f(y + 14)} Q${f(x)} ${f(y + 10)} ${f(x + 9)} ${f(y + 14)} M${f(x - 9)} ${f(y + 26)} Q${f(x)} ${f(y + 30)} ${f(x + 9)} ${f(y + 26)}" fill="none" stroke="#00000030" stroke-width="1.6"/>`;
    s += `<ellipse cx="${f(x - 4)}" cy="${f(y + 16)}" rx="3" ry="5" fill="#ffffff" opacity=".35"/>`;
  }
  return wrap(w, h, s);
}

function busyTablesSVG(): string {
  const w = 1000, h = 130;
  const top = h - 70; // tabletops at GROUND_Y - 70
  let s = "";
  const sets: [number, string, string[]][] = [
    [120, "#e98fb4", ["#f6efe2", "#7fc4dc"]],
    [600, "#f6d36a", ["#8fcc76", "#f6efe2", "#c97b6a"]],
    [820, "#7fc4dc", ["#e98fb4", "#fde6a8"]],
  ];
  for (const [x, pot, cups] of sets) {
    s += teapot(x - 18, top, 15, pot) + steam(x - 4, top - 30, 22);
    cups.forEach((col, i) => {
      const cx = x + 16 + i * 18;
      s += `<ellipse cx="${cx}" cy="${top}" rx="10" ry="2" fill="#e3ecf7"/>` + cup(cx, top - 1, 13, 11, col) + steam(cx, top - 16, 16);
    });
    s += `<ellipse cx="${x - 40}" cy="${top - 2}" rx="9" ry="3" fill="#f6efe2"/><circle cx="${x - 42}" cy="${top - 6}" r="4" fill="#d9984f"/>`;
  }
  return wrap(w, h, s);
}

function nellSnowSVG(): string {
  let s = `<path d="M4 60 Q10 30 40 24 Q60 6 92 12 Q124 2 146 20 Q178 24 186 60 Z" fill="${SNOW}"/>`;
  s += `<path d="M14 60 Q30 44 60 46 Q100 36 130 48 Q160 44 180 60 Z" fill="${SNOW_SH}"/>`;
  s += `<path d="M30 34 Q60 18 90 22" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M118 36 Q140 30 160 40" fill="none" stroke="${SNOW_DEEP}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  return wrap(190, 62, s);
}

function stoveFireSVG(): string {
  let s = `<rect x="6" y="40" width="32" height="8" rx="4" fill="#7a4a30" transform="rotate(-8 22 44)"/><rect x="8" y="42" width="30" height="7" rx="3.5" fill="#8a5a3a" transform="rotate(10 22 46)"/>`;
  s += `<path d="M6 44 Q2 24 14 14 Q14 26 20 26 Q16 10 24 0 Q28 16 32 18 Q34 10 38 8 Q44 26 38 44 Z" fill="#e9583c"/>`;
  s += `<path d="M12 44 Q10 30 18 24 Q20 32 24 32 Q22 20 28 14 Q34 28 32 44 Z" fill="#f2b54a"/>`;
  s += `<path d="M17 44 Q16 36 22 30 Q26 38 28 44 Z" fill="#fde6a8"/>`;
  s += `<circle cx="10" cy="46" r="2" fill="#ffd98a"/><circle cx="34" cy="47" r="2" fill="#ffd98a"/>`;
  return wrap(44, 50, s);
}

function candlesSVG(): string {
  let s = "";
  for (const [x, h] of [[12, 30], [35, 40], [58, 26]] as [number, number][]) {
    s += `<rect x="${x - 10}" y="${50 - h}" width="20" height="${h}" rx="6" fill="#cfe3ec" opacity=".7"/>`;
    s += `<rect x="${x - 5}" y="${50 - h + 10}" width="10" height="${h - 12}" rx="2" fill="#f6efe2"/>`;
    s += `<path d="M${x} ${50 - h - 2} Q${x - 4} ${50 - h + 5} ${x} ${50 - h + 9} Q${x + 4} ${50 - h + 5} ${x} ${50 - h - 2} Z" fill="#ffb347"/><ellipse cx="${x}" cy="${50 - h + 6}" rx="1.5" ry="2.5" fill="#fde6a8"/>`;
    s += `<rect x="${x - 10}" y="${50 - h}" width="20" height="4" rx="2" fill="#ffffff" opacity=".4"/>`;
  }
  return wrap(70, 50, s);
}

function snowflake(cx: number, cy: number, r: number, rot: number) {
  let arms = "";
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + rot) * Math.PI) / 180;
    const ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r;
    arms += `M${f(cx)} ${f(cy)} L${f(ex)} ${f(ey)}`;
    for (const k of [0.45, 0.7]) {
      const bx = cx + Math.cos(a) * r * k, by = cy + Math.sin(a) * r * k;
      const bl = r * (k === 0.45 ? 0.32 : 0.22);
      for (const da of [-0.8, 0.8]) arms += ` M${f(bx)} ${f(by)} L${f(bx + Math.cos(a + da) * bl)} ${f(by + Math.sin(a + da) * bl)}`;
    }
  }
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.28)}" fill="#ffffff"/>`;
  s += `<path d="${arms}" stroke="#ffffff" stroke-width="${f(Math.max(3, r * 0.14))}" stroke-linecap="round"/>`;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.1)}" fill="#cfdcec"/>`;
  // A strip of tape holding it to the glass
  s += `<rect x="${f(cx - 8)}" y="${f(cy - r - 4)}" width="16" height="7" rx="1" fill="#fff3c4" opacity=".75" transform="rotate(${rot % 30 - 15} ${f(cx)} ${f(cy - r)})"/>`;
  return s;
}

function snowflakesSVG(): string {
  let s = "";
  const flakes: [number, number, number, number][] = [[46, 48, 30, 0], [164, 42, 26, 15], [108, 104, 34, 8], [40, 156, 24, 20], [176, 152, 30, 5], [104, 178, 16, 12]];
  for (const [x, y, r, rot] of flakes) s += snowflake(x, y, r, rot);
  return wrap(220, 200, s);
}

function quiltSVG(): string {
  const w = 170, h = 70;
  const FUR = "#b9a497", EAR = "#f2a7a9";
  let s = "";
  // Two small mice, asleep, peeking out at the top.
  for (const [x, tilt] of [[60, -8], [112, 10]] as [number, number][]) {
    s += `<g transform="rotate(${tilt} ${x} 28)">`;
    for (const ex of [-12, 12]) s += `<circle cx="${x + ex}" cy="12" r="9.5" fill="${FUR}"/><circle cx="${x + ex}" cy="12" r="5.5" fill="${EAR}"/>`;
    s += `<ellipse cx="${x}" cy="28" rx="17" ry="15" fill="${FUR}"/>`;
    s += `<path d="M${x - 9} 27 q3.5 3.5 7 0 M${x + 2} 27 q3.5 3.5 7 0" fill="none" stroke="#4a3a34" stroke-width="2" stroke-linecap="round"/>`;
    s += `<circle cx="${x}" cy="32" r="2.4" fill="${EAR}"/><circle cx="${x - 11}" cy="32" r="3" fill="${EAR}" opacity=".55"/><circle cx="${x + 11}" cy="32" r="3" fill="${EAR}" opacity=".55"/>`;
    s += `</g>`;
  }
  // The quilt heaped over them, patchwork squares clipped to its soft shape.
  const shape = `M4 ${h} Q0 46 18 40 Q36 34 52 36 Q86 30 120 36 Q150 32 162 42 Q172 54 166 ${h} Z`;
  s += `<defs><clipPath id="quilt-clip"><path d="${shape}"/></clipPath></defs>`;
  let squares = "";
  const cols = ["#f6d36a", "#e98fa0", "#7fb0d9", "#8fcc76"];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) squares += `<rect x="${col * 22}" y="${30 + row * 14}" width="22" height="14" fill="${cols[(row * 3 + col) % 4]}"/>`;
  s += `<g clip-path="url(#quilt-clip)">${squares}<path d="M0 44 H170 M0 58 H170 ${Array.from({ length: 8 }, (_, i) => `M${i * 22} 30 V70`).join(" ")}" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="3 3" opacity=".7"/></g>`;
  s += `<path d="M18 42 Q36 36 52 38 Q86 32 120 38 Q150 34 160 44" fill="none" stroke="#ffffff" stroke-width="3" opacity=".45" stroke-linecap="round"/>`;
  return wrap(w, h, s);
}

function toastSVG(): string {
  let s = `<ellipse cx="25" cy="21" rx="24" ry="4" fill="#e3ecf7"/><ellipse cx="25" cy="20" rx="17" ry="2.5" fill="#ffffff"/>`;
  for (const [x, rot] of [[18, -10], [31, 8]] as [number, number][]) {
    s += `<g transform="rotate(${rot} ${x} 18)"><rect x="${x - 9}" y="2" width="18" height="17" rx="6" fill="#b9773e"/><rect x="${x - 7}" y="4" width="14" height="13" rx="4" fill="#e9b26a"/></g>`;
  }
  s += `<rect x="24" y="5" width="7" height="3" rx="1.5" fill="#fff1b0"/>`;
  return wrap(50, 24, s);
}

function ploughSVG(): string {
  const w = 260, h = 112;
  let s = `<path d="M218 92 L236 54 L250 56 Q262 80 252 ${h - 2} Z" fill="${SNOW}"/>`;
  s += `<path d="M202 46 L232 40 Q246 70 236 ${h - 8} L200 ${h - 12} Z" fill="#7a8a96"/><path d="M206 52 L228 48" stroke="#ffffff" stroke-opacity=".4" stroke-width="3"/>`;
  s += `<rect x="20" y="52" width="190" height="42" rx="14" fill="#e8a04f"/><rect x="20" y="76" width="190" height="6" fill="#c97b3a"/>`;
  s += `<path d="M110 52 V14 Q110 6 118 6 H170 Q182 6 186 16 L198 52 Z" fill="#e57b5f"/><path d="M122 46 V18 H166 L176 46 Z" fill="#bfe3ef"/><path d="M128 22 L140 22" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>`;
  s += ledgeSnow(108, 9, 80, 8) + ledgeSnow(20, 55, 86, 9);
  // Two warm headlights with soft beams
  s += `<path d="M206 62 L260 48 V92 Z" fill="#fde6a8" opacity=".35"/><circle cx="204" cy="64" r="8" fill="#ffd98a"/><circle cx="204" cy="64" r="4" fill="#fff6d6"/>`;
  s += `<circle cx="188" cy="30" r="7" fill="#ffd98a"/><circle cx="188" cy="30" r="3.5" fill="#fff6d6"/>`;
  for (const x of [60, 160]) s += `<circle cx="${x}" cy="94" r="17" fill="#3a3340"/><circle cx="${x}" cy="94" r="7" fill="#b9c4cc"/>`;
  s += `<rect x="34" y="40" width="30" height="14" rx="4" fill="#f2b54a"/><rect x="40" y="34" width="6" height="8" rx="2" fill="#6b5a6a"/>`;
  return wrap(w, h, s);
}

function sandbagsSVG(): string {
  let s = "";
  const bag = (x: number, y: number) => `<path d="M${x} ${y} Q${x} ${y - 20} ${x + 18} ${y - 20} H${x + 22} Q${x + 40} ${y - 20} ${x + 40} ${y} Q${x + 20} ${y + 4} ${x} ${y} Z" fill="#c9b48a"/><path d="M${x + 6} ${y - 14} Q${x + 20} ${y - 18} ${x + 34} ${y - 14}" stroke="#ffffff" stroke-opacity=".35" stroke-width="3" fill="none"/><path d="M${x + 36} ${y - 16} l6 -4 M${x + 36} ${y - 12} l6 2" stroke="#a8927a" stroke-width="2"/>`;
  for (let i = 0; i < 3; i++) s += bag(2 + i * 38, 60);
  for (let i = 0; i < 2; i++) s += bag(20 + i * 38, 42);
  s += bag(39, 24);
  return wrap(120, 62, s);
}

function crateSVG(): string {
  let s = `<path d="M10 22 L22 8 H100 L92 22 Z" fill="#7a5340"/>`;
  s += `<path d="M24 12 q10 -10 20 -2 q8 -8 18 0 q10 -8 20 2" fill="none" stroke="#e9cf7a" stroke-width="4" stroke-linecap="round"/>`;
  s += `<rect x="6" y="20" width="96" height="48" rx="5" fill="${WOOD_LIGHT}"/>`;
  for (const y of [32, 48]) s += `<rect x="6" y="${y}" width="96" height="4" fill="#a8674a"/>`;
  s += `<path d="M10 24 L98 64 M98 24 L10 64" stroke="#a8674a" stroke-width="3" opacity=".5"/>`;
  s += `<rect x="102" y="10" width="6" height="58" rx="2" fill="#b07a50" transform="rotate(14 105 68)"/>`;
  return wrap(112, 70, s);
}

function harbourLanternSVG(): string {
  let s = `<path d="M23 0 a5 5 0 1 0 0.1 0" fill="none" stroke="#3a3340" stroke-width="2"/><path d="M23 10 V16" stroke="#3a3340" stroke-width="2.5"/>`;
  s += `<rect x="15" y="14" width="16" height="6" rx="2" fill="#3a3340"/>`;
  s += `<ellipse cx="23" cy="38" rx="18" ry="20" fill="${PAPER[1]}"/><path d="M8 30 Q23 24 38 30 M6 38 Q23 34 40 38 M8 46 Q23 52 38 46" fill="none" stroke="#00000030" stroke-width="2"/>`;
  s += `<ellipse cx="17" cy="32" rx="4" ry="7" fill="#ffffff" opacity=".35"/><rect x="16" y="56" width="14" height="6" rx="2" fill="#3a3340"/>`;
  return wrap(46, 64, s);
}

function notebooksSVG(): string {
  let s = "";
  const books: [number, number, string][] = [[4, 24, "#6f8fb8"], [8, 14, "#c97b8a"], [2, 4, "#8fae6a"]];
  for (const [x, y, col] of books) s += `<rect x="${x}" y="${y}" width="54" height="10" rx="3" fill="${col}"/><rect x="${x + 2}" y="${y + 6}" width="50" height="2" fill="#f6efe2"/><rect x="${x + 40}" y="${y}" width="5" height="10" fill="#000" opacity=".15"/>`;
  return wrap(60, 34, s);
}

/** A tin lantern mould: a rounded shell with its seam and a ring to hang it by. */
function mouldSVG(w: number, h: number, col: string, shade: string): string {
  const cx = w / 2;
  let s = `<circle cx="${cx}" cy="5" r="4" fill="none" stroke="${shade}" stroke-width="2.5"/>`;
  s += `<rect x="${cx - w * 0.22}" y="8" width="${f(w * 0.44)}" height="6" rx="2" fill="${shade}"/>`;
  s += `<path d="M${f(cx - w * 0.3)} 14 Q${f(cx - w * 0.5)} ${f(h * 0.55)} ${f(cx - w * 0.3)} ${h - 6} H${f(cx + w * 0.3)} Q${f(cx + w * 0.5)} ${f(h * 0.55)} ${f(cx + w * 0.3)} 14 Z" fill="${col}"/>`;
  s += `<path d="M${cx} 14 V${h - 6} M${f(cx - w * 0.4)} ${f(h * 0.4)} Q${cx} ${f(h * 0.34)} ${f(cx + w * 0.4)} ${f(h * 0.4)} M${f(cx - w * 0.4)} ${f(h * 0.66)} Q${cx} ${f(h * 0.72)} ${f(cx + w * 0.4)} ${f(h * 0.66)}" fill="none" stroke="${shade}" stroke-width="2"/>`;
  s += `<rect x="${f(cx - w * 0.3)}" y="${h - 7}" width="${f(w * 0.6)}" height="7" rx="2" fill="${shade}"/>`;
  s += `<ellipse cx="${f(cx - w * 0.16)}" cy="${f(h * 0.45)}" rx="${f(w * 0.06)}" ry="${f(h * 0.14)}" fill="#ffffff" opacity=".4"/>`;
  return wrap(w, h, s);
}

function toolsSVG(): string {
  let s = `<rect x="44" y="6" width="5" height="16" rx="2" fill="#c98a5e" transform="rotate(-20 46 14)"/><rect x="50" y="4" width="4" height="18" rx="2" fill="#b9c4cc" transform="rotate(14 52 14)"/><rect x="54" y="8" width="5" height="14" rx="2" fill="#e9583c" transform="rotate(30 56 14)"/>`;
  s += `<rect x="2" y="8" width="54" height="18" rx="9" fill="#8a5a3a"/><ellipse cx="54" cy="17" rx="5" ry="9" fill="#a8674a"/><path d="M54 10 q-3 7 0 14" fill="none" stroke="#6b4430" stroke-width="2"/>`;
  s += `<rect x="22" y="7" width="7" height="20" rx="2" fill="#c9a37a"/><path d="M29 22 q8 4 6 10" fill="none" stroke="#c9a37a" stroke-width="3" stroke-linecap="round"/>`;
  s += `<rect x="6" y="11" width="44" height="3" rx="1.5" fill="#ffffff" opacity=".18"/>`;
  return wrap(64, 34, s);
}

function photoSVG(): string {
  let s = `<path d="M38 60 L44 26" stroke="${WOOD_DARK}" stroke-width="4" stroke-linecap="round"/>`;
  s += `<rect x="4" y="4" width="42" height="54" rx="4" fill="#c9a37a"/><rect x="9" y="9" width="32" height="44" rx="2" fill="#e9d8b8"/>`;
  // An old hare, long ears, and a young otter beside him.
  s += `<ellipse cx="18" cy="15" rx="2.6" ry="7" fill="#9a8a7c"/><ellipse cx="23" cy="15" rx="2.6" ry="7" fill="#9a8a7c"/><circle cx="20" cy="27" r="7.5" fill="#9a8a7c"/><rect x="13" y="33" width="14" height="20" rx="6" fill="#8a7a6c"/><circle cx="18" cy="27" r="1" fill="#3a2c26"/><circle cx="22.5" cy="27" r="1" fill="#3a2c26"/><path d="M14 23 q6 -2 12 0" stroke="#f6efe2" stroke-width="1.4" fill="none"/>`;
  s += `<circle cx="33" cy="36" r="5.5" fill="#7a5a44"/><circle cx="29" cy="32" r="1.8" fill="#7a5a44"/><circle cx="37" cy="32" r="1.8" fill="#7a5a44"/><ellipse cx="33" cy="38" rx="3" ry="2" fill="#c9a88a"/><rect x="28" y="40" width="10" height="13" rx="5" fill="#6b4c3a"/><circle cx="31.5" cy="35" r=".9" fill="#2a1c16"/><circle cx="34.5" cy="35" r=".9" fill="#2a1c16"/>`;
  s += `<rect x="9" y="9" width="32" height="44" rx="2" fill="#c9a36a" opacity=".18"/>`;
  return wrap(50, 62, s);
}

function waterwheelSVG(): string {
  const W = 300, cx = 150, cy = 150;
  let s = "";
  // Paddles around the rim
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 360;
    s += `<rect x="${cx - 7}" y="4" width="14" height="40" rx="3" fill="${WOOD}" transform="rotate(${a} ${cx} ${cy})"/><rect x="${cx - 7}" y="4" width="14" height="8" rx="3" fill="#7fbfd6" opacity=".55" transform="rotate(${a} ${cx} ${cy})"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="124" fill="none" stroke="${WOOD_DARK}" stroke-width="16"/><circle cx="${cx}" cy="${cy}" r="124" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="4" stroke-dasharray="30 20"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke="${WOOD}" stroke-width="8"/>`;
  for (let i = 0; i < 8; i++) s += `<rect x="${cx - 5}" y="${cy - 122}" width="10" height="122" rx="4" fill="${WOOD}" transform="rotate(${i * 45} ${cx} ${cy})"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="26" fill="${WOOD_DARK}"/><circle cx="${cx}" cy="${cy}" r="12" fill="#4a4250"/>`;
  for (let i = 0; i < 4; i++) s += `<circle cx="${f(cx + Math.cos((i * Math.PI) / 2 + 0.6) * 19)}" cy="${f(cy + Math.sin((i * Math.PI) / 2 + 0.6) * 19)}" r="2.5" fill="#b9c4cc"/>`;
  return wrap(W, W, s);
}

function propSVG(name: string): string {
  switch (name) {
    case "sign_down": return signDownSVG();
    case "sign_up": return signUpSVG();
    case "chalk_open": return aFrame([{ t: "OPEN", size: 20, y: 52 }, { t: "Lantern", size: 12, y: 74, col: "#f6d36a" }, { t: "tea", size: 12, y: 88, col: "#f6d36a" }], false);
    case "chalk_saturdays": return aFrame([{ t: "OPEN", size: 13, y: 36 }, { t: "EVERY DAY", size: 10, y: 50 }, { t: "SATURDAYS:", size: 10, y: 68, col: "#f6d36a" }, { t: "TWO OF US", size: 10, y: 81, col: "#f6d36a" }], true);
    case "mill_lanterns": return millLanternsSVG();
    case "busy_tables": return busyTablesSVG();
    case "nell_snow": return nellSnowSVG();
    case "stove_fire": return stoveFireSVG();
    case "candles": return candlesSVG();
    case "snowflakes": return snowflakesSVG();
    case "quilt": return quiltSVG();
    case "toast": return toastSVG();
    case "plough": return ploughSVG();
    case "sandbags": return sandbagsSVG();
    case "crate": return crateSVG();
    case "harbour_lantern": return harbourLanternSVG();
    default: return wrap(8, 8, "");
  }
}

function shedItemSVG(id: string): string {
  switch (id) {
    case "notebooks": return notebooksSVG();
    case "small_mould": return mouldSVG(46, 52, "#b9c4cc", "#7a8a96");
    case "tools": return toolsSVG();
    case "photo": return photoSVG();
    case "red_mould": return mouldSVG(58, 64, "#d9473f", "#8a3a34");
    default: return wrap(8, 8, "");
  }
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
    lane: (a) => laneSVG(a),
    street: (a) => streetSVG(a),
    square: (a) => squareSVG(a),
    hill: (a) => hillSVG(a),
    workshop: workshopSVG,
    home: homeSVG,
    millpath: millpathSVG,
    teashop: teashopSVG,
    quay: quaySVG,
    shore: shoreSVG,
  };
  for (const a of AREAS) specs.push({ key: `area-${a.id}`, svg: builders[a.id](a) });
  // Winter versions of the village: same houses and doors, under snow.
  const snowy: Partial<Record<Area["id"], (a: Area, snowy: boolean) => string>> = { lane: laneSVG, street: streetSVG, square: squareSVG, hill: hillSVG };
  for (const a of AREAS) {
    const b = snowy[a.id];
    if (b) specs.push({ key: `area-${a.id}-snow`, svg: b(a, true) });
  }
  specs.push({ key: "far", svg: farSVG() });
  specs.push({ key: "far-snow", svg: farSnowSVG() });
  specs.push({ key: "far-mill", svg: farMillSVG() });
  specs.push({ key: "far-coast", svg: farCoastSVG() });
  for (const [k, [top, bottom]] of Object.entries(SKIES)) specs.push({ key: `sky-${k}`, svg: skySVG(top, bottom) });
  for (const id of CHARACTER_IDS) {
    for (const e of EXPRESSIONS) specs.push({ key: charKey(id, e), svg: charTextureSVG(id, e) });
    // Calm talking and blinking are used all the time, so make them up front.
    specs.push({ key: charKey(id, "neutral", "open"), svg: charTextureSVG(id, "neutral", "open") });
    specs.push({ key: charKey(id, "neutral", "blink"), svg: charTextureSVG(id, "neutral", "blink") });
    if (id !== "you") specs.push({ key: `char-${id}-point`, svg: plushSVG(id, "neutral", { pointing: true }, CHAR_PX) });
    // You walk a lot, so your calm walk cycle is ready from the start; others are made when needed.
    if (id === "you") WALK_STEPS.forEach((_, i) => specs.push({ key: walkKey(id, "neutral", i), svg: walkTextureSVG(id, "neutral", i) }));
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
  specs.push({ key: "prop-street_bunting", svg: streetBuntingSVG() });
  for (const name of Object.keys(PROPS)) specs.push({ key: `prop-${name}`, svg: propSVG(name) });
  for (const item of SHED_ITEMS) specs.push({ key: `shed-item-${item.id}`, svg: shedItemSVG(item.id) });
  specs.push({ key: "waterwheel", svg: waterwheelSVG() });
  return specs;
}
