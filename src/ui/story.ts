// Story text, dialogue with portraits, and choice buttons.

import type { StoryChoice } from "../engine";
import { CAST, type SpokenLine } from "../logic/cast";
import { drawPortrait } from "./characters";

export interface StoryView {
  clear(): void;
  addLine(text: string, spoken?: SpokenLine | null): Promise<void>;
  showChoices(choices: StoryChoice[]): Promise<StoryChoice>;
  /** Resolve the open choice list from outside, e.g. by clicking a character. */
  pick(index: number): void;
  panel: HTMLElement;
}

export function createStoryView(
  text: HTMLElement,
  choices: HTMLElement,
  panel: HTMLElement,
  reducedMotion: boolean,
): StoryView {
  // Tapping the text skips the pacing until the next choice.
  let hurry = false;
  text.addEventListener("click", () => (hurry = true));
  let pending: { list: StoryChoice[]; resolve: (c: StoryChoice) => void } | null = null;

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, hurry || reducedMotion ? 0 : ms));

  function settle(choice: StoryChoice) {
    if (!pending) return;
    const { resolve } = pending;
    pending = null;
    choices.replaceChildren();
    resolve(choice);
  }

  return {
    panel,
    clear() {
      text.replaceChildren();
      panel.replaceChildren();
      choices.replaceChildren();
      hurry = false;
    },
    async addLine(line, spoken) {
      let node: HTMLElement;
      if (spoken) {
        node = document.createElement("div");
        node.className = `say say-${spoken.speaker}`;
        const body = document.createElement("div");
        const name = document.createElement("span");
        name.className = "say-name";
        name.textContent = CAST[spoken.speaker].name;
        const words = document.createElement("p");
        words.textContent = line;
        body.append(name, words);
        node.append(drawPortrait(spoken.speaker, spoken.expression ?? "neutral"), body);
      } else {
        node = document.createElement("p");
        node.textContent = line;
      }
      text.appendChild(node);
      node.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      // Longer lines get a little more time.
      await wait(350 + Math.min(line.length * 12, 900));
    },
    showChoices(list) {
      return new Promise((resolve) => {
        pending = { list, resolve };
        choices.replaceChildren();
        for (const choice of list) {
          const b = document.createElement("button");
          b.className = choice.talkTo ? "choice talk" : "choice";
          b.textContent = choice.text;
          b.addEventListener("click", () => settle(choice));
          choices.appendChild(b);
        }
        (choices.firstElementChild as HTMLElement | null)?.focus({ preventScroll: true });
      });
    },
    pick(index) {
      const choice = pending?.list.find((c) => c.index === index);
      if (choice) settle(choice);
    },
  };
}
