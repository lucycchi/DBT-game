// Every image in the game, generated here as SVG. Nothing is pre-made.
// One style throughout: a soft, pastel cottage village in a sunny meadow,
// rounded shapes, no outlines, warm light at night.

import { CHARACTER_IDS, EXPRESSIONS, type CharacterId, type Expression } from "../logic/cast";
import { characterSVG as plushSVG, FEET, type Frame } from "../ui/plush";
import { AREAS, GROUND_Y, HOOKS, POLES, groundY, VIEW_H, type Area } from "./layout";

export const PAPER = ["#e9583c", "#f2b54a", "#e98a3c", "#d9473f", "#f0c75e", "#c94f6d"];
const FLAGS = ["#f08a6a", "#f6d36a", "#8fcc76", "#7fc4dc", "#e98fb4"];
const FONT = "Trebuchet MS, Verdana, sans-serif";

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

/** Builders draw in an area's own coordinates; `ox` is the area's world x, for lights. */
interface Ctx {
  ox: number;
}
const light = (c: Ctx, x: number, y: number) => WINDOW_LIGHTS.push({ x: c.ox + x, y });

// --- Small parts ----------------------------------------------------------------

function sqWindow(c: Ctx, x: number, y: number, w: number, h: number, shutters?: string) {
  light(c, x + w / 2, y + h / 2);
  let s = "";
  if (shutters) s += `<rect x="${f(x - 12)}" y="${f(y)}" width="10" height="${h}" rx="3" fill="${shutters}"/><rect x="${f(x + w + 2)}" y="${f(y)}" width="10" height="${h}" rx="3" fill="${shutters}"/>`;
  return s + `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="6" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(x + w / 2)} ${f(y + 2)} V${f(y + h - 2)} M${f(x + 2)} ${f(y + h / 2)} H${f(x + w - 2)}" stroke="#ffffff" stroke-width="3"/>`;
}

function archWindow(c: Ctx, x: number, y: number, w: number, h: number) {
  light(c, x + w / 2, y + h / 2);
  return `<path d="M${f(x)} ${f(y + h)} V${f(y + w / 2)} A${w / 2} ${w / 2} 0 0 1 ${f(x + w)} ${f(y + w / 2)} V${f(y + h)} Z" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(x + w / 2)} ${f(y + 3)} V${f(y + h - 2)}" stroke="#ffffff" stroke-width="3"/>`;
}

function porthole(c: Ctx, cx: number, cy: number, r: number) {
  light(c, cx, cy);
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/><path d="M${f(cx - r + 3)} ${f(cy)} H${f(cx + r - 3)} M${f(cx)} ${f(cy - r + 3)} V${f(cy + r - 3)}" stroke="#ffffff" stroke-width="2.5"/>`;
}

function flowerBox(x: number, y: number, w: number) {
  let s = `<rect x="${f(x - 4)}" y="${y}" width="${w + 8}" height="9" rx="4" fill="#a8674a"/>`;
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

function lollipop(x: number, base: number, size: number, r: () => number) {
  let s = `<rect x="${x - 8}" y="${f(base - size * 1.3)}" width="16" height="${f(size * 1.3)}" rx="6" fill="#9b6b43"/><circle cx="${x}" cy="${f(base - size * 1.55)}" r="${size}" fill="#6db35f"/><circle cx="${f(x - size * 0.32)}" cy="${f(base - size * 1.8)}" r="${f(size * 0.42)}" fill="#8fcc76"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${f(x - size * 0.5 + r() * size)}" cy="${f(base - size * 1.9 + r() * size * 0.9)}" r="4.5" fill="#f08a6a"/>`;
  return s;
}

function lamppost(c: Ctx, x: number) {
  light(c, x, GROUND_Y - 108);
  return `<rect x="${x - 4}" y="${GROUND_Y - 96}" width="8" height="100" rx="3" fill="#6b5a6a"/><path d="M${x - 14} ${GROUND_Y - 120} h28 l-4 22 h-20 Z" fill="#fde6a8" stroke="#6b5a6a" stroke-width="4" stroke-linejoin="round"/><circle cx="${x}" cy="${GROUND_Y - 124}" r="4" fill="#6b5a6a"/>`;
}

function sign(x: number, y: number, text: string) {
  const w = text.length * 13 + 36;
  return `<rect x="${f(x - w / 2)}" y="${y}" width="${f(w)}" height="32" rx="16" fill="#a8674a"/><text x="${x}" y="${y + 22}" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="bold" fill="#fff6e6" letter-spacing="1">${text}</text>`;
}

function bunting(x0: number, x1: number, y: number, sag: number) {
  let s = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}" fill="none" stroke="#8a6a52" stroke-width="2.5"/>`;
  const n = Math.floor((x1 - x0) / 46);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y + 4 * sag * t * (1 - t);
    s += `<path d="M${f(x - 12)} ${f(yy)} L${f(x + 12)} ${f(yy)} L${f(x)} ${f(yy + 24)} Z" fill="${FLAGS[i % FLAGS.length]}"/>`;
  }
  return s;
}

/** The street: a flowery grass edge, then a sandy path or soft cobbles. */
function ground(w: number, seed: number, cobbled: boolean) {
  const r = rng(seed);
  let s = `<rect x="0" y="${GROUND_Y - 8}" width="${w}" height="18" fill="#9fd07a"/>`;
  for (let i = 0; i < w / 30; i++) s += `<circle cx="${f(r() * w)}" cy="${f(GROUND_Y - 2 + r() * 10)}" r="3.5" fill="${FLAGS[i % FLAGS.length]}"/>`;
  s += `<rect x="0" y="${GROUND_Y + 8}" width="${w}" height="${VIEW_H - GROUND_Y}" fill="${cobbled ? "#ecd3a6" : "#f2d7a2"}"/>`;
  if (cobbled) {
    for (let row = 0; row < 12; row++) {
      const y = GROUND_Y + 22 + row * 20;
      for (let x = (row % 2) * 22; x < w + 30; x += 44 + r() * 6) {
        s += `<ellipse cx="${f(x)}" cy="${y}" rx="${f(18 + r() * 3)}" ry="7" fill="${r() > 0.5 ? "#e0c08c" : "#e6c99a"}"/><ellipse cx="${f(x - 3)}" cy="${y - 2}" rx="10" ry="2.5" fill="#fbecd0" opacity=".7"/>`;
      }
    }
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

// --- Houses: five kinds, so the village reads as a place where different people live

interface HouseOpts {
  door?: number;
  doorColor?: string;
}

function gableCottage(c: Ctx, x: number, w: number, h: number, wall: string, roof: string, o: HouseOpts = {}) {
  const t = GROUND_Y - h;
  const rh = w * 0.45;
  let s = `<rect x="${f(x + w * 0.66)}" y="${f(t - rh * 0.8)}" width="22" height="${f(rh * 0.7)}" rx="5" fill="#b9775a"/>`;
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="16" fill="${wall}"/>`;
  s += `<path d="M${x - 14} ${t + 10} L${x + w / 2} ${f(t - rh)} L${x + w + 14} ${t + 10} Z" fill="${roof}" stroke="${roof}" stroke-width="18" stroke-linejoin="round"/>`;
  s += `<path d="M${x + 8} ${t - 4} L${x + w / 2 - 8} ${f(t - rh + 18)}" stroke="#ffffff" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"/>`;
  s += porthole(c, x + w / 2, t - rh * 0.38, 13);
  const door = o.door ?? x + w / 2;
  for (const wx of [x + 22, x + w - 56]) {
    if (Math.abs(wx + 17 - door) < 45) continue;
    s += sqWindow(c, wx, t + 34, 34, 38) + flowerBox(wx, t + 74, 34);
  }
  return s + roundDoor(door, 42, o.doorColor ?? "#a8674a");
}

function townhouse(c: Ctx, x: number, w: number, h: number, wall: string, roof: string) {
  const t = GROUND_Y - h;
  let s = `<path d="M${x - 10} ${t + 6} C${x - 6} ${t - 50} ${f(x + w * 0.2)} ${t - 60} ${x + w / 2} ${t - 74} C${f(x + w * 0.8)} ${t - 60} ${x + w + 6} ${t - 50} ${x + w + 10} ${t + 6} Z" fill="${roof}"/>`;
  s += `<path d="M${x + w / 2} ${t - 74} V${t - 110}" stroke="#7a5a44" stroke-width="3"/><path d="M${x + w / 2} ${t - 110} l26 8 l-26 8 Z" fill="#f6d36a"/>`;
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="8" fill="${wall}"/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="${f(x + 10 + ((i * 37) % (w - 30)))}" y="${f(t + 20 + i * 26)}" width="16" height="7" rx="3" fill="#000" opacity=".06"/>`;
  s += archWindow(c, x + w / 2 - 15, t - 46, 30, 40);
  for (const fy of [t + 22, t + 86]) s += sqWindow(c, x + 16, fy, 28, 36, "#7fb0c9") + sqWindow(c, x + w - 44, fy, 28, 36, "#7fb0c9");
  return s + squareDoor(x + w / 2, 36, 58, "#5f8fb0");
}

function bakery(c: Ctx, x: number, w: number, h: number, wall: string, roof: string) {
  const t = GROUND_Y - h;
  let s = `<rect x="${f(x + w * 0.75)}" y="${t - 70}" width="24" height="56" rx="5" fill="#b9775a"/>`;
  s += `<path d="M${x - 12} ${t + 8} Q${x - 12} ${t - 62} ${x + w / 2} ${t - 64} Q${x + w + 12} ${t - 62} ${x + w + 12} ${t + 8} Z" fill="${roof}"/>`;
  for (let i = 1; i < 6; i++) {
    const rx = x - 12 + (i * (w + 24)) / 6;
    s += `<path d="M${f(rx)} ${t + 6} Q${f(rx)} ${t - 40} ${f(rx + (i - 3) * 6)} ${t - 56}" stroke="#ffffff" stroke-opacity=".22" stroke-width="5" fill="none"/>`;
  }
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="12" fill="${wall}"/>`;
  s += `<rect x="${x + w / 2 - 64}" y="${t + 14}" width="128" height="32" rx="16" fill="#a8674a"/><text x="${x + w / 2}" y="${t + 36}" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="18" fill="#fff6e6" letter-spacing="1">BAKERY</text>`;
  const ay = t + 62;
  for (let i = 0; i < 8; i++) s += `<path d="M${f(x + 6 + (i * (w - 12)) / 8)} ${ay} h${f((w - 12) / 8)} v26 q${f(-(w - 12) / 16)} 12 ${f(-(w - 12) / 8)} 0 Z" fill="${i % 2 ? "#ffffff" : "#ef7a6a"}"/>`;
  light(c, x + 18 + w * 0.25, ay + 70);
  s += `<rect x="${x + 18}" y="${ay + 44}" width="${f(w * 0.5)}" height="54" rx="8" fill="#bfe3ef" stroke="#ffffff" stroke-width="4"/>`;
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${f(x + 36 + i * w * 0.11)}" cy="${ay + 88}" rx="13" ry="8" fill="${i % 2 ? "#d9984f" : "#c47e3f"}"/>`;
  return s + squareDoor(x + w - 50, 42, 66, "#a8674a");
}

function turretCottage(c: Ctx, x: number, w: number, h: number, wall: string, roof: string) {
  const t = GROUND_Y - h;
  const tx = x + w - 62;
  const tw = 74;
  const tt = t - 60;
  let s = `<path d="M${x - 14} ${t + 10} L${x + 30} ${t - 52} L${tx - 10} ${t - 52} L${tx + 10} ${t + 10} Z" fill="${roof}" stroke="${roof}" stroke-width="14" stroke-linejoin="round"/>`;
  s += `<rect x="${x}" y="${t}" width="${tx - x + 10}" height="${h + 14}" rx="14" fill="${wall}"/>`;
  s += `<rect x="${tx}" y="${tt}" width="${tw}" height="${GROUND_Y - tt + 14}" rx="${tw / 2}" fill="${wall}"/><rect x="${tx}" y="${tt + 30}" width="${tw}" height="${GROUND_Y - tt - 16}" fill="${wall}"/>`;
  s += `<path d="M${tx - 10} ${tt + 12} L${tx + tw / 2} ${tt - 70} L${tx + tw + 10} ${tt + 12} Z" fill="#7a9fd0" stroke="#7a9fd0" stroke-width="10" stroke-linejoin="round"/>`;
  s += `<path d="M${tx + tw / 2} ${tt - 70} V${tt - 96}" stroke="#7a5a44" stroke-width="3"/><path d="M${tx + tw / 2 - 14} ${tt - 92} h28 M${tx + tw / 2 + 10} ${tt - 96} l6 4 l-6 4" stroke="#7a5a44" stroke-width="3" fill="none"/>`;
  s += porthole(c, tx + tw / 2, tt + 34, 14) + archWindow(c, tx + tw / 2 - 14, t + 50, 28, 46);
  s += sqWindow(c, x + 24, t + 36, 40, 40) + flowerBox(x + 24, t + 80, 40);
  return s + roundDoor(f(x + (tx - x) * 0.62), 44, "#7a9a5a");
}

function porchHouse(c: Ctx, x: number, w: number, h: number, wall: string, roof: string) {
  const t = GROUND_Y - h;
  let s = `<path d="M${x - 16} ${t + 10} L${f(x + w * 0.22)} ${t - 60} L${f(x + w * 0.78)} ${t - 60} L${x + w + 16} ${t + 10} Z" fill="${roof}" stroke="${roof}" stroke-width="14" stroke-linejoin="round"/>`;
  s += `<rect x="${f(x + w * 0.38)}" y="${t - 52}" width="${f(w * 0.24)}" height="40" rx="6" fill="${wall}"/><path d="M${f(x + w * 0.35)} ${t - 48} L${f(x + w * 0.5)} ${t - 74} L${f(x + w * 0.65)} ${t - 48} Z" fill="${roof}" stroke="${roof}" stroke-width="8" stroke-linejoin="round"/>`;
  s += sqWindow(c, x + w * 0.5 - 14, t - 46, 28, 28);
  s += `<rect x="${f(x + w * 0.2)}" y="${t - 90}" width="18" height="40" rx="4" fill="#b9775a"/>`;
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="12" fill="${wall}"/>`;
  for (let yy = t + 14; yy < GROUND_Y - 6; yy += 16) s += `<path d="M${x + 6} ${yy} H${x + w - 6}" stroke="#000" stroke-opacity=".05" stroke-width="2"/>`;
  s += sqWindow(c, x + 22, t + 30, 46, 40, "#c97b6a") + sqWindow(c, x + w - 68, t + 30, 46, 40, "#c97b6a");
  s += `<path d="M${f(x + w * 0.3)} ${t + 84} H${f(x + w * 0.7)} L${f(x + w * 0.74)} ${t + 98} H${f(x + w * 0.26)} Z" fill="${roof}"/>`;
  for (const px of [x + w * 0.3, x + w * 0.68]) s += `<rect x="${f(px)}" y="${t + 96}" width="7" height="${GROUND_Y - t - 96}" fill="#ffffff"/>`;
  s += `<rect x="${f(x + w * 0.28)}" y="${GROUND_Y - 2}" width="${f(w * 0.44)}" height="8" rx="3" fill="#c9a37a"/>`;
  return s + squareDoor(x + w / 2, 40, 58, "#c97b6a");
}

/** The lantern workshop: a wide shop with a big arched double door and a lantern sign. */
function workshopFront(c: Ctx, x: number, w: number, h: number, wall: string, roof: string, door: number) {
  const t = GROUND_Y - h;
  let s = `<path d="M${x - 18} ${t + 10} L${x + w / 2} ${f(t - w * 0.32)} L${x + w + 18} ${t + 10} Z" fill="${roof}" stroke="${roof}" stroke-width="18" stroke-linejoin="round"/>`;
  s += `<rect x="${x}" y="${t}" width="${w}" height="${h + 14}" rx="14" fill="${wall}"/>`;
  s += `<path d="M${x + 6} ${t + 8} V${GROUND_Y} M${x + w - 6} ${t + 8} V${GROUND_Y}" stroke="#d8b48a" stroke-width="10" stroke-linecap="round"/>`;
  s += archWindow(c, x + 34, t + 44, 46, 64) + archWindow(c, x + w - 80, t + 44, 46, 64);
  s += sign(x + w / 2, t + 8, "LANTERNS");
  // A paper lantern hanging from a bracket
  s += `<path d="M${x + w - 20} ${t + 60} h34 v10" stroke="#7a5a44" stroke-width="4" fill="none"/><rect x="${x + w + 2}" y="${t + 70}" width="24" height="30" rx="10" fill="${PAPER[1]}"/>`;
  light(c, x + w + 14, t + 85);
  // Big arched double door
  s += `<path d="M${door - 34} ${GROUND_Y + 4} V${GROUND_Y - 56} A34 34 0 0 1 ${door + 34} ${GROUND_Y - 56} V${GROUND_Y + 4} Z" fill="#8a5a3a"/><path d="M${door} ${GROUND_Y - 88} V${GROUND_Y + 4}" stroke="#6b4430" stroke-width="3"/><circle cx="${door - 8}" cy="${GROUND_Y - 34}" r="3" fill="#f6d36a"/><circle cx="${door + 8}" cy="${GROUND_Y - 34}" r="3" fill="#f6d36a"/>`;
  return s;
}

// --- Areas ------------------------------------------------------------------------

function laneSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(11);
  let s = lollipop(60, GROUND_Y, 40, r) + lollipop(1030, GROUND_Y, 36, r);
  // Nell's cottage: someone painted her door yellow one spring, long ago. Her step is out front.
  s += gableCottage(c, 150, 250, 190, "#fff1d6", "#e57b5f", { door: 300, doorColor: "#f2c43a" });
  s += `<rect x="260" y="${GROUND_Y - 6}" width="100" height="14" rx="5" fill="#d8c4a8"/>`;
  s += townhouse(c, 440, 130, 236, "#dcefe1", "#6fa7c9");
  // Your house, with its porch; the front door is at x 740.
  s += porchHouse(c, 600, 280, 165, "#e3ecf7", "#e8a04f");
  s += gableCottage(c, 905, 120, 150, "#fde6a8", "#b986c9");
  s += lamppost(c, 415) + lamppost(c, 890);
  s += sign(740, GROUND_Y - 300, "LANTERN LANE");
  s += ground(w, 3, false);
  return wrap(w, VIEW_H, s);
}

function streetSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const r = rng(23);
  let s = lollipop(410, GROUND_Y, 34, r);
  s += bakery(c, 30, 320, 200, "#ffe1d4", "#8bbf74");
  // The workshop door is at world x 1650 (local 600).
  s += workshopFront(c, 470, 260, 210, "#fde6a8", "#b986c9", 600);
  s += townhouse(c, 850, 130, 220, "#e3ecf7", "#e57b5f");
  s += bunting(0, 460, GROUND_Y - 330, 28) + bunting(460, 1000, GROUND_Y - 320, 24);
  s += lamppost(c, 380) + lamppost(c, 810);
  s += ground(w, 29, false);
  return wrap(w, VIEW_H, s);
}

function squareSVG(a: Area): string {
  const c: Ctx = { ox: a.x0 };
  const w = a.x1 - a.x0;
  const lx = (x: number) => x - a.x0;
  const r = rng(37);
  let s = lollipop(30, GROUND_Y, 40, r) + lollipop(1120, GROUND_Y, 42, r);
  // Houses stand to either side so the fountain has open sky behind it.
  s += gableCottage(c, 150, 190, 170, "#ffe1d4", "#e57b5f");
  s += porchHouse(c, 680, 200, 150, "#fff1d6", "#8bbf74");
  s += turretCottage(c, 905, 225, 170, "#e3ecf7", "#b986c9");
  // Lantern poles and the string between them
  for (const p of POLES) s += `<rect x="${lx(p) - 7}" y="${GROUND_Y - 370}" width="14" height="374" rx="6" fill="#b98a5e"/><circle cx="${lx(p)}" cy="${GROUND_Y - 372}" r="10" fill="#9b6b43"/>`;
  const hookPath = HOOKS.map((h) => `L${f(lx(h.x))} ${f(h.y)}`).join(" ");
  s += `<path d="M${lx(POLES[0])} ${GROUND_Y - 364} ${hookPath} L${lx(POLES[1])} ${GROUND_Y - 364}" fill="none" stroke="#8a6a52" stroke-width="2.5"/>`;
  // Fountain: a round pastel basin with a little tiered top
  const fx = 500;
  s += `<ellipse cx="${fx}" cy="${GROUND_Y + 4}" rx="152" ry="16" fill="#000" opacity=".08"/>`;
  s += `<path d="M${fx - 140} ${GROUND_Y + 2} Q${fx - 140} ${GROUND_Y - 58} ${fx - 120} ${GROUND_Y - 58} H${fx + 120} Q${fx + 140} ${GROUND_Y - 58} ${fx + 140} ${GROUND_Y + 2} Z" fill="#e8e2f0"/>`;
  s += `<rect x="${fx - 146}" y="${GROUND_Y - 66}" width="292" height="16" rx="8" fill="#f6f2fa"/><rect x="${fx - 124}" y="${GROUND_Y - 52}" width="248" height="10" rx="5" fill="#9fd6ea"/>`;
  s += `<rect x="${fx - 16}" y="${GROUND_Y - 168}" width="32" height="104" rx="14" fill="#e8e2f0"/>`;
  s += `<path d="M${fx - 64} ${GROUND_Y - 166} Q${fx} ${GROUND_Y - 132} ${fx + 64} ${GROUND_Y - 166} Z" fill="#f6f2fa"/><circle cx="${fx}" cy="${GROUND_Y - 190}" r="18" fill="#e8e2f0"/>`;
  s += `<path d="M${fx - 10} ${GROUND_Y - 196} Q${fx - 60} ${GROUND_Y - 226} ${fx - 72} ${GROUND_Y - 166} M${fx + 10} ${GROUND_Y - 196} Q${fx + 60} ${GROUND_Y - 226} ${fx + 72} ${GROUND_Y - 166}" fill="none" stroke="#9fd6ea" stroke-width="6" stroke-linecap="round" opacity=".9"/>`;
  // Benches
  for (const bx of [270, 760]) s += `<rect x="${bx - 50}" y="${GROUND_Y - 34}" width="100" height="12" rx="6" fill="#c98a5e"/><rect x="${bx - 42}" y="${GROUND_Y - 24}" width="8" height="26" rx="3" fill="#9b6b43"/><rect x="${bx + 34}" y="${GROUND_Y - 24}" width="8" height="26" rx="3" fill="#9b6b43"/>`;
  // The cart at the edge of the square
  const cx = lx(3080);
  s += `<rect x="${cx - 60}" y="${GROUND_Y - 62}" width="120" height="40" rx="10" fill="#c98a5e"/><path d="M${cx + 60} ${GROUND_Y - 48} l46 -22" stroke="#9b6b43" stroke-width="6" stroke-linecap="round"/>`;
  s += `<circle cx="${cx - 34}" cy="${GROUND_Y - 16}" r="17" fill="#7a5a44"/><circle cx="${cx - 34}" cy="${GROUND_Y - 16}" r="6" fill="#c98a5e"/><circle cx="${cx + 34}" cy="${GROUND_Y - 16}" r="17" fill="#7a5a44"/><circle cx="${cx + 34}" cy="${GROUND_Y - 16}" r="6" fill="#c98a5e"/>`;
  s += lamppost(c, lx(2120)) + lamppost(c, lx(3000));
  s += ground(w, 41, true);
  // Market Street's paving fades into the square's cobbles, instead of stopping in a straight line.
  s += `<defs><linearGradient id="pave-fade"><stop offset="0" stop-color="#f2d7a2"/><stop offset="1" stop-color="#f2d7a2" stop-opacity="0"/></linearGradient></defs><rect x="0" y="${GROUND_Y + 8}" width="220" height="${VIEW_H - GROUND_Y}" fill="url(#pave-fade)"/>`;
  // The loose cobblestone, tipped up by the fountain
  s += `<ellipse cx="${lx(2470)}" cy="${GROUND_Y + 12}" rx="18" ry="8" fill="#d8b582" transform="rotate(-14 ${lx(2470)} ${GROUND_Y + 12})"/><ellipse cx="${lx(2470) - 3}" cy="${GROUND_Y + 9}" rx="9" ry="3" fill="#fbecd0" transform="rotate(-14 ${lx(2470)} ${GROUND_Y + 12})"/>`;
  return wrap(w, VIEW_H, s);
}

function hillSVG(a: Area): string {
  const w = a.x1 - a.x0;
  const r = rng(29);
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 20) pts.push(`${x} ${f(groundY(a.x0 + x))}`);
  let s = lollipop(240, groundY(a.x0 + 240), 40, r) + lollipop(560, groundY(a.x0 + 560), 46, r) + lollipop(1150, groundY(a.x0 + 1150), 40, r);
  // A soft rock with the hollow in it
  const hx = 1000;
  const gy = groundY(a.x0 + hx);
  s += `<path d="M${hx - 190} ${gy + 4} Q${hx - 180} ${gy - 220} ${hx - 10} ${gy - 232} Q${hx + 170} ${gy - 220} ${hx + 196} ${gy + 4} Z" fill="#d6cbd9"/>`;
  s += `<path d="M${hx - 140} ${gy - 130} Q${hx - 60} ${gy - 190} ${hx + 50} ${gy - 168}" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/>`;
  s += `<path d="M${hx - 74} ${gy + 4} Q${hx - 80} ${gy - 124} ${hx} ${gy - 130} Q${hx + 80} ${gy - 124} ${hx + 74} ${gy + 4} Z" fill="#4a3f52"/>`;
  s += `<path d="M${hx - 58} ${gy + 2} Q${hx - 62} ${gy - 100} ${hx} ${gy - 108}" fill="none" stroke="#5e5268" stroke-width="7"/>`;
  for (let i = 0; i < 8; i++) s += `<circle cx="${hx - 90 + i * 26}" cy="${gy - 134 + (i % 2) * 7}" r="10" fill="${["#8fcc76", "#6db35f"][i % 2]}"/>`;
  for (let i = 0; i < 5; i++) s += `<circle cx="${hx - 70 + i * 34}" cy="${gy - 144 + (i % 2) * 6}" r="4" fill="${FLAGS[i]}"/>`;
  // Grass
  s += `<path d="M0 ${VIEW_H} L${pts.join(" L")} L${w} ${VIEW_H} Z" fill="#9fd07a"/>`;
  s += `<path d="M${pts.join(" L")}" fill="none" stroke="#8cc26a" stroke-width="10"/>`;
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

export const SKIES: Record<string, [string, string]> = {
  afternoon: ["#9fd8e6", "#fdf0c4"],
  sunset: ["#f09a7a", "#ffd593"],
  night: ["#24204e", "#4a3d78"],
  morning: ["#bfe6ef", "#fff4d6"],
  storm: ["#1b2030", "#3d4658"],
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
    for (const e of EXPRESSIONS) specs.push({ key: charKey(id, e), svg: charTextureSVG(id, e) });
    // Calm talking and blinking are used all the time, so make them up front.
    specs.push({ key: charKey(id, "neutral", "open"), svg: charTextureSVG(id, "neutral", "open") });
    specs.push({ key: charKey(id, "neutral", "blink"), svg: charTextureSVG(id, "neutral", "blink") });
    if (id !== "you") specs.push({ key: `char-${id}-point`, svg: plushSVG(id, "neutral", { pointing: true }, CHAR_PX) });
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
