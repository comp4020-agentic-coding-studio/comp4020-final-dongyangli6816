// A sprite is a character grid plus a palette: one letter per pixel, "." for
// transparent, and "c" (never a palette key) for the surrounding text colour.
// At most seven colours plus transparency, outlined in ink
// (docs/design/system.md, section 10).
export type Sprite = { grid: readonly string[]; palette: Readonly<Record<string, string>> };

export const INK = "#0b2416";

// Sprites and tiles are 32 × 32 (ADR 0005); the 8 × 8 icons are interface.
export const TILE = 32;

// A grid first drawn at 16 × 16, with every pixel made 2 × 2, so it looks
// the same at 32. Each sprite drops this once it's redrawn at 32.
export const upscale = (grid: readonly string[]): string[] =>
  grid.flatMap((row) => {
    const wide = [...row].map((ch) => ch + ch).join("");
    return [wide, wide];
  });
