// Accessories (AV-4, AV-7; docs/design/avatar/spec.md, "Accessories, Nov 8").
// 32-wide grids whose row 0 is the pose's hairRow, drawn after the hair and
// props and before the machine's front. k ink; a main, b shade, c light,
// d accent, from the accessory's palette. Neck items only on the tee (A.8).
export type Slot = "head" | "face" | "neck";

export const ACC_DRAWINGS = {
  "cap": [ // head, rows 0-7
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaadaaaadaaabbk.......",
    "......kaacaaaddddddaaaabbk......",
    "......kaaaaaadaaaadaaaabbk......",
    "......kkkkkkkkkkkkkkkkkkkk......",
    "....kccccccccccccccccccccbbk....",
    ".....kkkkkkkkkkkkkkkkkkkkkk.....",
  ],
  "beanie": [ // head, rows 0-9
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaaaaaaaaabbk.......",
    "......kaacaaaaaaaaaaaaabbk......",
    ".....kkkkkkkkkkkkkkkkkkkkkk.....",
    ".....kcbcbcbcbcbcbcbcbcbcbk.....",
    ".....kcbcbcbcbcbcbcbcbcbcbk.....",
    ".....kcbkkkkkkkkkkkkkkkkcbk.....",
    ".....kcbk..............kcbk.....",
    "......kk................kk......",
  ],
  "bucket-hat": [ // head, rows 0-7
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaaaaaaaaabbk.......",
    ".......kddddddddddddddddk.......",
    ".....kkaaaaaaaaaaaaaaaaabkk.....",
    "...kkaaaaaaaaaaaaaaaaaaaaabkk...",
    "..kcccccccccccccccccccccccbbbk..",
    "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..",
  ],
  "headphones": [ // head, rows 0-11
    ".........kkkkkkkkkkkkkk.........",
    ".......kkaaaaaaaaaaaaaakk.......",
    "......kaakkkkkkkkkkkkkkaak......",
    ".....kaak..............kaak.....",
    ".....kak................kak.....",
    "....kkakk..............kkakk....",
    "...kccccbk............kccccbk...",
    "...kcddcbk............kcddcbk...",
    "...kcddcbk............kcddcbk...",
    "...kcddcbk............kcddcbk...",
    "...kbbbbbk............kbbbbbk...",
    "....kkkkk..............kkkkk....",
  ],
  "headband": [ // head, rows 0-7
    "................................",
    "................................",
    "................................",
    "......kkkkkkkkkkkkkkkkkkkk......",
    "......kaaaaaaaaaaaaaaaaaak......",
    "......kccccccccccccccccccck.....",
    "......kbbbbbbbbbbbbbbbbbbk......",
    "......kkkkkkkkkkkkkkkkkkkk......",
  ],
  "bandana": [ // head, rows 0-9
    "..........kkkkkkkkkkkk..........",
    "........kkaaaaaaaaaaaakk........",
    ".......kaacaaaacaaaacabk........",
    "......kaaaaacaaaacaaaabbk.......",
    "......kacaaaaaacaaaaacbbkkk.....",
    "......kaaaacaaaaaacaaabkbbak....",
    "......kbbbbbbbbbbbbbbbbkbkkak...",
    "......kkkkkkkkkkkkkkkkkkkkbak...",
    ".........................kbak...",
    ".........................kkk....",
  ],
  "nightcap": [ // head, rows 0-11
    "..........kkkkkkkkkkkkk.........",
    "........kkaaaaaaaaaaaaakk.......",
    ".......kaaacaaaaaaaaaaaaakk.....",
    "......kaaaaaaaaaacaaaaaaaaak....",
    "......kaaaaaaaaaaaaaaaakkaaak...",
    ".....kddddddddddddddddddkkaak...",
    ".....kddddddddddddddddddk.kak...",
    "......kkkkkkkkkkkkkkkkkk..kak...",
    "..........................kak...",
    ".........................kdddk..",
    ".........................kdddk..",
    "..........................kkk...",
  ],
  "crown": [ // head, rows 0-7
    "........kk.....kk.....kk........",
    "........kck...kcak...kck........",
    "........kcak.kcaaak.kcak........",
    "........kcaakcaaaaakcaak........",
    "........kcaaaaaaaaaaaaak........",
    "........kaacaaaddaaacaak........",
    "........kbbbbbbbbbbbbbbk........",
    "........kkkkkkkkkkkkkkkk........",
  ],
  "glasses": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........aaaa..aaaa...........",
    ".......aaaac...aac...aaa........",
    "..........a....aa....a..........",
    "..........a....aa....a..........",
    "...........aaaa..aaaa...........",
  ],
  "shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "........kkkkkkkkkkkkkkkk........",
    "........kcaaaakkcaaaakk.........",
    ".........kaaaaakkaaaaak.........",
    ".........kbbbbbkkbbbbbk.........",
    "..........kkkk....kkkk..........",
  ],
  "star-shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "............k......k............",
    "...........kak....kak...........",
    ".........kaacaakkaacaak.........",
    "..........kaaak..kaaak..........",
    ".........kaakaakkaakaak.........",
    ".........kk...kkkk...kk.........",
  ],
  "heart-shades": [ // face, rows 0-11
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..........kk.kkkkk.kk...........",
    ".........kcakaakkcakaak.........",
    ".........kaaaaakkaaaaak.........",
    "..........kaaak..kaaak..........",
    "...........kak....kak...........",
  ],
  "towel": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "......kcccccck..................",
    "....kcaaaaaaabk.................",
    "....kbbkaaaaabk.................",
    "........kddddk..................",
    "........kaaaak..................",
    "........kddddk..................",
    "........kakabk..................",
  ],
  "medal": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........kdk....kdk...........",
    "............kdkkkkdk............",
    ".............kcaabk.............",
    "............kcaaaabk............",
    "............kaaaabbk............",
    ".............kabbbk.............",
    "..............kkkk..............",
  ],
  "chain": [ // neck, rows 0-22
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    ".........kack......kcak.........",
    "..........kcak....kack..........",
    "...........kacakkacak...........",
    "............kkcaackk............",
    ".............kacabk.............",
    ".............kcaabk.............",
    "..............kkkk..............",
  ],
} as const;

// The 21 accessories, in the criteria's table order (D1). A colour variant
// is the same drawing with another palette.
export const ACCESSORIES = [
  { id: "cap", name: "Cap", slot: "head", kind: "starter", drawing: "cap", palette: { a: "#34466e", b: "#232f4d", c: "#50669a", d: "#34466e" } },
  { id: "beanie", name: "Beanie", slot: "head", kind: "starter", drawing: "beanie", palette: { a: "#8a8d93", b: "#64676d", c: "#b3b6bb" } },
  { id: "pink-beanie", name: "Pink beanie", slot: "head", kind: "starter", drawing: "beanie", palette: { a: "#e09ab9", b: "#b8728f", c: "#f2bfd5" } },
  { id: "bucket-hat", name: "Bucket hat", slot: "head", kind: "starter", drawing: "bucket-hat", palette: { a: "#b3a172", b: "#857549", c: "#cdbf93", d: "#6b5d3a" } },
  { id: "headphones", name: "Headphones", slot: "head", kind: "starter", drawing: "headphones", palette: { a: "#d9dadc", b: "#9ea2a8", c: "#eef0f1", d: "#3d4048" } },
  { id: "glasses", name: "Glasses", slot: "face", kind: "starter", drawing: "glasses", palette: { a: "#2a2130", c: "#f4f1e6" } },
  { id: "towel", name: "Towel", slot: "neck", kind: "starter", drawing: "towel", palette: { a: "#dccfb0", b: "#a89a78", c: "#f0e8d4", d: "#56627a" } },
  { id: "sweatband", name: "Sweatband", slot: "head", kind: "quick", drawing: "headband", palette: { a: "#f5f4ee", b: "#c4c5c9", c: "#f5f4ee" } },
  { id: "shades", name: "Shades", slot: "face", kind: "quick", drawing: "shades", palette: { a: "#232a3a", b: "#141821", c: "#e9f0f3" } },
  { id: "bronze-medal", name: "Bronze medal", slot: "neck", kind: "quick", drawing: "medal", palette: { d: "#f4f1e6", a: "#a4552a", b: "#6b3415", c: "#dd9a68" } },
  { id: "hype-band", name: "Hype band", slot: "head", kind: "quick", drawing: "headband", palette: { a: "#e0399a", b: "#a8226f", c: "#fff7fb" } },
  { id: "star-shades", name: "Star shades", slot: "face", kind: "quick", drawing: "star-shades", palette: { a: "#8a55f0", c: "#f3ecff" } },
  { id: "heart-shades", name: "Heart shades", slot: "face", kind: "quick", drawing: "heart-shades", palette: { a: "#f0469a", c: "#ffe3f0" } },
  { id: "mirror-shades", name: "Mirror shades", slot: "face", kind: "quick", drawing: "shades", palette: { a: "#d3d6d2", b: "#7f8783", c: "#ffffff" } },
  { id: "bandana", name: "Bandana", slot: "head", kind: "quick", drawing: "bandana", palette: { a: "#2a56c6", b: "#1b3a8f", c: "#f4f4ee" } },
  { id: "squad-cap", name: "Squad cap", slot: "head", kind: "quick", drawing: "cap", palette: { a: "#2f8a4c", b: "#1d5e32", c: "#4fae6a", d: "#f4f1e6" } },
  { id: "nightcap", name: "Nightcap", slot: "head", kind: "quick", drawing: "nightcap", palette: { a: "#3d4699", c: "#f1e9cf", d: "#f1e9cf" } },
  { id: "silver-medal", name: "Silver medal", slot: "neck", kind: "long", drawing: "medal", palette: { d: "#f4f1e6", a: "#c9c8c1", b: "#86857e", c: "#ffffff" } },
  { id: "gold-medal", name: "Gold medal", slot: "neck", kind: "long", drawing: "medal", palette: { d: "#f4f1e6", a: "#c98614", b: "#86500c", c: "#ffe08a" } },
  { id: "gold-chain", name: "Gold chain", slot: "neck", kind: "long", drawing: "chain", palette: { a: "#c98614", b: "#86500c", c: "#ffe08a" } },
  { id: "crown", name: "Crown", slot: "head", kind: "long", drawing: "crown", palette: { a: "#c98614", b: "#86500c", c: "#ffe08a", d: "#3a5ccc" } },
] as const;

export type AccId = (typeof ACCESSORIES)[number]["id"];
export type Accessory = (typeof ACCESSORIES)[number];
export type Drawing = keyof typeof ACC_DRAWINGS;
export const SLOTS = ["head", "face", "neck"] as const satisfies readonly Slot[];

// What a person wears: one id or nothing per slot (AV-4).
export type Wear = { head: AccId | null; face: AccId | null; neck: AccId | null };
export const NOTHING: Wear = { head: null, face: null, neck: null };

export const accessoryById = (id: string): Accessory | undefined => ACCESSORIES.find((a) => a.id === id);
export const isStarter = (id: string): boolean => accessoryById(id)?.kind === "starter";

// A stored or posted wear, made safe: anything unknown or in the wrong slot
// is dropped (a look from before accessories wears nothing, AV-4.9).
export function asWear(v: unknown): Wear {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const out: Wear = { ...NOTHING };
  for (const slot of SLOTS) {
    const a = typeof o[slot] === "string" ? accessoryById(o[slot] as string) : undefined;
    if (a && a.slot === slot) out[slot] = a.id;
  }
  return out;
}

// "head,face,neck", empty for none: the data-wear attribute and part of the
// look's key, so a change redraws (AV-7.7).
export const wearKey = (w: Wear): string => SLOTS.map((s) => w[s] ?? "").join(",");
export function wearFromKey(key: string | undefined): Wear {
  const [head, face, neck] = (key ?? "").split(",");
  return asWear({ head, face, neck });
}

// A.8: where a neck item may show in a drawing: the tee, shirt letters from
// the collar down to (not including) the belt line, and not under a prop.
// Rows are the drawing's own (0-31). A drawing with no belt line below the
// collar has no tee, and its neck item is hidden.
export function teeMask(body: readonly string[], hairRow: number, props: readonly string[]): boolean[][] {
  const collar = hairRow + 15;
  let belt = -1;
  for (let y = collar + 1; y < body.length; y++) {
    if (/k{12,}/.test(body[y].slice(3, 29))) {
      belt = y;
      break;
    }
  }
  return body.map((row, y) =>
    [...row].map((ch, x) => belt > 0 && y >= collar && y < belt && (ch === "t" || ch === "T") && (props[y]?.[x] ?? ".") === "."),
  );
}

// One accessory over a drawing, as the drawing's own 32 x 32 grid of
// accessory letters (k a b c d, "." for nothing): shifted to the hairRow,
// a neck item clipped to the tee.
export function placed(acc: Accessory, hairRow: number, mask?: boolean[][]): string[] {
  const grid = ACC_DRAWINGS[acc.drawing];
  const out = Array.from({ length: 32 }, () => [..."................................"]);
  grid.forEach((row, r) => {
    const y = r + hairRow;
    if (y < 0 || y >= 32) return;
    for (let x = 0; x < 32; x++) {
      const ch = row[x];
      if (ch === "." || ch === undefined) continue;
      if (acc.slot === "neck" && !mask?.[y]?.[x]) continue;
      out[y][x] = ch;
    }
  });
  return out.map((r) => r.join(""));
}

// The palette as custom properties, for the layer that draws it
export const accVars = (acc: Accessory): string =>
  Object.entries(acc.palette)
    .map(([k, v]) => `--acc-${k}: ${v}`)
    .join("; ");

// The editor's live preview with no JavaScript (avatar spec A.3): the
// checked radio in each slot shows its accessory on the preview, as
// editorCss() does for the look. Generated here so the list lives in one
// place.
export function accessoriesCss(): string {
  const rules: string[] = [];
  for (const slot of SLOTS) {
    rules.push(`.editor:has(input[name="${slot}"]:checked) .preview .acc-${slot} { display: none; }`);
  }
  for (const a of ACCESSORIES) {
    rules.push(`.editor:has(input[name="${a.slot}"][value="${a.id}"]:checked) .preview .acc-${a.id} { display: inline; }`);
  }
  return rules.join("\n");
}

// What a person wears over one drawing, as SVG markup for the inside of its
// bobbing group (g.av-top), in the order head, face, neck (avatar spec
// A.6). Pure: the server's Avatar.astro draws the same groups, and the
// room's script uses this to dress an avatar it draws from a template, so
// the templates needn't carry every accessory.
type Grid = { body: readonly string[]; hairRow: number; props: readonly string[] };
const runs = (grid: readonly string[]): Map<string, string> => {
  const out = new Map<string, string>();
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      let end = x + 1;
      while (row[end] === row[x]) end++;
      if (row[x] !== ".") out.set(row[x], (out.get(row[x]) ?? "") + `M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return out;
};
export function accMarkup(wear: Wear, d: Grid): string {
  return SLOTS.map((slot) => {
    const a = wear[slot] ? accessoryById(wear[slot]!) : undefined;
    if (!a) return "";
    const mask = slot === "neck" ? teeMask(d.body, d.hairRow, d.props) : undefined;
    const parts = [...runs(placed(a, d.hairRow, mask))].map(([ch, dd]) => `<path class="a${ch}" d="${dd}"/>`).join("");
    return `<g class="acc acc-${slot} acc-${a.id}" style="${accVars(a)}">${parts}</g>`;
  }).join("");
}

// The emoji an unlock is told with: the earner's room banner ("New: shades
// 😎") and the summary's "Wearing the shades now 😎" (summary spec, Not
// decided 7). None for an accessory with no emoji of its own: 🔥.
export const ACC_EMOJI: Partial<Record<AccId, string>> = {
  shades: "😎",
  "mirror-shades": "😎",
  "star-shades": "🤩",
  "heart-shades": "😍",
  crown: "👑",
  "bronze-medal": "🥉",
  "silver-medal": "🥈",
  "gold-medal": "🥇",
};
export const accEmoji = (id: string): string => ACC_EMOJI[id as AccId] ?? "🔥";

// What earned each one, in the editor's words (avatar spec A.4), shared by
// the editor's "Earned 3 Nov: first PB" and the summary's rows
export const ACC_REASON: Partial<Record<AccId, string>> = {
  sweatband: "first set",
  shades: "first PB",
  "bronze-medal": "first workout",
  "hype-band": "5 Cheers",
  "star-shades": "3 hype messages",
  "heart-shades": "first high-five",
  "mirror-shades": "3 rests on time",
  bandana: "3 machines",
  "squad-cap": "first day together",
  nightcap: "a minute slacking",
  "silver-medal": "10 days",
  "gold-medal": "30 days",
  "gold-chain": "5 days together",
  crown: "4 weeks in a row",
};
