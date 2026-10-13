// Dony, the gym's member of the month (BOT-2; docs/design/room/spec.md,
// appendix). His own grids, not BODY plus a hair overlay: black hair with a
// side part, glasses, a violet bomber open over a black tee. His slots are a
// person's (k ink, s skin, h hair, t shirt), so Avatar.astro and the .av slot
// classes draw him unchanged, with his four colours set on the svg. Props as
// everyone's: m dim, w paper, r resting blue. Pure data, so the room's script
// can use it too.
import type { Pose } from "./avatar.ts";

export const DONY_VARS = "--av-skin: #e9bd94; --av-hair: #2e3046; --av-shirt: #8b6cf2";

const blank = "................";
const put = (grid: string[], x: number, y: number, rows: readonly string[]) =>
  rows.forEach((row, dy) => {
    const line = grid[y + dy].split("");
    [...row].forEach((ch, dx) => ch !== "." && (line[x + dx] = ch));
    grid[y + dy] = line.join("");
  });

const HEAD = [
  ".....kkkkkk.....",
  "....khhhhhhkk...", // side part: the hair overhangs to his left
  "...khhhhhhhhhk..",
  "...khhhhhhhhhk..",
  "...khhhsssssk...", // the fringe swept across the forehead
  "..kksttkksttkk..", // glasses: ink frames, temples past the head; each lens an eye glint and a tint
  "...kssssssssk...",
  "...kssssssssk...",
  "....kssssssk....",
];
// an open violet jacket over a black tee
const TORSO = ["...kktthhttkk...", "..ktttthhttttk..", "..ktktthhttktk..", "..ksktthhttksk.."];
const BELT = "...kkkkkkkkkk...";
const LEGS = ["...khhk..khhk...", "...kkkk..kkkk..."];
const ARMS_UP_TORSO = ["ksktttthhttttksk", "..ktttthhttttk..", "..ktttthhttttk..", "...kttthhtttk..."];
const BAR = "mmwwwwwwwwwwwwmm";

function armsUp(): string[] {
  const g = [...HEAD, ...ARMS_UP_TORSO, BELT, ...LEGS];
  put(g, 0, 1, ["kk............kk"]);
  for (let y = 2; y <= 8; y++) put(g, 0, y, ["ks............sk"]);
  return g;
}

export type DonyFrame = Pose | "lift2" | "walk1" | "walk2" | "hop";

// Each frame is the body (slots k s h t) and its props (m w r), drawn over it.
export function donyFrame(frame: DonyFrame): { body: string[]; props: string[] } {
  const props = Array<string>(16).fill(blank);
  const stand = [...HEAD, ...TORSO, BELT, ...LEGS];
  switch (frame) {
    case "walk1":
      return { body: [...HEAD, ...TORSO, BELT, "...khhk..kkkk...", "...kkkk........."], props };
    case "walk2":
      return { body: [...HEAD, ...TORSO, BELT, "...kkkk..khhk...", ".........kkkk..."], props };
    case "lift":
      put(props, 0, 0, [BAR]);
      return { body: armsUp(), props };
    case "lift2":
      put(props, 0, 8, [BAR]);
      return { body: [...HEAD, ...ARMS_UP_TORSO, BELT, ...LEGS], props };
    case "rest":
      put(props, 12, 8, [".k.", "kwk", "krk", "krk", "krk", "kkk"]);
      return { body: stand, props };
    case "sit":
      put(props, 7, 12, ["ww"]);
      return {
        body: [blank, blank, ...HEAD, "...kktthhttkk...", "..ktttkkkktttk..", "..ktskkkkkkstk..", ".kkkkkkkkkkkkkk.", ".khhk......khhk."],
        props,
      };
    case "hop": {
      const body = armsUp();
      body[14] = "..khhk....khhk..";
      body[15] = "..kkkk....kkkk..";
      return { body, props };
    }
    default:
      return { body: stand, props };
  }
}

// BOT-1: his poster on the back wall, over the wall tile ("." lets it show).
// The glint is one frame every 8 s over the full poster: his lenses flash.
export const POSTER = {
  full: [
    blank,
    "..kkkkkkkkkkkk..",
    "..kttttttttttk..", // the violet frame
    "..kttkkkkkkttk..",
    "..ktkhhhhhhktk..", // his hair
    "..ktkhhssssktk..",
    "..kkkstkkstkkk..", // his glasses, the frames reaching the poster's edge
    "..ktkssssssktk..",
    "..kttksssskttk..",
    "..kkttkhhkttkk..", // the black tee's collar
    "..kttthhhhtttk..",
    "..kkkkkkkkkkkk..",
    "....kssssssk....", // the plate: "Member of the month"
    "....kskksksk....", //   in three ink marks
    "....kkkkkkkk....",
    blank,
  ],
  glint: [blank, blank, blank, blank, blank, blank, "......s...s.....", blank, blank, blank, blank, blank, blank, blank, blank, blank],
  // the hint: bulbs round the poster while the room has never had a summon,
  // drawn in currentColor so the page lights them; A here, B in bulbs-alt,
  // alternating along the ring, outside the frame and beside the plate
  bulbs: [
    "..b...b..b...b..",
    blank,
    "b..............b",
    blank,
    blank,
    blank,
    "b..............b",
    blank,
    blank,
    blank,
    "b..............b",
    blank,
    "..b..........b..",
    blank,
    blank,
    blank,
  ],
  "bulbs-alt": [
    "b...b......b...b",
    blank,
    blank,
    blank,
    "b..............b",
    blank,
    blank,
    blank,
    "b..............b",
    blank,
    blank,
    blank,
    "b..............b",
    blank,
    blank,
    blank,
  ],
  empty: [
    blank,
    "..kkkkkkkkkkkk..",
    "..kttttttttttk..",
    "..kthhhhhhhhtk..", // the backing, charcoal
    "..kthhtttthhtk..", // his outline in violet, where he was
    "..kthththhthtk..",
    "..kthththhthtk..",
    "..kthhthhthhtk..",
    "..kthhhtthhhtk..",
    "..kthtthhtthtk..",
    "..ktthhhhhhttk..",
    "..kkkkkkkkkkkk..",
    "....kssssssk....",
    "....kskksksk....",
    "....kkkkkkkk....",
    blank,
  ],
};
export const POSTER_PALETTE = { k: "#0b2416", s: "#e9bd94", h: "#2e3046", t: "#8b6cf2", b: "currentColor" };
