import { describe, expect, it } from "vitest";
import { backdate, backdateWorkout, Browser, plainText, watchRoom } from "./helpers.ts";
import {
  act,
  sheet,
  start,
  choose,
  DAY,
  dayPattern,
  done,
  doneId,
  editIds,
  EX,
  finish,
  formRpe,
  formType,
  formValue,
  gym,
  lastTime,
  member,
  newRoom,
  nothingSent,
  page,
  parse,
  roomNow,
  solo,
  setsIn,
  stampSet,
  textOf,
  textOfDoc,
  workoutSets,
} from "./logbook-helpers.ts";

// The logbook refactor (docs/product/criteria/logbook.md), the parts the
// server decides, checked over HTTP against the running app: LB-0 to LB-2
// here; plans (LB-3) in spec/logbook-plans.test.ts; records, the exercise page
// and the weekly stats (LB-4 to LB-6) in spec/logbook-records.test.ts. Each
// test names the criteria it covers. Helpers: spec/logbook-helpers.ts.
//
// ===========================================================================
// THE CONTRACT (logbook, QA round one, 4 Nov 2026). Agreed by the user. The build
// meets this; the tests hold it to it. Anything not written here is the build's
// choice. Every room action is a form POST to /rooms/<id>, as today: 303 on
// success, the page re-rendered with 400 on a field error.
//
// -- Room: logging (existing actions, new fields) --------------------------------
// Done (no action), action=start, action=edit gain:
//   set_type = normal | warmup | failure   missing or "" -> normal; anything else
//                                          -> 400, nothing stored, "Set type is
//                                          Normal, Warm-up or Failure."
//   rpe      = "" | 1 ... 10 in steps of 0.5   "" -> none; else 400 "RPE is 1 to 10."
//   note     = optional, <=140 chars after trim   (Done and Start only)
//              Too long with Done: the set IS logged, and the answer is 400 with
//              the page showing "Notes are up to 140 characters." and the text kept.
//   Edit: rpe="" clears it; set_type changes it. Start stores nothing but the note.
//
// -- Room: new actions -----------------------------------------------------------
// action=note        exercise_id note   save; "" (or spaces) removes it. 303 to
//                                       ?exercise=<id>. 400 if no set of it in the
//                                       open workout, or the note is too long.
// action=plan-load   plan_id            attach to the open workout here (opens one
//                                       if needed, as entering does). 303.
// action=plan-clear                     detach. 303.
//   Someone else's or no such plan_id -> 404, as ADR 0006.
//   Choosing from the plan is the existing action=choose exercise=<id>; no new action.
//
// -- Summary /workouts/<id> ------------------------------------------------------
// POST action=save-plan name=<""|1-30 chars>   303 to /workouts/<id>. Already
//   saved (plan still exists) -> 303, no second plan. 400 with the page and the
//   copy for: name too long, only warm-ups, 20 plans. Someone else's -> 404.
//   Own but still open -> 409.
//
// -- /plans ----------------------------------------------------------------------
// GET: your plans, newest first. Signed out -> 303 /signin?next=/plans.
// POST action=rename plan_id name;  action=delete plan_id   -> 303 /plans.
//   400 with the page for a bad name; someone else's -> 404.
//
// -- /exercises/<id> -------------------------------------------------------------
// GET, id 1-16; anything else 404; signed out -> 303 /signin?next=/exercises/<id>.
//
// -- Hooks in the HTML the tests read (the build keeps them, whatever the design) -
// Every set written on any page: an element with data-set, plus
//   data-type="warmup|failure" (absent for normal) and
//   data-records="heaviest e1rm reps added hold distance time" (space-separated,
//   the ones it set; absent if none); its text is setLabel, with " @ 8" when it
//   has an RPE.
// Room sheet: [data-last] holds Last time's day and its [data-set]s in order;
//   the set to match has data-match. [data-plan] holds the loaded plan:
//   [data-plan-item data-exercise=<id>] reading e.g. "Bench press 2 of 4", Up
//   next with data-next. A note is shown inside [data-note], as text.
// History: [data-week] with data-workouts, data-volume, data-km, and
//   data-streak only when the streak is >=1.
// Exercise page: [data-record=<key>] per current record (value and day);
//   table[data-points] with one row per chart point (day, value).
//
// -- Events ----------------------------------------------------------------------
// No new events. note, plan-load, plan-clear, and every request to /plans,
// /workouts and /exercises send nothing to the room's stream. Done, edit,
// delete, start and choose broadcast exactly as today.
//
// -- Test hook (SPOTTER_TEST_HOOKS=1 only) ---------------------------------------
// POST /rooms/<id>/qa  op=backdate ms=<n> workout=<id>: moves one of the
//   caller's own workouts in this room (open or finished): its started_at,
//   ended_at and its sets' completed_at and rest_ended_at, all back by ms.
//   Nothing else changes. Lets tests put workouts in earlier weeks (LB-6) and
//   order records across workouts (LB-4).
//
// -- Time zone -------------------------------------------------------------------
// The app runs with TZ=Australia/Sydney (Dockerfile), so on CI too. Tests that
// work out week boundaries must do it in Australia/Sydney, not the runner's zone.
//
// -- Settled 4 Nov, after round one (the user) ------------------------------------
// 1. action=start answers 200 with the Lifting page, as today (not 303).
// 2. The sheet is read at the address the server last redirected to (e.g.
//    /rooms/<id>?exercise=3&rested=1); a bare GET of the room shows no exercise.
// 3. The room's sheet carries data-workout=<id> of the person's open workout in
//    this room, whenever one is open.
// 4. Each plan's forms on /plans carry input[name=plan_id]. Forms are told apart
//    by a hidden input[name=action] with value save-plan, plan-load, plan-clear,
//    rename or delete. A plan item's one-tap control is a submit button inside
//    [data-plan-item] that posts action=choose exercise=<id>.
// 5. Neither the per-exercise "Best" line nor the exercise page's [data-record]
//    is or contains a [data-set]. Only logged sets carry data-set.
// 6. Editing or deleting a set in a finished workout answers 404, the same as
//    someone else's set (ADR 0006).
// 7. No hooks for legacy rows or restarts: sets posted without the new fields
//    stand in for sets logged before this change.
// ===========================================================================

const FIRST_TIME = "First time on this one. Ease into it.";
const BAD_TYPE = "Set type is Normal, Warm-up or Failure.";
const BAD_RPE = "RPE is 1 to 10.";
const LONG_NOTE = "Notes are up to 140 characters.";

// Mia's previous session of an exercise: these sets, finished, and moved
// back `daysAgo` days. She stays in the room, Finished.
async function previousSession(b: Browser, path: string, sets: [string, Record<string, string>][], daysAgo = 0) {
  for (const [ex, fields] of sets) await done(b, path, ex, fields);
  const workout = await finish(b, path);
  if (daysAgo) await backdateWorkout(b, path, workout, daysAgo * DAY);
  return workout;
}
const kg = (w: string, r: string, more: Record<string, string> = {}) => ({ weight_kg: w, reps: r, ...more });
const texts = (sets: { text: string }[]) => sets.map((s) => s.text);

// ===========================================================================
// Across all six
// ===========================================================================

describe("sets logged without the new fields", () => {
  // LB-0.3, LB-2.1 (no type is Normal). Stand-in (contract, settled 7): no
  // hook makes a row from before this change, so these are sets posted with
  // no type, RPE or note, as every set before this change was.
  it("are written exactly as before on every page", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    await done(b, path, EX.bench, kg("62.5", "7"));
    const room = await sheet(b, path);
    const workout = await finish(b, path);
    const pages = { room, summary: await page(b, `/workouts/${workout}`), history: await page(b, "/history") };
    // home's Last workout card writes only each lift's Best, which is no [data-set] (settled 5)
    const home = await page(b, "/");
    expect(home.querySelector("[data-set]"), "home: no logged sets, only Best").toBeNull();
    expect(textOfDoc(home)).toContain("62.5 kg × 7");
    expect(home.querySelector("[data-note]"), "home: no note").toBeNull();
    for (const [name, d] of Object.entries(pages)) {
      const sets = [...d.querySelectorAll("[data-set]")].filter((e) => !e.closest(".stamp"));
      expect(sets.map(textOf), `${name}: the sets as setLabel writes them`).toEqual(["60 kg × 8", "62.5 kg × 7"]);
      for (const s of sets) {
        expect(s.getAttribute("data-type"), `${name}: no type mark`).toBeNull();
        expect(textOf(s), `${name}: no RPE`).not.toContain("@");
      }
      expect(d.querySelector("[data-note]"), `${name}: no note`).toBeNull();
    }
    // the same figures as before: 2 sets, 480 + 437.5 kg, rounded to the kilo as always
    expect(textOfDoc(pages.summary)).toMatch(/Sets\s*2\b/);
    expect(textOfDoc(pages.summary)).toMatch(/Volume\s*918 kg/);
  });
});

describe("nobody can reach someone else's sets or notes", () => {
  // LB-0.4 (another person's set, a room she isn't in), LB-2.6 (refused
  // changes store nothing)
  it("answers 404 and changes nothing", async () => {
    const { b, path } = await solo();
    const setId = await doneId(b, path, EX.bench, kg("60", "8"));
    const tom = await solo("Tom");

    const edit = await tom.b.post(tom.path, { action: "edit", set_id: setId, weight_kg: "60", reps: "8", set_type: "warmup", rpe: "8" });
    expect(edit.status).toBe(404);
    const note = await tom.b.post(path, { action: "note", exercise_id: EX.bench, note: "not mine" });
    expect(note.status, "a note to a room he isn't in").toBe(404);

    const mine = workoutSets(await sheet(b, path));
    expect(mine).toEqual([{ text: "60 kg × 8", type: null, records: [], match: false }]);
    expect((await sheet(b, path)).querySelector("[data-note]")).toBeNull();
  });
});

// ===========================================================================
// LB-1: Last time, in full
// ===========================================================================

describe("Last time", () => {
  // LB-1.1
  it("shows every set of the previous session, in order, with its day", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [[EX.bench, kg("60", "8")], [EX.bench, kg("62.5", "8")], [EX.bench, kg("62.5", "7")]], 5);
    await choose(b, path, EX.bench);
    const d = await sheet(b, path);
    expect(texts(lastTime(d))).toEqual(["60 kg × 8", "62.5 kg × 8", "62.5 kg × 7"]);
    expect(textOf(d.querySelector("[data-last]"))).toMatch(dayPattern(Date.now() - 5 * DAY));
    expect(textOf(d.querySelector("[data-last]"))).toContain("Last time");
  });

  // LB-1.2
  it("writes each set for its kind", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [
      [EX.pullUp, { reps: "12", weight_kg: "" }],
      [EX.pullUp, { reps: "6", weight_kg: "10" }],
      [EX.plank, { minutes: "1", seconds: "30" }],
      [EX.run, { distance_km: "5", minutes: "25", seconds: "0" }],
    ]);
    await choose(b, path, EX.pullUp);
    expect(texts(lastTime(await sheet(b, path)))).toEqual(["BW × 12", "BW + 10 kg × 6"]);
    await choose(b, path, EX.plank);
    expect(texts(lastTime(await sheet(b, path)))).toEqual(["1:30"]);
    await choose(b, path, EX.run);
    expect(texts(lastTime(await sheet(b, path)))).toEqual(["5 km · 25:00 · 5:00 /km"]);
  });

  // LB-1.3
  it("is only the newest earlier session, never older ones or today's sets", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [[EX.bench, kg("50", "8")], [EX.bench, kg("52.5", "8")], [EX.bench, kg("55", "8")]], 2);
    await previousSession(b, path, [[EX.bench, kg("60", "6")], [EX.bench, kg("62.5", "6")]]);
    await done(b, path, EX.bench, kg("70", "5"));
    await done(b, path, EX.bench, kg("72.5", "5"));
    await choose(b, path, EX.bench);
    expect(texts(lastTime(await sheet(b, path)))).toEqual(["60 kg × 6", "62.5 kg × 6"]);
  });

  // LB-1.4, LB-2.23 (the note comes back under Last time)
  it("shows the previous session's types, RPE and note", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" }));
    await done(b, path, EX.bench, kg("60", "8"));
    await done(b, path, EX.bench, kg("60", "6", { set_type: "failure", rpe: "9" }));
    expect((await act(b, path, { action: "note", exercise_id: EX.bench, note: "seat on 4" })).status).toBe(303);
    await finish(b, path);
    await choose(b, path, EX.bench);
    const d = await sheet(b, path);
    expect(lastTime(d).map(({ text, type }) => ({ text, type }))).toEqual([
      { text: "40 kg × 10", type: "warmup" },
      { text: "60 kg × 8", type: null },
      { text: "60 kg × 6 @ 9", type: "failure" },
    ]);
    expect(textOf(d.querySelector("[data-last] [data-note]"))).toBe("seat on 4");
  });

  // LB-1.5: the first time on one exercise, beside a Last time on another
  it("says it's the first time when there is no earlier set", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [[EX.squat, kg("80", "5")]]);
    await choose(b, path, EX.squat);
    expect(texts(lastTime(await sheet(b, path))), "squat has a Last time").toEqual(["80 kg × 5"]);
    await choose(b, path, EX.bench);
    const d = await sheet(b, path);
    expect(textOfDoc(d)).toContain(FIRST_TIME);
    expect(lastTime(d)).toEqual([]);
  });

  // LB-1.6, LB-1.10 (a session in a room since closed still counts)
  it("shows while lifting and resting, even after a set of the same exercise, and not while editing or idle", async () => {
    const mia = await solo();
    const { b } = mia;
    await previousSession(b, mia.path, [[EX.bench, kg("60", "8")]]);
    const path = await newRoom(b, mia.path); // she was alone, so the old room closes

    expect(lastTime(await sheet(b, path)), "idle, nothing chosen").toEqual([]);
    await choose(b, path, EX.bench);
    expect(texts(lastTime(await sheet(b, path))), "lifting").toEqual(["60 kg × 8"]);
    const setId = await doneId(b, path, EX.bench, kg("62.5", "8"));
    expect(texts(lastTime(await sheet(b, path))), "resting after a bench set").toEqual(["60 kg × 8"]);

    // Slacking: the hook moves her rest's end 150 s + 31 s back (it also makes her Away)
    const id = (await roomNow(b, path)).members.find((m) => m.name === "Mia")!.id;
    await backdate(b, path, { user: id }, 181_000);
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("slacking");
    expect(texts(lastTime(await sheet(b, path))), "slacking").toEqual(["60 kg × 8"]);

    expect(lastTime(await page(b, `${path}?edit=${setId}`)), "editing a set").toEqual([]);
  });

  // LB-1.7
  it("marks the set to match, counting only working sets", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [
      [EX.bench, kg("40", "10", { set_type: "warmup" })],
      [EX.bench, kg("60", "8")],
      [EX.bench, kg("62.5", "8")],
      [EX.bench, kg("62.5", "7")],
    ]);
    const matched = async () => lastTime(await sheet(b, path)).filter((s) => s.match).map((s) => s.text);

    await choose(b, path, EX.bench);
    expect(await matched(), "about to do working set 1").toEqual(["60 kg × 8"]);
    await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" }));
    expect(await matched(), "a warm-up doesn't move it").toEqual(["60 kg × 8"]);
    await done(b, path, EX.bench, kg("60", "8"));
    expect(await matched(), "working set 2").toEqual(["62.5 kg × 8"]);
    await done(b, path, EX.bench, kg("62.5", "8"));
    await done(b, path, EX.bench, kg("62.5", "8"));
    expect(await matched(), "past what last time had").toEqual([]);
  });

  // LB-1.8, LB-2.4 (the type starts at Normal), LB-2.13 (the RPE starts empty)
  it("pre-fills weight and reps as before, never the type or the RPE", async () => {
    const { b, path } = await solo();
    await previousSession(b, path, [
      [EX.bench, kg("60", "8")],
      [EX.bench, kg("45", "12", { set_type: "warmup", rpe: "6" })],
    ]);
    await choose(b, path, EX.bench);
    const d = await sheet(b, path);
    expect(formValue(d, "weight_kg")).toBe("45");
    expect(formValue(d, "reps")).toBe("12");
    expect(formType(d)).toBe("normal");
    expect(formRpe(d)).toBe("");
  });

  // LB-1.11
  it("is never shown to anyone else in the room", async (ctx) => {
    const g = await gym();
    const { b } = g.Mia;
    await previousSession(b, g.path, [[EX.bench, kg("77.5", "3")]]);
    const tomStream = await watchRoom(g.Tom.b, g.path);
    ctx.onTestFinished(() => tomStream.close());
    await choose(b, g.path, EX.bench);
    expect(texts(lastTime(await sheet(b, g.path)))).toEqual(["77.5 kg × 3"]);
    await tomStream.next("room", (e) => member(e, "Mia")?.state === "lifting", 2000);

    expect(await (await g.Tom.b.get(g.path)).text()).not.toContain("77.5");
    expect(JSON.stringify(tomStream.all("room"))).not.toContain("77.5");
  });
});

// ===========================================================================
// LB-2: set types and RPE
// ===========================================================================

describe("set types", () => {
  // LB-2.1 (offered, Normal selected, while lifting and resting), LB-2.2,
  // LB-2.3, LB-2.4 (back to Normal after a warm-up), LB-2.11 (numbering)
  it("stores and marks warm-ups and failure sets, numbering only working sets", async () => {
    const { b, path } = await solo();
    await choose(b, path, EX.bench);
    expect(formType(await sheet(b, path)), "lifting").toBe("normal");

    let d = await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" }));
    expect(stampSet(d)).toMatchObject({ text: "40 kg × 10", type: "warmup" });
    expect(textOf(d.querySelector(".stamp"))).toMatch(/^Warm-up logged: 40 kg × 10/);
    expect(formType(d), "resting after a warm-up").toBe("normal");

    d = await done(b, path, EX.bench, kg("60", "8"));
    expect(textOf(d.querySelector(".stamp"))).toMatch(/^Set 1 logged: 60 kg × 8/);
    d = await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" }));
    expect(textOf(d.querySelector(".stamp"))).toMatch(/^Warm-up logged/);
    d = await done(b, path, EX.bench, kg("60", "5", { set_type: "failure" }));
    expect(stampSet(d)).toMatchObject({ text: "60 kg × 5", type: "failure" });
    expect(textOf(d.querySelector(".stamp"))).toMatch(/^Set 2 logged: 60 kg × 5/);

    const all = [
      { text: "40 kg × 10", type: "warmup" },
      { text: "60 kg × 8", type: null },
      { text: "40 kg × 10", type: "warmup" },
      { text: "60 kg × 5", type: "failure" },
    ];
    const pick = (sets: { text: string; type: string | null }[]) => sets.map(({ text, type }) => ({ text, type }));
    expect(pick(workoutSets(d)), "This workout").toEqual(all);
    const workout = await finish(b, path);
    for (const at of [`/workouts/${workout}`, "/history", `/exercises/${EX.bench}`]) {
      expect(pick(setsIn((await page(b, at)).body)), at).toEqual(all);
    }
  });

  // LB-2.5, LB-2.15
  it("carries a type and RPE chosen during a rest into the lifting form, storing nothing until Done", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const before = await editIds(b, path);
    // Start answers 200 with the Lifting page (contract, settled 1)
    const { status, d } = await start(b, path, { exercise_id: EX.bench, weight_kg: "40", reps: "10", set_type: "warmup", rpe: "6.5" });
    expect(status).toBe(200);
    expect(formType(d)).toBe("warmup");
    expect(formRpe(d)).toBe("6.5");
    expect(await editIds(b, path), "Start set stores no set").toEqual(before);

    const logged = await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup", rpe: "6.5" }));
    expect(stampSet(logged)).toMatchObject({ text: "40 kg × 10 @ 6.5", type: "warmup" });
  });

  // LB-2.6, LB-2.17
  it("lets a set in the open workout change its type and RPE, and not a finished one", async () => {
    const { b, path } = await solo();
    const setId = await doneId(b, path, EX.bench, kg("60", "8"));
    const edit = (fields: Record<string, string>) => act(b, path, { action: "edit", set_id: setId, weight_kg: "60", reps: "8", ...fields });

    expect((await edit({ set_type: "failure", rpe: "8" })).status).toBe(303);
    expect(workoutSets(await sheet(b, path))).toMatchObject([{ text: "60 kg × 8 @ 8", type: "failure" }]);
    expect(setsIn((await page(b, "/history")).body)).toMatchObject([{ text: "60 kg × 8 @ 8", type: "failure" }]);

    expect((await edit({ set_type: "normal", rpe: "" })).status).toBe(303);
    expect(workoutSets(await sheet(b, path))).toMatchObject([{ text: "60 kg × 8", type: null }]);

    await finish(b, path);
    // a finished workout's set: 404, as someone else's (contract, settled 6)
    expect((await edit({ set_type: "warmup", rpe: "7" })).status, "edit a finished workout's set").toBe(404);
    expect((await act(b, path, { action: "delete", set_id: setId })).status, "delete a finished workout's set").toBe(404);
    expect(setsIn((await page(b, "/history")).body)).toMatchObject([{ text: "60 kg × 8", type: null }]);
  });

  // LB-2.7
  it("refuses any other type, storing nothing and keeping her lifting with her fields", async () => {
    const { b, path } = await solo();
    await choose(b, path, EX.bench);
    const res = await act(b, path, { exercise_id: EX.bench, weight_kg: "67.5", reps: "9", set_type: "dropset" });
    expect(res.status).toBe(400);
    const d = parse(await res.text());
    expect(textOfDoc(d)).toContain(BAD_TYPE);
    expect(formValue(d, "weight_kg")).toBe("67.5");
    expect(formValue(d, "reps")).toBe("9");
    expect(await editIds(b, path)).toEqual(new Set());
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("lifting");
  });

  // LB-2.8, LB-2.18
  it("offers and accepts every type and an RPE on all four kinds", async () => {
    const { b, path } = await solo();
    const cases: [string, Record<string, string>, string, string][] = [
      [EX.run, { distance_km: "1", minutes: "6", seconds: "0", set_type: "warmup", rpe: "4" }, "warmup", "@ 4"],
      [EX.plank, { minutes: "1", seconds: "0", set_type: "failure", rpe: "9.5" }, "failure", "@ 9.5"],
      [EX.pullUp, { reps: "5", weight_kg: "", set_type: "warmup", rpe: "5" }, "warmup", "@ 5"],
      [EX.bench, { weight_kg: "60", reps: "8", set_type: "failure", rpe: "10" }, "failure", "@ 10"],
    ];
    for (const [ex, fields, type, rpe] of cases) {
      await choose(b, path, ex);
      const form = await sheet(b, path);
      expect(form.querySelector('[name="set_type"]'), `exercise ${ex} offers the type`).not.toBeNull();
      expect(form.querySelector('[name="rpe"]'), `exercise ${ex} offers the RPE`).not.toBeNull();
      const s = stampSet(await done(b, path, ex, fields));
      expect(s?.type, `exercise ${ex}`).toBe(type);
      expect(s?.text, `exercise ${ex}`).toMatch(new RegExp(`${rpe}$`));
    }
  });

  // LB-2.9, LB-2.10 (warm-ups count in Sets and Volume, the types are kept)
  it("counts warm-ups and failure sets in the workout's sets and volume", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" })); // 400
    await done(b, path, EX.bench, kg("60", "5", { set_type: "failure" })); // 300
    await done(b, path, EX.bench, kg("60", "8")); // 480
    const d = await page(b, `/workouts/${await finish(b, path)}`);
    const summary = textOfDoc(d);
    expect(summary).toMatch(/Sets\s*3\b/);
    expect(summary).toMatch(/Volume\s*1,180 kg/);
    expect(setsIn(d.body).map((s) => s.type), "the types, as marks only").toEqual(["warmup", "failure", null]);
  });

  // LB-2.12, LB-0.2 (a type and an RPE change nothing the room sees)
  it("rests and turns Slacking after a warm-up with an RPE exactly as after any set", async (ctx) => {
    const g = await gym();
    const { b } = g.Mia;
    const tom = await watchRoom(g.Tom.b, g.path);
    ctx.onTestFinished(() => tom.close());
    const first = await tom.next("room", () => true, 2000);
    const id = member(first, "Mia")!.id;

    const d = await done(b, g.path, EX.bench, kg("40", "10", { set_type: "warmup", rpe: "8" }));
    expect(stampSet(d), "stored as a warm-up with its RPE").toMatchObject({ text: "40 kg × 10 @ 8", type: "warmup" });
    expect(d.body.innerHTML, "bench press rests 150 s").toMatch(/data-rest-target="150"/);
    const resting = await tom.next("room", (e) => member(e, "Mia")?.state === "resting", 2000);
    expect(member(resting, "Mia")?.exercise).toBe("Bench press");

    await backdate(b, g.path, { user: id }, 181_000);
    await tom.next("room", (e) => member(e, "Mia")?.state === "slacking", 2000);
  });
});

describe("RPE", () => {
  // LB-2.13 (never pre-filled, none stored without one), LB-2.16
  it("is written after the set in lifter's shorthand, and starts empty for the next set", async () => {
    const { b, path } = await solo();
    let d = await done(b, path, EX.bench, kg("100", "5", { rpe: "8" }));
    expect(stampSet(d)?.text).toBe("100 kg × 5 @ 8");
    expect(formRpe(d), "the next set's RPE").toBe("");
    d = await done(b, path, EX.bench, kg("100", "5"));
    expect(workoutSets(d).map((s) => s.text)).toEqual(["100 kg × 5 @ 8", "100 kg × 5"]);
    const workout = await finish(b, path);
    expect(setsIn((await page(b, `/workouts/${workout}`)).body).map((s) => s.text), "summary").toEqual(["100 kg × 5 @ 8", "100 kg × 5"]);
  });

  // LB-2.14
  it("accepts 1 to 10 in half steps and refuses anything else, keeping her lifting with her fields", async () => {
    const { b, path } = await solo();
    for (const rpe of ["0", "0.5", "10.5", "7.3", "hard"]) {
      await choose(b, path, EX.bench);
      const res = await act(b, path, { exercise_id: EX.bench, weight_kg: "67.5", reps: "9", rpe });
      expect(res.status, `RPE ${rpe}`).toBe(400);
      const d = parse(await res.text());
      expect(textOfDoc(d), `RPE ${rpe}`).toContain(BAD_RPE);
      expect(formValue(d, "weight_kg"), `RPE ${rpe}`).toBe("67.5");
      // a field that only takes numbers (a select or a number input) may not keep "hard"
      if (rpe !== "hard") expect(formRpe(d), `RPE ${rpe}: kept as typed`).toBe(rpe);
    }
    expect(await editIds(b, path), "nothing stored").toEqual(new Set());
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("lifting");

    for (const rpe of ["1", "1.5", "9.5", "10"]) {
      expect(stampSet(await done(b, path, EX.bench, kg("60", "8", { rpe })))?.text, `RPE ${rpe}`).toBe(`60 kg × 8 @ ${rpe}`);
    }
  });
});

// ===========================================================================
// LB-2: exercise notes
// ===========================================================================

describe("exercise notes", () => {
  const noteOf = (d: Document) => {
    const el = [...d.querySelectorAll("[data-note]")].find((e) => !e.closest("[data-last]"));
    return el ? textOf(el) : null;
  };

  // LB-2.19
  it("are offered only once she has a set of the exercise in this workout", async () => {
    const { b, path } = await solo();
    await choose(b, path, EX.bench);
    expect((await sheet(b, path)).querySelector('[name="note"]'), "before the first set").toBeNull();
    expect((await act(b, path, { action: "note", exercise_id: EX.bench, note: "seat on 4" })).status).toBe(400);
    const d = await done(b, path, EX.bench, kg("60", "8"));
    expect(d.querySelector('[name="note"]'), "after it").not.toBeNull();
  });

  // LB-2.20, LB-2.22, LB-2.27
  it("is kept by its own save, Start set or Done, the latest wins, and an empty one removes it", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const own = await act(b, path, { action: "note", exercise_id: EX.bench, note: "seat on 4" });
    expect(own.status).toBe(303);
    expect(own.headers.get("location")).toMatch(new RegExp(`[?&]exercise=${EX.bench}\\b`));
    expect(noteOf(await sheet(b, path))).toBe("seat on 4");

    const started = await start(b, path, { exercise_id: EX.bench, weight_kg: "60", reps: "8", note: "seat on 5" });
    expect(noteOf(started.d), "with Start set").toBe("seat on 5");
    await done(b, path, EX.bench, kg("60", "8", { note: "left shoulder grumpy" }));
    expect(noteOf(await sheet(b, path)), "with Done").toBe("left shoulder grumpy");

    expect((await act(b, path, { action: "note", exercise_id: EX.bench, note: "   " })).status).toBe(303);
    expect(noteOf(await sheet(b, path)), "spaces remove it").toBeNull();
  });

  // LB-2.21
  it("holds 140 characters after trimming, and a longer one is refused without stopping a set", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const fits = "a".repeat(140);
    const tooLong = "b".repeat(141);

    expect((await act(b, path, { action: "note", exercise_id: EX.bench, note: `  ${fits}  ` })).status).toBe(303);
    expect(noteOf(await sheet(b, path))).toBe(fits);

    const own = await act(b, path, { action: "note", exercise_id: EX.bench, note: tooLong });
    expect(own.status).toBe(400);
    const ownPage = await own.text();
    expect(plainText(ownPage)).toContain(LONG_NOTE);
    expect(ownPage, "the text kept").toContain(tooLong);

    const before = await editIds(b, path);
    const withDone = await act(b, path, { exercise_id: EX.bench, weight_kg: "62.5", reps: "8", note: tooLong });
    expect(withDone.status).toBe(400);
    const donePage = await withDone.text();
    expect(plainText(donePage)).toContain(LONG_NOTE);
    expect(donePage, "the text kept").toContain(tooLong);
    expect((await editIds(b, path)).size, "the set is logged all the same").toBe(before.size + 1);
  });

  // LB-2.23 (This workout, summary, history, exercise page), LB-2.24, LB-2.26
  it("shows as typed with its exercise wherever the workout is written, and is fixed once it ends", async () => {
    const { b, path } = await solo();
    const typed = "<b>hi</b> seat on 4 💪";
    await done(b, path, EX.bench, kg("60", "8"));
    await act(b, path, { action: "note", exercise_id: EX.bench, note: typed });
    const room = await sheet(b, path);
    const workout = await finish(b, path);
    const pages = {
      room,
      summary: await page(b, `/workouts/${workout}`),
      history: await page(b, "/history"),
      exercise: await page(b, `/exercises/${EX.bench}`),
    };
    for (const [name, d] of Object.entries(pages)) {
      const note = d.querySelector("[data-note]");
      expect(textOf(note), name).toBe(typed);
      expect(note?.querySelector("b"), `${name}: text, never HTML`).toBeNull();
    }

    expect((await act(b, path, { action: "note", exercise_id: EX.bench, note: "changed" })).status, "after finishing").toBe(400);
    expect(textOf((await page(b, `/workouts/${workout}`)).querySelector("[data-note]"))).toBe(typed);
  });

  // LB-2.25, LB-0.2 (a note sends nothing to the room)
  it("is never shown to anyone else, and saving it sends nothing to the room", async (ctx) => {
    const g = await gym();
    const { b } = g.Mia;
    await done(b, g.path, EX.bench, kg("60", "8"));
    const secret = "left shoulder grumpy";
    await nothingSent(ctx, g.Tom.b, "Tom", g.path, async () => {
      expect((await act(b, g.path, { action: "note", exercise_id: EX.bench, note: secret })).status).toBe(303);
    });
    expect(await (await g.Tom.b.get(g.path)).text()).not.toContain(secret);
    const tom = await watchRoom(g.Tom.b, g.path);
    ctx.onTestFinished(() => tom.close());
    await start(b, g.path, { exercise_id: EX.bench, weight_kg: "60", reps: "8", note: `${secret} again` });
    await tom.next("room", (e) => member(e, "Mia")?.state === "lifting", 2000);
    expect(JSON.stringify(tom.all("room"))).not.toContain(secret);
  });
});
