// Ink lines carry instructions for the TypeScript layer as tags:
//   # event: hide            -> a world/meter event
//   # event: settle full     -> an event with one argument
//   # scene: facts           -> hand control to an interactive TS scene

export interface GameEvent {
  name: string;
  arg?: string;
}

// fit: answer whether the feeling matches what happened. approach: walk back
// against the pull to hide. mend/hang: hands-on puzzles. chain: look back.
export type SceneName = "fit" | "approach" | "mend" | "hang" | "chain";
const SCENES: readonly SceneName[] = ["fit", "approach", "mend", "hang", "chain"];

export interface ParsedTags {
  events: GameEvent[];
  scene: SceneName | null;
}

export function parseTags(tags: readonly string[] | null | undefined): ParsedTags {
  const result: ParsedTags = { events: [], scene: null };
  for (const raw of tags ?? []) {
    const match = /^\s*(event|scene)\s*:\s*(.+?)\s*$/.exec(raw);
    if (!match) continue;
    const [, kind, body] = match;
    if (kind === "scene") {
      if (!SCENES.includes(body as SceneName)) throw new Error(`Unknown scene: ${body}`);
      result.scene = body as SceneName;
    } else {
      const [name, arg] = body.split(/\s+/, 2);
      result.events.push(arg === undefined ? { name } : { name, arg });
    }
  }
  return result;
}
