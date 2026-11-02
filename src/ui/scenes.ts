// Panels the Ink story hands off to: deciding whether the feeling matches what
// happened (DBT: check the facts), the mending puzzle (DBT: repair), and
// looking back over the day (DBT: chain analysis). Each resolves with what the
// player did. Player-facing text avoids DBT terms.

import { emotionFits, FIT_QUESTIONS, HOTSPOTS, type FitAnswers, type HotspotId, type Variant } from "../logic/facts";
import { buildChain, type ChainRecord, type LinkId } from "../logic/chain";
import type { Sound } from "../audio/sound";
import { bodySignals, guiltFits, REST_QUESTIONS, type RestAnswers } from "../logic/rest";

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: { class?: string; text?: string } = {},
  ...children: (Node | null)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text) node.textContent = props.text;
  for (const c of children) if (c) node.appendChild(c);
  return node;
}

function button(text: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = h("button", { class: cls, text });
  b.addEventListener("click", onClick);
  return b;
}

function openPanel(panel: HTMLElement, ...children: Node[]) {
  panel.replaceChildren(h("div", { class: "panel-card" }, ...children));
  panel.hidden = false;
}

function closePanel(panel: HTMLElement) {
  panel.hidden = true;
  panel.replaceChildren();
}

/** The card shown when the player finds out what actually happened. */
export function factCard(variant: Variant, id: HotspotId): HTMLElement {
  const spot = HOTSPOTS[variant].find((s) => s.id === id)!;
  return h(
    "div",
    { class: "factcard" },
    h("h3", { text: spot.name }),
    h("p", { class: "shame-view" }, h("span", { text: "As the feeling tells it" }), document.createTextNode(spot.shameView)),
    h("p", { class: "fact" }, h("span", { text: "What actually happened" }), document.createTextNode(spot.fact)),
  );
}

// --- Does the feeling match what happened? ------------------------------------

export interface FitResult {
  fit: boolean;
  answers: FitAnswers;
}

export function runFitScene(panel: HTMLElement, variant: Variant, found: HotspotId[]): Promise<FitResult> {
  return new Promise((resolve) => {
    const answers: Partial<FitAnswers> = {};
    const result = h("div", { class: "fit-result" });
    const rows = FIT_QUESTIONS.map((q) => {
      const opts = h("div", { class: "yn" });
      for (const [label, value] of [["Yes", true], ["No", false]] as const) {
        const b = button(label, "choice small", () => {
          answers[q.key] = value;
          opts.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
          conclude();
        });
        opts.appendChild(b);
      }
      return h("div", { class: "fit-q" }, h("p", { text: q.text }), opts);
    });

    function conclude() {
      if (answers.rejection === undefined || answers.values === undefined) return;
      const a = answers as FitAnswers;
      const fit = emotionFits(a);
      result.replaceChildren(
        h("p", { text: fit ? "From your answers, the feeling matches what happened." : "From your answers, the feeling doesn't match what happened." }),
        button("Continue", "primary", () => {
          closePanel(panel);
          resolve({ fit, answers: a });
        }),
      );
    }

    const cards = h("div", { class: "found" }, ...found.map((id) => factCard(variant, id)));
    openPanel(
      panel,
      h("h2", { text: "What you found out" }),
      cards,
      h("p", { class: "hint", text: "Shame makes sense when people you care about would really push you away over this. Guilt makes sense when you went against something you care about." }),
      ...rows,
      result,
    );
  });
}

// --- Checking in (chapter two) -------------------------------------------------

export interface CheckInResult {
  guiltFits: boolean;
  answers: RestAnswers;
}

/** Notice what your body is saying, then check whether guilt about resting fits. */
export function runCheckInScene(panel: HTMLElement, tasksDone: number): Promise<CheckInResult> {
  return new Promise((resolve) => {
    const answers: Partial<RestAnswers> = {};
    const result = h("div", { class: "fit-result" });
    const rows = REST_QUESTIONS.map((q) => {
      const opts = h("div", { class: "yn" });
      for (const [label, value] of [["Yes", true], ["No", false]] as const) {
        const b = button(label, "choice small", () => {
          answers[q.key] = value;
          opts.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
          conclude();
        });
        opts.appendChild(b);
      }
      return h("div", { class: "fit-q" }, h("p", { text: q.text }), opts);
    });

    function conclude() {
      if (answers.letsDown === undefined || answers.pushedAway === undefined) return;
      const a = answers as RestAnswers;
      const fits = guiltFits(a);
      result.replaceChildren(
        h("p", { text: fits ? "From your answers, the guilt about stopping matches what's happening." : "From your answers, the guilt about stopping doesn't match what's happening." }),
        button("Continue", "primary", () => {
          closePanel(panel);
          resolve({ guiltFits: fits, answers: a });
        }),
      );
    }

    const signals = h("ul", { class: "signals" }, ...bodySignals(tasksDone).map((t) => h("li", { text: t })));
    openPanel(
      panel,
      h("h2", { text: "What your body is telling you" }),
      signals,
      h("p", { class: "hint", text: "Bakers, Mara and Tobin all have helpers today. Ash offered to cover your stall." }),
      ...rows,
      result,
    );
  });
}

// --- Slow breathing (chapter three) ----------------------------------------------

/** Hold to breathe in, let go to breathe out, slower than in. Resolves with slow breaths taken. */
export function runBreathScene(panel: HTMLElement, sound: Sound, onBreath: () => void, reducedMotion: boolean): Promise<number> {
  const IN_MIN = 3; // seconds
  const OUT_MIN = 4.5;
  const GOAL = 4;
  return new Promise((resolve) => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.classList.add("breath-art");
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", "100");
    ring.setAttribute("cy", "100");
    ring.setAttribute("r", "90");
    ring.setAttribute("class", "breath-ring");
    const orb = document.createElementNS(NS, "circle");
    orb.setAttribute("cx", "100");
    orb.setAttribute("cy", "100");
    orb.setAttribute("class", "breath-orb");
    svg.append(ring, orb);

    const cue = h("p", { class: "breath-cue", text: "Press and hold to breathe in." });
    const count = h("p", { class: "hint", text: `0 of ${GOAL} slow breaths` });
    const hold = button("Hold to breathe in", "primary breath-btn", () => {});
    const stop = button("Back to the storm", "ghost", () => finish());

    let phase: "idle" | "in" | "out" = "idle";
    let inLength = 0;
    let breaths = 0;
    let raf = 0;
    let size = 20;

    const now = () => performance.now() / 1000;
    let t0 = now();

    const frame = () => {
      const t = now() - t0;
      if (phase === "in") size = Math.min(88, 20 + (t / IN_MIN) * 68);
      if (phase === "out") size = Math.max(20, size - (68 / OUT_MIN) * (1 / 60));
      orb.setAttribute("r", String(reducedMotion ? (phase === "in" ? 88 : 20) : size));
      if (phase === "in") cue.textContent = t < IN_MIN ? "In through your nose..." : "Now let go, and breathe out slowly.";
      if (phase === "out") cue.textContent = t < OUT_MIN ? "Out, slower than in..." : "Hold again for the next breath.";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const press = (on: boolean) => {
      if (on && phase !== "in") {
        // A breath counts when the last out-breath was long enough after a long enough in-breath.
        if (phase === "out" && inLength >= IN_MIN && now() - t0 >= OUT_MIN) {
          breaths++;
          count.textContent = `${breaths} of ${GOAL} slow breaths`;
          sound.play("ui", { pitch: 0.8 + breaths * 0.1 });
          onBreath();
          if (breaths >= GOAL) return finish();
        }
        phase = "in";
        t0 = now();
      } else if (!on && phase === "in") {
        inLength = now() - t0;
        phase = "out";
        t0 = now();
      }
      hold.classList.toggle("held", on);
    };

    const keyDown = (e: KeyboardEvent) => {
      if (e.key === " " && !e.repeat) {
        e.preventDefault();
        press(true);
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.key === " ") press(false);
    };
    hold.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      press(true);
    });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) hold.addEventListener(ev, () => press(false));
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    function finish() {
      // An out-breath in progress that's already long enough still counts.
      if (phase === "out" && inLength >= IN_MIN && now() - t0 >= OUT_MIN && breaths < GOAL) {
        breaths++;
        onBreath();
      }
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      closePanel(panel);
      resolve(breaths);
    }

    openPanel(
      panel,
      h("h2", { text: "Slow your breathing" }),
      h("p", { class: "hint", text: "Hold Space (or the button) to breathe in for a few seconds. Let go and breathe out for longer than you breathed in." }),
      svg,
      cue,
      count,
      h("div", { class: "row" }, hold, stop),
    );
  });
}

// --- Mending -------------------------------------------------------------------

/** Patch the torn lantern (borrowed-lantern story) or bend the dented ones back. */
export function runMendScene(panel: HTMLElement, variant: Variant, sound: Sound): Promise<void> {
  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (tag: string, attrs: Record<string, string | number>, parent: Element) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    parent.appendChild(node);
    return node;
  };
  return new Promise((resolve) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 300 230");
    svg.classList.add("mend-art");
    const status = h("p", { class: "hint" });
    let done = 0;

    const lantern = (cx: number, color: string, rx: number) => {
      const g = svgEl("g", {}, svg);
      svgEl("path", { d: `M${cx} 10 V30`, stroke: "#3a3340", "stroke-width": 4 }, g);
      svgEl("rect", { x: cx - 22, y: 26, width: 44, height: 12, rx: 3, fill: "#3a3340" }, g);
      svgEl("ellipse", { class: "paper", cx, cy: 110, rx, ry: 80, fill: color }, g);
      svgEl("rect", { x: cx - 22, y: 186, width: 44, height: 12, rx: 3, fill: "#3a3340" }, g);
      return g;
    };

    const finishIfDone = (total: number) => {
      status.textContent = done < total ? `${total - done} to go` : "Done.";
      if (done === total) {
        sound.play("mend");
        window.setTimeout(() => {
          closePanel(panel);
          resolve();
        }, 900);
      }
    };

    if (variant === "promise") {
      lantern(150, "#c94f6d", 70);
      const tear = [[146, 50], [156, 80], [144, 110], [156, 140], [148, 170], [152, 190]];
      for (let i = 0; i < tear.length - 1; i++) {
        const [x, y] = tear[i];
        const [nx, ny] = tear[i + 1];
        const seg = svgEl("path", { d: `M${x} ${y} L${nx} ${ny}`, class: "tear-seg" }, svg);
        const hit = svgEl("circle", { cx: (x + nx) / 2, cy: (y + ny) / 2, r: 16, class: "mend-spot", tabindex: 0, role: "button", "aria-label": `Patch the tear, piece ${i + 1}` }, svg);
        const patch = () => {
          if (seg.classList.contains("patched")) return;
          seg.classList.add("patched");
          hit.classList.add("used");
          sound.play("pickup", { pitch: 0.9 + i * 0.08 });
          done++;
          finishIfDone(tear.length - 1);
        };
        hit.addEventListener("click", patch);
        hit.addEventListener("keydown", (e) => ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") && patch());
      }
      openPanel(panel, h("h2", { text: "Patch the tear" }), h("p", { class: "hint", text: "Lay a strip of gold paper over each part of the tear." }), svg, status);
      finishIfDone(tear.length - 1);
    } else {
      [80, 220].forEach((cx, i) => {
        const g = lantern(cx, i ? "#f2b54a" : "#e9583c", 50);
        g.classList.add("dented");
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `Bend lantern ${i + 1} back into shape (press and hold)`);
        let held: number | undefined;
        let progress = 0;
        const start = () => {
          if (g.classList.contains("fixed") || held !== undefined) return;
          held = window.setInterval(() => {
            progress += 0.05;
            g.querySelector(".paper")!.setAttribute("rx", String(50 + 20 * Math.min(1, progress)));
            if (progress >= 1) {
              window.clearInterval(held);
              held = undefined;
              g.classList.add("fixed");
              sound.play("pickup", { pitch: 1 + i * 0.2 });
              done++;
              finishIfDone(2);
            }
          }, 40);
        };
        const stop = () => {
          window.clearInterval(held);
          held = undefined;
        };
        g.addEventListener("pointerdown", start);
        g.addEventListener("pointerup", stop);
        g.addEventListener("pointerleave", stop);
        g.addEventListener("keydown", (e) => ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") && start());
        g.addEventListener("keyup", stop);
      });
      openPanel(panel, h("h2", { text: "Bend them back" }), h("p", { class: "hint", text: "Press and hold each dented lantern until it's round again." }), svg, status);
      finishIfDone(2);
    }
  });
}

// --- Looking back over the day -------------------------------------------------

export function runChainScene(panel: HTMLElement, record: ChainRecord, onTap: (id: LinkId) => void): Promise<void> {
  const links = buildChain(record);
  return new Promise((resolve) => {
    const reflection = h("div", { class: "reflection" });
    reflection.hidden = true;
    const done = button("Continue", "primary", () => {
      closePanel(panel);
      resolve();
    });
    done.disabled = true;

    const chain = h("ol", { class: "chain" });
    for (const link of links) {
      const b = button("", "link", () => {
        onTap(link.id);
        chain.querySelectorAll(".link").forEach((x) => x.classList.toggle("picked", x === b));
        reflection.hidden = false;
        reflection.replaceChildren(h("h3", { text: link.title }), h("p", { text: link.reflection }));
        done.disabled = false;
      });
      b.append(h("strong", { text: link.title }), h("span", { text: link.detail }));
      chain.appendChild(h("li", {}, b));
    }

    openPanel(
      panel,
      h("h2", { text: "Looking back" }),
      h("p", { class: "hint", text: "Tap a moment where doing something different would change how the day went. Tap as many as you like." }),
      chain,
      reflection,
      done,
    );
  });
}
