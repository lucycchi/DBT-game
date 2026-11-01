// Interactive scenes the Ink story hands off to: check the facts, chain review,
// and the text-only transfer question. Each resolves with what the player did.

import {
  canDecide,
  emotionFits,
  FIT_QUESTIONS,
  HOTSPOTS,
  initialFacts,
  inspect,
  MIN_INSPECTED,
  type FactsState,
  type FitAnswers,
  type HotspotId,
  type Variant,
} from "../logic/facts";
import { buildChain, type ChainRecord, type LinkId } from "../logic/chain";
import type { WorldView } from "./world";

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

// --- Check the facts -------------------------------------------------------

export interface FactsResult {
  fit: boolean;
  answers: FitAnswers;
  inspected: HotspotId[];
}

export function runFactsScene(
  panel: HTMLElement,
  world: WorldView,
  variant: Variant,
  onInspect: (id: HotspotId) => void,
): Promise<FactsResult> {
  const spots = HOTSPOTS[variant];
  let facts: FactsState = initialFacts();

  return new Promise((resolve) => {
    const card = h("div", { class: "factcard" });
    card.hidden = true;
    const list = h("div", { class: "hotspots" });
    const decide = button("", "primary decide", () => askFit());
    const hint = h("p", { class: "hint", text: "Tap someone in the square, or pick from this list." });

    const updateDecide = () => {
      const left = MIN_INSPECTED - facts.inspected.length;
      decide.disabled = !canDecide(facts);
      decide.textContent = left > 0 ? `Look at ${left} more to decide` : "Does the feeling fit the facts?";
    };

    const show = (id: HotspotId) => {
      const spot = spots.find((s) => s.id === id);
      if (!spot) return;
      facts = inspect(facts, id);
      onInspect(id);
      world.markSeen(id);
      list.querySelector(`[data-id="${id}"]`)?.classList.add("seen");
      card.hidden = false;
      card.replaceChildren(
        h("h3", { text: spot.name }),
        h("p", { class: "shame-view" }, h("span", { text: "As the feeling tells it" }), document.createTextNode(spot.shameView)),
        h("p", { class: "fact" }, h("span", { text: "What actually happened" }), document.createTextNode(spot.fact)),
      );
      updateDecide();
    };

    for (const s of spots) {
      const b = button(s.name, "spot", () => show(s.id));
      b.dataset.id = s.id;
      list.appendChild(b);
    }
    world.onHotspot(show);
    updateDecide();
    panel.replaceChildren(h("div", { class: "scene facts" }, hint, list, card, decide));

    function askFit() {
      world.onHotspot(null);
      const answers: Partial<FitAnswers> = {};
      const result = h("div", { class: "fit-result" });
      const rows = FIT_QUESTIONS.map((q) => {
        const row = h("div", { class: "fit-q" }, h("p", { text: q.text }));
        const opts = h("div", { class: "yn" });
        for (const [label, value] of [["Yes", true], ["No", false]] as const) {
          const b = button(label, "choice small", () => {
            answers[q.key] = value;
            opts.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
            maybeConclude();
          });
          opts.appendChild(b);
        }
        row.appendChild(opts);
        return row;
      });

      function maybeConclude() {
        if (answers.rejection === undefined || answers.values === undefined) return;
        const a = answers as FitAnswers;
        const fit = emotionFits(a);
        result.replaceChildren(
          h("p", {
            text: fit
              ? "From your answers, the feeling fits the facts."
              : "From your answers, the feeling doesn't fit the facts.",
          }),
          button("Continue", "primary", () => {
            panel.replaceChildren();
            resolve({ fit, answers: a, inspected: facts.inspected });
          }),
          button("Look again", "ghost", () => {
            panel.replaceChildren(h("div", { class: "scene facts" }, hint, list, card, decide));
            world.onHotspot(show);
          }),
        );
      }

      panel.replaceChildren(
        h(
          "div",
          { class: "scene fit" },
          h("p", { class: "hint", text: "Shame fits when people would push you away for this. Guilt fits when you went against your own values." }),
          ...rows,
          result,
        ),
      );
    }
  });
}

// --- Chain review ----------------------------------------------------------

export function runChainScene(panel: HTMLElement, record: ChainRecord, onTap: (id: LinkId) => void): Promise<void> {
  const links = buildChain(record);
  return new Promise((resolve) => {
    const reflection = h("div", { class: "reflection" });
    reflection.hidden = true;
    const done = button("Continue", "primary", () => {
      panel.replaceChildren();
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

    panel.replaceChildren(
      h(
        "div",
        { class: "scene chain-review" },
        h("p", { class: "hint", text: "Tap the link where a different choice would change what happens. Tap as many as you like." }),
        chain,
        reflection,
        done,
      ),
    );
  });
}

// --- Transfer --------------------------------------------------------------

export interface TransferAnswers {
  feeling: string;
  applies: "yes" | "no" | "depends" | "";
  why: string;
}

export function runTransferScene(panel: HTMLElement): Promise<TransferAnswers> {
  return new Promise((resolve) => {
    const feeling = h("input");
    feeling.type = "text";
    feeling.id = "transfer-feeling";
    const why = h("textarea");
    why.id = "transfer-why";
    why.rows = 3;
    const applies = h("div", { class: "yn" });
    let pickedApplies: TransferAnswers["applies"] = "";
    for (const [label, value] of [["Yes", "yes"], ["No", "no"], ["It depends", "depends"]] as const) {
      const b = button(label, "choice small", () => {
        pickedApplies = value;
        applies.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
      });
      applies.appendChild(b);
    }

    const label = (text: string, forId?: string) => {
      const l = h("label", { text });
      if (forId) l.htmlFor = forId;
      return l;
    };

    const submit = button("Done", "primary", () => {
      const answers = { feeling: feeling.value.trim(), applies: pickedApplies, why: why.value.trim() };
      panel.replaceChildren(
        h(
          "div",
          { class: "scene transfer" },
          h("h3", { text: "One way to look at it" }),
          h("p", {
            text:
              "It depends on the facts, so check them first. Did your coworker brush you off, or just move on " +
              "because time was short? If shame doesn't fit (you didn't act against your values, and no one is " +
              "about to push you out), opposite action applies: go to the lunch, camera on, head up, and say " +
              "something, maybe bring the idea back up. If the facts show something real, like you'd talked " +
              "over someone, repair fits better: own it, make amends, let it go.",
          }),
          button("Finish", "primary", () => {
            panel.replaceChildren();
            resolve(answers);
          }),
        ),
      );
    });

    panel.replaceChildren(
      h(
        "div",
        { class: "scene transfer" },
        h("p", {
          class: "scenario",
          text:
            "You're in a work meeting. You share an idea. Your coworker doesn't respond and moves straight " +
            "to the next item. Your face goes hot. You want to turn your camera off and skip the team lunch afterward.",
        }),
        label("What might you be feeling?", "transfer-feeling"),
        feeling,
        label("Would opposite action fit here?"),
        applies,
        label("Why?", "transfer-why"),
        why,
        submit,
      ),
    );
    feeling.focus();
  });
}
