import { INK, type Sprite } from "./sprite.ts";

// Small gym-floor props.
export const kettlebell: Sprite = {
  grid: ["..kk..", ".k..k.", "kkkkkk", "kaaaak", "kaaaak", ".kkkk."],
  palette: { k: INK, a: "#3d5a45" },
};

export const dumbbell: Sprite = {
  grid: [".k....k.", "kkaaaakk", "kkaaaakk", ".k....k."],
  palette: { k: INK, a: "#3d5a45" },
};

// The logo's dumbbell in green and ink: the empty logbook.
export const bigDumbbell: Sprite = {
  grid: [
    "..gg........gg..",
    "..gg........gg..",
    "gggg........gggg",
    "ggggkkkkkkkkgggg",
    "ggggkkkkkkkkgggg",
    "gggg........gggg",
    "..gg........gg..",
    "..gg........gg..",
  ],
  palette: { g: "#1f6b3a", k: INK },
};
