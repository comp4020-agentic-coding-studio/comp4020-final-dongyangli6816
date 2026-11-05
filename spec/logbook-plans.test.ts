import { describe, expect, it } from "vitest";
import { Browser, createRoom, plainText, signUp } from "./helpers.ts";
import {
  act,
  sheet,
  start,
  choose,
  counts,
  done,
  doneId,
  EX,
  fieldsOf,
  finish,
  formFields,
  member,
  nothingSent,
  openWorkoutId,
  page,
  person,
  planFrom,
  planIds,
  planItems,
  roomNow,
  solo,
  textOf,
  textOfDoc,
  upNext,
  workoutSets,
} from "./logbook-helpers.ts";

// Plans (docs/product/criteria/logbook.md, LB-3), checked over HTTP against
// the running app, to the contract at the top of spec/logbook.test.ts. Each
// test names the criteria it covers.

const ONLY_WARMUPS = "Only warm-ups in this one. Nothing to plan yet.";
const LONG_NAME = "Names are up to 30 characters.";
const TOO_MANY = "That's 20 plans. Delete one to make room.";
const NO_PLANS = "Finish a workout, then save it as a plan from its summary";

const warmup = { set_type: "warmup" };
const load = (b: Browser, path: string, plan: string) => act(b, path, { action: "plan-load", plan_id: plan });
const savePlan = (b: Browser, workout: string, name = "") => b.post(`/workouts/${workout}`, { action: "save-plan", name });
const plansText = async (b: Browser) => textOfDoc(await page(b, "/plans"));
// the exercise the set form (Done, or Start set during a rest) is for
const formExercise = (d: Document) => d.querySelector<HTMLInputElement>('input[name="exercise_id"]')?.value ?? null;

// Mia with a plan "Push day" (incline 3, lateral 2), back in a fresh room,
// Idle with a new workout and nothing chosen. Others named join that room.
async function withPlan(others: string[] = [], plan: [string, number][] = [[EX.incline, 3], [EX.lateral, 2]]) {
  const mia = await person("Mia");
  const first = await createRoom(mia.b);
  const made = await planFrom(mia.b, first.path, plan, "Push day");
  await mia.b.post(first.path, { action: "leave" }); // alone, so that room closes
  const { path, passcode } = await createRoom(mia.b);
  const people: Record<string, Browser> = {};
  for (const name of others) {
    people[name] = new Browser();
    await signUp(people[name], undefined, "correct horse", name);
    await people[name].post("/join", { passcode });
  }
  return { b: mia.b, email: mia.email, path, plan: made.plan, people };
}

describe("saving a finished workout as a plan", () => {
  // LB-3.1, LB-3.2 (order first done, working sets only, warm-up-only
  // exercises left out, capped at 10), LB-3.3 (sets with no type are working
  // sets; stand-in, contract settled 7: no hook makes a row from before this
  // change, so sets posted without set_type stand in for them), LB-3.8 (the
  // plans page lists it)
  it("makes a plan of the exercises in the order first done, with their working sets", async () => {
    const { b, path } = await solo();
    for (let i = 0; i < 2; i++) await done(b, path, EX.bench, warmup);
    for (let i = 0; i < 4; i++) await done(b, path, EX.bench);
    for (let i = 0; i < 3; i++) await done(b, path, EX.incline);
    await done(b, path, EX.curl, warmup);
    for (let i = 0; i < 12; i++) await done(b, path, EX.lateral);
    const workout = await finish(b, path);

    expect(formFields(await page(b, `/workouts/${workout}`), "save-plan"), "Save as plan is offered").not.toBeNull();
    const saved = await savePlan(b, workout, "Push day");
    expect(saved.status).toBe(303);
    expect(saved.headers.get("location")).toMatch(new RegExp(`^/workouts/${workout}\\b`));
    expect(textOfDoc(await page(b, `/workouts/${workout}`)), "the summary confirms, naming it").toContain("Push day");

    const plans = await plansText(b);
    expect(plans).toMatch(/Push day[\s\S]*Bench press · 4 sets[\s\S]*Incline bench press · 3 sets[\s\S]*Lateral raise · 10 sets/);
    expect(plans, "an exercise with only warm-ups is left out").not.toContain("Dumbbell curl");
  }, 15_000); // 21 sets in a row: room for a busy CI machine

  // LB-3.1 (a blank name is the workout's date), LB-3.5 (trimmed, up to 30,
  // shown as text, names may repeat), LB-3.8 (newest first)
  it("names it as given, or by its date, and refuses a name over 30 characters", async () => {
    const { b, path } = await solo();
    await planFrom(b, path, [[EX.bench, 1]], "  <b>Push</b>  ");
    await planFrom(b, path, [[EX.bench, 1]], "<b>Push</b>");
    await planFrom(b, path, [[EX.bench, 1]], "");
    const d = await page(b, "/plans");
    expect(d.querySelector("main b"), "names are text, never HTML").toBeNull();
    const text = textOfDoc(d);
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" })
        .formatToParts(new Date())
        .map((x) => [x.type, x.value]),
    );
    const dated = new RegExp(`${p.weekday},? ${p.day} ${p.month}`);
    expect(text, "a blank name is the workout's date").toMatch(dated);
    expect(text.indexOf("<b>Push</b>"), "two plans may share a name").not.toBe(text.lastIndexOf("<b>Push</b>"));
    expect(text.search(dated), "newest first").toBeLessThan(text.indexOf("<b>Push</b>"));

    await done(b, path, EX.bench);
    const next = await finish(b, path);
    const long = await savePlan(b, next, "x".repeat(31));
    expect(long.status).toBe(400);
    expect(plainText(await long.text())).toContain(LONG_NAME);
    expect(await planIds(b)).toHaveLength(3);
    expect((await savePlan(b, next, "y".repeat(30))).status).toBe(303);
    expect(await planIds(b)).toHaveLength(4);
  });

  // LB-3.2 (only warm-ups)
  it("refuses a workout of only warm-ups", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, warmup);
    const res = await savePlan(b, await finish(b, path));
    expect(res.status).toBe(400);
    expect(plainText(await res.text())).toContain(ONLY_WARMUPS);
    expect(await planIds(b)).toEqual([]);
  });

  // LB-3.4
  it("saves a workout once, and offers it again once that plan is deleted", async () => {
    const { b, path } = await solo();
    const { workout, plan } = await planFrom(b, path, [[EX.bench, 2]], "Push day");
    const summary = await page(b, `/workouts/${workout}`);
    expect(formFields(summary, "save-plan"), "not offered again").toBeNull();
    expect(textOfDoc(summary)).toContain("Saved as Push day");
    expect(summary.querySelector('a[href="/plans"]'), "linking to her plans").not.toBeNull();

    expect((await savePlan(b, workout, "Again")).status, "a replayed save").toBe(303);
    expect(await planIds(b)).toEqual([plan]);

    expect((await b.post("/plans", { action: "delete", plan_id: plan })).status).toBe(303);
    expect(formFields(await page(b, `/workouts/${workout}`), "save-plan"), "offered again").not.toBeNull();
  });

  // LB-3.6
  it("keeps 20 plans at most", async () => {
    const { b, path } = await solo();
    for (let i = 0; i < 20; i++) {
      await done(b, path, EX.bench);
      expect((await savePlan(b, await finish(b, path), `Plan ${i}`)).status, `plan ${i + 1}`).toBe(303);
    }
    await done(b, path, EX.bench);
    const res = await savePlan(b, await finish(b, path), "One more");
    expect(res.status).toBe(400);
    expect(plainText(await res.text())).toContain(TOO_MANY);
    expect(await planIds(b)).toHaveLength(20);
  }, 30_000);

  // LB-3.7, LB-0.4 (someone else's workout)
  it("can't be saved from someone else's workout, or from her open one", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench);
    const finished = await finish(b, path);
    const tom = await person("Tom");
    expect((await savePlan(tom.b, finished)).status, "someone else's").toBe(404);
    expect(await planIds(tom.b)).toEqual([]);

    // her next workout, open, by the sheet's data-workout: 409
    await done(b, path, EX.bench);
    const open = await openWorkoutId(b, path);
    expect(open).not.toBe(finished);
    expect((await savePlan(b, open, "Open")).status).toBe(409);
    expect(formFields(await page(b, `/workouts/${open}`), "save-plan"), "no Save as plan on an open workout").toBeNull();
    expect(await planIds(b)).toEqual([]);
  });
});

describe("the plans page", () => {
  // LB-3.8 (empty), LB-3.10 (signed out)
  it("says how to get a plan when there are none, and sends the signed-out to sign in", async () => {
    const { b } = await person();
    expect(await plansText(b)).toContain(NO_PLANS);
    const out = await new Browser().get("/plans");
    expect(out.status).toBe(303);
    expect(out.headers.get("location")).toBe("/signin?next=/plans");
  });

  // LB-3.9, LB-3.22 (the sheet follows a rename and a delete), LB-3.5 (rename's rules)
  it("renames and deletes a plan, and a loaded plan follows on the sheet with her sets untouched", async () => {
    const { b, path, plan } = await withPlan();
    await done(b, path, EX.incline);
    expect((await load(b, path, plan)).status).toBe(303);
    expect(textOf((await sheet(b, path)).querySelector("[data-plan]"))).toContain("Push day");

    const long = await b.post("/plans", { action: "rename", plan_id: plan, name: "z".repeat(31) });
    expect(long.status).toBe(400);
    expect(plainText(await long.text())).toContain(LONG_NAME);
    expect((await b.post("/plans", { action: "rename", plan_id: plan, name: " Chest " })).status).toBe(303);
    expect(await plansText(b)).toContain("Chest");
    const renamed = textOf((await sheet(b, path)).querySelector("[data-plan]"));
    expect(renamed).toContain("Chest");
    expect(renamed).not.toContain("Push day");

    const sets = workoutSets(await sheet(b, path));
    expect((await b.post("/plans", { action: "delete", plan_id: plan })).status).toBe(303);
    expect(await planIds(b)).toEqual([]);
    const after = await sheet(b, path);
    expect(after.querySelector("[data-plan]"), "gone from the sheet").toBeNull();
    expect(workoutSets(after), "no set changes").toEqual(sets);
  });

  // LB-3.10, LB-0.4
  it("won't rename, delete or load someone else's plan", async () => {
    const mia = await solo();
    const { plan } = await planFrom(mia.b, mia.path, [[EX.bench, 1]], "Mine");
    const tom = await solo("Tom");
    expect((await tom.b.post("/plans", { action: "rename", plan_id: plan, name: "Ours" })).status).toBe(404);
    expect((await tom.b.post("/plans", { action: "delete", plan_id: plan })).status).toBe(404);
    expect((await load(tom.b, tom.path, plan)).status).toBe(404);
    expect((await load(tom.b, tom.path, "999999")).status, "no such plan").toBe(404);
    expect(await planIds(mia.b)).toEqual([plan]);
    expect(await plansText(mia.b)).toContain("Mine");
    expect((await sheet(tom.b, tom.path)).querySelector("[data-plan]")).toBeNull();
  });
});

describe("loading a plan in the room", () => {
  // LB-3.12
  it("is offered on the sheet only to someone with a plan, and not while editing a set", async () => {
    const { b, path } = await solo();
    expect(formFields(await sheet(b, path), "plan-load"), "no plans: no control").toBeNull();
    await planFrom(b, path, [[EX.bench, 1]]);
    await act(b, path, { action: "leave" });
    const room = (await createRoom(b)).path;

    expect(formFields(await sheet(b, room), "plan-load"), "idle").not.toBeNull();
    await choose(b, room, EX.bench);
    expect(formFields(await sheet(b, room), "plan-load"), "lifting").not.toBeNull();
    const setId = await doneId(b, room, EX.bench);
    expect(formFields(await sheet(b, room), "plan-load"), "resting").not.toBeNull();
    expect(formFields(await sheet(b, `${room}?edit=${setId}`), "plan-load"), "editing").toBeNull();
  });

  // LB-3.13, LB-3.14, LB-3.25, LB-0.2 (loading sends nothing to the room)
  it("shows the plan with Up next preselected, and changes nothing anyone else can see", async (ctx) => {
    const { b, path, plan, people } = await withPlan(["Tom"]);
    const before = member(await roomNow(b, path), "Mia");
    expect(before?.state).toBe("idle");
    const tomBefore = await (await people.Tom.get(path)).text();

    await nothingSent(ctx, people.Tom, "Tom", path, async () => {
      expect((await load(b, path, plan)).status).toBe(303);
    });

    const d = await sheet(b, path);
    expect(planItems(d).map((i) => i.text)).toEqual([
      expect.stringContaining("Incline bench press 0 of 3"),
      expect.stringContaining("Lateral raise 0 of 2"),
    ]);
    expect(upNext(d)).toBe(EX.incline);
    const after = member(await roomNow(b, path), "Mia");
    expect({ state: after?.state, exercise: after?.exercise, station: after?.station }, "no exercise, station or state").toEqual({
      state: "idle",
      exercise: null,
      station: null,
    });
    expect(await (await people.Tom.get(path)).text(), "nobody else can tell").not.toContain("Push day");
    expect(tomBefore).not.toContain("Push day");

    // LB-3.14: the picker has Up next selected, so its Choose takes it
    const picker = d.querySelector<HTMLSelectElement>('select[name="exercise"]');
    expect(picker?.value, "Up next is preselected").toBe(EX.incline);
    expect((await act(b, path, fieldsOf(picker!.closest("form")!))).status).toBe(303);
    const chose = member(await roomNow(b, path), "Mia");
    expect(chose?.state).toBe("lifting");
    expect(chose?.exercise).toBe("Incline bench press");
    expect(chose?.station?.equipment).toBe("Flat bench");
  });

  // LB-3.15, LB-3.19 (out of order, Up next still in plan order)
  it("counts working sets of each exercise, from before the load too, in plan order", async () => {
    const { b, path, plan } = await withPlan([], [[EX.bench, 2], [EX.incline, 1], [EX.lateral, 2]]);
    await done(b, path, EX.lateral); // before the load
    await done(b, path, EX.lateral, warmup);
    await load(b, path, plan);
    let d = await sheet(b, path);
    expect(counts(d)).toEqual({ [EX.bench]: "0/2", [EX.incline]: "0/1", [EX.lateral]: "1/2" });
    expect(upNext(d)).toBe(EX.bench);

    await done(b, path, EX.incline);
    await done(b, path, EX.curl); // not in the plan
    d = await sheet(b, path);
    expect(counts(d)).toEqual({ [EX.bench]: "0/2", [EX.incline]: "1/1", [EX.lateral]: "1/2" });
    expect(upNext(d), "still the first one not done").toBe(EX.bench);

    await done(b, path, EX.bench);
    await done(b, path, EX.bench);
    await done(b, path, EX.bench);
    d = await sheet(b, path);
    expect(planItems(d).find((i) => i.exercise === EX.bench)?.text).toContain("3 of 2");
    expect(upNext(d)).toBe(EX.lateral);
  });

  // LB-3.16, LB-3.17
  it("chooses an exercise from the plan exactly as Choose, and the last planned set leaves Start set where it was", async () => {
    const { b, path, plan } = await withPlan([], [[EX.bench, 1], [EX.lateral, 2]]);
    await load(b, path, plan);
    let d = await done(b, path, EX.bench);
    // LB-3.17: the last planned bench set: resting, Start set still bench, Up next lateral
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("resting");
    expect(formExercise(d), "Start set is still for bench").toBe(EX.bench);
    expect(upNext(d)).toBe(EX.lateral);

    // LB-3.16: the plan's lateral, chosen during the rest
    // its one tap: a submit button inside the item posting action=choose
    // exercise=<id> (contract, settled 4)
    const item = d.querySelector(`[data-plan] [data-plan-item][data-exercise="${EX.lateral}"]`);
    const button = item?.querySelector<HTMLButtonElement>('button:not([type="button"]):not([type="reset"])');
    expect(button, "a submit button inside the plan item").toBeTruthy();
    const form = button!.form;
    expect(form, "the button submits a form").toBeTruthy();
    const tap = fieldsOf(form!, button);
    expect(tap).toMatchObject({ action: "choose", exercise: EX.lateral });
    expect((await act(b, path, tap)).status).toBe(303);
    const after = member(await roomNow(b, path), "Mia");
    expect(after?.state, "the rest goes on").toBe("resting");
    expect(after?.station?.equipment).toBe("Dumbbell rack");
    d = await sheet(b, path);
    expect(formExercise(d), "Start set now starts lateral").toBe(EX.lateral);
  });

  // LB-3.18, LB-3.20
  it("says nothing more when every exercise is done, and never acts by itself", async () => {
    const { b, path, plan } = await withPlan([], [[EX.bench, 1]]);
    await load(b, path, plan);
    expect(member(await roomNow(b, path), "Mia")?.state, "loading chose nothing").toBe("idle");
    await done(b, path, EX.bench);
    const d = await sheet(b, path);
    expect(counts(d)).toEqual({ [EX.bench]: "1/1" });
    expect(upNext(d), "no Up next").toBeNull();
    const now = member(await roomNow(b, path), "Mia");
    expect({ state: now?.state, exercise: now?.exercise }, "the workout goes on, unfinished").toEqual({ state: "resting", exercise: "Bench press" });
    expect(workoutSets(d)).toHaveLength(1);
  });

  // LB-3.21, LB-3.23 (another device sees the same plan and counts)
  it("replaces a loaded plan with another, clears it, and every device shows the same", async () => {
    const { b, email, path, plan } = await withPlan([], [[EX.incline, 3]]);
    // a second plan, from a second finished workout in another room
    const other = await createRoom(b);
    const second = (await planFrom(b, other.path, [[EX.squat, 2]], "Legs")).plan;
    await b.post(other.path, { action: "leave" });

    const phone = new Browser();
    expect((await phone.post("/signin", { email, password: "correct horse" })).status).toBe(303);

    await done(b, path, EX.incline);
    await load(b, path, plan);
    expect(counts(await sheet(phone, path)), "her phone").toEqual({ [EX.incline]: "1/3" });

    expect((await load(b, path, second)).status).toBe(303);
    expect(counts(await sheet(b, path))).toEqual({ [EX.squat]: "0/2" });
    expect(counts(await sheet(phone, path)), "her phone, after the swap").toEqual({ [EX.squat]: "0/2" });

    expect((await act(b, path, { action: "plan-clear" })).status).toBe(303);
    expect((await sheet(b, path)).querySelector("[data-plan]")).toBeNull();
    expect((await sheet(phone, path)).querySelector("[data-plan]")).toBeNull();
    expect(workoutSets(await sheet(b, path)).map((s) => s.text), "her sets untouched").toEqual(["40 kg × 8"]);
  });

  // LB-3.24
  it("goes with the workout: finishing or leaving drops it, and loading after finishing waits for the next workout", async () => {
    const { b, path, plan } = await withPlan([], [[EX.incline, 3]]);
    await done(b, path, EX.incline);
    await load(b, path, plan);
    await finish(b, path);
    expect((await sheet(b, path)).querySelector("[data-plan]"), "finished: no plan").toBeNull();

    // finished and staying: loading attaches it to her next workout, still Finished
    expect((await load(b, path, plan)).status).toBe(303);
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("finished");
    expect(counts(await sheet(b, path)), "a fresh count for the next workout").toEqual({ [EX.incline]: "0/3" });
    await choose(b, path, EX.incline);
    expect(member(await roomNow(b, path), "Mia")?.state).toBe("lifting");
    expect(counts(await sheet(b, path))).toEqual({ [EX.incline]: "0/3" });

    await act(b, path, { action: "leave" });
    const next = (await createRoom(b)).path;
    expect((await sheet(b, next)).querySelector("[data-plan]"), "left: her next workout has none").toBeNull();
  });
});
