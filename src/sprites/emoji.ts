import { INK, type Sprite } from "./sprite.ts";

// Interactions and emoji (docs/product/criteria/int.md; docs/design/room/spec.md,
// "Interactions, Oct 22"). Grids carry their ink outline already.
//
// The eight emoji (INT-8, D3), 16 x 16, drawn at 2 px a pixel (32 px) above
// their sender's avatar and at 2x in the tray. Five colours each at most,
// plus ink. Yellow is the finished token's value, the heart is pink (red
// means slacking or an error), and "m" is a paper motion line with no
// outline. Hi is an open palm with wave arcs; the slap reaction is a white
// glove with a leaf cuff and a pow, so the two never read alike.
const E = { k: INK, y: "#f2c94c", Y: "#c99a2e", o: "#f08a24", w: "#e8f0d8", W: "#aab8a0", p: "#e46fae", P: "#b4488a", b: "#7cc6e8", m: "#e8f0d8" };
const emoji = (grid: string[]): Sprite => ({ grid, palette: E });

export const hiEmoji = emoji([
  "........kk......",
  "..m..kkkyykkk.m.",
  ".m..kyykyykyyk.m",
  ".m..kyykyykyyk.m",
  "..m.kyykyykyykm.",
  "..k.kyykyykyyk..",
  ".kykkyykyykyyk..",
  ".kyykyyyyyyyyk..",
  ".kyyyyyyyyyyYk..",
  "..kyyyyyyyyyYk..",
  "..kyyyyyyyyyYk..",
  "...kyyyyyyyYk...",
  "....kyyyyyyYk...",
  ".....kyyyyYk....",
  ".....kyyyyYk....",
  "......kkkkk.....",
]);

export const flexEmoji = emoji([
  "..........kkkk..",
  ".........kyyyyk.",
  "........kyyyyyyk",
  "........kyyyyyyk",
  "........kyYyYyyk",
  ".........kyyyyk.",
  "....kkk..kyyyyk.",
  "...kyyyk.kyyyyk.",
  "..kyyyyykkyyyyk.",
  ".kyyyyyyykyyyyk.",
  "kyyyyyyyyyyyyyk.",
  "kyyyyyyyyyyyyyk.",
  "kyyyyyyyyyyyyYk.",
  ".kYYYYYYYYYYYk..",
  "..kkkkkkkkkkk...",
  "................",
]);

export const fireEmoji = emoji([
  ".......k........",
  "......kok.......",
  "......kook......",
  ".....koook..k...",
  "..k..kooookkok..",
  ".kokkoooookkook.",
  ".kookoooyookook.",
  ".koooooyyyooook.",
  ".kooooyyyyyoook.",
  ".koooyyywyyyook.",
  ".koooyywwwyyook.",
  ".kooyyywwwyyook.",
  "..kooyywwwyyok..",
  "...koooyyyoook..",
  "....kkoooookk...",
  "......kkkkk.....",
]);

export const clapEmoji = emoji([
  "................",
  "..m....m....m...",
  "...m...m...m....",
  ".....k.k.k......",
  "....kYkYkYk.....",
  "....kYYYYYkk.k..",
  "...kYYYYYkyykyk.",
  "...kYYYYkyyyyyyk",
  "..kyYYYYkyyyyyyk",
  "..kyyYYYkyyyyyyk",
  "...kyyYYkyyyyyyk",
  "....kyYYkyyyyyYk",
  ".....kYYkyyyyYk.",
  "......kYkyyyyk..",
  ".......kyyyYk...",
  "........kkkk....",
]);

export const hahaEmoji = emoji([
  "......kkkk......",
  "....kkyyyykk....",
  "...kyyyyyyyyk...",
  "..kyyyyyyyyyyk..",
  ".kyyyyyyyyyyyyk.",
  ".kyykyyyyyykyyk.",
  ".kykykyyyykykyk.",
  ".kbbyyyyyyyybbk.",
  "kbbykkkkkkkkybbk",
  "kbbykwwwwwwkybbk",
  ".kbykppppppkybk.",
  "..kyykkkkkkyyk..",
  "..kyyyyyyyyyYk..",
  "...kyyyyyyyYk...",
  "....kkyyyYkk....",
  "......kkkk......",
]);

export const deadEmoji = emoji([
  "................",
  ".....kkkkkk.....",
  "...kkwwwwwwkk...",
  "..kwwwwwwwwwwk..",
  ".kwwwwwwwwwwwwk.",
  ".kwwwwwwwwwwwWk.",
  ".kwkkkwwwwkkkWk.",
  ".kwkkkwwwwkkkWk.",
  ".kwkkkwwwwkkkWk.",
  ".kwwwwwkkwwwwWk.",
  "..kwwwwkkwwwWk..",
  "...kwwwwwwwWk...",
  "...kwkwkwkwk....",
  "...kwwwwwwWWk...",
  "....kkkkkkkk....",
  "................",
]);

export const eyesEmoji = emoji([
  "................",
  "................",
  "...kkk....kkk...",
  "..kwwwk..kwwwk..",
  ".kwwwwwkkwwwwwk.",
  ".kwwwwwkkwwwwwk.",
  "..kkwwwk.kkwwwk.",
  "..kkwwwk.kkwwwk.",
  "..kkwwwk.kkwwwk.",
  ".kwwwwwkkwwwwwk.",
  ".kWwwwWkkWwwwWk.",
  "..kWWWk..kWWWk..",
  "...kkk....kkk...",
  "................",
  "................",
  "................",
]);

export const loveEmoji = emoji([
  "................",
  "................",
  "...kkkk..kkkk...",
  "..kppppkkppppk..",
  ".kppwpppppppppk.",
  ".kpwppppppppppk.",
  ".kpppppppppppPk.",
  ".kppppppppppPPk.",
  "..kpppppppppPk..",
  "...kpppppppPk...",
  "....kpppppPk....",
  ".....kpppPk.....",
  "......kpPk......",
  ".......kk.......",
  "................",
  "................",
]);

// Tray order, the keys the server accepts, and the word shown under each and
// used as its accessible name (INT-8.2, INT-8.9, INT-8.12).
export const EMOJI = [
  { key: "hi", word: "Hi", sprite: hiEmoji },
  { key: "flex", word: "Flex", sprite: flexEmoji },
  { key: "fire", word: "Fire", sprite: fireEmoji },
  { key: "clap", word: "Clap", sprite: clapEmoji },
  { key: "haha", word: "Haha", sprite: hahaEmoji },
  { key: "dead", word: "Dead", sprite: deadEmoji },
  { key: "eyes", word: "Eyes", sprite: eyesEmoji },
  { key: "love", word: "Love", sprite: loveEmoji },
] as const;

// Reactions (INT-3), 32 x 32 effects drawn over the target's tile, whatever
// pose or machine frame is under them (animations.md D7). Frames play once:
// cheer 3 x 200 ms, poke 3 x 240 ms, slap 4 x 200 ms, all under 1 s
// (system 11). Reduced motion shows frame 2 alone for 800 ms.
const FX = { k: INK, w: "#e8f0d8", W: "#aab8a0", y: "#f2c94c", Y: "#c99a2e", l: "#c8e66b", m: "#e8f0d8", p: "#e46fae" };
// rows from `top` down; the rest of the 32 x 32 tile is transparent
const fx = (top: number, rows: string[]): Sprite => {
  const blank = ".".repeat(32);
  return { grid: [...Array(top).fill(blank), ...rows, ...Array(32 - top - rows.length).fill(blank)], palette: FX };
};

// Cheer: sparkles (paper stars with a leaf heart, yellow ones) burst round
// the person, then fade to specks.
export const cheerFx1 = fx(2, [
  "...........................k....",
  "..........................kyk...",
  "....k....................kyyyk..",
  "...kwk....................kyk...",
  "..kwlwk....................k....",
  "...kwk..........................",
  "....k...........................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "............................k...",
  "...........................kwk..",
  "..........................kwlwk.",
  "...........................kwk..",
  "............................k...",
]);

export const cheerFx2 = fx(0, [
  "...............kwk.......kwk....",
  "....k.........kwlwk.....kwlwk...",
  "...kwk.........kwk.......kwk....",
  "...kwk..........k.........k.....",
  ".kkwlwkk........................",
  "kwwlllwwk.......................",
  ".kkwlwkk........................",
  "...kwk.....................k....",
  "...kwk....................kyk...",
  "....k.....................kyk...",
  "........................kkyyykk.",
  ".......................kyyywyyyk",
  "........................kkyyykk.",
  "..........................kyk...",
  "..........................kyk...",
  "...k.......................k....",
  "..kyk...........................",
  ".kyyyk..........................",
  "..kyk...........................",
  "...k............................",
]);

export const cheerFx3 = fx(0, [
  "..................m.............",
  "..m...........m.................",
  ".............................m..",
  "................................",
  ".......m........................",
  "................................",
  "........................m.......",
  "..k.............................",
  ".kwk............................",
  "kwlwk...........................",
  ".kwk............................",
  "..k.............................",
  "..............................m.",
  ".m...........................k..",
  "............................kyk.",
  "...........................kyyyk",
  "............................kyk.",
  ".............................k..",
  "................................",
  "................................",
  ".....m..........................",
  "................................",
  "...........................m....",
]);

// Poke: a pointing finger pokes in from the left at the ribs, a "!" pops
// over the head, then the finger goes and the "!" jumps 2 px: "hey".
export const pokeFx1 = fx(13, [
  "...kkkk.........................",
  "kkkwwwwkkkkk....................",
  "wwwwwwwwwwwwk...................",
  "wwwwwwwwwwwWk...................",
  "wwwwwWWWkkkk....................",
  "kkwwwWWk........................",
  "..kkkkk.........................",
]);

export const pokeFx2 = fx(2, [
  "........................kkkkk...",
  ".......................kwwwwwk..",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwwwwwk.",
  "......................kwwwkwwwk.",
  ".......................kwwwwwk..",
  "........................kwwkk...",
  "........................kwk.....",
  "...kkkk..................k......",
  "kkkwwwwkkkkk....................",
  "wwwwwwwwwwwwk...................",
  "wwwwwwwwwwwWk...................",
  "wwwwwWWWkkkk....................",
  "kkwwwWWk........................",
  "..kkkkk.........................",
]);

export const pokeFx3 = fx(0, [
  "........................kkkkk...",
  ".......................kwwwwwk..",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwkwwwk.",
  "......................kwwwwwwwk.",
  "......................kwwwkwwwk.",
  ".......................kwwwwwk..",
  "........................kwwkk...",
  "........................kwk.....",
  ".........................k......",
]);

// Slap: a cartoon glove (white, leaf cuff) swings in with speed lines, a
// yellow pow at the cheek, then dizzy stars circle the head. Slapstick, so
// it reads as playful (INT-3.13); never a red mark, never on the body.
export const slapFx1 = fx(7, [
  ".....k.k.k......................",
  "....kwkwkwk.....................",
  "...kwwwwwwwk....................",
  "mm.kwwwwwwwk....................",
  "..kwwwwwwwwwk...................",
  "mmmwwwwwwwwWk...................",
  "...kwwwwwwWk....................",
  "mm.kwwwwwWWk....................",
  "....kWWWWWk.....................",
  "....klllllk.....................",
  ".....kkkkk......................",
]);

export const slapFx2 = fx(5, [
  "......k.........................",
  "...k.kyk.k......................",
  "..kykkykkyk.....................",
  "...kyyyyyk......................",
  "..kkywwwykk.....................",
  ".kyyywwwyyyk....................",
  "..kkywwwykk.....................",
  "...kyyyyyk......................",
  "..kykkykkyk.....................",
  "...k.kyk.k......................",
  "......k.........................",
]);

export const slapFx3 = fx(0, [
  "..............kkykk.............",
  "......k......kyyyyyk......k.....",
  "....kkykk.....kyyyk.....kkykk...",
  "...kyyyyyk....kykyk....kyyyyyk..",
  "....kyyyk......k.k......kyyyk...",
  "....kykyk...............kykyk...",
  ".....k.k.................k.k....",
]);

export const slapFx4 = fx(0, [
  "........kkykk.......kkykk.......",
  ".......kyyyyyk.....kyyyyyk......",
  "........kyyyk.......kyyyk.......",
  "....k...kykyk.......kykyk...k...",
  "..kkykk..k.k.........k.k..kkykk.",
  ".kyyyyyk.................kyyyyyk",
  "..kyyyk...................kyyyk.",
  "..kykyk...................kykyk.",
  "...k.k.....................k.k..",
]);

// Room feel (docs/product/criteria/room-feel.md; docs/design/room/spec.md,
// "Room feel, Nov 4", F.6 and F.12). INT-11 lets a reaction run to 1.5 s:
// cheer gains a fourth frame (the big burst), and every reaction now plays
// as a pop-in, a hold and a sparkle-out (timings in the spec, not here).
// Thanks is pink hearts rising off the shoulders (warm, never red); Poke
// back and Slap back replay poke and slap with the leaf return arrow (back)
// held over the head, so "back" reads at a glance; the high-five is a yellow
// palm reaching towards the partner, drawn facing east (the page mirrors it
// for a partner to the west), the smack, then a spark; the PB is confetti in
// two frames that swap round the flex. All of it off the face.

export const cheerFx4 = fx(0, [
  "....k......................k....",
  "...kyk....................kwk...",
  "...kyk....................kwk...",
  ".kkyyykk................kkwlwkk.",
  "kyywyyyyk..............kwwlllwwk",
  ".kkyyykk................kkwlwkk.",
  "...kyk....................kwk...",
  "...kyk....................kwk...",
  "....k......................k....",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  ".............................k..",
  "............................kyk.",
  "..k........................kyyyk",
  ".kwk........................kyk.",
  "kwlwk........................k..",
  ".kwk............................",
  "..k.............................",
  "................................",
  "................................",
  "................................",
  "................................",
  "..m.............................",
  ".............................m..",
]);

export const thanksFx1 = fx(17, [
  "............................k.k.",
  "...........................kpkpk",
  ".k.k.......................kpppk",
  "kpkpk.......................kpk.",
  "kpppk........................k..",
  ".kpk............................",
  "..k.............................",
]);

export const thanksFx2 = fx(7, [
  "..........................kk.kk.",
  ".........................kppkppk",
  ".kk.kk...................kpwpppk",
  "kppkppk..................kpppppk",
  "kpwpppk...................kpppk.",
  "kpppppk....................kpk..",
  ".kpppk......................k...",
  "..kpk...........................",
  "...k............................",
  "............................m...",
  "................................",
  "..m.............................",
]);

export const thanksFx3 = fx(0, [
  "...........................k.k..",
  "..k.k.....................kpkpk.",
  ".kpkpk....................kpppk.",
  ".kpppk.....................kpk..",
  "..kpk.......................k...",
  "...k............................",
  "................................",
  "................................",
  ".............................m..",
  "..m.............................",
  "................................",
  "................................",
  "................................",
  "m...............................",
]);

export const highfiveFx1 = fx(9, [
  ".......................kk.kk.kk.",
  "......................kyykyykyyk",
  "......................kyykyykyyk",
  "......................kyykyykyyk",
  ".....................kkyyyyyyyyk",
  ".....................kyyyyyyyyyk",
  ".....................kyyyyyyyyYk",
  "......................kyyyyyyyYk",
  "......................kyyyyyyyYk",
  ".......................kyyyyyYk.",
  ".......................kyyyyyYk.",
  ".......................kkkkkkk..",
  "................................",
  ".......................m..m..m..",
  ".......................m..m..m..",
  "..........................m.....",
]);

export const highfiveFx2 = fx(0, [
  "...........................k....",
  "........................k.kyk.k.",
  ".........................kyyyk..",
  ".......................kkyywyykk",
  "......................kyykyyykyk",
  "......................kykkkykykk",
  "................m.....kyykykkyyk",
  ".....................kkyyyyyyyyk",
  "................m....kyyyyyyyyyk",
  ".....................kyyyyyyyyYk",
  "......................kyyyyyyyYk",
  "......................kyyyyyyyYk",
  ".......................kyyyyyYk.",
  ".......................kyyyyyYk.",
  ".......................kkkkkkk..",
  "................................",
  "......................m.m.m.....",
]);

export const highfiveFx3 = fx(0, [
  ".............................k..",
  "......................m.....kyk.",
  "...........................kyyyk",
  ".......................kk.kkkyk.",
  "......................kyykyykkyk",
  "......................kyykyykyyk",
  "......................kyykyykyyk",
  ".....................kkyyyyyyyyk",
  ".....................kyyyyyyyyyk",
  ".....................kyyyyyyyyYk",
  "......................kyyyyyyyYk",
  "......................kyyyyyyyYk",
  ".......................kyyyyyYk.",
  ".......................kyyyyyYk.",
  ".......................kkkkkkk..",
  "................................",
  "..............................m.",
]);

export const backFx1 = fx(0, [
  "..k.............................",
  ".klkkkkk........................",
  "klllllllk.......................",
  ".klkkkkllk......................",
  "..k....klk......................",
  "....kkkllk......................",
  "....klllk.......................",
  "....kkkk........................",
]);

export const pbFx1 = fx(0, [
  "...yy.................ll........",
  ".............w..................",
  ".............w..............p...",
  ".................yy.........p...",
  "........ll......................",
  ".........................yy.....",
  "w...............................",
  "w...............................",
  "..p.............................",
  "..p..........................w..",
  ".............................w..",
  "................................",
  "................................",
  ".....yy.........................",
  "..........................ll....",
]);

export const pbFx2 = fx(0, [
  "..................p.............",
  ".........yy.......p.............",
  ".w......................yy......",
  ".w..............................",
  "..............................ll",
  "..............ll................",
  "......yy........................",
  ".......................w........",
  ".......................w........",
  "................................",
  "................................",
  "ll..............................",
  ".............................yy.",
  "................................",
  "................................",
  "................................",
  "...w............................",
  "...w............................",
  "...........................p....",
  "...........................p....",
  "................................",
  ".yy.............................",
  "............................ll..",
]);

// Acting it out (docs/product/criteria/room-acting.md, INT-14; docs/design/
// room/spec.md, "Acting it out, Nov 5", A.6 and A.11). The travelling
// effects: what flies from a lifter's machine, or from where a cut-short
// walk stopped, to the target. Drawn in the middle of the tile, about 16 x
// 14, facing east (the page mirrors them flying west); two frames each that
// swap every 125 ms in flight, like the walk's strides. Each is the move's
// own object, so kinds never mix: a yellow star (cheer), a white finger
// (poke), the white glove with its leaf cuff (slap; never the yellow Hi
// palm), a pink heart (thanks), the yellow palm (high-five). Poke back and
// Slap back fly the poke's and slap's with the leaf return arrow riding on
// top (back-1, as on their reactions).
export const starFx1 = fx(8, [
  "...............k................",
  "..............kyk...............",
  "..............kyk...............",
  ".............kyyyk..............",
  "...m.....kkkkyywyykkkk..........",
  "..m.......kyyyywyyyyk...........",
  "...m.......kyyyyyyyk............",
  "............kyyyyyk.............",
  "..m........kyyyYyyyk............",
  "...m.......kyyk.kyyk............",
  "..........kyyk...kyyk...........",
  "..........kkk.....kkk...........",
]);
export const starFx2 = fx(8, [
  "................................",
  "..............k.................",
  ".m...........kyk................",
  "..m.....kk..kyyyk..kk...........",
  ".m......kyykyywyykyyk...........",
  ".........kyyyywyyyyk............",
  "..m.......kyyyyyyyk.............",
  ".m.......kyyyyyyyyyk............",
  "..m.....kyyykkkkkyyyk...........",
  "........kkk.......kkk...........",
  "................................",
  "..............k.................",
]);
export const fingerFx1 = fx(10, [
  "..m.........kkkk................",
  ".m.......kkkwwwwkkkkk...........",
  "..m......kwwwwwwwwwwwk..........",
  ".m.......kwwwwwwwwwwWk..........",
  "..m......kwwwwWWWkkkk...........",
  ".........kkwwwWWk...............",
  "...........kkkkk................",
]);
export const fingerFx2 = fx(10, [
  "m...........kkkk................",
  ".m.......kkkwwwwkkkkkk..........",
  "m........kwwwwwwwwwwwwk.........",
  ".m.......kwwwwwwwwwwwWk.........",
  "m........kwwwwWWWkkkkk..........",
  ".........kkwwwWWk...............",
  "...........kkkkk................",
]);
export const gloveFx1 = fx(9, [
  "..............k.k.k.............",
  ".............kwkwkwk............",
  "............kwwwwwwwk...........",
  "mm..........kwwwwwwwk...........",
  "...mm......kwwwwwwwwwk..........",
  "mmmmmmm....kwwwwwwwwWk..........",
  "............kwwwwwwWk...........",
  "...mm.......kwwwwwWWk...........",
  "mm...........kWWWWWk............",
  ".............klllllk............",
  "..............kkkkk.............",
]);
export const gloveFx2 = fx(9, [
  "................................",
  ".............k.k.k..............",
  "m...........kwkwkwkk............",
  ".mm........kwwwwwwwwk...........",
  "....mm.....kwwwwwwwwwk..........",
  "mmmmmmmm...kwwwwwwwwWk..........",
  "...........kwwwwwwwWWk..........",
  "....mm......kwwwwwWWk...........",
  ".mm..........kWWWWk.............",
  "............klllllk.............",
  ".............kkkkk..............",
]);
export const heartFx1 = fx(9, [
  "...........kkk.kkk..............",
  "..........kpppkpppk.............",
  "..m......kppwpppppPk............",
  ".m.......kpwppppppPk............",
  "..m......kppppppppPk............",
  ".m........kppppppPk.............",
  "...........kppppPk..............",
  "............kppPk...............",
  ".............kPk................",
  "..............k.................",
]);
export const heartFx2 = fx(9, [
  "................................",
  "...........kk..kk...............",
  ".m........kppkkppk..............",
  "..m......kpwpppppPk.............",
  ".m.......kppppppppk.............",
  "..m.......kppppppPk.............",
  "...........kppppPk..............",
  "............kpPPk...............",
  ".............kPk................",
  "..............k.................",
]);
export const palmFx1 = fx(8, [
  ".............kk.kk.kk...........",
  "............kyykyykyyk..........",
  "............kyykyykyyk..........",
  "..m.........kyykyykyyk..........",
  ".m.........kkyyyyyyyyk..........",
  "..m........kyyyyyyyyyk..........",
  ".m.........kyyyyyyyyYk..........",
  "............kyyyyyyyYk..........",
  ".............kyyyyyYk...........",
  ".............kyyyyyYk...........",
  ".............kkkkkkk............",
]);
export const palmFx2 = fx(8, [
  "................................",
  ".............kk.kk.kk...........",
  "m...........kyykyykyyk..........",
  ".m..........kyykyykyyk..........",
  "m..........kkyyyyyyyyk..........",
  ".m.........kyyyyyyyyyk..........",
  "m..........kyyyyyyyyYk..........",
  "............kyyyyyyyYk..........",
  ".............kyyyyyYk...........",
  ".............kyyyyyYk...........",
  ".............kkkkkkk............",
]);
// The high-five's smack (INT-16): a yellow burst drawn centred on the corner
// between the two raised palms (the walker stands diagonally in front of the
// partner), or where two lifters' palms meet halfway. Not a palm, so it never
// reads as the Hi emoji; not the slap's POW (no white core, no rays of a hit).
export const smackFx1 = fx(9, [
  "...........m....m...............",
  "............m..m................",
  "..............k.................",
  ".............kyk................",
  "..mm.....k..kyyyk..k.....mm.....",
  "........kyk.kyyyk.kyk...........",
  ".........kykyyyyykyk............",
  "..........kyyywyyyk.............",
  "......kkkkyyywwwyyykkkk.........",
  "..........kyyywyyyk.............",
  ".........kykyyyyykyk............",
  "........kyk.kyyyk.kyk...........",
  "..mm.....k..kyyyk..k.....mm.....",
  ".............kyk................",
  "..............k.................",
]);
