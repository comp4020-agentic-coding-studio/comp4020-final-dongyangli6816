// Builds one SVG of every sprite in src/sprites/, so a design mockup can draw
// the real art with <use href="/sprites.svg#id"> instead of a copy of its own.
// scripts/shot.mjs serves it next to the mockup; nothing is written to disk.
//
//   node scripts/sprites.ts            prints the sheet
//   node scripts/sprites.ts --ids      lists the ids, one per line
//
// Ids: av-<figure> (stand, rest, sit, walk1, walk2; body in the slots on
// --ink, --av-skin, --av-shirt), with av-<figure>-<hair> drawing it with that
// hair over it, and dony-<figure> plus dony-hop with his head; eq-<machine>
// (idle), with eq-<machine>-back-<n> and eq-<machine>-front-<n> for frame n
// and av-<machine>-<n>-<hair> and dony-<machine>-<n> for the person on it,
// to stack back, person, front; tile-<char> and map-tiles (the whole floor);
// bay-<slot> and claim; poster-<name>; i-<name> for the 8 x 8 icons in
// currentColor; the sprites of props.ts and door.ts by their export names;
// em-<key> for the eight emoji and fx-<kind>-<n> for reaction frames
// (emoji.ts).
import type { Equipment } from "../src/lib/exercises.ts";
import { BODY, FIGURES, HAIR_STYLES, type Drawing, type Figure, type HairStyle } from "../src/sprites/avatar.ts";
import { DONY_HOP, DONY_VARS, POSTER, POSTER_PALETTE } from "../src/sprites/dony.ts";
import { bay, CLAIM, GYM_PALETTE, MAP, SCENERY, STATIONS, TILES } from "../src/sprites/gym.ts";
import { MACHINES } from "../src/sprites/machines.ts";
import { headOf } from "../src/sprites/poses.ts";
import * as icons from "../src/sprites/icons.ts";
import * as props from "../src/sprites/props.ts";
import * as door from "../src/sprites/door.ts";
import * as emoji from "../src/sprites/emoji.ts";
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
  // a person: body, then hair (or Dony's head), then props
  const person = (d: Drawing, style?: HairStyle | "dony") =>
    slots(d.body) + (style ? slots(headOf(style), d.hairRow) : "") + slots(d.props);
  const dony = (d: Drawing) => `<g style="${DONY_VARS}">${person(d, "dony")}</g>`;
  for (const [figure, d] of Object.entries(FIGURES) as [Figure, Drawing][]) {
    out.push(symbol(`av-${figure}`, TILE, TILE, person(d)));
    for (const { id } of HAIR_STYLES) out.push(symbol(`av-${figure}-${id}`, TILE, TILE, person(d, id)));
    out.push(symbol(`dony-${figure}`, TILE, TILE, dony(d)));
  }
  out.push(symbol("dony-hop", TILE, TILE, dony(DONY_HOP)));
  out.push(symbol("av-ghost", TILE, TILE, slots(BODY)));
  for (const [machine, { idle, frames }] of Object.entries(MACHINES) as [Equipment, (typeof MACHINES)[Equipment]][]) {
    out.push(symbol(`eq-${machine}`, TILE, TILE, gym(idle)));
    frames.forEach((f, i) => {
      const n = i + 1;
      out.push(symbol(`eq-${machine}-back-${n}`, TILE, TILE, gym(f.back)));
      out.push(symbol(`eq-${machine}-front-${n}`, TILE, TILE, gym(f.front)));
      for (const { id } of HAIR_STYLES) out.push(symbol(`av-${machine}-${n}-${id}`, TILE, TILE, person(f, id)));
      out.push(symbol(`dony-${machine}-${n}`, TILE, TILE, dony(f)));
    });
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
  STATIONS.forEach((_, i) => out.push(symbol(`bay-${i + 1}`, TILE, TILE, gym(bay(i + 1)))));
  out.push(symbol("claim", TILE, TILE, gym(CLAIM)));
  for (const [name, grid] of Object.entries(POSTER)) {
    out.push(symbol(`poster-${name}`, TILE, TILE, paths(grid, (ch) => POSTER_PALETTE[ch as keyof typeof POSTER_PALETTE])));
  }

  for (const [name, s] of Object.entries(icons)) out.push(sprite(`i-${name.replace(/Icon$/, "").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, s));
  for (const [name, s] of Object.entries({ ...props, ...door })) out.push(sprite(name, s as Sprite));
  // emoji as em-<key>, reaction frames as fx-<kind>-<n> (cheerFx1 -> fx-cheer-1)
  for (const { key, sprite: s } of emoji.EMOJI) out.push(sprite(`em-${key}`, s));
  for (const [name, s] of Object.entries(emoji)) {
    const m = name.match(/^(\w+)Fx(\d)$/);
    if (m) out.push(sprite(`fx-${m[1]}-${m[2]}`, s as Sprite));
  }
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
