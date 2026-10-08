import { describe, expect, it } from "vitest";
import { Browser, createRoom, signUp } from "./helpers.ts";

// What a set records depends on the exercise (docs/adr/0002-exercise-kinds.md),
// sets can be fixed after logging (LOG-8), and finishing lands on a summary
// (LOG-6). Exercise ids are the seeded ones in src/lib/exercises.ts.
const RUN = "1";
const BENCH = "3";
const PULL_UP = "11";
const PLANK = "16";

async function inRoom() {
  const b = new Browser();
  await signUp(b);
  const { path } = await createRoom(b);
  return { b, path };
}

describe("each exercise asks for what it measures", () => {
  it("logs a run as distance and time, with no weight to fill in", async () => {
    const { b, path } = await inRoom();
    const form = await (await b.get(`${path}?exercise=${RUN}`)).text();
    expect(form).toContain('name="distance_km"');
    expect(form).not.toContain('name="weight_kg"');

    const logged = await b.post(path, { exercise_id: RUN, distance_km: "5", minutes: "25", seconds: "0" });
    expect(logged.status).toBe(303);
    const history = await (await b.get("/history")).text();
    expect(history).toContain("5 km");
    expect(history).toContain("5:00 /km");
  });

  it("logs a plank as a hold, and a pull-up as reps with optional added weight", async () => {
    const { b, path } = await inRoom();
    expect((await b.post(path, { exercise_id: PLANK, minutes: "1", seconds: "30" })).status).toBe(303);
    expect((await b.post(path, { exercise_id: PULL_UP, reps: "8", weight_kg: "" })).status).toBe(303);
    const page = await (await b.get(path)).text();
    expect(page).toContain("1:30");
    expect(page).toContain("BW × 8");
  });

  it("refuses a run with no distance", async () => {
    const { b, path } = await inRoom();
    const res = await b.post(path, { exercise_id: RUN, distance_km: "0", minutes: "20", seconds: "0" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Distance is 0.01 to 1000 km.");
  });

  it("pre-fills a run from the last one", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: RUN, distance_km: "3.2", minutes: "18", seconds: "5" });
    const form = await (await b.get(`${path}?exercise=${RUN}`)).text();
    expect(form).toMatch(/name="distance_km"[^>]*value="3.2"/);
    expect(form).toMatch(/name="minutes"[^>]*value="18"/);
    expect(form).toMatch(/name="seconds"[^>]*value="5"/);
  });
});

describe("a set can be fixed after it's logged", () => {
  it("edits and deletes a set in the open workout", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: BENCH, weight_kg: "60", reps: "8" });
    const setId = (await (await b.get(path)).text()).match(/\?edit=(\d+)/)![1];

    expect((await b.post(path, { action: "edit", set_id: setId, weight_kg: "62.5", reps: "8" })).status).toBe(303);
    expect(await (await b.get(path)).text()).toContain("62.5");

    expect((await b.post(path, { action: "delete", set_id: setId })).status).toBe(303);
    expect(await (await b.get(path)).text()).not.toContain(`?edit=${setId}`);
  });

  it("won't touch someone else's set", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: BENCH, weight_kg: "60", reps: "8" });
    const setId = (await (await b.get(path)).text()).match(/\?edit=(\d+)/)![1];

    const other = await inRoom();
    const res = await other.b.post(other.path, { action: "delete", set_id: setId });
    expect(res.status).toBe(404);
    expect(await (await b.get(path)).text()).toContain(`?edit=${setId}`);
  });
});

describe("finishing shows a summary that only its owner can see", () => {
  it("lands on the workout's summary with its totals", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: BENCH, weight_kg: "100", reps: "5" });
    await b.post(path, { exercise_id: RUN, distance_km: "2", minutes: "10", seconds: "0" });

    const finished = await b.post(path, { action: "finish" });
    expect(finished.status).toBe(303);
    const summaryPath = finished.headers.get("location")!;
    expect(summaryPath).toMatch(/^\/workouts\/\d+/);
    const summary = await (await b.follow(finished)).text();
    expect(summary).toContain("500"); // 100 kg × 5 of volume
    expect(summary).toContain("2 km");

    const stranger = new Browser();
    await signUp(stranger);
    expect((await stranger.get(summaryPath.split("?")[0])).status).toBe(404);
  });
});

describe("the rest timer", () => {
  it("starts from the exercise's default and moves by 15 s", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: BENCH, weight_kg: "60", reps: "8" });
    // bench press rests 150 s by default
    expect(await (await b.get(path)).text()).toMatch(/data-rest-target="150"/);

    expect((await b.post(path, { action: "rest", delta: "15" })).status).toBe(303);
    expect(await (await b.get(path)).text()).toMatch(/data-rest-target="165"/);

    // the next bench set starts from the rest last chosen for it
    await b.post(path, { exercise_id: BENCH, weight_kg: "60", reps: "8" });
    expect(await (await b.get(path)).text()).toMatch(/data-rest-target="165"/);
  });

  it("starts no rest timer after a run", async () => {
    const { b, path } = await inRoom();
    await b.post(path, { exercise_id: RUN, distance_km: "2", minutes: "10", seconds: "0" });
    expect(await (await b.get(path)).text()).not.toContain("data-rest-target");
  });
});
