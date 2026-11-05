import { describe, expect, it } from "vitest";
import { backdateWorkout, Browser, createRoom, roomLogOf, watchRoom } from "./helpers.ts";
import {
  act,
  sheet,
  start,
  DAY,
  dayPattern,
  done,
  doneId,
  EX,
  finish,
  lastTime,
  member,
  midWeekAgo,
  page,
  person,
  setsIn,
  solo,
  stampSet,
  textOf,
  textOfDoc,
  weekStart,
  workoutSets,
  choose,
} from "./logbook-helpers.ts";

// Records, the exercise page and the weekly stats (docs/product/criteria/
// logbook.md, LB-4 to LB-6), checked over HTTP against the running app, to
// the contract at the top of spec/logbook.test.ts. Each test names the
// criteria it covers.

const kg = (w: string, r: string, more: Record<string, string> = {}) => ({ weight_kg: w, reps: r, ...more });
const bw = (r: string, added = "") => ({ reps: r, weight_kg: added });
const hold = (m: string, s: string) => ({ minutes: m, seconds: s });
const run = (km: string, m: string) => ({ distance_km: km, minutes: m, seconds: "0" });
// the records each set of the open workout set, in order
const marks = async (b: Browser, path: string) => workoutSets(await sheet(b, path)).map((s) => s.records);

// ===========================================================================
// LB-4: personal records
// ===========================================================================

describe("records", () => {
  // LB-4.1, LB-4.2, LB-4.3, LB-4.5 (e1RM, rounded to 0.1 kg; none past 10 reps),
  // LB-4.8 as far as HTTP reaches (stand-in, contract settled 7: sets posted
  // without set_type count as working sets, as rows from before this change)
  it("marks a working set that beats every earlier one, never the first, never an equal", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("100", "5")); // first: nothing to beat (e1RM 116.7)
    await done(b, path, EX.bench, kg("100", "5")); // equal isn't better
    await done(b, path, EX.bench, kg("100", "6")); // reps and e1RM 120, not heaviest
    await done(b, path, EX.bench, kg("80", "12")); // most reps; no e1RM past 10 reps
    await done(b, path, EX.bench, kg("120", "1")); // heaviest; e1RM 120 is equal, not better
    expect(await marks(b, path)).toEqual([[], [], ["e1rm", "reps"], ["reps"], ["heaviest"]]);

    // across workouts too, and a 1-rep e1RM is the weight itself
    await finish(b, path);
    await done(b, path, EX.bench, kg("120.5", "1"));
    expect(await marks(b, path)).toEqual([["e1rm", "heaviest"]]);
  });

  // LB-4.4
  it("never marks a warm-up, nor counts it as the best to beat", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("90", "5"));
    await done(b, path, EX.bench, kg("100", "5"));
    await done(b, path, EX.bench, kg("102.5", "1", { set_type: "warmup" }));
    await done(b, path, EX.bench, kg("101", "1"));
    expect(await marks(b, path)).toEqual([[], ["e1rm", "heaviest"], [], ["heaviest"]]);
  });

  // LB-4.1 (each kind's record types, Terms), LB-4.6
  it("keeps the record types of each kind, Heaviest added only for weight added", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.pullUp, bw("10")); // first
    await done(b, path, EX.pullUp, bw("6", "5")); // first with weight added: nothing to beat (LB-4.6, as D16)
    await done(b, path, EX.pullUp, bw("5", "10")); // heaviest added
    await done(b, path, EX.pullUp, bw("12")); // most reps, nothing added
    await done(b, path, EX.plank, hold("1", "0"));
    await done(b, path, EX.plank, hold("1", "30")); // longest hold
    await done(b, path, EX.run, run("5", "25"));
    await done(b, path, EX.run, run("3", "30")); // longest time
    await done(b, path, EX.run, run("6", "20")); // longest distance
    const m = await marks(b, path);
    expect(m.slice(0, 4)).toEqual([[], [], ["added"], ["reps"]]);
    expect(m.slice(4)).toEqual([[], ["hold"], [], ["time"], ["distance"]]);
  });

  // LB-4.9, LB-4.11
  it("works marks out again after an edit, and a beaten record keeps its mark", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const second = await doneId(b, path, EX.bench, kg("70", "8"));
    await done(b, path, EX.bench, kg("65", "8"));
    await done(b, path, EX.bench, kg("80", "8"));
    expect(await marks(b, path), "70 stays a record after 80 beats it").toEqual([[], ["e1rm", "heaviest"], [], ["e1rm", "heaviest"]]);

    expect((await act(b, path, { action: "edit", set_id: second, weight_kg: "55", reps: "8" })).status).toBe(303);
    expect(await marks(b, path), "edited down, it loses its mark; 65 gains one").toEqual([[], [], ["e1rm", "heaviest"], ["e1rm", "heaviest"]]);
  });

  // LB-4.10
  it("is marked, in words, on the stamp, This workout, Last time, the summary, history and the exercise page", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const d = await done(b, path, EX.bench, kg("62.5", "8"));
    expect(stampSet(d)?.records, "stamp").toEqual(["e1rm", "heaviest"]);
    expect(textOf(d.querySelector(".stamp")), "stamp, in words").toMatch(/new record/i);
    expect(workoutSets(d)[1].records, "This workout").toEqual(["e1rm", "heaviest"]);
    const workout = await finish(b, path);
    await choose(b, path, EX.bench);
    expect(lastTime(await sheet(b, path))[1]?.records, "Last time").toEqual(["e1rm", "heaviest"]);
    for (const at of [`/workouts/${workout}`, "/history", `/exercises/${EX.bench}`]) {
      const p = await page(b, at);
      expect(setsIn(p.body).find((s) => s.text === "62.5 kg × 8")?.records, at).toEqual(["e1rm", "heaviest"]);
      expect(textOfDoc(p), `${at}, in words`).toMatch(/new record/i);
    }
  });

  // LB-4.12
  it("are counted on the summary, which says nothing about records when there are none", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.pullUp, bw("8"));
    const first = await finish(b, path);
    // three sets, each setting one record (Most reps), so sets and records agree
    for (const r of ["9", "10", "11"]) await done(b, path, EX.pullUp, bw(r));
    const second = await finish(b, path);
    expect(textOfDoc(await page(b, `/workouts/${second}`))).toContain("3 new records");
    expect(textOfDoc(await page(b, `/workouts/${first}`))).not.toMatch(/record/i);
  });

  // LB-4.13
  it("tells nobody else in the room", async (ctx) => {
    const mia = await person("Mia");
    const tom = await person("Tom");
    const { path, passcode } = await createRoom(mia.b);
    await tom.b.post("/join", { passcode });
    await done(mia.b, path, EX.bench, kg("60", "8"));
    await start(mia.b, path, { exercise_id: EX.bench, weight_kg: "62.5", reps: "8" });
    const watch = await watchRoom(tom.b, path);
    ctx.onTestFinished(() => watch.close());
    await watch.next("room", (e) => member(e, "Mia")?.state === "lifting", 2000);
    const logBefore = roomLogOf(await (await tom.b.get(path)).text());

    const d = await done(mia.b, path, EX.bench, kg("62.5", "8"));
    expect(stampSet(d)?.records, "it is a record").toEqual(["e1rm", "heaviest"]);
    await watch.next("room", (e) => member(e, "Mia")?.state === "resting", 2000);
    expect(JSON.stringify(watch.all("room"))).not.toMatch(/record|e1rm|heaviest/i);
    expect(watch.all("interaction").length + watch.all("say").length + watch.all("emote").length).toBe(0);
    const tomHtml = await (await tom.b.get(path)).text();
    expect(roomLogOf(tomHtml), "no room-log line").toEqual(logBefore);
    expect(textOfDoc(await page(tom.b, path))).not.toMatch(/new record/i);
  });
});

// ===========================================================================
// LB-5: an exercise's progress page
// ===========================================================================

describe("the exercise page", () => {
  const rows = (d: Document) => [...d.querySelectorAll("table[data-points] tr")].filter((tr) => tr.querySelector("td")).map(textOf);

  // LB-5.1
  it("is there for each of the 16 exercises, to the signed in", async () => {
    const { b } = await person();
    const bench = await b.get(`/exercises/${EX.bench}`);
    expect(bench.status).toBe(200);
    expect(textOfDoc(await page(b, `/exercises/${EX.bench}`))).toContain("Bench press");
    expect((await b.get("/exercises/16")).status).toBe(200);
    for (const bad of ["0", "17", "abc", "3.5"]) expect((await b.get(`/exercises/${bad}`)).status, bad).toBe(404);
    const out = await new Browser().get(`/exercises/${EX.bench}`);
    expect(out.status).toBe(303);
    expect(out.headers.get("location")).toBe(`/signin?next=/exercises/${EX.bench}`);
  });

  // LB-5.2, LB-5.6
  it("shows her current records and every set, by workout, newest first, and nothing of anyone else's", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("100", "5"));
    await done(b, path, EX.bench, kg("100", "6", { rpe: "8" }));
    await act(b, path, { action: "note", exercise_id: EX.bench, note: "seat on 4" });
    const old = await finish(b, path);
    await backdateWorkout(b, path, old, 3 * DAY);
    await done(b, path, EX.bench, kg("90", "5", { set_type: "warmup" })); // her open workout
    const tom = await solo("Tom");
    await done(tom.b, tom.path, EX.bench, kg("123.5", "7"));

    const d = await page(b, `/exercises/${EX.bench}`);
    const record = (key: string) => textOf(d.querySelector(`[data-record="${key}"]`));
    const then = dayPattern(Date.now() - 3 * DAY);
    expect(record("heaviest")).toMatch(/100 kg/);
    expect(record("heaviest")).toMatch(then);
    expect(record("e1rm")).toMatch(/120 kg/);
    expect(record("reps")).toMatch(/\b6\b/);

    expect(setsIn(d.body).map(({ text, type }) => ({ text, type }))).toEqual([
      { text: "90 kg × 5", type: "warmup" },
      { text: "100 kg × 5", type: null },
      { text: "100 kg × 6 @ 8", type: null },
    ]);
    expect(d.querySelector(`a[href="/workouts/${old}"]`), "the finished workout links to its summary").not.toBeNull();
    // the order within the sets' own table (the Records card above names days too)
    const log = textOf(d.querySelector("[data-set]")?.closest("table"));
    expect(log.indexOf("Live"), "her open workout, marked Live, comes first").toBeGreaterThanOrEqual(0);
    expect(log.indexOf("Live")).toBeLessThan(log.search(then));
    expect(textOf(d.querySelector("[data-note]"))).toBe("seat on 4");
    expect(d.body.innerHTML, "nothing of Tom's").not.toContain("123.5");
  });

  // LB-5.3, LB-5.5 (the points are text in the server's HTML)
  it("plots one point per workout, oldest first: the best e1RM of its working sets", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("100", "5")); // e1RM 116.7
    await done(b, path, EX.bench, kg("80", "10")); // 106.7
    await backdateWorkout(b, path, await finish(b, path), 3 * DAY);
    await done(b, path, EX.bench, kg("200", "1", { set_type: "warmup" }));
    await done(b, path, EX.bench, kg("60", "12")); // nothing to plot
    await backdateWorkout(b, path, await finish(b, path), 2 * DAY);
    await done(b, path, EX.bench, kg("100", "6")); // 120, today, still open

    const r = rows(await page(b, `/exercises/${EX.bench}`));
    expect(r).toHaveLength(2);
    expect(r[0]).toMatch(dayPattern(Date.now() - 3 * DAY));
    expect(r[0]).toMatch(/116\.7/);
    expect(r[1]).toMatch(/\b120\b/);
  });

  // LB-5.3 (bodyweight, duration, cardio)
  it("plots most reps, the longest hold and the longest distance for the other kinds", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.pullUp, bw("8"));
    await done(b, path, EX.pullUp, bw("10", "5"));
    await done(b, path, EX.plank, hold("1", "0"));
    await done(b, path, EX.plank, hold("1", "30"));
    await done(b, path, EX.run, run("5", "25"));
    await done(b, path, EX.run, run("3", "30"));
    expect(rows(await page(b, `/exercises/${EX.pullUp}`))).toEqual([expect.stringMatching(/\b10\b/)]);
    expect(rows(await page(b, `/exercises/${EX.plank}`))).toEqual([expect.stringContaining("1:30")]);
    expect(rows(await page(b, `/exercises/${EX.run}`))).toEqual([expect.stringMatching(/\b5\b/)]);
  });

  // LB-5.4
  it("says when there are no sets yet, and has no chart with nothing to plot", async () => {
    const { b, path } = await solo();
    const none = await page(b, `/exercises/${EX.bench}`);
    expect(textOfDoc(none)).toContain("No sets of Bench press yet");
    expect(none.querySelector('a[href="/history"]')).not.toBeNull();
    expect(none.querySelector("table[data-points]")).toBeNull();

    await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" }));
    const warmups = await page(b, `/exercises/${EX.bench}`);
    expect(warmups.querySelector("table[data-points]"), "only warm-ups: no chart").toBeNull();
    expect(setsIn(warmups.body), "but the set is listed").toHaveLength(1);
  });

  // LB-5.7
  it("is linked from every exercise name in history, a summary and home's last workout, not from the room", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench);
    await done(b, path, EX.plank);
    expect((await sheet(b, path)).querySelector('a[href^="/exercises/"]'), "the room has no link").toBeNull();
    const workout = await finish(b, path);
    for (const at of ["/history", `/workouts/${workout}`, "/"]) {
      const d = await page(b, at);
      for (const ex of [EX.bench, EX.plank]) expect(d.querySelector(`a[href="/exercises/${ex}"]`), `${at} links exercise ${ex}`).not.toBeNull();
    }
  });

  // LB-5.8
  it("keeps every past set reachable over a long history", async () => {
    const { b, path } = await solo();
    const weights = Array.from({ length: 14 }, (_, i) => String(40 + i * 2.5));
    for (const [i, w] of weights.entries()) {
      await done(b, path, EX.bench, kg(w, "5"));
      await backdateWorkout(b, path, await finish(b, path), (weights.length - i) * 7 * DAY);
    }
    const sets = setsIn((await page(b, `/exercises/${EX.bench}`)).body).map((s) => s.text);
    expect(sets.sort()).toEqual(weights.map((w) => `${w} kg × 5`).sort());
  }, 30_000);
});

// ===========================================================================
// LB-6: weekly stats on history
// ===========================================================================

describe("weekly stats", () => {
  type Week = { workouts: number; volume: number; km: number; streak: number | null };
  const num = (s: string | null) => Number((s ?? "").replace(/[^\d.]/g, "") || "0");
  async function week(b: Browser): Promise<Week | null> {
    const el = (await page(b, "/history")).querySelector("[data-week]");
    if (!el) return null;
    return {
      workouts: num(el.getAttribute("data-workouts")),
      volume: num(el.getAttribute("data-volume")),
      km: num(el.getAttribute("data-km")),
      streak: el.hasAttribute("data-streak") ? num(el.getAttribute("data-streak")) : null,
    };
  }
  // one finished workout with a set, put in the middle of the week n weeks ago
  async function trainedWeeksAgo(b: Browser, path: string, n: number) {
    await done(b, path, EX.bench, kg("50", "10"));
    const id = await finish(b, path);
    await backdateWorkout(b, path, id, Date.now() - midWeekAgo(n));
  }

  // LB-6.1, LB-6.3 (the open workout counts once it has a set; an empty one
  // doesn't), LB-6.4 (warm-ups included), LB-6.5 (trained this week: 1)
  it("counts this week's workouts with a set, their volume and distance, and a streak", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("40", "10", { set_type: "warmup" })); // 400
    await done(b, path, EX.bench, kg("60", "8")); // 480
    await done(b, path, EX.run, run("5", "25"));
    await finish(b, path);
    await act(b, path, { action: "leave" });
    const empty = (await createRoom(b)).path;
    await b.post(empty, { action: "leave" }); // an empty workout
    const open = (await createRoom(b)).path;
    await done(b, open, EX.bench, kg("50", "10")); // 500, still open

    expect(await week(b)).toEqual({ workouts: 2, volume: 1380, km: 5, streak: 1 });
    expect(textOfDoc(await page(b, "/history")), "the all-time line stays").toMatch(/in the book/);
  });

  // LB-6.2, LB-6.3 (0, plainly), LB-6.5 (not yet this week: last week's run counts)
  it("puts a workout in the week it started, Sunday 11:30 pm being last week", async () => {
    const { b, path } = await solo();
    await done(b, path, EX.bench, kg("60", "8"));
    const id = await finish(b, path);
    await backdateWorkout(b, path, id, Date.now() - (weekStart(Date.now()) - 30 * 60 * 1000));
    expect(await week(b)).toEqual({ workouts: 0, volume: 0, km: 0, streak: 1 });
  });

  // LB-6.5, LB-6.6 (no streak at 0, nothing said about it)
  it("counts the streak back from this week, or last week if not yet, and shows none at 0", async () => {
    const three = await solo();
    for (const n of [4, 2, 1]) await trainedWeeksAgo(three.b, three.path, n);
    await done(three.b, three.path, EX.bench); // this week
    expect((await week(three.b))?.streak, "this week, last week and the one before; not 3 weeks ago").toBe(3);

    const two = await solo();
    for (const n of [2, 1]) await trainedWeeksAgo(two.b, two.path, n);
    expect((await week(two.b))?.streak, "not yet this week, the two weeks before").toBe(2);

    const none = await solo();
    await trainedWeeksAgo(none.b, none.path, 2);
    expect((await week(none.b))?.streak, "neither this week nor last").toBeNull();
    expect(textOfDoc(await page(none.b, "/history"))).not.toMatch(/streak/i);
  });

  // LB-6.7
  it("are worked out again each load, so a deleted set changes them", async () => {
    const { b, path } = await solo();
    const id = await doneId(b, path, EX.bench, kg("60", "8"));
    expect(await week(b)).toMatchObject({ workouts: 1, volume: 480 });
    await done(b, path, EX.bench, kg("50", "10"));
    expect(await week(b)).toMatchObject({ workouts: 1, volume: 980 });
    expect((await act(b, path, { action: "delete", set_id: id })).status).toBe(303);
    expect(await week(b)).toMatchObject({ workouts: 1, volume: 500 });
  });

  // LB-6.8, LB-6.9
  it("are only on her own history, and not on an empty one", async () => {
    const mia = await person("Mia");
    const tom = await person("Tom");
    const { path, passcode } = await createRoom(mia.b);
    await tom.b.post("/join", { passcode });
    expect(await week(mia.b), "no workouts: no stats").toBeNull();
    expect(textOfDoc(await page(mia.b, "/history"))).toContain("No workouts yet");

    await done(mia.b, path, EX.bench, kg("60", "8"));
    expect(await week(mia.b)).not.toBeNull();
    expect(await week(tom.b), "not on Tom's").toBeNull();
    expect((await page(tom.b, path)).querySelector("[data-week], [data-streak]"), "not in the room").toBeNull();
  });
});
