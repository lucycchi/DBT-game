// Thin wrapper around the inkjs Story. Steps the story line by line, parses tags,
// and binds TS game logic as Ink external functions. No DOM here, so the same
// engine runs in the browser and in tests.

import { Story } from "inkjs";
import { outcome } from "./logic/outcome";
import { parseTags, type GameEvent, type SceneName } from "./logic/tags";
import type { Variant } from "./logic/facts";

export interface StoryLine {
  text: string;
  events: GameEvent[];
  scene: SceneName | null;
}

export interface StoryChoice {
  index: number;
  text: string;
}

type InkValue = string | number | boolean;

export class Engine {
  private story: Story;

  constructor(json: string | object, variant: Variant) {
    this.story = new Story(typeof json === "string" ? json : JSON.stringify(json));
    this.story.BindExternalFunction(
      "outcome",
      (a: boolean, b: boolean, c: boolean) => outcome(Boolean(a), Boolean(b), Boolean(c)),
      true,
    );
    this.setVar("variant", variant);
  }

  /** Continue until the next choice point, or until a line that opens a scene. */
  continueBatch(): StoryLine[] {
    const lines: StoryLine[] = [];
    while (this.story.canContinue) {
      const text = (this.story.Continue() ?? "").trim();
      const { events, scene } = parseTags(this.story.currentTags);
      lines.push({ text, events, scene });
      if (scene) break;
    }
    return lines;
  }

  get choices(): StoryChoice[] {
    return this.story.currentChoices.map((c) => ({ index: c.index, text: c.text }));
  }

  choose(index: number): void {
    this.story.ChooseChoiceIndex(index);
  }

  get ended(): boolean {
    return !this.story.canContinue && this.story.currentChoices.length === 0;
  }

  getVar(name: string): InkValue {
    return this.story.variablesState[name] as InkValue;
  }

  setVar(name: string, value: InkValue): void {
    this.story.variablesState[name] = value;
  }
}
