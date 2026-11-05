// What an avatar on the gym map is doing, and the drawings that show it
// (GYM-9, GYM-10, GYM-11; docs/product/criteria/animations.md). The server
// picks stand, rest, sit or a machine from the room (src/lib/floor.ts); the
// room's script adds walk between tiles, and hop for Dony at his poster.
// Pure data, so the server's render, the room's script and the mockups'
// sprite sheet all draw the same thing.
import type { Equipment } from "../lib/exercises.ts";
import { EMPTY, FIGURES, HAIR, type Drawing, type HairStyle } from "./avatar.ts";
import { DONY_HEAD, DONY_HOP } from "./dony.ts";
import { MACHINES, type Frame } from "./machines.ts";

// flex1 and flex2 are the PB's flex (GYM-17.7, room spec F.5): one drawing
// each, swapped by the room's script on the flex's own timings, not bobbed
export type Pose = "stand" | "rest" | "sit" | "walk" | "hop" | "flex1" | "flex2" | ActPose | Equipment;

// Acting an interaction out (INT-13 to INT-16, room spec A.5): the walker's
// move, the target's reaction, and the lifter's hand (a body-less layer).
// One drawing each, swapped by the room's script on the move's timings.
export const ACT_POSES = [
  "reach",
  "swing",
  "point",
  "cheer",
  "bow",
  "crouch",
  "startle",
  "recoil",
  "sit-cheer",
  "sit-startle",
  "sit-recoil",
  "sit-reach",
  "hand1",
  "hand2",
] as const;
export type ActPose = (typeof ACT_POSES)[number];
// poses that hold still on their own: the script times them, nothing bobs
export const isHeld = (pose: string): boolean => pose === "flex1" || pose === "flex2" || (ACT_POSES as readonly string[]).includes(pose);

export const isMachine = (pose: string): pose is Equipment => pose in MACHINES;

// A pose's drawings: one, or two that swap (a machine's frames, the walk's
// strides). The hop is Dony's alone.
export function drawingsOf(pose: Pose): readonly (Drawing | Frame)[] {
  if (isMachine(pose)) return MACHINES[pose].frames;
  if (pose === "walk") return [FIGURES.walk1, FIGURES.walk2];
  if (pose === "hop") return [DONY_HOP];
  return [FIGURES[pose]];
}

// what goes on the head: a hair style, or Dony's own head (D2)
export const headOf = (style: HairStyle | "dony"): readonly string[] => (style === "dony" ? DONY_HEAD : HAIR[style]);

// The machines whose bar or handle leaves its resting place while someone
// uses it (GYM-10.13): the idle drawing's pixels that Frame 1's back and
// front layers don't have, so the station can hide them on their own.
const HELD: readonly Equipment[] = ["flat-bench", "squat-rack", "lifting-platform", "cable-machine"];
export function barOf(e: Equipment): { rest: string[]; bar: string[] } {
  const { idle, frames } = MACHINES[e];
  if (!HELD.includes(e)) return { rest: [...idle], bar: [...EMPTY] };
  const [f1] = frames;
  const kept = (y: number, x: number) => {
    const front = f1.front[y][x];
    return (front !== "." ? front : f1.back[y][x]) === idle[y][x];
  };
  const rest: string[] = [];
  const bar: string[] = [];
  idle.forEach((row, y) => {
    let r = "";
    let b = "";
    for (let x = 0; x < row.length; x++) {
      const isBar = row[x] !== "." && !kept(y, x);
      r += isBar ? "." : row[x];
      b += isBar ? row[x] : ".";
    }
    rest.push(r);
    bar.push(b);
  });
  return { rest, bar };
}
