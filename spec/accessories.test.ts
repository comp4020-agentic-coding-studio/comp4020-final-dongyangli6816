// Avatar accessories, and how they're unlocked
// (docs/product/criteria/accessories.md, AV-4 to AV-7), the parts the server
// decides, checked over HTTP against the running app. Each test names the
// criteria it covers.
//
// ===========================================================================
// THE CONTRACT (9 Nov). The build meets this; the tests hold it to it.
// Anything not written here is the build's choice.
// ===========================================================================
//
// Ids. As stored, posted and put in attributes (src/sprites/accessories.ts,
// ACCESSORIES, in the criteria's D1 order):
//   head: cap beanie pink-beanie bucket-hat headphones sweatband hype-band
//         bandana squad-cap nightcap crown
//   face: glasses shades star-shades heart-shades mirror-shades
//   neck: towel bronze-medal silver-medal gold-medal gold-chain
//   Starters (AV-4.2): cap beanie pink-beanie bucket-hat headphones glasses
//   towel. Quick (AV-5.1 to 5.10) and long-haul (AV-5.11, 5.12, 5.14): the
//   rest.
//
// ---------------------------------------------------------------------------
// The editor, GET /avatar (AV-4)
// ---------------------------------------------------------------------------
// After the four look groups, three groups, one per slot, each a
// <fieldset data-slot="head|face|neck">. In each, one radio
//   <input type="radio" name="head|face|neck" value="none|<id>">
// for None and every accessory the person may wear (starters, and those
// they've unlocked), the one they wear `checked` (None when nothing). Every
// accessory of the slot has an element carrying
//   data-acc="<id>" data-state="starter|earned|locked"
// A locked one has no radio; its visible text holds the word "Locked", its
// condition, and for a count that only goes up, "<n> of <goal>" (AV-4.3; the
// crown never has a count). An earned one's text holds "Earned <d Mon>"
// (AV-4.4).
//
// POST /avatar, as today (a form, the Origin a real form carries), with
//   head=<id>|none  face=<id>|none  neck=<id>|none
// beside the look's fields. A missing slot field means none. Success: 303,
// as today, and the look and what's worn are stored together.
// intent=randomise rolls the four look choices and leaves what's worn as it
// was (AV-4.6).
// Refused (AV-4.8), the whole save, nothing stored: an unknown id, an id in
// another slot's field, an id the person hasn't unlocked, a slot field sent
// twice. Answer: 400 and the editor with its existing error text
// ("Couldn't save your avatar. ..."), as for a bad look today.
//
// ---------------------------------------------------------------------------
// What a person wears, wherever they're drawn (AV-7)
// ---------------------------------------------------------------------------
// The room's `room` event: each members[].look gains
//   "wear": {"head": <id>|null, "face": <id>|null, "neck": <id>|null}
// (Dony's always all null, AV-4.11). A change of what someone wears (Wear it
// or an editor Save) sends a `room` event to every open stream of every
// open room they're a member of (AV-7.7).
// Every server-drawn avatar (the map, the squad row's head, home's tile and
// lists, the editor preview, LB-7's art on history, the summary and the
// exercise page) carries
//   data-wear="<head>,<face>,<neck>"      empty where nothing ("cap,,")
// on its outermost avatar element, so a test reads it without the art.
// Nothing about accessories is added to any accessible name (AV-7.8).
//
// ---------------------------------------------------------------------------
// Wear it
// ---------------------------------------------------------------------------
// In the room, with the room's script (JSON, as interactions are):
//   POST /rooms/<id>  action=wear  acc=<id>
//   200 {"ok":true}
//   400 {"ok":false,"reason":"invalid"}   unknown id; the nightcap (it has no
//                                         Wear it, AV-6.15)
//   409 {"ok":false,"reason":"locked"}    not unlocked by the caller (a
//                                         starter is never locked)
// It puts the accessory in its slot, replacing what was there, and nothing
// else changes. Everyone else is answered as the room page answers them
// today (signed out 303 to sign in; not a member, the same 404).
//
// On the summary, with no script needed:
//   POST /workouts/<id>  action=wear  acc=<id>
//   the owner: 303 back to /workouts/<id>, same rules; a refused one 400 and
//   the summary with "That didn't save. Try again." Anyone else: the 404 the
//   summary gives today.
//
// ---------------------------------------------------------------------------
// Unlocks (AV-5)
// ---------------------------------------------------------------------------
// Worked out on the server in the same request as the action that could
// earn one (Done, Start set, a rest skip, Finish, a sent Cheer or preset, a
// High-five offer or acceptance), and again on opening the editor or a
// summary. Recorded for good with the time earned (AV-5.16). Back-fill for
// an account that already met a condition (AV-5.17) is recorded quietly.
//
// The summary, /workouts/<id>, lists what that workout unlocked, in the
// order earned, each as
//   <li data-unlocked="<id>"> ... </li>
// holding a Wear it form (action=wear) unless it's the nightcap or already
// worn ("Wearing it"). Quiet back-fill is never listed (AV-6.6, 6.14).
// An unlock belongs to the earner's workout open at the time; one earned
// outside a workout (a Cheer before the first set) belongs to the next
// workout the earner finishes in that room, or to none.
//
// Events, on the room's stream (/rooms/<id>/events):
//   event: unlock   {"accs":[<id>,...],"at"}
//       only to the earner's own open streams, in any room they're in;
//       never to anyone else; never for the nightcap or quiet back-fill
//       (AV-6.1, 6.4, 6.13, 6.15). accs in AV-6.4's order.
//   event: trophy   {"from":{"id","name"},"acc":<id>,"at"}
//       to every stream in that room, for a long-haul unlock (silver-medal,
//       gold-medal, gold-chain, crown) (AV-6.7). When the same Done is also
//       a PB, no trophy event: the `pb` event carries it instead (AV-6.8):
//   event: pb       gains "unlocked":[<id>,...] (long-haul ids only), and
//       is unchanged otherwise.
//   For gold-chain or squad-cap earned by both people at once (AV-5.13),
//   each gets their own `unlock` (and the room a trophy per person).
//
// The room log (the room page's; the `room` event carries none): a
// long-haul unlock is an entry
//   {"kind":"trophy","from":{"id","name"},"acc":<id>,"at"}
// kept after reload and restart (AV-6.9). Nothing else about accessories is
// ever in the log.
//
// The server log: one line per unlock (acc.unlock, with acc, condition and
// told|quiet), Wear it (acc.wear), editor save of what's worn (avatar.save,
// as today, with head/face/neck) and refusal (acc.refused / avatar.refused
// with a reason). No password, token, passcode or full email (OPS-2).
//
// ---------------------------------------------------------------------------
// The test hook (only with SPOTTER_TEST_HOOKS=1; otherwise 404, as today)
// ---------------------------------------------------------------------------
// No new op. The existing
//   POST /rooms/<id>/qa  op=backdate  ms=<n>  workout=<id>
// moves one of the caller's workouts in that room and its sets n ms back,
// which puts them on an earlier calendar day: enough for days trained (10,
// 30), days trained together (5) and the 4-week streak. It also moves those
// sets' rest end, as today. An unlock it makes newly true is recorded the
// next time unlocks are worked out (the next action, the editor, a
// summary), never by the hook itself.
// ===========================================================================


import { describe, expect, it, type TestContext } from "vitest";
import { JSDOM } from "jsdom";
import { backdate, backdateWorkout, Browser, createRoom, freshEmail, roomLogOf, signUp, watchRoom, type RoomEvent, type RoomWatch, type Wear } from "./helpers.ts";
import { DAY, done, EX, finish, midWeekAgo, start } from "./logbook-helpers.ts";

const S = 1000;
const MIN = 60 * S;
const STARTERS = ["cap", "beanie", "pink-beanie", "bucket-hat", "headphones", "glasses", "towel"];
const EARNED = [
  "sweatband", "hype-band", "bandana", "squad-cap", "nightcap", "crown",
  "shades", "star-shades", "heart-shades", "mirror-shades",
  "bronze-medal", "silver-medal", "gold-medal", "gold-chain",
];
const SLOTS = { head: ["cap", "beanie", "pink-beanie", "bucket-hat", "headphones", "sweatband", "hype-band", "bandana", "squad-cap", "nightcap", "crown"], face: ["glasses", "shades", "star-shades", "heart-shades", "mirror-shades"], neck: ["towel", "bronze-medal", "silver-medal", "gold-medal", "gold-chain"] } as const;
const NOTHING: Wear = { head: null, face: null, neck: null };
const SAVE_ERROR = "Couldn't save your avatar";

// ---------- people and rooms ----------

type Json = { ok: boolean; reason?: string; at?: number; offer?: number; done?: boolean };
type Answer = { status: number; body: Json | null; text: string };
async function answer(res: Response): Promise<Answer> {
  const text = await res.text();
  let body: Json | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body, text };
}

// A room with these people in it, the first its host, each in their own
// browser; ids from the room's own stream. watch() opens a stream that
// closes when the test ends.
async function gym(ctx: TestContext, names: string[]) {
  const b: Record<string, Browser> = {};
  for (const name of names) {
    b[name] = new Browser();
    await signUp(b[name], freshEmail(), "correct horse", name);
  }
  const { path, passcode } = await createRoom(b[names[0]]);
  for (const name of names.slice(1)) await b[name].post("/join", { passcode });
  const id: Record<string, number> = {};
  for (const m of (await now(b[names[0]], path)).members) id[m.name] = m.id;
  const watch = async (name: string, at = path) => {
    const w = await watchRoom(b[name], at);
    ctx.onTestFinished(() => w.close());
    await w.next("room", () => true, 2000);
    return w;
  };
  return { path, passcode, b, id, watch };
}

async function now(b: Browser, path: string): Promise<RoomEvent> {
  const w = await watchRoom(b, path);
  try {
    return await w.next("room", () => true, 2000);
  } finally {
    w.close();
  }
}
const wearOf = async (b: Browser, path: string, name: string) => (await now(b, path)).members.find((m) => m.name === name)?.look.wear;

const parse = (html: string) => new JSDOM(html).window.document;
const page = async (b: Browser, path: string) => parse(await (await b.get(path)).text());
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

// ---------- the editor ----------

type Tile = { state: string | null; text: string; choosable: boolean };
async function editor(b: Browser) {
  const d = await page(b, "/avatar");
  const tile = (acc: string): Tile => {
    const el = d.querySelector(`[data-acc="${acc}"]`);
    return {
      state: el?.getAttribute("data-state") ?? null,
      text: text(el),
      choosable: !!d.querySelector(`input[type="radio"][value="${acc}"]`),
    };
  };
  const checked = (name: string) => d.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null;
  const worn = (): Wear => {
    const w = (slot: string) => {
      const v = checked(slot);
      return v === null || v === "none" ? null : v;
    };
    return { head: w("head"), face: w("face"), neck: w("neck") };
  };
  const look = { skin: checked("skin")!, hair: checked("hair")!, hair_colour: checked("hair_colour")!, shirt: checked("shirt")! };
  return { d, tile, worn, look };
}

// a Save in the editor: her look as it is, and these slots
async function save(b: Browser, wear: Partial<Record<keyof Wear, string>>) {
  const { look } = await editor(b);
  return b.post("/avatar", { ...look, ...wear });
}

// Wear it, from the room (JSON) and from a summary
const wearIt = async (b: Browser, path: string, acc: string) => answer(await b.post(path, { action: "wear", acc }));

// ---------- interactions ----------

const interact = async (b: Browser, path: string, to: number, kind: string) =>
  answer(await b.post(path, { action: "interact", to: String(to), kind }));
const say = async (b: Browser, path: string, to: number, preset: string) =>
  answer(await b.post(path, { action: "say", to: String(to), preset }));
function ok(a: Answer, what: string) {
  expect(a.status, `${what}: ${a.text.slice(0, 160)}`).toBe(200);
  expect(a.body?.ok, what).toBe(true);
  return a.body!;
}

// Dony, out of his poster, with his own emoji moved away from now so his
// answers aren't held back (as spec/room-feel.test.ts summonQuiet)
async function summonQuiet(b: Browser, path: string, w: RoomWatch) {
  expect((await b.post(path, { action: "dony", intent: "summon" })).status).toBe(303);
  const out = await w.next("room", (e) => (e as unknown as { dony?: { member: unknown } }).dony?.member != null, 2000);
  const dony = (out as unknown as { dony: { member: { id: number } } }).dony.member.id;
  for (let j = 0; j < 400; j++) {
    await backdate(b, path, { room: true }, j === 0 ? 20 * MIN : 7_919);
    const res = await b.get(`${path}/qa`);
    const v = ((await res.json()) as { dony: { emotes: { at: number; why: string }[] } }).dony;
    const t = Date.now();
    if (!v.emotes.some((e) => e.why === "own" && e.at > t - 40 * S && e.at < t + 40 * S)) return dony;
  }
  throw new Error("no quiet stretch of his visit found");
}

// ---------- days ----------

// One finished workout of one working set (bench 40 kg x 8: never a PB after
// the first), moved back `daysAgo` whole days in this room.
async function dayOf(b: Browser, path: string, daysAgo: number, fields: Record<string, string> = {}) {
  await done(b, path, EX.bench, fields);
  const workout = await finish(b, path);
  if (daysAgo) await backdateWorkout(b, path, workout, daysAgo * DAY);
  return workout;
}
// Mia trained on n earlier days (n .. 1 days ago), one workout each
async function trainedDays(b: Browser, path: string, n: number) {
  for (let k = n; k >= 1; k--) await dayOf(b, path, k);
}

// ===========================================================================
// AV-4: the slots, the starters, the editor
// ===========================================================================

describe("the editor's accessories", () => {
  // AV-4.1 (three groups, each with None), AV-4.2 (the seven starters at
  // once), AV-4.3 (the fourteen earned ones locked with their goal, counts at
  // 0 where they count up, the crown with none), AV-4.6 (a new account
  // wears nothing)
  it("offers a new account the seven starters and None in each slot, and shows the rest locked", async () => {
    const b = new Browser();
    const res = await signUp(b, freshEmail(), "correct horse", "Priya");
    const d = parse(await (await b.follow(res.res)).text());
    for (const [slot, accs] of Object.entries(SLOTS)) {
      const group = d.querySelector(`fieldset[data-slot="${slot}"]`);
      expect(group, `the ${slot} group`).not.toBeNull();
      const values = [...group!.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${slot}"]`)].map((i) => i.value);
      expect(values, `${slot}: None and its starters`).toEqual(["none", ...accs.filter((a) => STARTERS.includes(a))]);
      expect(group!.querySelector<HTMLInputElement>(`input[name="${slot}"]:checked`)?.value, `${slot}: wearing nothing`).toBe("none");
      for (const acc of accs) expect(group!.querySelector(`[data-acc="${acc}"]`), `${acc} in the ${slot} group`).not.toBeNull();
    }
    const { tile } = await editor(b);
    for (const acc of STARTERS) expect(tile(acc), acc).toMatchObject({ state: "starter", choosable: true });
    for (const acc of EARNED) {
      const t = tile(acc);
      expect(t, acc).toMatchObject({ state: "locked", choosable: false });
      expect(t.text, acc).toContain("Locked");
    }
    for (const [acc, goal] of [["hype-band", "0 of 5"], ["star-shades", "0 of 3"], ["mirror-shades", "0 of 3"], ["bandana", "0 of 3"], ["silver-medal", "0 of 10"], ["gold-medal", "0 of 30"], ["gold-chain", "0 of 5"]]) {
      expect(tile(acc).text, `${acc} counts up`).toContain(goal);
    }
    expect(tile("nightcap").text, "the nightcap counts seconds").toMatch(/\b0( ?s)? of 60\b/);
    expect(tile("crown").text, "the crown never counts (D8)").not.toMatch(/\d+ of \d+/);
    expect(await wearOf(b, (await createRoom(b)).path, "Priya"), "and the room sees nothing worn").toEqual(NOTHING);
  });

  // AV-4.5 (a Save stores them with the look, success as today), AV-4.1 (all
  // three slots at once), AV-7.7 (the change reaches every open room she's a
  // member of, within a second; a fresh screen sees it as stored)
  it("saves a head, face and neck accessory together, and shows them in each of her rooms within a second", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const other = (await createRoom(g.b.Mia)).path;
    const tom = await g.watch("Tom");
    const mine = await g.watch("Mia", other);
    const res = await save(g.b.Mia, { head: "cap", face: "glasses", neck: "towel" });
    const saved = Date.now();
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/avatar?saved=1");
    const want = { head: "cap", face: "glasses", neck: "towel" };
    const seen = await tom.next("room", (e) => e.members.find((m) => m.name === "Mia")?.look.wear?.head === "cap", 2000);
    expect(seen.arrivedAt - saved, "Tom's screen within a second").toBeLessThan(1000);
    expect(seen.members.find((m) => m.name === "Mia")?.look.wear).toEqual(want);
    await mine.next("room", (e) => e.members.find((m) => m.name === "Mia")?.look.wear?.head === "cap", 1000);
    expect((await editor(g.b.Mia)).worn()).toEqual(want);
    expect(await wearOf(g.b.Tom, g.path, "Mia"), "a screen opened later").toEqual(want);
  });

  // AV-4.6 (Randomise rolls the look only; what's worn is untouched)
  it("leaves what she wears as it was when she taps Randomise", async () => {
    const b = new Browser();
    await signUp(b, freshEmail(), "correct horse", "Mia");
    expect((await save(b, { head: "beanie", face: "glasses", neck: "none" })).status).toBe(303);
    const res = await b.post("/avatar", { intent: "randomise", head: "beanie", face: "glasses", neck: "none" });
    expect(res.status).toBe(200);
    const d = parse(await res.text());
    const checked = (n: string) => d.querySelector<HTMLInputElement>(`input[name="${n}"]:checked`)?.value;
    expect([checked("head"), checked("face"), checked("neck")], "the roll keeps what's worn").toEqual(["beanie", "glasses", "none"]);
    expect((await editor(b)).worn(), "and nothing is saved").toEqual({ head: "beanie", face: "glasses", neck: null });
  });

  // AV-4.8 (an unknown id, the wrong slot, a locked one, a slot sent twice:
  // the whole save refused with the editor's error, nothing stored)
  it("refuses a hand-made save naming an accessory she can't wear, and stores none of it", async () => {
    const b = new Browser();
    await signUp(b, freshEmail(), "correct horse", "Mia");
    expect((await save(b, { head: "cap", face: "none", neck: "none" })).status).toBe(303);
    const { look } = await editor(b);
    const other = { ...look, shirt: look.shirt === "grey" ? "blue" : "grey" };
    const bad: [string, URLSearchParams][] = [
      ["an unknown id", new URLSearchParams({ ...other, head: "top-hat", face: "glasses", neck: "towel" })],
      ["an id in another slot's field", new URLSearchParams({ ...other, head: "glasses", face: "none", neck: "towel" })],
      ["a locked one", new URLSearchParams({ ...other, head: "crown", face: "glasses", neck: "towel" })],
      ["a locked one in face", new URLSearchParams({ ...other, head: "beanie", face: "shades", neck: "towel" })],
      ["a slot sent twice", new URLSearchParams([...Object.entries(other), ["head", "beanie"], ["head", "bucket-hat"], ["face", "glasses"], ["neck", "towel"]])],
    ];
    for (const [what, body] of bad) {
      const res = await b.request("/avatar", { method: "POST", body });
      expect(res.status, what).toBe(400);
      expect(await res.text(), what).toContain(SAVE_ERROR);
      const after = await editor(b);
      expect(after.worn(), `${what}: nothing worn changed`).toEqual({ head: "cap", face: null, neck: null });
      expect(after.look, `${what}: the look didn't change either`).toEqual(look);
    }
  });

  // AV-4.9 (a save with only the look's fields saves as before, wearing
  // nothing: the stand-in for an account from before accessories, whose
  // stored look has no slots)
  it("saves a look posted without any slot as before, wearing nothing", async () => {
    const b = new Browser();
    await signUp(b, freshEmail(), "correct horse", "Mia");
    expect((await save(b, { head: "cap", face: "glasses", neck: "towel" })).status).toBe(303);
    const res = await b.post("/avatar", { skin: "6", hair: "curls", hair_colour: "blue", shirt: "grey" });
    expect(res.headers.get("location")).toBe("/avatar?saved=1");
    const { look, worn } = await editor(b);
    expect(look).toEqual({ skin: "6", hair: "curls", hair_colour: "blue", shirt: "grey" });
    expect(worn()).toEqual(NOTHING);
  });
});

// ===========================================================================
// AV-7: wherever she's drawn
// ===========================================================================

describe("accessories wherever she's drawn", () => {
  // AV-7.4 (the squad row and home), AV-7.5 (history, the summary, the
  // exercise page), AV-7.6 (the editor's preview and home's tile), AV-7.8
  // (her map name and squad row's words unchanged)
  it("draws what she wears on the map, the squad row, home, the editor and the logbook, and names none of it", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = g.id.Mia;
    const workout = await dayOf(g.b.Mia, g.path, 0);
    const read = async () => {
      const room = await page(g.b.Tom, g.path);
      const onMap = room.querySelector(`button.avatar[data-id="${mia}"]`);
      const row = room.querySelector(`ul.people li[data-id="${mia}"]`);
      return { onMap, row, label: onMap?.getAttribute("aria-label"), rowText: text(row) };
    };
    const before = await read();
    expect(before.label, "her name on the map").toMatch(/^Mia\b/);
    expect((await save(g.b.Mia, { head: "bucket-hat", face: "glasses", neck: "towel" })).status).toBe(303);
    const after = await read();
    const WORN = "bucket-hat,glasses,towel";
    const wearIn = (el: Element | null | undefined) =>
      el ? [el, ...el.querySelectorAll("[data-wear]")].map((e) => e.getAttribute("data-wear")).filter((v) => v !== null) : [];
    expect(wearIn(after.onMap), "on the map").toContain(WORN);
    expect(wearIn(after.row), "in the squad row").toContain(WORN);
    expect(after.label, "the map's name is unchanged").toBe(before.label);
    expect(after.rowText, "the squad row's words are unchanged").toBe(before.rowText);
    const outsideUnlocks = (d: Document) =>
      [...d.querySelectorAll("[data-wear]")].filter((e) => !e.closest("[data-unlocked]")).map((e) => e.getAttribute("data-wear"));
    for (const at of ["/", "/history", `/workouts/${workout}`, `/exercises/${EX.bench}`]) {
      expect(outsideUnlocks(await page(g.b.Mia, at)), at).toContain(WORN);
    }
    const preview = (await editor(g.b.Mia)).d.querySelector(".preview");
    expect(wearIn(preview), "the editor's preview").toContain(WORN);
  });

  // AV-4.11, AV-7.13 (Dony wears nothing, on the stream and on the map),
  // AV-5.5 (a High-five Dony accepts counts for the offerer), AV-5.21 and
  // AV-5.10 (Dony never makes a day trained together)
  it("never puts an accessory on Dony, counts his High-five for the offerer, and never counts him as training together", async (ctx) => {
    const g = await gym(ctx, ["Ava"]);
    const ava = await g.watch("Ava");
    expect((await save(g.b.Ava, { head: "cap", face: "glasses", neck: "towel" })).status).toBe(303);
    const dony = await summonQuiet(g.b.Ava, g.path, ava);
    const offered = ok(await interact(g.b.Ava, g.path, dony, "highfive"), "Ava offers Dony a High-five");
    expect(offered.done, "an offer, not yet a High-five").toBeUndefined();
    await ava.next("highfive", (e) => e.done !== undefined && e.to.id === dony, 4000);
    const unlock = await ava.next("unlock", (e) => e.accs.includes("heart-shades"), 2000);
    expect(unlock.accs).toEqual(["heart-shades"]);
    await done(g.b.Ava, g.path, EX.bench);
    const e = (await now(g.b.Ava, g.path)) as unknown as RoomEvent & { dony: { member: { look: { wear: Wear } } } };
    expect(e.dony.member.look.wear, "Dony wears nothing").toEqual(NOTHING);
    const map = (await page(g.b.Ava, g.path)).querySelector(`button.avatar[data-id="${dony}"]`);
    expect(map, "Dony on the map").not.toBeNull();
    for (const el of [map!, ...map!.querySelectorAll("[data-wear]")]) {
      expect(el.getAttribute("data-wear") ?? ",,", "Dony on the map").toBe(",,");
    }
    const { tile } = await editor(g.b.Ava);
    expect(tile("squad-cap").state, "Dony never makes a day together").toBe("locked");
    expect(tile("heart-shades").state).toBe("earned");
  });
});

// ===========================================================================
// AV-5: what counts, and for good
// ===========================================================================

describe("the quick unlocks", () => {
  // AV-5.1 (a warm-up unlocks nothing; the first working set, with no stored
  // type, unlocks the Sweatband with that Done), AV-4.4 (the editor offers
  // it, earned, with its day), AV-6.3 (nothing is put on by itself),
  // AV-5.18 (the unlock comes from the Done, no second request)
  it("unlocks the Sweatband with her first working set, never a warm-up, and doesn't put it on", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const mia = await g.watch("Mia");
    await done(g.b.Mia, g.path, EX.bench, { set_type: "warmup" });
    expect((await editor(g.b.Mia)).tile("sweatband").state, "after a warm-up").toBe("locked");
    expect(mia.all("unlock"), "nothing for a warm-up").toEqual([]);
    await done(g.b.Mia, g.path, EX.bench);
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["sweatband"]);
    const { tile, worn } = await editor(g.b.Mia);
    expect(tile("sweatband")).toMatchObject({ state: "earned", choosable: true });
    const day = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", day: "numeric", month: "short" }).format(new Date());
    expect(tile("sweatband").text).toContain(`Earned ${day}`);
    expect(worn(), "not put on").toEqual(NOTHING);
    expect(await wearOf(g.b.Mia, g.path, "Mia")).toEqual(NOTHING);
  });

  // AV-5.2 (a workout of warm-ups only unlocks nothing; one finished by its
  // room closing counts)
  it("unlocks the Bronze medal for a finished workout with a working set, a closed room's included, never warm-ups only", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    await done(g.b.Mia, g.path, EX.bench, { set_type: "warmup" });
    await finish(g.b.Mia, g.path);
    expect((await editor(g.b.Mia)).tile("bronze-medal").state, "warm-ups only").toBe("locked");
    await done(g.b.Tom, g.path, EX.bench);
    expect((await editor(g.b.Tom)).tile("bronze-medal").state, "still open").toBe("locked");
    expect((await g.b.Mia.post(g.path, { action: "end" })).status).toBe(303);
    expect((await editor(g.b.Tom)).tile("bronze-medal").state, "finished by the room closing").toBe("earned");
  });

  // AV-5.3 (the first set is never a PB, an equal one isn't, a better one
  // unlocks Shades with that Done)
  it("unlocks Shades with the Done that beats her best, not one that equals it", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const mia = await g.watch("Mia");
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "40", reps: "8" });
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "40", reps: "8" });
    await mia.next("unlock", (e) => e.accs.includes("sweatband"), 2000);
    expect((await editor(g.b.Mia)).tile("shades").state, "after an equal set").toBe("locked");
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "42.5", reps: "8" });
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["shades"]);
  });

  // AV-5.4 (five accepted Cheers; a refused one and a Thanks don't count; a
  // Cheer to Dony does), AV-4.3 (the count shows how far: "4 of 5")
  it("unlocks the Hype band on her fifth accepted Cheer, Dony's included, not counting refusals or Thanks", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = await g.watch("Mia");
    const dony = await summonQuiet(g.b.Mia, g.path, mia);
    const tom = g.id.Tom;
    ok(await interact(g.b.Mia, g.path, tom, "cheer"), "1, to Tom");
    expect((await interact(g.b.Mia, g.path, tom, "cheer")).status, "refused: the 10 s limit").toBe(429);
    ok(await interact(g.b.Mia, g.path, dony, "cheer"), "2, to Dony");
    ok(await interact(g.b.Tom, g.path, g.id.Mia, "cheer"), "Tom cheers Mia");
    const theirs = await mia.next("interaction", (e) => e.kind === "cheer" && e.to.id === g.id.Mia, 2000);
    ok(await answer(await g.b.Mia.post(g.path, { action: "reply", answers: String(theirs.id) })), "Mia's Thanks");
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 11 * S);
    ok(await interact(g.b.Mia, g.path, tom, "cheer"), "3, to Tom");
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 11 * S);
    ok(await interact(g.b.Mia, g.path, tom, "cheer"), "4, to Tom");
    const four = (await editor(g.b.Mia)).tile("hype-band");
    expect(four.state).toBe("locked");
    expect(four.text).toContain("4 of 5");
    expect(mia.all("unlock")).toEqual([]);
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 11 * S);
    ok(await interact(g.b.Mia, g.path, tom, "cheer"), "5, to Tom");
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["hype-band"]);
  }, 60_000);

  // AV-5.7 (three accepted hype presets, Dony's included; a nudge and a
  // refused one don't count)
  it("unlocks Star shades on her third accepted hype preset, Dony's included, not counting nudges or refusals", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = await g.watch("Mia");
    const dony = await summonQuiet(g.b.Mia, g.path, mia);
    const tom = g.id.Tom;
    ok(await say(g.b.Mia, g.path, tom, "hype-1"), "1, to Tom");
    expect((await say(g.b.Mia, g.path, tom, "hype-2")).status, "refused: the 2 s limit").toBe(429);
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 3 * S);
    ok(await say(g.b.Mia, g.path, tom, "nudge-1"), "a nudge");
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 3 * S);
    ok(await say(g.b.Mia, g.path, dony, "hype-3"), "2, to Dony");
    const two = (await editor(g.b.Mia)).tile("star-shades");
    expect(two.state).toBe("locked");
    expect(two.text).toContain("2 of 3");
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 3 * S);
    ok(await say(g.b.Mia, g.path, tom, "hype-5"), "3, to Tom");
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["star-shades"]);
  }, 60_000);

  // AV-5.5 (a lapsed offer counts for nobody; a High-five that happens
  // unlocks Heart shades for both, the one who didn't act included)
  it("unlocks Heart shades for both people when a High-five lands, never for a lapsed one", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = await g.watch("Mia");
    const tom = await g.watch("Tom");
    const first = ok(await interact(g.b.Mia, g.path, g.id.Tom, "highfive"), "Mia offers");
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, 11 * S);
    expect((await answer(await g.b.Tom.post(g.path, { action: "accept", offer: String(first.offer) }))).body?.reason, "lapsed").toBe("too-slow");
    expect((await editor(g.b.Mia)).tile("heart-shades").state, "lapsed: Mia").toBe("locked");
    expect((await editor(g.b.Tom)).tile("heart-shades").state, "lapsed: Tom").toBe("locked");
    const again = ok(await interact(g.b.Mia, g.path, g.id.Tom, "highfive"), "Mia offers again");
    ok(await answer(await g.b.Tom.post(g.path, { action: "accept", offer: String(again.offer) })), "Tom accepts");
    expect((await tom.next("unlock", () => true, 2000)).accs, "Tom, who accepted").toEqual(["heart-shades"]);
    expect((await mia.next("unlock", () => true, 2000)).accs, "Mia, who offered").toEqual(["heart-shades"]);
  });

  // AV-5.6 (59 s of Slacking time doesn't, 60 s does, and only once it's
  // stored, never during the rest), AV-6.15 (the Nightcap is told to nobody:
  // no unlock event, no room log line; only her summary lists it, with no
  // Wear it)
  it("unlocks the Nightcap at a minute of stored Slacking time, and tells nobody but her summary", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = await g.watch("Mia");
    const tom = await g.watch("Tom");
    // a curl rests 60 s; Slacking starts 30 s past that
    await done(g.b.Mia, g.path, EX.curl);
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, (60 + 30 + 58.5) * S);
    await start(g.b.Mia, g.path, { exercise_id: EX.curl, weight_kg: "10", reps: "8" });
    const almost = (await editor(g.b.Mia)).tile("nightcap");
    expect(almost.state, "under 60 s").toBe("locked");
    expect(almost.text).toMatch(/\b5[89]( ?s)? of 60\b/);
    await done(g.b.Mia, g.path, EX.curl);
    await backdate(g.b.Mia, g.path, { user: g.id.Mia }, (60 + 30 + 3) * S);
    expect((await editor(g.b.Mia)).tile("nightcap").state, "during the rest itself").toBe("locked");
    await start(g.b.Mia, g.path, { exercise_id: EX.curl, weight_kg: "10", reps: "8" });
    expect((await editor(g.b.Mia)).tile("nightcap").state, "once stored").toBe("earned");
    await done(g.b.Mia, g.path, EX.curl);
    const workout = await finish(g.b.Mia, g.path);
    const summary = await page(g.b.Mia, `/workouts/${workout}`);
    const li = summary.querySelector('li[data-unlocked="nightcap"]');
    expect(li, "on her summary").not.toBeNull();
    expect(li!.querySelector('input[name="action"][value="wear"], button[value="wear"]'), "no Wear it").toBeNull();
    expect(mia.all("unlock").some((u) => u.accs.includes("nightcap")), "no banner for her").toBe(false);
    expect(tom.all("unlock").length + tom.all("trophy").length, "nothing to Tom").toBe(0);
    const log = roomLogOf(await (await g.b.Tom.get(g.path)).text());
    expect(log, "Tom's room page has its room log").not.toBeNull();
    expect(log!.join("\n")).not.toMatch(/nightcap|unlocked/i);
  }, 30_000);

  // AV-5.8 (three on-time rests unlock Mirror shades with the Start set;
  // a rest after a warm-up, and one ended Slacking, don't count)
  it("unlocks Mirror shades on her third rest ended on time, not counting a warm-up's or a Slacking one", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const mia = await g.watch("Mia");
    const curl = { exercise_id: EX.curl, weight_kg: "10", reps: "8" };
    const rest = async (type: string, pastTarget: number | null) => {
      await done(g.b.Mia, g.path, EX.curl, { set_type: type });
      if (pastTarget !== null) await backdate(g.b.Mia, g.path, { user: g.id.Mia }, (60 + pastTarget) * S);
      await start(g.b.Mia, g.path, curl);
    };
    await rest("normal", null); // 1, at once
    await rest("warmup", null); // a warm-up's rest
    await rest("normal", 31); // ended Slacking
    const one = (await editor(g.b.Mia)).tile("mirror-shades");
    expect(one.state).toBe("locked");
    expect(one.text).toContain("1 of 3");
    await rest("normal", 28); // 2, 28 s past the target (plus the request's own time)
    expect(mia.all("unlock").some((u) => u.accs.includes("mirror-shades"))).toBe(false);
    await rest("normal", null); // 3
    expect((await mia.next("unlock", (e) => e.accs.includes("mirror-shades"), 2000)).accs).toEqual(["mirror-shades"]);
  }, 30_000);

  // AV-5.9 (bench and incline bench are one machine; a set in another room
  // counts; the third machine's Done unlocks the Bandana)
  it("unlocks the Bandana on her third machine, counting bench and incline bench as one, in any room", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const mia = await g.watch("Mia");
    await done(g.b.Mia, g.path, EX.bench);
    await done(g.b.Mia, g.path, EX.incline);
    await done(g.b.Mia, g.path, EX.squat);
    const two = (await editor(g.b.Mia)).tile("bandana");
    expect(two.state).toBe("locked");
    expect(two.text).toContain("2 of 3");
    const other = (await createRoom(g.b.Mia)).path;
    await done(g.b.Mia, other, EX.curl);
    expect((await mia.next("unlock", (e) => e.accs.includes("bandana"), 2000)).accs).toEqual(["bandana"]);
  });

  // AV-5.10, AV-5.13 (the Done that completes the pair unlocks the Squad cap
  // for both, the one who didn't act included; in AV-6.4's order)
  it("unlocks the Squad cap for both people with the second one's first working set", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Jiwoo"]);
    const mia = await g.watch("Mia");
    const jiwoo = await g.watch("Jiwoo");
    await done(g.b.Mia, g.path, EX.bench);
    expect((await mia.next("unlock", () => true, 2000)).accs, "Mia alone").toEqual(["sweatband"]);
    await done(g.b.Jiwoo, g.path, EX.curl);
    expect((await jiwoo.next("unlock", () => true, 2000)).accs, "Ji-woo, who logged second").toEqual(["sweatband", "squad-cap"]);
    expect((await mia.next("unlock", () => true, 2000)).accs, "Mia, who didn't act").toEqual(["squad-cap"]);
  });
});

describe("the long-haul unlocks", () => {
  // AV-5.11 (nine days, however many workouts, isn't ten; the tenth day's
  // Done unlocks the Silver medal; the thirtieth, the Gold medal). Each Done
  // is logged today and its workout moved back after, so today is always one
  // of the days counted at that Done.
  it("unlocks the Silver medal on her tenth day trained and the Gold medal on her thirtieth", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const mia = await g.watch("Mia");
    const moveBack = (w: string, days: number) => backdateWorkout(g.b.Mia, g.path, w, days * DAY);
    await trainedDays(g.b.Mia, g.path, 8); // 8 .. 1 days ago
    const a = await dayOf(g.b.Mia, g.path, 0);
    const b = await dayOf(g.b.Mia, g.path, 0); // two workouts today: nine days, ten workouts
    const nine = (await editor(g.b.Mia)).tile("silver-medal");
    expect(nine.state, "nine days").toBe("locked");
    expect(nine.text).toContain("9 of 10");
    await moveBack(a, 9);
    await moveBack(b, 9); // still nine days: 9 .. 1 days ago
    expect(mia.all("unlock").some((u) => u.accs.includes("silver-medal"))).toBe(false);
    await done(g.b.Mia, g.path, EX.bench); // today, the tenth
    expect((await mia.next("unlock", (e) => e.accs.includes("silver-medal"), 2000)).accs, "with the tenth day's Done").toEqual(["silver-medal"]);
    await moveBack(await finish(g.b.Mia, g.path), 10);
    for (let k = 28; k >= 11; k--) await dayOf(g.b.Mia, g.path, k); // 28 .. 1 days ago
    const c = await dayOf(g.b.Mia, g.path, 0); // today: 29
    const twentyNine = (await editor(g.b.Mia)).tile("gold-medal");
    expect(twentyNine.state).toBe("locked");
    expect(twentyNine.text).toContain("29 of 30");
    await moveBack(c, 29);
    await done(g.b.Mia, g.path, EX.bench); // today, the thirtieth
    expect((await mia.next("unlock", (e) => e.accs.includes("gold-medal"), 2000)).accs).toEqual(["gold-medal"]);
  }, 120_000);

  // AV-5.12, AV-5.13 (a day only one of them logged, and a day they logged
  // in different rooms, don't count; the fifth day together unlocks the Gold
  // chain for both, with the Done that completes the pair)
  it("unlocks the Gold chain for both on their fifth day trained together in one room", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Jiwoo"]);
    const elsewhere = (await createRoom(g.b.Jiwoo)).path;
    await dayOf(g.b.Mia, g.path, 6); // only Mia
    await dayOf(g.b.Mia, g.path, 5); // both, in different rooms
    await dayOf(g.b.Jiwoo, elsewhere, 5);
    for (let k = 4; k >= 1; k--) {
      await dayOf(g.b.Mia, g.path, k);
      await dayOf(g.b.Jiwoo, g.path, k);
    }
    const four = (await editor(g.b.Mia)).tile("gold-chain");
    expect(four.state).toBe("locked");
    expect(four.text).toContain("4 of 5");
    const mia = await g.watch("Mia");
    const jiwoo = await g.watch("Jiwoo");
    await done(g.b.Jiwoo, g.path, EX.bench);
    await done(g.b.Mia, g.path, EX.bench);
    expect((await mia.next("unlock", () => true, 2000)).accs, "Mia, who completed the pair").toEqual(["gold-chain"]);
    expect((await jiwoo.next("unlock", () => true, 2000)).accs, "Ji-woo, who didn't act").toEqual(["gold-chain"]);
  }, 60_000);

  // AV-5.14 (a past run of four weeks counts, warm-ups included, with no
  // streak now), AV-4.3 (the crown never shows a count)
  it("unlocks the Crown for a past run of four weeks, of warm-ups only, with no streak now", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const week = async (n: number) => {
      await done(g.b.Mia, g.path, EX.bench, { set_type: "warmup" });
      const w = await finish(g.b.Mia, g.path);
      await backdateWorkout(g.b.Mia, g.path, w, Date.now() - midWeekAgo(n));
    };
    for (const n of [7, 6, 5]) await week(n);
    const three = (await editor(g.b.Mia)).tile("crown");
    expect(three.state).toBe("locked");
    expect(three.text).not.toMatch(/\d+ of \d+/);
    await week(4);
    expect((await editor(g.b.Mia)).tile("crown").state, "four weeks in a row, three weeks ago").toBe("earned");
  }, 30_000);
});

describe("an unlock is kept", () => {
  // AV-5.16 (deleting the sets that earned them locks nothing again)
  it("keeps the Sweatband and Shades after she deletes the sets that earned them", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "40", reps: "8" });
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "45", reps: "8" });
    const ids = [...new Set([...(await (await g.b.Mia.get(g.path)).text()).matchAll(/[?&]edit=(\d+)/g)].map((m) => m[1]))];
    expect(ids).toHaveLength(2);
    let { tile } = await editor(g.b.Mia);
    expect([tile("sweatband").state, tile("shades").state]).toEqual(["earned", "earned"]);
    for (const id of ids) expect((await g.b.Mia.post(g.path, { action: "delete", set_id: id })).status).toBe(303);
    ({ tile } = await editor(g.b.Mia));
    expect([tile("sweatband").state, tile("shades").state], "after deleting both sets").toEqual(["earned", "earned"]);
  });

  // AV-5.19 (two Dones at the same moment, two tabs open: one unlock, told
  // once on each screen)
  it("records an unlock once and tells each open screen once when two Dones arrive together", async (ctx) => {
    const g = await gym(ctx, ["Mia"]);
    const tab1 = await g.watch("Mia");
    const tab2 = await g.watch("Mia");
    const set = { exercise_id: EX.bench, weight_kg: "40", reps: "8" };
    const both = await Promise.all([g.b.Mia.post(g.path, set), g.b.Mia.post(g.path, set)]);
    for (const r of both) expect(r.status).toBe(303);
    await tab1.next("unlock", () => true, 2000);
    await tab2.next("unlock", () => true, 2000);
    await tab1.during("unlock", 500);
    for (const tab of [tab1, tab2]) {
      expect(tab.all("unlock").map((u) => u.accs), "told once").toEqual([["sweatband"]]);
    }
  });
});

// ===========================================================================
// AV-6: being told, and Wear it
// ===========================================================================

describe("being told", () => {
  // AV-4.13, AV-6.7 (a quick unlock sends nothing to anyone else), AV-6.13
  // (an action in another room tells her open screens in this one)
  it("tells only the earner of a quick unlock, on her open screens in any of her rooms", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    const mia = await g.watch("Mia");
    const tom = await g.watch("Tom");
    const other = (await createRoom(g.b.Mia)).path;
    await done(g.b.Mia, other, EX.bench);
    expect((await mia.next("unlock", () => true, 2000)).accs, "Mia's screen in the room she isn't logging in").toEqual(["sweatband"]);
    await done(g.b.Mia, g.path, EX.bench);
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "45" }); // Shades, in this room
    await mia.next("unlock", (e) => e.accs.includes("shades"), 2000);
    await tom.during("unlock", 300);
    expect(tom.all("unlock"), "no unlock to Tom").toEqual([]);
    expect(tom.all("trophy"), "no room banner").toEqual([]);
    const log = roomLogOf(await (await g.b.Tom.get(g.path)).text());
    expect(log, "Tom's room page has its room log").not.toBeNull();
    expect(log!.join("\n"), "nothing in the room log").not.toMatch(/unlocked/i);
    expect(JSON.stringify(await now(g.b.Tom, g.path)), "nothing about her unlocks in Tom's room view").not.toMatch(/sweatband|shades/);
  });

  // AV-6.7 (a long-haul unlock: the room's trophy to everyone, her own
  // unlock to her), AV-6.9 (the room log line, for Tom and for her, kept
  // after a reload)
  it("tells the whole room of a long-haul unlock, and keeps it in the room log", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    await trainedDays(g.b.Mia, g.path, 9);
    const mia = await g.watch("Mia");
    const tom = await g.watch("Tom");
    const posted = Date.now();
    await done(g.b.Mia, g.path, EX.bench);
    const trophy = await tom.next("trophy", () => true, 2000);
    expect(trophy.arrivedAt - posted, "within a second").toBeLessThan(1000);
    expect(trophy).toMatchObject({ from: { id: g.id.Mia, name: "Mia" }, acc: "silver-medal" });
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["silver-medal"]);
    expect(tom.all("unlock"), "Tom gets the room's, not hers").toEqual([]);
    expect(roomLogOf(await (await g.b.Tom.get(g.path)).text())?.[0], "Tom's log").toMatch(/^Mia unlocked the silver medal\b/i);
    expect(roomLogOf(await (await g.b.Mia.get(g.path)).text())?.[0], "Mia's log").toMatch(/^You unlocked the silver medal\b/i);
  }, 60_000);

  // AV-6.8 (a Done that is a PB and a long-haul unlock: one pb event carrying
  // it, no trophy), AV-6.4 (her one unlock names both, long-haul first)
  it("folds a long-haul unlock into the PB it came with, and names both to her, long-haul first", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    await trainedDays(g.b.Mia, g.path, 9);
    const mia = await g.watch("Mia");
    const tom = await g.watch("Tom");
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "45" });
    const pb = await tom.next("pb", () => true, 2000);
    expect(pb.from.id).toBe(g.id.Mia);
    expect(pb.unlocked).toEqual(["silver-medal"]);
    expect((await mia.next("unlock", () => true, 2000)).accs).toEqual(["silver-medal", "shades"]);
    await tom.during("trophy", 500);
    expect(tom.all("trophy"), "no second banner").toEqual([]);
  }, 60_000);

  // AV-6.6 (the summary lists the workout's unlocks in the order earned,
  // each with Wear it, no script needed; "Wearing it" once worn; the same
  // later), the contract's summary Wear it (owner 303, refused 400, anyone
  // else 404)
  it("lists what a workout unlocked on its summary, each with a Wear it that works without script", async () => {
    const b = new Browser();
    await signUp(b, freshEmail(), "correct horse", "Mia");
    const path = (await createRoom(b)).path;
    await done(b, path, EX.bench, { weight_kg: "40" });
    await done(b, path, EX.bench, { weight_kg: "45" });
    const workout = await finish(b, path);
    const at = `/workouts/${workout}`;
    const listed = async () => [...(await page(b, at)).querySelectorAll("li[data-unlocked]")];
    const ids = (await listed()).map((li) => li.getAttribute("data-unlocked"));
    expect(ids, "in the order earned").toEqual(["sweatband", "shades", "bronze-medal"]);
    for (const li of await listed()) expect(li.querySelector('input[name="action"][value="wear"], button[name="action"][value="wear"]'), li.getAttribute("data-unlocked")!).not.toBeNull();

    const worn = await b.post(at, { action: "wear", acc: "shades" });
    expect(worn.status).toBe(303);
    expect(worn.headers.get("location")).toMatch(new RegExp(`^/workouts/${workout}\\b`));
    const shades = (await listed()).find((li) => li.getAttribute("data-unlocked") === "shades")!;
    expect(text(shades)).toContain("Wearing it");
    expect(shades.querySelector('[value="wear"]')).toBeNull();
    expect((await editor(b)).worn()).toEqual({ head: null, face: "shades", neck: null });

    const refused = await b.post(at, { action: "wear", acc: "crown" });
    expect(refused.status).toBe(400);
    expect(await refused.text()).toContain("That didn't save. Try again.");
    expect((await editor(b)).worn(), "nothing changed").toEqual({ head: null, face: "shades", neck: null });

    const tom = new Browser();
    await signUp(tom, freshEmail(), "correct horse", "Tom");
    const theirs = await tom.post(at, { action: "wear", acc: "sweatband" });
    const nowhere = await tom.get("/workouts/999999999");
    expect(theirs.status, "someone else's summary").toBe(404);
    expect(nowhere.status).toBe(404);
  });
});

describe("Wear it in the room", () => {
  // AV-6.2 (Wear it puts it in its slot, replacing what was there, and
  // nothing else about her changes), AV-5.20, AV-7.7 (on Tom's screen within
  // a second), the contract's refusals (invalid, locked, the nightcap,
  // someone not in the room, signed out)
  it("puts an earned accessory on at once for everyone, replacing what was in the slot, and refuses the rest", async (ctx) => {
    const g = await gym(ctx, ["Mia", "Tom"]);
    expect((await save(g.b.Mia, { head: "cap", face: "glasses", neck: "none" })).status).toBe(303);
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "40" });
    await done(g.b.Mia, g.path, EX.bench, { weight_kg: "45" }); // Shades; she's resting
    const tom = await g.watch("Tom");
    const before = (await now(g.b.Tom, g.path)).members.find((m) => m.name === "Mia")!;
    expect(before.state).toBe("resting");

    const sent = Date.now();
    ok(await wearIt(g.b.Mia, g.path, "shades"), "Wear it");
    const seen = await tom.next("room", (e) => e.members.find((m) => m.name === "Mia")?.look.wear?.face === "shades", 2000);
    expect(seen.arrivedAt - sent, "within a second").toBeLessThan(1000);
    const after = seen.members.find((m) => m.name === "Mia")!;
    expect(after.look.wear).toEqual({ head: "cap", face: "shades", neck: null });
    const { look: l1, ...rest1 } = before as typeof before & { seenAt?: number };
    const { look: l2, ...rest2 } = after as typeof after & { seenAt?: number };
    const same = (r: Record<string, unknown>) => ({ ...r, seenAt: undefined });
    expect(same(rest2), "nothing else about her changed").toEqual(same(rest1));
    expect({ ...l2, wear: null }).toEqual({ ...l1, wear: null });

    expect((await wearIt(g.b.Mia, g.path, "top-hat")).body).toEqual({ ok: false, reason: "invalid" });
    expect((await wearIt(g.b.Mia, g.path, "crown")).body).toEqual({ ok: false, reason: "locked" });
    const locked = await wearIt(g.b.Mia, g.path, "gold-chain");
    expect(locked.status).toBe(409);
    const nightcap = await wearIt(g.b.Mia, g.path, "nightcap");
    expect({ status: nightcap.status, body: nightcap.body }, "the nightcap has no Wear it").toEqual({ status: 400, body: { ok: false, reason: "invalid" } });
    const stranger = new Browser();
    await signUp(stranger, freshEmail(), "correct horse", "Lena");
    const there = await stranger.post(g.path, { action: "wear", acc: "cap" });
    const nowhere = await stranger.post("/rooms/999999999", { action: "wear", acc: "cap" });
    expect(there.status, "not a member").toBe(404);
    expect(await there.text()).toBe(await nowhere.text());
    const signedOut = await new Browser().post(g.path, { action: "wear", acc: "cap" });
    expect(signedOut.status).toBe(303);
    expect(signedOut.headers.get("location")).toMatch(/^\/signin\b/);
    expect(await wearOf(g.b.Tom, g.path, "Mia"), "none of them changed anything").toEqual({ head: "cap", face: "shades", neck: null });
  });
});
