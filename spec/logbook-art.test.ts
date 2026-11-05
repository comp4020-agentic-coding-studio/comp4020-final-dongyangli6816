import { describe, expect, it } from "vitest";
import type { Browser } from "./helpers.ts";
import { done, finish, page, setsIn, solo, textOf, textOfDoc } from "./logbook-helpers.ts";

// LB-7, an exercise's animation in the logbook (docs/product/criteria/
// logbook.md, D36 to D43), the parts the server's HTML decides, checked over
// HTTP against the running app. Each test names the criteria it covers. The
// motion, sizes and taps (LB-7.9 to LB-7.13) are browser checks.
//
// Stand-in (LB-7.7): no hook makes a row from before this change, or from
// before the four kinds (the logbook contract, settled 7), so sets posted now
// stand in; the art goes by the exercise, so all 16 are checked.
//
// ===========================================================================
// THE CONTRACT for LB-7 (exercise art), 5 Nov 2026. An addition to the logbook
// contract at the top of spec/logbook.test.ts; nothing there changes.
//
// -- Requests ---------------------------------------------------------------------
// None new. The art is drawn into pages the server already answers: /history,
// /workouts/<id>, /exercises/<id>. No event is sent, no field is read.
//
// -- Hooks in the HTML the tests read (the build keeps them) -----------------------
// Every piece of exercise art is one element:
//   <span class="ex-art" data-pose="<equipment>" aria-hidden="true"> ... </span>
//   where <equipment> is the exercise's machine key: treadmill, flat-bench,
//   squat-rack, dumbbell-rack, lifting-platform, pull-up-bar, cable-machine,
//   exercise-mat (src/lib/exercises.ts EQUIPMENT; spec-4-weeks.md equipment table).
//   Inside it, in this order: the machine's back layer (svg.machine.back), the
//   avatar (svg.av, with class pose-<equipment>), the machine's front layer
//   (svg.machine.front). The avatar carries its look as the gym does: the
//   data-look attribute is NOT promised; the look's colours are custom
//   properties on svg.av (--av-skin, --av-shirt, --av-hair, ...) and its hair
//   style is the g.hair-<style> group drawn.
//   It contains no text and nothing focusable.
//
// On history and a summary, in the set table (table.log): each exercise group's
//   row header th.lift holds exactly one .ex-art, inside the group's link
//   a[href="/exercises/<id>"] (so a tap on it opens the exercise page; the link's
//   text is still exactly the exercise's name).
// On the exercise page: the head (header.ex-head) holds exactly one .ex-art, for
//   that exercise, on the default page and on the never-logged empty state. Its
//   own set table (groups are sessions) holds none.
// Nowhere else: the room page, home (/), /plans, and the summary's plan preview
//   (ol.plan-list) hold no .ex-art.
//
// -- Motion ------------------------------------------------------------------------
// The art's two frames are g.frame-1 and g.frame-2 inside it (person and machine
// together). With motion allowed, frame-2 becomes visible within one frame time
// (400 ms; 250 ms for data-pose="treadmill"). With prefers-reduced-motion:
// reduce, frame-1 stays visible and frame-2 hidden.
// ===========================================================================

// the exercise's machine (src/lib/exercises.ts, the equipment table)
const MACHINE: Record<string, string> = {
  "1": "treadmill", "2": "treadmill", "3": "flat-bench", "4": "flat-bench", "5": "squat-rack", "6": "squat-rack",
  "7": "dumbbell-rack", "8": "dumbbell-rack", "9": "lifting-platform", "10": "lifting-platform",
  "11": "pull-up-bar", "12": "pull-up-bar", "13": "cable-machine", "14": "cable-machine",
  "15": "exercise-mat", "16": "exercise-mat",
};
const NAME: Record<string, string> = {
  "1": "Run", "2": "Incline walk", "3": "Bench press", "4": "Incline bench press", "5": "Back squat",
  "6": "Overhead press", "7": "Dumbbell curl", "8": "Lateral raise", "9": "Deadlift", "10": "Romanian deadlift",
  "11": "Pull-up", "12": "Hanging leg raise", "13": "Lat pulldown", "14": "Seated cable row", "15": "Push-ups", "16": "Plank",
};
// a set of each kind, as the room takes it
const SET: Record<string, Record<string, string>> = {
  cardio: { distance_km: "2", minutes: "10", seconds: "0" },
  duration: { minutes: "1", seconds: "0" },
  bodyweight: { reps: "8", weight_kg: "" },
  weight: { weight_kg: "40", reps: "8" },
};
const kindOf = (ex: string) => (["1", "2"].includes(ex) ? "cardio" : ex === "16" ? "duration" : ["11", "12", "15"].includes(ex) ? "bodyweight" : "weight");
const logSet = (b: Browser, path: string, ex: string) => done(b, path, ex, SET[kindOf(ex)]);

const LOOK = { skin: "2", hair: "ponytail", hair_colour: "pink", shirt: "white" };
const OTHER = { skin: "6", hair: "curls", hair_colour: "blue", shirt: "grey" };

// one piece of art as the contract draws it
type Art = { pose: string; hidden: boolean; layers: string[]; avClass: string; colours: string; hair: string[]; text: string; focusable: number };
function artOf(el: Element): Art {
  const av = el.querySelector("svg.av");
  return {
    pose: el.getAttribute("data-pose") ?? "",
    hidden: el.getAttribute("aria-hidden") === "true",
    // the three layers, in order
    layers: [...el.querySelectorAll("svg.machine.back, svg.av, svg.machine.front")].map((s) =>
      s.classList.contains("av") ? "av" : s.classList.contains("back") ? "back" : "front",
    ),
    avClass: av?.getAttribute("class") ?? "",
    colours: colours(av),
    hair: hairOf(av),
    text: (el.textContent ?? "").trim(),
    focusable: el.querySelectorAll("a, button, input, select, textarea, [tabindex]").length,
  };
}
// the look's colours: the --av-* custom properties, sorted
const colours = (svg: Element | null | undefined) =>
  ((svg?.getAttribute("style") ?? "").match(/--av-[\w-]+\s*:\s*[^;]+/g) ?? []).map((s) => s.replace(/\s+/g, "")).sort().join(";");
const hairOf = (svg: Element | null | undefined) =>
  [...new Set([...(svg?.querySelectorAll("g[class*='hair-']") ?? [])].flatMap((g) => [...g.classList].filter((c) => /^hair-/.test(c))))].sort();

// a piece of art for this machine, drawn as the contract says
function expectArt(el: Element | null, machine: string, what: string) {
  expect(el, `${what}: art`).not.toBeNull();
  const a = artOf(el!);
  expect(a.pose, what).toBe(machine);
  expect(a.layers, `${what}: back, avatar, front`).toEqual(["back", "av", "front"]);
  expect(a.avClass, `${what}: the avatar in the machine's pose`).toContain(`pose-${machine}`);
  return a;
}

// each exercise group of a set table: its name link and the art in its row header
function groups(d: Document, table: Element | null = null) {
  const scope = table ?? d;
  return [...scope.querySelectorAll("table.log th.lift")].map((th) => {
    const link = th.querySelector('a[href^="/exercises/"]');
    return { th, link, id: link?.getAttribute("href")?.split("/").pop() ?? "", arts: th.querySelectorAll(".ex-art") };
  });
}

// Mia's look on the room's map, from her own avatar (the gym's drawing)
async function gymLook(b: Browser, path: string) {
  const d = await page(b, path);
  const svg = d.querySelector(".map .avatar.me svg.av");
  expect(svg, "her avatar on the map").not.toBeNull();
  return { colours: colours(svg), hair: hairOf(svg) };
}

// Mia, with her look, and finished workouts of bench, squat, pull-up and run
async function mia(exercises = ["3", "3", "5", "11", "1"]) {
  const { b, path } = await solo();
  expect((await b.post("/avatar", LOOK)).status).toBe(303);
  for (const ex of exercises) await logSet(b, path, ex);
  const workout = await finish(b, path);
  return { b, path, workout };
}

// ===========================================================================

describe("exercise art in the logbook", () => {
  // LB-7.1 (every group, the live one too, one piece per group whatever its
  // sets), LB-7.4 (the art is the exercise's machine)
  it("puts one piece of art, the exercise's machine with her in its pose, in each group's row header on history", async () => {
    const { b, path } = await mia(["3", "3", "3", "5", "11", "1"]);
    await logSet(b, path, "16"); // a live workout: plank
    const g = groups(await page(b, "/history"));
    expect(g.map((x) => x.id).sort(), "five groups: live plank; bench, squat, pull-up, run").toEqual(["1", "11", "16", "3", "5"].sort());
    for (const x of g) {
      expect(x.arts.length, `${NAME[x.id]}: one piece of art`).toBe(1);
      expectArt(x.arts[0], MACHINE[x.id], NAME[x.id]);
    }
  });

  // LB-7.2
  it("shows the same art in the summary's set table", async () => {
    const { b, workout } = await mia();
    const g = groups(await page(b, `/workouts/${workout}`));
    expect(g.map((x) => x.id)).toEqual(["3", "5", "11", "1"]);
    for (const x of g) {
      expect(x.arts.length, NAME[x.id]).toBe(1);
      expectArt(x.arts[0], MACHINE[x.id], NAME[x.id]);
    }
  });

  // LB-7.3, LB-7.14
  it("puts the art in the exercise page's head, on its empty state too, and none in its session rows", async () => {
    const { b } = await mia();
    const bench = await page(b, "/exercises/3");
    const head = bench.querySelectorAll("header.ex-head .ex-art");
    expect(head.length, "the head: one").toBe(1);
    expectArt(head[0], "flat-bench", "Bench press head");
    expect(bench.querySelectorAll(".ex-art").length, "nowhere else on the page: no art in the session rows").toBe(1);
    expect(bench.querySelectorAll("table.log").length, "the page has its set table").toBeGreaterThan(0);

    const never = await page(b, "/exercises/13"); // lat pulldown: never logged
    expect(textOfDoc(never)).toContain("No sets of Lat pulldown yet");
    const empty = never.querySelectorAll("header.ex-head .ex-art");
    expect(empty.length, "the empty state's head: one").toBe(1);
    expectArt(empty[0], "cable-machine", "Lat pulldown head, empty");
  });

  // LB-7.4 (the two exercises on a machine share its art, the name says
  // which), LB-7.7 (all 16, by the exercise, whatever its sets record)
  it("gives all sixteen exercises their machine's art, the same for both on one machine", async () => {
    const all = Object.keys(NAME);
    const { b, workout } = await mia(all);
    const g = groups(await page(b, `/workouts/${workout}`));
    expect(g.map((x) => x.id), "all sixteen, in the order done").toEqual(all);
    for (const x of g) {
      expectArt(x.arts[0] ?? null, MACHINE[x.id], NAME[x.id]);
      expect(textOf(x.link), `${x.id}: the name says which exercise`).toBe(NAME[x.id]);
    }
    for (const ex of all) {
      const head = (await page(b, `/exercises/${ex}`)).querySelector("header.ex-head .ex-art");
      expect(head?.getAttribute("data-pose"), `/exercises/${ex}`).toBe(MACHINE[ex]);
    }
  }, 30_000);

  // LB-7.6
  it("draws her look as it is now, as the gym does, after she changes it", async () => {
    const { b, path, workout } = await mia();
    const before = groups(await page(b, `/workouts/${workout}`))[0].arts[0];
    const was = { colours: colours(before?.querySelector("svg.av")), hair: hairOf(before?.querySelector("svg.av")) };
    expect(was, "the art in her look, as the map draws her").toEqual(await gymLook(b, path));
    expect(was.hair).toEqual(["hair-ponytail"]);

    expect((await b.post("/avatar", OTHER)).status).toBe(303);
    const now = await gymLook(b, path);
    expect(now, "the map now draws her new look").not.toEqual(was);
    for (const at of [`/workouts/${workout}`, "/history", "/exercises/3"]) {
      const art = (await page(b, at)).querySelector(".ex-art svg.av");
      expect({ colours: colours(art), hair: hairOf(art) }, `${at}: her look now`).toEqual(now);
    }
    expect(now.hair).toEqual(["hair-curls"]);
  });

  // LB-7.8
  it("is hidden from screen readers, has no text and nothing to focus, and leaves the name the link's text", async () => {
    const { b, workout } = await mia();
    for (const at of [`/workouts/${workout}`, "/history", "/exercises/3"]) {
      const d = await page(b, at);
      const arts = [...d.querySelectorAll(".ex-art")];
      expect(arts.length, `${at}: art`).toBeGreaterThan(0);
      for (const el of arts) {
        const a = artOf(el);
        expect({ hidden: a.hidden, text: a.text, focusable: a.focusable }, at).toEqual({ hidden: true, text: "", focusable: 0 });
        expect(el.closest("[aria-hidden='true']"), `${at}: hidden`).not.toBeNull();
      }
    }
    // on history and a summary, inside the name's link, whose text is the name alone
    for (const x of groups(await page(b, `/workouts/${workout}`))) {
      expect(x.arts[0]?.closest(`a[href="/exercises/${x.id}"]`), `${NAME[x.id]}: inside its link`).toBe(x.link);
      expect(textOf(x.link), `${NAME[x.id]}: the link's text`).toBe(NAME[x.id]);
    }
  });

  // LB-7.15 (only the art is new in a set table's cells)
  it("changes nothing else in the set table", async () => {
    const { b, workout } = await mia();
    for (const at of [`/workouts/${workout}`, "/history"]) {
      const d = await page(b, at);
      const table = d.querySelector("table.log")!;
      const withArt = table.innerHTML;
      table.querySelectorAll(".ex-art").forEach((el) => el.remove());
      expect(table.querySelectorAll(".ex-art").length).toBe(0);
      const sets = setsIn(table).map((s) => s.text);
      expect(sets, `${at}: the sets`).toEqual(["40 kg × 8", "40 kg × 8", "40 kg × 8", "BW × 8", "2 km · 10:00 · 5:00 /km"]);
      expect(groups(d).map((x) => textOf(x.link)), `${at}: the names`).toEqual(["Bench press", "Back squat", "Pull-up", "Run"]);
      expect(textOf(table), `${at}: the Best line`).toContain("Best 40 kg × 8");
      expect(withArt, `${at}: it had art to remove`).toContain("ex-art");
    }
  });

  // LB-7.16
  it("shows no art in the room, on home, on the plans page or in the summary's plan preview", async () => {
    const { b, path, workout } = await mia();
    await logSet(b, path, "3"); // a live workout, so the room has This workout and Last time
    const room = await page(b, path.concat("?exercise=3"));
    expect(room.querySelector(".map .avatar.me"), "the room page, with her on the map").not.toBeNull();
    expect(room.querySelector(".sheet [data-last]"), "with Last time").not.toBeNull();
    expect(room.querySelectorAll(".ex-art").length, "room").toBe(0);
    expect((await page(b, "/")).querySelectorAll(".ex-art").length, "home").toBe(0);

    const summary = await page(b, `/workouts/${workout}`);
    expect(summary.querySelector("ol.plan-list"), "the plan preview").not.toBeNull();
    expect(summary.querySelectorAll("ol.plan-list .ex-art").length, "the plan preview").toBe(0);
    expect(summary.querySelectorAll(".ex-art").length, "the set table has art, so the check above means something").toBeGreaterThan(0);
    expect((await b.post(`/workouts/${workout}`, { action: "save-plan", name: "" })).status).toBe(303);
    const plans = await page(b, "/plans");
    expect(plans.querySelector("article.plan"), "a plan on the plans page").not.toBeNull();
    expect(plans.querySelectorAll(".ex-art").length, "plans").toBe(0);
  });
});
