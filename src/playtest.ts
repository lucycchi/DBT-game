// Playtest notes: what the player chose and when, kept for the facilitator.
// Stays in this browser only; the facilitator downloads it at the end.

export interface LogEntry {
  /** Seconds since the session started. */
  t: number;
  type: string;
  data?: unknown;
}

const STORAGE_KEY = "lantern-night:last-playtest";

export class PlaytestLog {
  private start = Date.now();
  readonly entries: LogEntry[] = [];

  constructor(readonly variant: string) {}

  record(type: string, data?: unknown): void {
    this.entries.push({ t: Math.round((Date.now() - this.start) / 100) / 10, type, data });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch {
      // Storage can be unavailable (private window); the in-memory log still works.
    }
  }

  toJSON() {
    return {
      variant: this.variant,
      startedAt: new Date(this.start).toISOString(),
      minutes: Math.round((Date.now() - this.start) / 6000) / 10,
      entries: this.entries,
    };
  }

  download(): void {
    const blob = new Blob([JSON.stringify(this.toJSON(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lantern-night-playtest-${new Date(this.start).toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
