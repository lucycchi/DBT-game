// Draws the distress and urge bars and the distress curve. Animates through the
// meter history one point at a time so the up-then-down shape is visible.

import type { MeterState } from "../logic/meter";

const STEP_MS = 160;

export interface MeterView {
  render(m: MeterState): void;
}

export function createMeterView(root: HTMLElement, reducedMotion: boolean): MeterView {
  const distressFill = root.querySelector<HTMLElement>(".fill.distress")!;
  const urgeFill = root.querySelector<HTMLElement>(".fill.urge")!;
  const distressVal = root.querySelector<HTMLElement>('[data-val="distress"]')!;
  const urgeVal = root.querySelector<HTMLElement>('[data-val="urge"]')!;
  const line = root.querySelector<SVGPolylineElement>(".curve-line")!;

  let shown = 0; // how many history points are drawn
  let timer: number | undefined;
  let latest: MeterState | null = null;

  const word = (n: number) => (n >= 75 ? "very high" : n >= 50 ? "high" : n >= 25 ? "medium" : "low");

  function drawCurve(points: number[]) {
    const n = Math.max(points.length - 1, 1);
    line.setAttribute(
      "points",
      points.map((v, i) => `${((i / n) * 200).toFixed(1)},${(58 - (v / 100) * 56).toFixed(1)}`).join(" "),
    );
  }

  function frame() {
    if (!latest) return;
    const h = latest.history;
    // A shorter history means the meter was reset (new game).
    if (shown > h.length) shown = 0;
    shown = reducedMotion ? h.length : Math.min(h.length, shown + 1);
    const current = shown === h.length ? latest.distress : h[shown - 1];
    distressFill.style.width = `${current}%`;
    distressVal.textContent = word(current);
    urgeFill.style.width = `${latest.urge}%`;
    urgeVal.textContent = word(latest.urge);
    drawCurve(h.slice(0, shown));
    timer = shown < h.length ? window.setTimeout(frame, STEP_MS) : undefined;
  }

  return {
    render(m) {
      latest = m;
      if (timer === undefined) frame();
    },
  };
}
