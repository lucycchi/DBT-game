// Thin wrapper around the inkjs Story. Steps the story line by line, parses tags,
// and binds TS game logic as Ink external functions. No DOM here, so the same
// engine runs in the browser and in tests.

import { Story } from "inkjs";
import { outcome } from "./logic/outcome";
import { parseTags, type GameEvent, type SceneName } from "./logic/tags";
import type { Variant } from "./logic/facts";
import { isCharacterId, parseSpoken, type CharacterId, type SpokenLine } from "./logic/cast";

export interface StoryLine {
  text: string;
  /** Set when the line is dialogue; `text` is then the spoken words only. */
  spoken: SpokenLine | null;
  events: GameEvent[];
  scene: SceneName | null;
}

export interface StoryChoice {
  index: number;
  text: string;
  /** From a `#talk: id` choice tag: choosing this starts a conversation with that character. */
  talkTo: CharacterId | null;
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
      const raw = (this.story.Continue() ?? "").trim();
      const { events, scene } = parseTags(this.story.currentTags);
      const spoken = parseSpoken(raw);
      if (spoken?.expression) events.push({ name: "face", arg: `${spoken.speaker}:${spoken.expression}` });
      lines.push({ text: spoken ? spoken.text : raw, spoken, events, scene });
      if (scene) break;
    }
    return lines;
  }

  get choices(): StoryChoice[] {
    return this.story.currentChoices.map((c) => {
      const tag = (c.tags ?? []).map((t) => /^\s*talk\s*:\s*(\w+)\s*$/.exec(t)?.[1]).find(Boolean);
      return { index: c.index, text: c.text, talkTo: tag && isCharacterId(tag) ? tag : null };
    });
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
