// A villager on screen: which feeling they show, their mouth while they talk,
// blinking, and the small body movement that goes with each feeling.

import Phaser from "phaser";
import type { CharacterId, Expression } from "../logic/cast";
import { FEELINGS, type Frame, type Motion } from "../ui/plush";
import { charKey, walkKey } from "./art";

/** Makes sure a texture exists; returns false while it is still being made. */
export type EnsureTexture = (id: CharacterId, expr: Expression, frame: Frame) => boolean;
/** The same for a walking frame (0..7). */
export type EnsureWalk = (id: CharacterId, expr: Expression, i: number) => boolean;

export class Puppet {
  expr: Expression = "neutral";
  pointing = false;
  /** Movement offsets laid over the sprite's base position, angle and scale. */
  readonly m = { dy: 0, angle: 0, sx: 1, sy: 1 };
  private mouthOpen = false;
  /** Which walking frame is showing, or null when standing. */
  private walkFrame: number | null = null;
  private blinkUntil = 0;
  private nextBlink: number;
  private motion: Phaser.Tweens.Tween[] = [];

  constructor(
    private scene: Phaser.Scene,
    readonly id: CharacterId,
    readonly img: Phaser.GameObjects.Image,
    private ensure: EnsureTexture,
    private still: boolean,
    private ensureWalk: EnsureWalk | null = null,
  ) {
    this.nextBlink = scene.time.now + 1500 + Math.random() * 3000;
    this.idle();
  }

  /** Show a feeling; changing it plays that feeling's movement. */
  setFeeling(expr: Expression, pointing = false) {
    if (expr === this.expr && pointing === this.pointing) return;
    const changed = expr !== this.expr;
    this.expr = expr;
    this.pointing = pointing;
    // Have this feeling's talking and blinking frames ready before they're needed.
    this.ensure(this.id, expr, "open");
    this.ensure(this.id, expr, "blink");
    if (changed && !pointing) this.play(FEELINGS[expr].motion);
    this.refresh();
  }

  /** Show a walking frame (0..7), or null to stand. */
  setWalk(i: number | null) {
    if (i === this.walkFrame) return;
    this.walkFrame = i;
    this.refresh();
  }

  setMouth(open: boolean) {
    if (open === this.mouthOpen) return;
    this.mouthOpen = open;
    this.refresh();
  }

  /** Call every frame. Handles blinking. */
  update(now: number) {
    if (now >= this.nextBlink) {
      this.blinkUntil = now + 130;
      this.nextBlink = now + 2500 + Math.random() * 3500;
      this.refresh(now);
    } else if (this.blinkUntil && now >= this.blinkUntil) {
      this.blinkUntil = 0;
      this.refresh(now);
    }
  }

  /** Apply the movement on top of a base scale and angle. */
  apply(scale: number, sy = 1, angle = 0) {
    this.img.setScale(scale * this.m.sx, scale * sy * this.m.sy).setAngle(angle + this.m.angle);
  }

  private refresh(now = this.scene.time.now) {
    if (this.pointing) {
      this.img.setTexture(`char-${this.id}-point`);
      return;
    }
    // Walking (and not talking): the walk cycle for this feeling, once it's ready.
    if (this.walkFrame !== null && !this.mouthOpen && this.ensureWalk?.(this.id, this.expr, this.walkFrame)) {
      const key = walkKey(this.id, this.expr, this.walkFrame);
      if (this.img.texture.key !== key) this.img.setTexture(key);
      return;
    }
    const frame: Frame = now < this.blinkUntil ? "blink" : this.mouthOpen ? "open" : "closed";
    const key = frame !== "closed" && this.ensure(this.id, this.expr, frame) ? charKey(this.id, this.expr, frame) : charKey(this.id, this.expr);
    if (this.img.texture.key !== key) this.img.setTexture(key);
  }

  private play(kind: Motion) {
    for (const t of this.motion) t.stop();
    this.motion = [];
    Object.assign(this.m, { dy: 0, angle: 0, sx: 1, sy: 1 });
    if (this.still) return;
    const done = { onComplete: () => this.idle() };
    switch (kind) {
      case "bounce": this.tween({ dy: -6, sy: 1.03, yoyo: true, repeat: 3, duration: 200, ease: "Sine.out", ...done }); break;
      case "laugh": this.tween({ angle: -3, dy: -2, yoyo: true, repeat: 5, duration: 170, ...done }); break;
      case "hop": this.tween({ dy: -12, sx: 1.04, sy: 0.97, yoyo: true, repeat: 1, duration: 170, ease: "Quad.out", ...done }); break;
      case "stomp": this.tween({ dy: -2, yoyo: true, repeat: 5, duration: 90, ...done }); break;
      case "sink": this.tween({ dy: 3, sy: 0.95, duration: 600, ease: "Sine.out" }); break;
      case "shrink": this.tween({ sx: 0.95, sy: 0.88, duration: 500, ease: "Sine.out" }); break;
      case "droop": this.tween({ angle: 3, dy: 2, duration: 800, ease: "Sine.out" }); break;
      case "shiver": this.tween({ angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 60 }); break;
      case "sway": this.tween({ angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 1100, ease: "Sine.inOut" }); break;
      default: this.idle();
    }
  }

  /** Gentle breathing while nothing else is happening. */
  private idle() {
    if (this.still) return;
    this.tween({ sy: 1.015, yoyo: true, repeat: -1, duration: 1400 + Math.random() * 600, ease: "Sine.inOut" });
  }

  private tween(config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets">) {
    this.motion.push(this.scene.tweens.add({ targets: this.m, ...config }));
  }
}
