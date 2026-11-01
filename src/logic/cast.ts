// Who is in the village. Personalities live in CHARACTERS.md; looks live in
// src/ui/looks.ts. This file holds only what the story and logic need.

export const CAST = {
  you: { name: "You" },
  mara: { name: "Mara" },
  tobin: { name: "Tobin" },
  wren: { name: "Wren" },
  oda: { name: "Oda" },
  pip: { name: "Pip" },
  juno: { name: "Juno" },
  nell: { name: "Nell" },
  ash: { name: "Ash" },
} as const;

export type CharacterId = keyof typeof CAST;
export const CHARACTER_IDS = Object.keys(CAST) as CharacterId[];

/** Characters who are talked to together: the bakers and the kids. */
const GROUPS: Partial<Record<CharacterId, CharacterId[]>> = { wren: ["oda"], pip: ["juno"] };

export function talkGroup(id: CharacterId): CharacterId[] {
  return GROUPS[id] ?? [];
}

export const EXPRESSIONS = ["neutral", "smile", "laugh", "worried", "sad", "surprised", "warm"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export function isCharacterId(id: string): id is CharacterId {
  return id in CAST;
}

export function isExpression(e: string): e is Expression {
  return (EXPRESSIONS as readonly string[]).includes(e);
}

export interface SpokenLine {
  speaker: CharacterId;
  expression: Expression | null;
  text: string;
}

/**
 * Ink writes dialogue as `mara: text` or `mara/worried: text`.
 * Returns null for narration.
 */
export function parseSpoken(line: string): SpokenLine | null {
  const match = /^([a-z]+)(?:\/([a-z]+))?:\s+(.+)$/.exec(line);
  if (!match) return null;
  const [, id, expr, text] = match;
  if (!isCharacterId(id)) return null;
  if (expr !== undefined && !isExpression(expr)) throw new Error(`Unknown expression "${expr}" in: ${line}`);
  return { speaker: id, expression: (expr as Expression | undefined) ?? null, text };
}
