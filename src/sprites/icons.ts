import type { Sprite } from "./sprite.ts";

// 8 × 8 pixel icons in the text colour, drawn at 2×. The state icons come
// from docs/design/system.md section 5.
const icon = (...grid: string[]): Sprite => ({ grid, palette: {} });

export const dumbbellIcon = icon("........", ".c....c.", "cc....cc", "cccccccc", "cc....cc", ".c....c.", "........", "........");
export const dropIcon = icon("...cc...", "...cc...", "..cccc..", ".cc.ccc.", ".c.cccc.", ".cccccc.", "..cccc..", "........");
export const phoneIcon = icon(".ccccc..", ".c...c..", ".c...c..", ".c...c..", ".c...c..", ".ccccc..", ".cc.cc..", ".ccccc..");
export const trophyIcon = icon("cccccccc", "c.cccc.c", "c.cccc.c", ".cccccc.", "..cccc..", "...cc...", "..cccc..", ".cccccc.");
export const arrowIcon = icon("........", "...c....", "...cc...", "cccccc..", "ccccccc.", "cccccc..", "...cc...", "...c....");
