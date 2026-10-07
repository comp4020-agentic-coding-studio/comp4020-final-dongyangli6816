// A sprite is a character grid plus a palette: one letter per pixel, "." for
// transparent, and "c" (never a palette key) for the surrounding text colour.
// At most four colours plus transparency, outlined in ink
// (docs/design/system.md, section 10).
export type Sprite = { grid: readonly string[]; palette: Readonly<Record<string, string>> };

export const INK = "#0b2416";
