// A person's avatar (AV-1, AV-2, docs/design/avatar/spec.md): one body grid
// with no hair, four hair overlays drawn at the head, and a look of four
// choices. Slot letters: k ink, s skin, t shirt, h hair. Colours are never in
// the grids: Avatar.astro gives each pixel its slot as a class, and the look
// sets --av-skin, --av-hair and --av-shirt, so recolouring is a palette swap.
// Pure data, so the room's script can use it too.

// Rows 0 to 12 bob in the idle loop.
export const AVATAR_UPPER_ROWS = 13;

export const BODY = [
  "................",
  ".....kkkkkk.....",
  "....kssssssk....",
  "...kssssssssk...",
  "...kssssssssk...",
  "...kskssssksk...",
  "...kskssssksk...",
  "...kssssssssk...",
  "....kssssssk....",
  "...kkttttttkk...",
  "..kttttttttttk..",
  "..ktkttttttktk..",
  "..kskttttttksk..",
  "...kkkkkkkkkk...",
  "...kssk..kssk...",
  "...kkkk..kkkk...",
];

// Overlays start at row 0, column 0: the head anchor of the front-facing idle
// frames.
export const HAIR = {
  crop: [".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "...khhhhhhhhk...", "...kh......hk..."],
  curls: [
    "....kkkkkkkk....",
    "...khhhhhhhhk...",
    "..khhhkhhkhhhk..",
    "..khhhhhhhhhhk..",
    "..khkhhhhhhkhk..",
    "..khh......hhk..",
    "..kh........hk..",
  ],
  long: [
    ".....kkkkkk.....",
    "....khhhhhhk....",
    "...khhhhhhhhk...",
    "...khhhhhhhhk...",
    "...khh....hhk...",
    "..kh........hk..",
    "..kh........hk..",
    "..kh........hk..",
    "..kh........hk..",
    "..khh......hhk..",
    "..kkk......kkk..",
  ],
  ponytail: [
    ".....kkkkkk.....",
    "....khhhhhhkk...",
    "...khhhhhhhhhk..",
    "...khhhhhhhhhhk.",
    "...kh......hhhk.",
    "............khk.",
    "............khk.",
    ".............k..",
  ],
} as const;
export type HairStyle = keyof typeof HAIR;

// The choices, in the order the editor shows them. The id is what's stored.
export const SKINS = [
  { id: "1", name: "Skin tone 1, lightest", hex: "#f6d7bd" },
  { id: "2", name: "Skin tone 2", hex: "#e9bd94" },
  { id: "3", name: "Skin tone 3", hex: "#d09a68" },
  { id: "4", name: "Skin tone 4", hex: "#ad7447" },
  { id: "5", name: "Skin tone 5", hex: "#8a5532" },
  { id: "6", name: "Skin tone 6, deepest", hex: "#6e4429" },
] as const;
export const HAIR_STYLES = [
  { id: "crop", name: "Crop" },
  { id: "curls", name: "Curls" },
  { id: "long", name: "Long" },
  { id: "ponytail", name: "Ponytail" },
] as const;
export const HAIR_COLOURS = [
  { id: "black", name: "Black", hex: "#1d1714" },
  { id: "dark-brown", name: "Dark brown", hex: "#4a2c1a" },
  { id: "brown", name: "Brown", hex: "#7d4e2b" },
  { id: "ginger", name: "Ginger", hex: "#b5552a" },
  { id: "blonde", name: "Blonde", hex: "#d6ad55" },
  { id: "silver", name: "Silver", hex: "#c3c7bd" },
  { id: "pink", name: "Pink", hex: "#e46fae" },
  { id: "blue", name: "Blue", hex: "#4d6bd6" },
] as const;
// none red, and none a state colour, so a shirt never reads as a state
export const SHIRTS = [
  { id: "purple", name: "Purple", hex: "#6a4c93" },
  { id: "navy", name: "Navy", hex: "#2e3f7f" },
  { id: "teal", name: "Teal", hex: "#1f8a86" },
  { id: "charcoal", name: "Charcoal", hex: "#3b3b45" },
  { id: "orange", name: "Orange", hex: "#e07b28" },
  { id: "pink", name: "Pink", hex: "#d65a9a" },
  { id: "white", name: "White", hex: "#eeeee6" },
  { id: "grey", name: "Grey", hex: "#8c8f94" },
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

const hex = (list: readonly { id: string; hex: string }[], id: string) => list.find((o) => o.id === id)!.hex;

// One string per look, to tell whether a drawn avatar is still right.
export const lookKey = (look: Look): string => `${look.skin}|${look.hair}|${look.hairColour}|${look.shirt}`;

// The look's three colours, as the custom properties .av reads.
export const lookVars = (look: Look): string =>
  `--av-skin: ${hex(SKINS, look.skin)}; --av-hair: ${hex(HAIR_COLOURS, look.hairColour)}; --av-shirt: ${hex(SHIRTS, look.shirt)}`;

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
    for (const o of list) rules.push(`.editor:has(input[name="${field}"][value="${o.id}"]:checked) { ${prop}: ${o.hex}; }`);
  }
  return rules.join("\n");
}
