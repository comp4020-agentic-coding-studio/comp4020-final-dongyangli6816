// A sprite is a character grid plus a palette: one letter per pixel, "." for
// transparent, and "c" (never a palette key) for the surrounding text colour.
// At most seven colours plus transparency, outlined in ink
// (docs/design/system.md, section 10).
export type Sprite = { grid: readonly string[]; palette: Readonly<Record<string, string>> };

export const INK = "#0b2416";

// Sprites and tiles are 32 × 32 (ADR 0005); the 8 × 8 icons are interface.
export const TILE = 32;

// A grid as one SVG path per letter, each run of it in a row a rectangle:
// about a quarter of the markup of a <rect> per run, which matters at 32 px
// since the room page carries every pose and frame. Rows from `from` up to
// (not including) `to`; `dy` moves them down.
export function paths(grid: readonly string[], from = 0, to = grid.length, dy = 0): Map<string, string> {
  const out = new Map<string, string>();
  for (let y = from; y < Math.min(to, grid.length); y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; ) {
      let end = x + 1;
      while (row[end] === row[x]) end++;
      if (row[x] !== ".") out.set(row[x], (out.get(row[x]) ?? "") + `M${x} ${y + dy}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  }
  return out;
}
