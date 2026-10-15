import { INK, type Sprite } from "./sprite.ts";

// Small gym-floor props, at 32 px scale (ADR 0005).
export const kettlebell: Sprite = {
  grid: [
    "...kkkkkk...",
    "..kaaaaaak..",
    ".kak....kak.",
    ".kak....kak.",
    ".kkkkkkkkkk.",
    "kaeeaaaaaaak",
    "kaeaaaaaaaak",
    "kaeaaaaaaaak",
    "kaaaaaaaaaak",
    "kaaaaaaaaadk",
    ".kddddddddk.",
    "..kkkkkkkk..",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232" },
};

export const dumbbell: Sprite = {
  grid: [
    ".kkk........kkk.",
    "keaak......keaak",
    "keaakkkkkkkkeaak",
    "keaakeeeeeekeaak",
    "kaaakeeeeeekaaak",
    "kaaakkkkkkkkaaak",
    "kddak......kdddk",
    ".kkk........kkk.",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232" },
};

// The logo's dumbbell in green and ink: the empty logbook. 32 × 16, drawn at
// full size (ADR 0005).
export const bigDumbbell: Sprite = {
  grid: [
    "....kkkk................kkkk....",
    "...kllllk..............kllllk...",
    "...klgggk..............kggglk...",
    ".kkklgggk..............kggglkkk.",
    "kllklgggkkk..........kkkggglkllk",
    "klgklgggkmk..........kmkggglkglk",
    "klgklgggkmkkkkkkkkkkkkmkggglkglk",
    "klgklgggkmkmmmkmmkmmmkmkggglkglk",
    "kdgkdgggkmkmkmmmmmmkmkmkgggdkgdk",
    "kddkdgggkmkkkkkkkkkkkkmkgggdkddk",
    "kddkdgggkmk..........kmkgggdkddk",
    "kddkddddkkk..........kkkddddkddk",
    ".kkkddddk..............kddddkkk.",
    "...kddddk..............kddddk...",
    "...kddddk..............kddddk...",
    "....kkkk................kkkk....",
  ],
  palette: {
    k: INK,
    g: "#1f6b3a", // --green, plate
    d: "#0f3d22", // --deep, plate shade
    l: "#c8e66b", // --leaf, plate highlight (the logo's plate colour)
    m: "#3d5a45", // --muted, bar and collar
  },
};
