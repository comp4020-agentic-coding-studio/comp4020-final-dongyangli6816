import { INK, type Sprite } from "./sprite.ts";

// The gym's front door, with the dumbbell sign and lit windows: sign in.
export const door: Sprite = {
  grid: [
    "..kkkkkkkkkkkk..",
    "..klkllllllklk..",
    "..klkkkkkkkklk..",
    "..klkllllllklk..",
    "..kkkkkkkkkkkk..",
    ".kkkkkkkkkkkkkk.",
    ".kllllllllllllk.",
    ".klggggkkgggglk.",
    ".klgppgkkgppglk.",
    ".klgppgkkgppglk.",
    ".klggggkkgggglk.",
    ".klgggpkkpggglk.",
    ".klggggkkgggglk.",
    ".klggggkkgggglk.",
    ".klggggkkgggglk.",
    "kkkkkkkkkkkkkkkk",
  ],
  palette: { k: INK, l: "#c8e66b", g: "#1f6b3a", p: "#e8f0d8" },
};

// The same door swung open onto a lit doorway, with a mat: join.
export const doorway: Sprite = {
  grid: [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kllkllllllkllk.",
    ".klkkkkkkkkkklk.",
    ".kllkllllllkllk.",
    ".kkkkkkkkkkkkkk.",
    "..klllllllkggk..",
    "..klllllllkggk..",
    "..klllllllkggk..",
    "..klllllllkglk..",
    "..klllllllkggk..",
    "..klllllllkggk..",
    "..klllllllkggk..",
    "..klllllllkggk..",
    ".kaaaaaaaaaaaak.",
    ".kkkkkkkkkkkkkk.",
  ],
  palette: { k: INK, l: "#c8e66b", g: "#1f6b3a", a: "#0f3d22" },
};
