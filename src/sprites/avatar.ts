// A person's avatar (AV-1, AV-2, docs/design/avatar/spec.md): one body grid
// with no hair, four hair overlays drawn at the head, and a look of four
// choices. Slot letters: k ink, s skin, t shirt, h hair, and S, T, H for a
// darker shade of each (ADR 0005). Colours are never in the grids:
// Avatar.astro gives each pixel its slot as a class, and the look sets
// --av-skin, --av-hair and --av-shirt (and a shade's -2 where a palette has
// one), so recolouring is a palette swap.
// Pure data, so the room's script can use it too.

// Rows 0 to 25 bob in the idle loop: everything above the belt (row 26).
export const AVATAR_UPPER_ROWS = 26;

export const BODY = [
  "................................",
  "..........kkkkkkkkkkkk..........",
  "........kksssssssssssskk........",
  ".......kssssssssssssssssk.......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  ".....ksssskksssssssskkssssk.....",
  ".....kSssskksssssssskksssSk.....",
  ".....ksssskksssssssskkssssk.....",
  "......kSssssssssssssssssSk......",
  "......kSssssssssssssssssSk......",
  ".......kSsssssskkssssssSk.......",
  "........kksssssssssssskk........",
  "..........kkkSSSSSSkkk..........",
  "......kkkktttTTTTTTtttkkkk......",
  "....kkTttttttttttttttttttTkk....",
  "...kTttkTttttttttttttttTkttTk...",
  "...kTttkTttttttttttttttTkttTk...",
  "...kssskTttttttttttttttTksssk...",
  "...kssskTttttttttttttttTksssk...",
  "...kSSSkTttttttttttttttTkSSSk...",
  "....kkkkkTTTTTTTTTTTTTTkkkkk....",
  ".......kkkkkkkkkkkkkkkkkk.......",
  ".......kkkkkkk....kkkkkkk.......",
  "........kssssk....kssssk........",
  "........kSsssk....ksssSk........",
  ".......kTTTTTk....kTTTTTk.......",
  ".......kkkkkkk....kkkkkkk.......",
];

// Overlays start at row 0, column 0: the head anchor of the front-facing idle
// frames. They draw over the head's outline, never inside the face (rows
// 10 to 16, columns 8 to 23).
export const HAIR = {
  crop: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk........",
    ".......khhhhhhhhhhhhhhhhk.......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khhhhhhhhhhhhhhhhhhk......",
    "......khHhhhhhhhhhhhhhhHhk......",
    "......kHHHhHHhhHHhhHHhHHHk......",
    "......kH..H...H..H...H..Hk......",
  ],
  curls: [
    "........kkk.kkkkkkkk.kkk........",
    "......kkhhhkhhhhhhhhkhhhkk......",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    "....khhHhhhhHhhhhhhHhhhhHhhk....",
    "....khhhhhhhhhhhhhhhhhhhhhhk....",
    "...khhHhhhhHhhhhhhhhHhhhhHhhk...",
    "...khhhhhhhhhhhhhhhhhhhhhhhhk...",
    "...khHhhHhhhHhhHHhhHhhhHhhHhk...",
    "...khhhHH.HHH.HHHH.HHH.HHhhhk...",
    "...kHhhH...H........H...HhhHk...",
    "...khHhk................khHhk...",
    "...kHhhk................khhHk...",
    "...khHhk................khHhk...",
    "....kHk..................kHk....",
  ],
  long: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk........",
    ".......khhhhhhhhhhhhhhhhk.......",
    "......khhhhhhhhhhhhhhhhhhk......",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    ".....khhhhhhhhhhhhhhhhhhhhk.....",
    "....khhhhhhhhhhhhhhhhhhhhhhk....",
    "....khhhHhhhhhhHHhhhhhhHhhhk....",
    "....khhHHH.HHHHHHHHHH.HHHhhk....",
    "....khhH................Hhhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....khHk................kHhk....",
    "....kHHk................kHHk....",
    "....kkkk................kkkk....",
  ],
  ponytail: [
    "..........kkkkkkkkkkkk..........",
    "........kkhhhhhhhhhhhhkk.kkk....",
    ".......khhhhhhhhhhhhhhhhkhhhk...",
    "......khhhhhhhhhhhhhhhhhhkkkkk..",
    "......khhhhhhhhhhhhhhhhhhkhhhk..",
    "......khhhhhhhhhhhhhhhhhhkhhHk..",
    "......khHhhhhhhhhhhhhhhHhkhhHk..",
    "......kHHHhHHhhHHhhHHhHHHkhhHk..",
    "......kH..H...H..H...H..HkhHHk..",
    ".........................khHk...",
    ".........................kHHk...",
    "..........................kk....",
  ],
} as const;
export type HairStyle = keyof typeof HAIR;

// The gym's poses (GYM-10, docs/design/room/spec.md, appendix), all built on
// BODY: the body grid, the row the hair overlay starts at, and props drawn
// over both in m dim, w paper or r resting blue (classes pm, pw, pr).
export type Pose = "stand" | "lift" | "rest" | "sit";
// Props are drawn over the body and the hair, so they may use the body's
// slots too (k s S t T for the lift's raised arms, the rest's fingers):
// Avatar.astro's runs() keeps any letter that isn't m, w or r as its slot.
const EMPTY = Array<string>(32).fill("................................");

// lift: the head 3 rows down so the bar clears every hair style; the arms
// are props, so they draw over curls, long and the ponytail
const LIFT_BODY = [
  "................................",
  "................................",
  "................................",
  "................................",
  "..........kkkkkkkkkkkk..........",
  "........kksssssssssssskk........",
  ".......kssssssssssssssssk.......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  ".....ksssskksssssssskkssssk.....",
  ".....kSssskksssssssskksssSk.....",
  ".....ksssskksssssssskkssssk.....",
  "......kSssssssssssssssssSk......",
  "......kSssssssssssssssssSk......",
  ".......kSsssssskkssssssSk.......",
  "........kksssssssssssskk........",
  "..........kkkSSSSSSkkk..........",
  "......kkkktttTTTTTTtttkkkk......",
  "......kTttttttttttttttttTk......",
  ".......kTttttttttttttttTk.......",
  ".......kTttttttttttttttTk.......",
  ".......kkTTTTTTTTTTTTTTkk.......",
  ".......kkkkkkkkkkkkkkkkkk.......",
  ".......kkkkkkk....kkkkkkk.......",
  "........kssssk....kssssk........",
  "........kSsssk....ksssSk........",
  ".......kTTTTTk....kTTTTTk.......",
  ".......kkkkkkk....kkkkkkk.......",
];
const LIFT_PROPS = [
  "mkkkkk....................kkkkkm",
  "mkssskwwwwwwwwwwwwwwwwwwwwkssskm",
  "mksssk....................kssskm",
  "mkSSSk....................kSSSkm",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kSssk....................kssSk.",
  ".kkkkk....................kkkkk.",
  ".kTttk....................kttTk.",
  ".kTttk....................kttTk.",
  ".kTttk....................kttTk.",
  ".kTtttt..................ttttTk.",
  "..kTttt..................tttTk..",
  "...kkkkk................kkkkk...",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// rest: BODY, with a bottle held in the right hand, the fingers over it
const REST_PROPS = [
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
  ".........................kkk....",
  ".........................kwk....",
  "........................kkkkk...",
  "........................kwrrk...",
  "........................kwrrk...",
  "........................kwrrk...",
  "........................kwrrk...",
  "........................kwrrk...",
  "........................kwrrk...",
  "........................ksssk...",
  "........................ksssk...",
  "........................kSSSk...",
  "........................kkkkk...",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// sit: the head 2 rows down, forearms in to a phone at the lap, knees
// towards us; the glow (w) blinks in GymMap.astro
const SIT_BODY = [
  "................................",
  "................................",
  "................................",
  "..........kkkkkkkkkkkk..........",
  "........kksssssssssssskk........",
  ".......kssssssssssssssssk.......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  "......kssssssssssssssssssk......",
  ".....ksssskksssssssskkssssk.....",
  ".....kSssskksssssssskksssSk.....",
  ".....ksssskksssssssskkssssk.....",
  "......kSssssssssssssssssSk......",
  "......kSssssssssssssssssSk......",
  ".......kSsssssskkssssssSk.......",
  "........kksssssssssssskk........",
  "..........kkkSSSSSSkkk..........",
  "......kkkktttTTTTTTtttkkkk......",
  "....kkTttttttttttttttttttTkk....",
  "...kTttkTttttkkkkkkttttTkttTk...",
  "...kssskTttttkkkkkkttttTksssk...",
  "...kSsssssssskkkkkkssssssssSk...",
  "....kkkkkkkkkkkkkkkkkkkkkkkk....",
  "....kkkkkkkkkkkkkkkkkkkkkkkk....",
  "......kssssssk....kssssssk......",
  "......kssssssk....kssssssk......",
  "......kSsssssk....ksssssSk......",
  ".....kTTTTTTTk....kTTTTTTTk.....",
  ".....kkkkkkkkk....kkkkkkkkk.....",
];
const SIT_PROPS = [
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
  "..............wwww..............",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
  "................................",
];

const POSES: Record<Pose, { body: string[]; hairRow: number; props: string[] }> = {
  stand: { body: BODY, hairRow: 0, props: EMPTY },
  lift: { body: LIFT_BODY, hairRow: 3, props: LIFT_PROPS },
  rest: { body: BODY, hairRow: 0, props: REST_PROPS },
  sit: { body: SIT_BODY, hairRow: 2, props: SIT_PROPS },
};
export const poseOf = (pose: Pose) => POSES[pose];

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
  { id: "long", name: "Long" },
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
