import { INK, type Sprite } from "./sprite.ts";

// Small gym-floor props, at 32 px scale (ADR 0005).
export const kettlebell: Sprite = {
  grid: [
    "...kkkkkk...",
    "..kewaaadk..",
    ".kewk..kadk.",
    ".kek....kdk.",
    ".kak....kdk.",
    "..kkkkkkkk..",
    ".kewwaaaaadk",
    "kewaaaaaaadk",
    "kewaaddaaadk",
    "kaaaaaaaaadk",
    ".kaaaaaaddk.",
    "..kkkkkkkk..",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232", w: "#a9c4b0" },
};

export const dumbbell: Sprite = {
  grid: [
    ".kkkk......kkkk.",
    "kwwadk....kwwadk",
    "kwwadkkkkkkwwadk",
    "kwaadkeaeakwaadk",
    "kwaadkaaaakwaadk",
    "kwaadkkkkkkwaadk",
    "kaaddk....kaaddk",
    ".kkkk......kkkk.",
  ],
  palette: { k: INK, a: "#3d5a45", e: "#6f8f78", d: "#2a4232", w: "#a9c4b0" },
};

// The logo's dumbbell in green and ink: the empty logbook. 32 × 16, drawn at
// full size (ADR 0005).
export const bigDumbbell: Sprite = {
  grid: [
    "....kkkk................kkkk....",
    "...kllllk..............kllllk...",
    "...kllggk..............kllggk...",
    ".kkklgggk..............klgggkkk.",
    "kllklgggkkk..........kkklgggklk.",
    "klgklgggkek..........kekgggdkglk",
    "klgklgggkekkkkkkkkkkkkekgggdkglk",
    "klgklgggkekemeemeemeemekgggdkglk",
    "kdgkdgggkmkmmmmmmmmmmmkmgggdkgdk",
    "kddkdgggkmkkkkkkkkkkkkkmgggdkddk",
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
    e: "#6f8f78", // the bar's lit line
  },
};
