// Story text and choice buttons.

import type { StoryChoice } from "../engine";

export interface StoryView {
  clear(): void;
  addLine(text: string): Promise<void>;
  showChoices(choices: StoryChoice[]): Promise<StoryChoice>;
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

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, hurry || reducedMotion ? 0 : ms));

  return {
    panel,
    clear() {
      text.replaceChildren();
      panel.replaceChildren();
      choices.replaceChildren();
      hurry = false;
    },
    async addLine(line) {
      const p = document.createElement("p");
      p.textContent = line;
      text.appendChild(p);
      p.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      // Longer lines get a little more time.
      await wait(350 + Math.min(line.length * 12, 900));
    },
    showChoices(list) {
      return new Promise((resolve) => {
        choices.replaceChildren();
        for (const choice of list) {
          const b = document.createElement("button");
          b.className = "choice";
          b.textContent = choice.text;
          b.addEventListener("click", () => {
            choices.replaceChildren();
            resolve(choice);
          });
          choices.appendChild(b);
        }
        (choices.firstElementChild as HTMLElement | null)?.focus({ preventScroll: true });
      });
    },
  };
}
