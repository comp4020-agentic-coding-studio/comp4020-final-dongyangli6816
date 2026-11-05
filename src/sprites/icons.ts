import type { Sprite } from "./sprite.ts";

// 8 × 8 pixel icons in the text colour, drawn at 2×. The state icons come
// from docs/design/system.md section 5.
const icon = (...grid: string[]): Sprite => ({ grid, palette: {} });

export const dumbbellIcon = icon("........", ".c....c.", "cc....cc", "cccccccc", "cc....cc", ".c....c.", "........", "........");
export const dropIcon = icon("...cc...", "...cc...", "..cccc..", ".cc.ccc.", ".c.cccc.", ".cccccc.", "..cccc..", "........");
export const phoneIcon = icon(".ccccc..", ".c...c..", ".c...c..", ".c...c..", ".c...c..", ".ccccc..", ".cc.cc..", ".ccccc..");
export const trophyIcon = icon("cccccccc", "c.cccc.c", "c.cccc.c", ".cccccc.", "..cccc..", "...cc...", "..cccc..", ".cccccc.");
export const arrowIcon = icon("........", "...c....", "...cc...", "cccccc..", "ccccccc.", "cccccc..", "...cc...", "...c....");
export const idleIcon = icon("...cc...", "...cc...", ".cccccc.", "...cc...", "...cc...", "..c..c..", "..c..c..", "........");
export const playIcon = icon("..c.....", "..cc....", "..ccc...", "..cccc..", "..cccc..", "..ccc...", "..cc....", "..c.....");
export const stopIcon = icon("........", ".cccccc.", ".cccccc.", ".cccccc.", ".cccccc.", ".cccccc.", ".cccccc.", "........");
// a record (docs/design/history/spec.md, "Shared marks"): a pixel star
export const recordIcon = icon("...cc...", "...cc...", "..cccc..", "cccccccc", ".cccccc.", "..cccc..", ".cc..cc.", ".c....c.");
export const pencilIcon =icon("......c.", ".....ccc", "....ccc.", "...ccc..", "..ccc...", ".ccc....", ".cc.....", "c.......");
// the squad list and the map's connection badge (docs/design/room/spec.md)
export const phoneOffIcon = icon("cccc.c.c", "c..c..c.", "c..c.c.c", "c..c....", "c..c....", "cccc....", "c.cc....", "cccc....");
export const signalIcon = icon("......c.", "........", "...cc.c.", "...cc...", "cc.cc.c.", "cc.cc...", "cc.cc.c.", "........");
export const claimIcon = icon("cc....cc", "c......c", "........", "........", "........", "........", "c......c", "cc....cc");
// the avatar editor: Randomise, and the chosen swatch's tick
export const dieIcon = icon("ccccccc.", "c.....c.", "c.c.c.c.", "c..c..c.", "c.c.c.c.", "c.....c.", "ccccccc.", "........");
export const tickIcon = icon("........", "......cc", ".....cc.", "c...cc..", "cc.cc...", ".ccc....", "..c.....", "........");
// the workout clock on the sheet's border
// interactions (docs/design/room/spec.md, "Interactions, Oct 22"): the menu's
// rows and the room log's lines (cheer, poke, slap, say), and the emoji tab
export const cheerIcon = icon("...c....", "...c....", "..ccc...", "ccccccc.", "..ccc...", "...c..c.", "...c.ccc", "......c.");
export const pokeIcon = icon("...c....", "...c....", "...c....", "...cccc.", ".ccccccc", ".ccccccc", "..ccccc.", "..ccccc.");
export const slapIcon = icon("....c.c.", "..c.c.c.", "c.cccccc", "..cccccc", "c.cccccc", "..ccccc.", "...cccc.", "........");
export const sayIcon = icon("cccccccc", "c......c", "c.cc.c.c", "c......c", "cccccccc", ".cc.....", ".c......", "........");
export const emoteIcon = icon(".cccccc.", "c......c", "c.c..c.c", "c......c", "c.c..c.c", "c..cc..c", ".cccccc.", "........");
export const clockIcon = icon("..cccc..", ".c.c..c.", "c..c...c", "c..ccc.c", "c......c", ".c....c.", "..cccc..", "........");
// room feel (docs/design/room/spec.md, "Room feel, Nov 4"): the menu's
// Thanks and High-five rows and their log lines; the PB line in the log (a
// medal, not the trophy, which is Finished's); the sound setting's three
// values (a speaker with waves, a bell for "rest timer only", a crossed
// speaker for off)
export const thanksIcon = icon("........", ".cc..cc.", "cccccccc", "cccccccc", ".cccccc.", "..cccc..", "...cc...", "........");
export const highFiveIcon = icon(".c.c.c..", ".c.c.c.c", ".c.c.c.c", "cccccccc", "cccccccc", ".ccccccc", "..ccccc.", "..ccccc.");
export const soundIcon = icon("...c....", "..cc..c.", "cccc...c", "cccc.c.c", "cccc.c.c", "cccc...c", "..cc..c.", "...c....");
export const bellIcon = icon("...cc...", "..cccc..", ".cccccc.", ".cccccc.", ".cccccc.", "cccccccc", "........", "...cc...");
export const pbIcon = icon("c.....c.", "cc...cc.", ".cc.cc..", "..ccc...", ".ccccc..", ".cc.cc..", ".ccccc..", "..ccc...");
export const soundOffIcon = icon("...c....", "..cc....", "cccc.c.c", "cccc..c.", "cccc.c.c", "cccc....", "..cc....", "...c....");
