// Builds one SVG of every sprite in src/sprites/, so a design mockup can draw
// the real art with <use href="/sprites.svg#id"> instead of a copy of its own.
// scripts/shot.mjs serves it next to the mockup; nothing is written to disk.
//
//   node scripts/sprites.ts            prints the sheet
//   node scripts/sprites.ts --ids      lists the ids, one per line
//
// Ids: av-<pose> (body, slots k s t on --ink, --av-skin, --av-shirt), with
// av-<pose>-<hair> drawing the same pose with that hair over it; dony-<frame>;
// tile-<char> and map-tiles (the whole floor); eq-<equipment>, bay-<slot> and
// claim; poster-<name>; i-<name> for the 8 x 8 icons in currentColor; and the
// sprites of props.ts and door.ts by their export names.
import { BODY, HAIR, HAIR_STYLES, poseOf, type Pose } from "../src/sprites/avatar.ts";
import { donyFrame, DONY_VARS, POSTER, POSTER_PALETTE, type DonyFrame } from "../src/sprites/dony.ts";
import { bay, CLAIM, GEAR, GYM_PALETTE, MAP, SCENERY, STATIONS, TILES } from "../src/sprites/gym.ts";
import * as icons from "../src/sprites/icons.ts";
import * as props from "../src/sprites/props.ts";
import * as door from "../src/sprites/door.ts";
import { TILE, type Sprite } from "../src/sprites/sprite.ts";

// the avatar's slots as Avatar.astro colours them
const SLOT: Record<string, string> = {
  k: "var(--ink)",
  s: "var(--av-skin)",
  t: "var(--av-shirt)",
  h: "var(--av-hair)",
  S: "var(--av-skin-2, color-mix(in srgb, var(--av-skin), var(--ink) 30%))",
  H: "var(--av-hair-2, color-mix(in srgb, var(--av-hair), var(--ink) 30%))",
  T: "var(--av-shirt-2, color-mix(in srgb, var(--av-shirt), var(--ink) 30%))",
  m: "var(--dim)",
  w: "var(--paper)",
  r: "var(--resting)",
};

// One <path> per colour, each run of it in a row as a rectangle.
function paths(grid: readonly string[], fill: (ch: string) => string | undefined, dy = 0): string {
  const byFill = new Map<string, string[]>();
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      let end = x + 1;
      while (row[end] === row[x]) end++;
      const f = row[x] === "." ? undefined : fill(row[x]);
      if (f) byFill.set(f, [...(byFill.get(f) ?? []), `M${x} ${y + dy}h${end - x}v1h-${end - x}z`]);
      x = end;
    }
  });
  return [...byFill].map(([f, d]) => `<path style="fill: ${f}" d="${d.join("")}"/>`).join("");
}

const symbol = (id: string, w: number, h: number, body: string) =>
  `<symbol id="${id}" viewBox="0 0 ${w} ${h}">${body}</symbol>`;
const sprite = (id: string, s: Sprite) =>
  symbol(id, s.grid[0].length, s.grid.length, paths(s.grid, (ch) => (ch === "c" ? "currentColor" : s.palette[ch])));
const gym = (grid: readonly string[]) => paths(grid, (ch) => GYM_PALETTE[ch]);
const slots = (grid: readonly string[], dy = 0) => paths(grid, (ch) => SLOT[ch], dy);

export function sheet(): string[] {
  const out: string[] = [];
  const poses: Pose[] = ["stand", "lift", "rest", "sit"];
  for (const pose of poses) {
    const { body, hairRow, props: extra } = poseOf(pose);
    out.push(symbol(`av-${pose}`, TILE, TILE, slots(body) + slots(extra)));
    for (const { id } of HAIR_STYLES) {
      out.push(symbol(`av-${pose}-${id}`, TILE, TILE, slots(body) + slots(HAIR[id], hairRow) + slots(extra)));
    }
  }
  out.push(symbol("av-ghost", TILE, TILE, slots(BODY)));
  const frames: DonyFrame[] = ["stand", "lift", "lift2", "rest", "sit", "walk1", "walk2", "hop"];
  for (const frame of frames) {
    const { body, props: extra } = donyFrame(frame);
    out.push(symbol(`dony-${frame}`, TILE, TILE, `<g style="${DONY_VARS}">${slots(body) + slots(extra)}</g>`));
  }

  // the floor as GymMap draws it: the poster's place is plain wall
  const base = (ch: string) => TILES[SCENERY[ch]?.base ?? (ch === "P" ? "W" : ch)];
  const kinds = [...new Set(MAP.join(""))];
  for (const ch of kinds) {
    out.push(symbol(`tile-${ch.charCodeAt(0)}`, TILE, TILE, gym(base(ch)) + (SCENERY[ch] ? gym(SCENERY[ch].grid) : "")));
  }
  const floor = MAP.flatMap((row, y) =>
    [...row].map((ch, x) => `<use href="#tile-${ch.charCodeAt(0)}" x="${x * TILE}" y="${y * TILE}" width="${TILE}" height="${TILE}"/>`),
  );
  out.push(symbol("map-tiles", 10 * TILE, 10 * TILE, floor.join("")));
  for (const [name, grid] of Object.entries(GEAR)) out.push(symbol(`eq-${name}`, TILE, TILE, gym(grid)));
  STATIONS.forEach((_, i) => out.push(symbol(`bay-${i + 1}`, TILE, TILE, gym(bay(i + 1)))));
  out.push(symbol("claim", TILE, TILE, gym(CLAIM)));
  for (const [name, grid] of Object.entries(POSTER)) {
    out.push(symbol(`poster-${name}`, TILE, TILE, paths(grid, (ch) => POSTER_PALETTE[ch as keyof typeof POSTER_PALETTE])));
  }

  for (const [name, s] of Object.entries(icons)) out.push(sprite(`i-${name.replace(/Icon$/, "").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, s));
  for (const [name, s] of Object.entries({ ...props, ...door })) out.push(sprite(name, s as Sprite));
  // the top bar's dumbbell, as Layout.astro draws it
  const logo = ["..ll........ll..", "..ll........ll..", "llll........llll", "llllwwwwwwwwllll"];
  out.push(sprite("logo", { grid: [...logo, ...logo.toReversed()], palette: { l: "#c8e66b", w: "#e8f0d8" } }));
  return out;
}

export const svg = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">\n${sheet().join("\n")}\n</svg>\n`;

if (import.meta.main) {
  if (process.argv.includes("--ids")) for (const s of sheet()) console.log(s.match(/id="([^"]+)"/)![1]);
  else process.stdout.write(svg());
}
