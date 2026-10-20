// A person's avatar (AV-1, AV-2, docs/design/avatar/spec.md, "Gen Z redesign,
// Oct 19"): one body grid with no hair, four hair overlays drawn at the head,
// and a look of four choices. Slot letters: k ink, s skin, t shirt, h hair,
// and S, T, H for a darker shade of each (ADR 0005); m dim, w paper and r
// resting blue are fixed colours, in the body (catchlights, sneakers) as in
// props (system 10). Colours are never in the grids: Avatar.astro gives each
// pixel its slot as a class, and the look sets --av-skin, --av-hair and
// --av-shirt (and a shade's -2 where a palette has one), so recolouring is a
// palette swap. Pure data, so the room's script can use it too.
//
// Anchors, as (column, row): head outline rows 1-14, columns 7-24; the face
// (eyes rows 8-10, mouth row 12) is columns 11-20, rows 8-12, and no overlay
// or prop covers it; shoulder line row 16; hands rows 21-22, gripping at
// (5, 22) and (26, 22); belt line row 23; sneakers rows 28-31.

// Rows 0 to 23 bob in the idle loop: head to belt line; cargos and sneakers
// stay planted.
export const AVATAR_UPPER_ROWS = 24;

// The head and shoulders, for lists: every column, so the ponytail's tail
// (column 31) fits.
export const HEAD_CROP = "0 0 32 20";

export const EMPTY = Array<string>(32).fill("................................");

export const BODY = [
  "................................",
  "..........kkkkkkkkkkkk..........",
  "........kksssssssssssSkk........",
  ".......ksssssssssssssssSk.......",
  ".......ksssssssssssssssSk.......",
  ".......ksssssssssssssssSk.......",
  ".......ksssssssssssssssSk.......",
  ".......ksssssssssssssssSk.......",
  ".......ksssswksssswksssSk.......",
  ".......ksssskksssskksssSk.......",
  ".......ksssskksssskksssSk.......",
  ".......ksssSSssssssSSssSk.......",
  "........ksssssskksssssSk........",
  ".........kkssssssSSSSkk.........",
  "...........kkkkkkkkkk...........",
  "......kkkkkkkkSSSSkkkkkkkk......",
  "....kkttttttttTSSTtttttttTkk....",
  "...ktttttttttttTTtttttttttTTk...",
  "...ktttTttttttttttttttTTTtTTk...",
  "...ktttTtttttttttttttTTTTtTTk...",
  "...kTTTkttttttttTtttttTTkTTTk...",
  "...kssSktttttttTttttttTTkssSk...",
  "...kssSkTTTTTTTTTTTTTTTTkssSk...",
  "....kkkkkkkkkkkkkkkkkkkkkkkk....",
  ".......ktTTTTTTTTTTTTTTTk.......",
  ".......ktTTTTTTkktTTTTTTk.......",
  ".......ktkkTTTTkktTTTTkkk.......",
  "......ktTTTTTTTkktTTTTTTTk......",
  ".....kwwwwwwwwk..kwwwwwwwwk.....",
  "....kwtttwwwwwk..kwwwwwtttwk....",
  "....kmmmmmmmmmk..kmmmmmmmmmk....",
  ".....kkkkkkkkk....kkkkkkkkk.....",
];

// Overlays start at row 0, column 0 of the drawing's hairRow. They draw over
// the head's outline, never inside the face (columns 11 to 20, rows 8 to 12).
export const HAIR = {
  crop: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk........",
    ".......khhhhhhhhhhhhhhhHk.......",
    "......khhhhhHhhhhhhhhhhHHk......",
    "......khhhhhhhhhHhhhhhhhHk......",
    "......khhhhhhhhhhhhhHhhhHk......",
    "......khhhhhhhhhhhhhhhhhHk......",
    "......kH..H...........H.Hk......",
    "......kH..H...........H.Hk......",
    "......kH................Hk......",
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
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ],
  curls: [
    "........kkk.kkk..kkk.kkk........",
    "......kkhhHkhhHhhhkhhhHhkk......",
    "....khhhhhhhhhhhhhhhhhhhhhHk....",
    "...khhHhhhHhhhHhhhHhhhHhhhHHk...",
    "...khhhhhhHHhhHHhhHHhhHHhhhHk...",
    "....khHhHH..HH..HH..HH..hhHk....",
    "...khhhH................HhhHk...",
    "...khhHH................HhHHk...",
    "....khhH................Hhhk....",
    "...khhHH................HhHHk...",
    "...khhhH................HhhHk...",
    "...kkhHH................HhHkk...",
    ".....kkk................kkk.....",
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
    "................................",
    "................................",
    "................................",
  ],
  long: [
    ".........kkkkkkkkkkkkkk.........",
    ".......kkhhhhhhhhhhhhhHkk.......",
    "......khhhhhHhhhhhhhhhhHHk......",
    ".....khhhhhhhhhhhhhHhhhhHHk.....",
    ".....khhhhhhhhhHhhhhhhhhHHk.....",
    ".....khhhhhhhhH..HhhhhhhHHk.....",
    ".....khhhhhhhH....HhhhhhHHk.....",
    ".....khhhhhH........HhhhHHk.....",
    ".....khhH..............HhHk.....",
    ".....khhH..............HhHk.....",
    "....khhhH..............HhhHk....",
    "....khhHH..............HhhHk....",
    "....khhHk..............khHHk....",
    "...khhHk................khHHk...",
    "...khHHk................kHHHk...",
    "...kHHk..................kHHk...",
    "....kk....................kk....",
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
  ],
  ponytail: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk..kkkk..",
    ".......khhhhhhhhhHhhhhhHkktttTk.",
    "......khhhhhhhhhhhhhhhhHHkkTTkk.",
    "......khhhhhhhhhhhhhhhhhHkhhhHk.",
    "......khhH...........HhhHkhhhhHk",
    "......khH.............HhHkhhhhHk",
    "......khH..............HkhhhhhHk",
    "......khH..............HkhhhhHk.",
    "......khH..............HkhhhhHk.",
    "......khH..............HkhhhHk..",
    "......khH..............HkhhhHk..",
    ".......kH..............kkhhHk...",
    "........k...............khHk....",
    ".........................kHk....",
    "..........................k.....",
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
  ],
} as const;
export type HairStyle = keyof typeof HAIR;

// A drawing of a person: the body, the row the hair overlay starts at, and
// props drawn over both (m w r in the gym's colours; any body letter keeps
// its slot, as the fingers round the bottle).
export type Drawing = { body: readonly string[]; hairRow: number; props: readonly string[] };

// The figures off a machine (GYM-9, GYM-10.17, GYM-11; docs/product/criteria/
// animations.md, D1, D3): standing, resting with a bottle, sitting with a
// phone (in front of the machine; the glow, w, blinks), and the walk's two
// strides, one leg lifted, holding nothing.
export type Figure = "stand" | "rest" | "sit" | "walk1" | "walk2";
const STAND: Drawing = {
  body: BODY,
  hairRow: 0,
  props: EMPTY,
};
const REST: Drawing = {
  body: BODY,
  hairRow: 0,
  props: [
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
    ".............................kk.",
    "............................kmmk",
    "............................kkkk",
    "............................kwrk",
    "............................kwrk",
    "............................kwrk",
    "............................ssSk",
    "............................sSSk",
    "............................kkkk",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ],
};
const SIT: Drawing = {
  body: [
    "................................",
    "................................",
    "................................",
    "................................",
    "..........kkkkkkkkkkkk..........",
    "........kksssssssssssSkk........",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssswksssswksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssSSssssssSSssSk.......",
    "........ksssssskksssssSk........",
    ".........kkssssssSSSSkk.........",
    "...........kkkkkkkkkk...........",
    "......kkkkkkkkSSSSkkkkkkkk......",
    "....kkttttttttTSSTtttttttTkk....",
    "...ktttttttttttTTtttttttttTTk...",
    "...ktttTtttttttttttttTTTTtTTk...",
    "...kTTTkttttttttttttttTTkTTTk...",
    "...ksssssssssskkkkkksssssssSk...",
    "...kSSSSSSSSSk....kSSSSSSSSSk...",
    "....kkkkkkkkkkkkkkkkkkkkkkkk....",
    "......ktTTTTTTTkktTTTTTTTk......",
    "......kTTTTTTTTkkTTTTTTTTk......",
    ".....kwwwwwwwwk..kwwwwwwwwk.....",
    ".....kmmmmmmmmk..kmmmmmmmmk.....",
    "......kkkkkkkk....kkkkkkkk......",
    "................................",
  ],
  hairRow: 3,
  props: [
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
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "..............wwww..............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ],
};
const WALK1: Drawing = {
  body: [
    "................................",
    "..........kkkkkkkkkkkk..........",
    "........kksssssssssssSkk........",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssswksssswksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssSSssssssSSssSk.......",
    "........ksssssskksssssSk........",
    ".........kkssssssSSSSkk.........",
    "...........kkkkkkkkkk...........",
    "......kkkkkkkkSSSSkkkkkkkk......",
    "....kkttttttttTSSTtttttttTkk....",
    "...ktttttttttttTTtttttttttTTk...",
    "...ktttTttttttttttttttTTTtTTk...",
    "...ktttTtttttttttttttTTTTtTTk...",
    "...kTTTkttttttttTtttttTTkTTTk...",
    "...kssSktttttttTttttttTTkssSk...",
    "...kssSkTTTTTTTTTTTTTTTTkssSk...",
    "....kkkkkkkkkkkkkkkkkkkkkkkk....",
    ".......ktTTTTTTTTTTTTTTTk.......",
    ".......kkTTTTTTkktTTTTTTk.......",
    ".....kwwwwwwwwk.ktTTTTkkk.......",
    "....kwtttwwwwwk.ktTTTTTTTk......",
    "....kmmmmmmmmmk..kwwwwwwwwk.....",
    ".....kkkkkkkkk...kwwwwwtttwk....",
    ".................kmmmmmmmmmk....",
    "..................kkkkkkkkk.....",
  ],
  hairRow: 0,
  props: EMPTY,
};
const WALK2: Drawing = {
  body: [
    "................................",
    "..........kkkkkkkkkkkk..........",
    "........kksssssssssssSkk........",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssssssssssssssSk.......",
    ".......ksssswksssswksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssskksssskksssSk.......",
    ".......ksssSSssssssSSssSk.......",
    "........ksssssskksssssSk........",
    ".........kkssssssSSSSkk.........",
    "...........kkkkkkkkkk...........",
    "......kkkkkkkkSSSSkkkkkkkk......",
    "....kkttttttttTSSTtttttttTkk....",
    "...ktttttttttttTTtttttttttTTk...",
    "...ktttTttttttttttttttTTTtTTk...",
    "...ktttTtttttttttttttTTTTtTTk...",
    "...kTTTkttttttttTtttttTTkTTTk...",
    "...kssSktttttttTttttttTTkssSk...",
    "...kssSkTTTTTTTTTTTTTTTTkssSk...",
    "....kkkkkkkkkkkkkkkkkkkkkkkk....",
    ".......ktTTTTTTTTTTTTTTTk.......",
    ".......ktTTTTTTkkTTTTTTkk.......",
    ".......ktkkTTTTk.kwwwwwwwwk.....",
    "......ktTTTTTTTk.kwwwwwtttwk....",
    ".....kwwwwwwwwk..kmmmmmmmmmk....",
    "....kwtttwwwwwk...kkkkkkkkk.....",
    "....kmmmmmmmmmk.................",
    ".....kkkkkkkkk..................",
  ],
  hairRow: 0,
  props: EMPTY,
};
export const FIGURES: Record<Figure, Drawing> = { stand: STAND, rest: REST, sit: SIT, walk1: WALK1, walk2: WALK2 };

// The choices, in the order the editor shows them. The id is what's stored.
export const SKINS = [
  { id: "1", name: "Skin tone 1, lightest", hex: "#f6d7bd", shade: "#e0b69a" },
  { id: "2", name: "Skin tone 2", hex: "#e9bd94", shade: "#cf9a73" },
  { id: "3", name: "Skin tone 3", hex: "#d09a68", shade: "#b37a4f" },
  { id: "4", name: "Skin tone 4", hex: "#ad7447", shade: "#8f5a36" },
  { id: "5", name: "Skin tone 5", hex: "#8a5532", shade: "#6e4026" },
  { id: "6", name: "Skin tone 6, deepest", hex: "#6e4429", shade: "#55311d" },
] as const;
export const HAIR_STYLES = [
  { id: "crop", name: "Crop" },
  { id: "curls", name: "Curls" },
  { id: "long", name: "Wolf cut" },
  { id: "ponytail", name: "Ponytail" },
] as const;
export const HAIR_COLOURS = [
  { id: "black", name: "Black", hex: "#1d1714", shade: "#3a2e28" },
  { id: "dark-brown", name: "Dark brown", hex: "#4a2c1a", shade: "#33190f" },
  { id: "brown", name: "Brown", hex: "#7d4e2b", shade: "#5a3319" },
  { id: "ginger", name: "Ginger", hex: "#b5552a", shade: "#873a1d" },
  { id: "blonde", name: "Blonde", hex: "#d6ad55", shade: "#ad7f37" },
  { id: "silver", name: "Silver", hex: "#c3c7bd", shade: "#8f929a" },
  { id: "pink", name: "Pink", hex: "#e46fae", shade: "#b4488a" },
  { id: "blue", name: "Blue", hex: "#4d6bd6", shade: "#3446a3" },
] as const;
// none red, and none a state colour, so a shirt never reads as a state
export const SHIRTS = [
  { id: "purple", name: "Purple", hex: "#6a4c93", shade: "#4c3470" },
  { id: "navy", name: "Navy", hex: "#2e3f7f", shade: "#1f2a5c" },
  { id: "teal", name: "Teal", hex: "#1f8a86", shade: "#156663" },
  { id: "charcoal", name: "Charcoal", hex: "#3b3b45", shade: "#282832" },
  { id: "orange", name: "Orange", hex: "#e07b28", shade: "#b0561a" },
  { id: "pink", name: "Pink", hex: "#d65a9a", shade: "#a83c76" },
  { id: "white", name: "White", hex: "#eeeee6", shade: "#bdbcc4" },
  { id: "grey", name: "Grey", hex: "#8c8f94", shade: "#66686f" },
] as const;

export type Look = {
  skin: (typeof SKINS)[number]["id"];
  hair: HairStyle;
  hairColour: (typeof HAIR_COLOURS)[number]["id"];
  shirt: (typeof SHIRTS)[number]["id"];
};

// The four choices as the editor's form names them, with their palettes.
export const CHOICES = [
  { field: "skin", key: "skin", options: SKINS },
  { field: "hair", key: "hair", options: HAIR_STYLES },
  { field: "hair_colour", key: "hairColour", options: HAIR_COLOURS },
  { field: "shirt", key: "shirt", options: SHIRTS },
] as const;

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

// AV-3: a new account starts as a random look.
export const randomLook = (): Look => ({
  skin: pick(SKINS).id,
  hair: pick(HAIR_STYLES).id,
  hairColour: pick(HAIR_COLOURS).id,
  shirt: pick(SHIRTS).id,
});

// A look read from anywhere (stored JSON, a form): each value must be one of
// its palette's ids, or there's no look.
export function asLook(v: Partial<Record<keyof Look, unknown>> | null | undefined): Look | null {
  if (!v) return null;
  for (const c of CHOICES) if (!c.options.some((o) => o.id === v[c.key])) return null;
  return v as Look;
}

export function parseLook(json: string | null): Look | null {
  try {
    return json ? asLook(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

// A choice's colour, and its darker shade where the palette names one (ADR
// 0005); without one, Avatar.astro mixes the colour towards ink.
type Swatch = { id: string; hex: string; shade?: string };
const swatch = (list: readonly Swatch[], id: string) => list.find((o) => o.id === id)!;
const withShade = (prop: string, o: Swatch) => `${prop}: ${o.hex}` + (o.shade ? `; ${prop}-2: ${o.shade}` : "");

// One string per look, to tell whether a drawn avatar is still right.
export const lookKey = (look: Look): string => `${look.skin}|${look.hair}|${look.hairColour}|${look.shirt}`;

// The look's three colours, as the custom properties .av reads.
export const lookVars = (look: Look): string =>
  [
    withShade("--av-skin", swatch(SKINS, look.skin)),
    withShade("--av-hair", swatch(HAIR_COLOURS, look.hairColour)),
    withShade("--av-shirt", swatch(SHIRTS, look.shirt)),
  ].join("; ");

// The editor's live preview with no JavaScript: the checked radios set the
// palette on the form with :has(), generated here from the palettes so the
// hex values live in one place.
export function editorCss(): string {
  const rules = [".editor:has(input[name=\"hair\"]:checked) .preview .hair { display: none; }"];
  for (const s of HAIR_STYLES) {
    rules.push(`.editor:has(input[name="hair"][value="${s.id}"]:checked) .preview .hair-${s.id} { display: inline; }`);
  }
  const vars = [
    ["skin", "--av-skin", SKINS],
    ["hair_colour", "--av-hair", HAIR_COLOURS],
    ["shirt", "--av-shirt", SHIRTS],
  ] as const;
  for (const [field, prop, list] of vars) {
    for (const o of list as readonly Swatch[]) {
      rules.push(`.editor:has(input[name="${field}"][value="${o.id}"]:checked) { ${withShade(prop, o)}; }`);
    }
  }
  return rules.join("\n");
}
