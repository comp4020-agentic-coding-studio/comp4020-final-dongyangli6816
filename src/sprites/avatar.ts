import { INK, type Sprite } from "./sprite.ts";

// The placeholder member until each account gets its own avatar (AV-3):
// hair, skin, shirt and an ink outline. Rows 1 to 11 are the upper body,
// which bobs in the idle loop.
export const avatar: Sprite = {
  grid: [
    "................",
    ".....kkkkkk.....",
    "....kaaaaaak....",
    "...kaaaaaaaak...",
    "...kabbbbbbak...",
    "...kbkbbbbkbk...",
    "...kbbbbbbbbk...",
    "....kbbbbbbk....",
    "...kksssssskk...",
    "..kssssssssssk..",
    "..kssssssssssk..",
    "..kbksssssskbk..",
    "...kkkkkkkkkk...",
    "...kkkk..kkkk...",
    "...kbbk..kbbk...",
    "...kkkk..kkkk...",
  ],
  palette: { k: INK, a: "#3b2219", b: "#c68642", s: "#6a4c93" },
};
export const AVATAR_UPPER_ROWS = 12;

// A squad member's head for lists: hair and skin over an ink outline.
export const head = (hair: string, skin: string): Sprite => ({
  grid: ["..kkkk..", ".kaaaak.", "kaaaaaak", "kabbbbak", "kbkbbkbk", "kbbbbbbk", ".kbbbbk.", "..kkkk.."],
  palette: { k: INK, a: hair, b: skin },
});

// The invite's empty spot at the door, for someone not signed up yet: the
// same body as an outline, in the muted ink, filled with the card colour.
export const ghostAvatar: Sprite = {
  grid: avatar.grid,
  palette: { k: "#3d5a45", a: "#f7fbef", b: "#f7fbef", s: "#f7fbef" },
};
