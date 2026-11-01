// Chain review: a short timeline of what happened, link by link. The player taps
// the link where a different choice would change things. Every link gets an
// answer; none is marked right or wrong.

import type { Completeness } from "./outcome";
import type { Variant } from "./facts";

export interface ChainRecord {
  variant: Variant;
  label: string;
  hideCount: number;
  bailed: boolean;
  path: "opposite" | "repair";
  completeness: Completeness;
  fit: boolean;
  factsSeen: number;
}

export type LinkId = "vulnerability" | "prompt" | "emotion" | "urge" | "action" | "facts" | "skill" | "outcome";

export interface ChainLink {
  id: LinkId;
  title: string;
  detail: string;
  /** What changes if something different happens at this link. */
  reflection: string;
}

const PART_NAMES = {
  opposite: "go back, head up, say something steady",
  repair: "own it, make amends, let it go",
};

function outcomeText(r: ChainRecord): string {
  if (r.completeness === "full") return "The lanterns went up. Light reached your lane. An invitation came.";
  if (r.completeness === "partial") return "The square lit, mostly. Things with Mara felt a little unfinished.";
  return "The lanterns went up without you. The shadow in your lane stayed.";
}

export function buildChain(r: ChainRecord): ChainLink[] {
  const promise = r.variant === "promise";
  const named = r.label ? `You called it ${r.label}.` : "You didn't put a name on it.";
  return [
    {
      id: "vulnerability",
      title: "Before",
      detail: promise
        ? "Rushing before sunset, arms full, the heirloom stacked on top."
        : "Rushing before sunset, all twelve lanterns in one trip.",
      reflection:
        "Vulnerabilities make the next links more likely. Two trips instead of one" +
        (promise ? ", or keeping the promise to carry the heirloom alone," : "") +
        " might have meant no fall. Not every link is in your control, but this one partly was.",
    },
    {
      id: "prompt",
      title: "Prompting event",
      detail: "You tripped. Someone laughed.",
      reflection:
        "This is the hardest link to change in the moment. Stones are loose; people laugh. " +
        "What happens after it is where most of the choices are.",
    },
    {
      id: "emotion",
      title: "Emotion",
      detail: `Hot face, eyes down, wanting to vanish. ${named}`,
      reflection:
        "Naming the emotion gives you something to check. If the name is off, you end up " +
        "checking the facts for a different feeling. The body cues and the urge are useful clues.",
    },
    {
      id: "urge",
      title: "Urge",
      detail: "Get out of sight. Hide.",
      reflection:
        "An urge is not a choice yet. Noticing \"this is the urge to hide\" is what opens up " +
        "the space to pick something else, or to pick hiding on purpose.",
    },
    {
      id: "action",
      title: "What you did",
      detail:
        r.hideCount === 0
          ? "You stayed in the square, urge and all."
          : `You hid${r.hideCount > 1 ? `, ${r.hideCount} times` : ""}${r.bailed ? ", including partway back" : ""}. The relief was real.`,
      reflection:
        r.hideCount === 0
          ? "Staying kept you next to the facts while they were still fresh. Distress stayed high for a while; that was the cost."
          : "Hiding worked: distress dropped fast. Meanwhile the lanterns stayed down, and Mara filled the silence with a guess. This is a link where a different action changes what the world does next.",
    },
    {
      id: "facts",
      title: "Check the facts",
      detail: `You looked at ${r.factsSeen} details. You decided the feeling ${r.fit ? "fit" : "didn't fit"}.`,
      reflection: promise
        ? "Here the facts were mixed: the laugh and the stares weren't what shame said, but the promise was real. That's what decides between opposite action and repair."
        : "Here the story shame told and the facts came apart: one laugh, most people didn't notice, the laugher had fallen too. That's what decides between opposite action and repair.",
    },
    {
      id: "skill",
      title: r.path === "opposite" ? "Opposite action" : "Repair",
      detail:
        r.completeness === "full"
          ? `All the way: ${PART_NAMES[r.path]}.`
          : `Part of the way (${PART_NAMES[r.path]}).`,
      reflection:
        r.completeness === "full"
          ? "Distress went up before it came down. Doing every part is what let it come all the way down."
          : "Each part you leave out keeps a piece of the old urge in charge. The result followed: partway down, not all the way.",
    },
    {
      id: "outcome",
      title: "What followed",
      detail: outcomeText(r),
      reflection:
        "Outcomes are where a chain ends, not where you change it. To change this one, look back up the chain.",
    },
  ];
}
