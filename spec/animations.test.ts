import { afterEach, describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents, signUp, type RoomEvent } from "./helpers.ts";

// Avatar animations (docs/product/criteria/animations.md), the parts the
// server decides: what the room's first render draws, before any script runs
// (GYM-8). Every hook these checks read is in the criteria file's contract
// (the QA report): an avatar's `data-pose` is its station's equipment id while
// it is Lifting on the machine, and its sprite holds the two frames as
// `g.frame-1` (the still frame) and `g.frame-2`.

// one exercise of each pair per machine, then the other (Bench press and
// Incline bench press look the same, GYM-10.1)
const MACHINES = [
  { equipment: "treadmill", first: "1", second: "2" },
  { equipment: "flat-bench", first: "3", second: "4" },
  { equipment: "squat-rack", first: "5", second: "6" },
  { equipment: "dumbbell-rack", first: "7", second: "8" },
  { equipment: "lifting-platform", first: "9", second: "10" },
  { equipment: "pull-up-bar", first: "11", second: "12" },
  { equipment: "cable-machine", first: "13", second: "14" },
  { equipment: "exercise-mat", first: "15", second: "16" },
];

type Avatar = { cls: string[]; x: number; y: number; pose: string; label: string; look: string; html: string };
type Station = { x: number; y: number; slot: number; equipment: string | null };

const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const tileOf = (tag: string) => ({
  x: Number(tag.match(/--x:\s*(\d+)/)?.[1]),
  y: Number(tag.match(/--y:\s*(\d+)/)?.[1]),
});

function avatarsOf(html: string): Avatar[] {
  return [...html.matchAll(/<button[^>]*class="avatar[^"]*"[^>]*>[\s\S]*?<\/button>/g)].map((m) => {
    const tag = m[0].match(/^<button[^>]*>/)![0];
    return {
      cls: attr(tag, "class")!.split(/\s+/),
      ...tileOf(tag),
      pose: attr(tag, "data-pose") ?? "",
      label: attr(tag, "aria-label") ?? "",
      look: attr(tag, "data-look") ?? "",
      html: m[0],
    };
  });
}

function stationsOf(html: string): Station[] {
  return [...html.matchAll(/<div class="station[^"]*"[^>]*>/g)].map((m) => ({
    ...tileOf(m[0]),
    slot: Number(attr(m[0], "data-slot")),
    equipment: attr(m[0], "data-equipment") ?? null,
  }));
}

const named = (avatars: Avatar[], name: string) => {
  const found = avatars.find((a) => a.label.startsWith(`${name},`) || a.label.startsWith(`${name} (you),`));
  expect(found, `${name}'s avatar`).toBeDefined();
  return found!;
};
const stationAt = (stations: Station[], a: Avatar) => stations.find((s) => s.x === a.x && s.y === a.y);

// the map's markup, from its div to the end of the map panel
const mapOf = (html: string) => html.slice(html.indexOf('<div class="map"'), html.indexOf("</section>", html.indexOf('<div class="map"')));

async function roomOf(names: string[]) {
  const host = new Browser();
  await signUp(host, freshEmail(), "correct horse", names[0]);
  const { path, passcode } = await createRoom(host);
  const rest: Browser[] = [];
  for (const name of names.slice(1)) {
    const b = new Browser();
    await signUp(b, freshEmail(), "correct horse", name);
    await b.post("/join", { passcode });
    rest.push(b);
  }
  return { path, people: [host, ...rest] };
}

const streams: { close: () => void }[] = [];
afterEach(() => streams.splice(0).forEach((s) => s.close()));

describe("the first render draws each avatar in its animation", () => {
  // GYM-10.1 (HTTP), GYM-10.3 to GYM-10.10 (this animation for this machine)
  it("draws everyone Lifting on their station's machine, in that machine's animation, for either exercise", async () => {
    for (const which of ["first", "second"] as const) {
      const names = MACHINES.map((_, i) => `P${i}`);
      const { path, people } = await roomOf(names);
      for (const [i, m] of MACHINES.entries()) await people[i].post(path, { action: "choose", exercise: m[which] });

      const html = await (await people[0].get(path)).text();
      const stations = stationsOf(html);
      const avatars = avatarsOf(html);
      for (const [i, m] of MACHINES.entries()) {
        const a = named(avatars, `P${i}`);
        const station = stationAt(stations, a);
        expect(station?.equipment, `P${i} (exercise ${m[which]}) is on a station with ${m.equipment}`).toBe(m.equipment);
        expect(a.cls).toContain("on-station");
        expect(a.pose, `P${i}'s pose on the ${m.equipment}, exercise ${m[which]}`).toBe(m.equipment);
        // the two frames are in the server's markup, so the page needs no script to draw them
        expect(a.html).toMatch(/<g[^>]*class="[^"]*\bframe-1\b/);
        expect(a.html).toMatch(/<g[^>]*class="[^"]*\bframe-2\b/);
      }
    }
  }, 60_000);

  // GYM-10.21 (HTTP)
  it("draws everyone in the place and pose their state calls for, from what the server reports now", async () => {
    const { path, people } = await roomOf(["Mia", "Tom", "Ji-woo", "Priya"]);
    const [mia, tom] = people;
    await mia.post(path, { action: "choose", exercise: "3" }); // bench press: flat bench 2
    await tom.post(path, { exercise_id: "5", weight_kg: "80", reps: "5" }); // a squat set: Resting

    // Priya opens the room: nobody is mid-walk in a first render
    const html = await (await people[3].get(path)).text();
    const avatars = avatarsOf(html);
    const stations = stationsOf(html);

    const m = named(avatars, "Mia");
    expect(stationAt(stations, m)?.slot).toBe(2);
    expect(m.pose).toBe("flat-bench");
    // Resting at the first rest spot, idle people at the idle spots, in join order
    expect(named(avatars, "Tom")).toMatchObject({ x: 1, y: 7, pose: "rest" });
    expect(named(avatars, "Ji-woo")).toMatchObject({ x: 8, y: 7, pose: "stand" });
    expect(named(avatars, "Priya")).toMatchObject({ x: 6, y: 7, pose: "stand" });
    // and nobody shows a walk
    expect(avatars.map((a) => a.pose)).not.toContain("walk");
  });
});

describe("Lifting never turns Slacking by itself", () => {
  // GYM-11.4 (HTTP). Time is the behaviour here: the check waits past the
  // slack point of the rest that Start set ended (a 15 s rest, the shortest the
  // server counts, plus 30 s), so it takes about 47 s.
  it.concurrent(
    "still reports Lifting after the slack point of the rest Start set ended has passed",
    async () => {
      const { path, people } = await roomOf(["Mia", "Tom"]);
      const [mia, tom] = people;
      const screen = await openEvents(tom, path);
      streams.push(screen);
      await screen.next();
      const member = (e: RoomEvent) => e.members.find((x) => x.name === "Mia")!;

      // a curl set, its rest cut from 60 s to 15 s: Slacking would start 45 s
      // from now (a 0 s rest is no rest, so it could never turn Slacking)
      await mia.post(path, { exercise_id: "7", weight_kg: "12", reps: "10" });
      const loggedAt = Date.now();
      for (let i = 0; i < 3; i++) await mia.post(path, { action: "rest", delta: "-15" });
      const rested = await screen.until((e) => member(e).state === "resting" && member(e).slackAt! - e.now <= 45_000);
      const slackAt = Date.now() + (member(rested).slackAt! - rested.now);
      await mia.post(path, { action: "start", exercise_id: "7", weight_kg: "12", reps: "10" });
      const started = await screen.until((e) => member(e).state === "lifting");
      expect(member(started).slackAt).toBeNull();

      expect(slackAt).toBeLessThanOrEqual(loggedAt + 46_000);
      await new Promise((r) => setTimeout(r, Math.max(0, slackAt + 2000 - Date.now())));
      const html = await (await tom.get(path)).text();
      const mias = named(avatarsOf(html), "Mia");
      expect(mias.label).toBe("Mia, lifting, dumbbell curl on dumbbell rack 4");
      expect(mias.pose).toBe("dumbbell-rack");
    },
    65_000,
  );
});

describe("tags, names and the squad list", () => {
  // GYM-15.1 (HTTP)
  it("keeps the accessible names, and hides the animation from assistive technology", async () => {
    const { path, people } = await roomOf(["Mia", "Tom"]);
    const [mia, tom] = people;
    await mia.post(path, { action: "choose", exercise: "5" }); // back squat: squat rack 3
    await tom.post(path, { exercise_id: "3", weight_kg: "60", reps: "8" }); // Resting, flat bench 2

    const html = await (await tom.get(path)).text();
    const avatars = avatarsOf(html);
    const m = named(avatars, "Mia");
    expect(m.pose).toBe("squat-rack");
    expect(m.label).toBe("Mia, lifting, back squat on squat rack 3");
    expect(named(avatars, "Tom").label).toBe("Tom (you), resting, flat bench 2");
    // every sprite inside an avatar is hidden: the name is the label
    for (const a of avatars) {
      const svgs = [...a.html.matchAll(/<svg[^>]*>/g)].map((s) => s[0]);
      expect(svgs.length).toBeGreaterThan(0);
      for (const svg of svgs) expect(svg).toMatch(/aria-hidden="true"/);
    }
    // nothing on the map announces itself
    const map = mapOf(html);
    expect(map).not.toMatch(/aria-live=|role="(status|alert|log)"/);
    // every station, and so every machine's front parts, is hidden art
    // (the browser check reads the map's accessibility tree as a whole)
    for (const s of map.matchAll(/<div class="station[^"]*"[^>]*>/g)) expect(s[0]).toMatch(/aria-hidden="true"/);
  });

  // GYM-15.2
  it("keeps someone's squad row and its standing head whatever their state or machine", async () => {
    const { path, people } = await roomOf(["Mia"]);
    const [mia] = people;
    const row = async () => {
      const html = await (await mia.get(path)).text();
      const li = html.match(/<li class="me[^"]*"[^>]*>([\s\S]*?)<\/li>/)![1];
      return {
        head: li.match(/<svg class="av[^"]*"[\s\S]*?<\/svg>/)![0],
        what: li.match(/<span class="what"[^>]*>([\s\S]*?)<\/span>\s*<\/span>|<span class="what"[^>]*>([\s\S]*?)<\/span>/)![0].replace(/<[^>]+>/g, "").trim(),
      };
    };
    const idle = await row();
    expect(idle.head).toMatch(/pose-stand/);

    await mia.post(path, { action: "choose", exercise: "3" });
    const bench = await row();
    expect(bench.what).toBe("Bench press · flat bench 2");
    expect(bench.head).toBe(idle.head);

    await mia.post(path, { action: "choose", exercise: "11" }); // pull-up: a delivered bar
    const pullUp = await row();
    expect(pullUp.what).toBe("Pull-up · pull-up bar 5");
    expect(pullUp.head).toBe(idle.head);

    await mia.post(path, { exercise_id: "11", reps: "8", weight_kg: "" });
    const resting = await row();
    expect(resting.what).toMatch(/^Rest \d+:\d\d left · pull-up bar 5$/);
    expect(resting.head).toBe(idle.head);
  });
});

describe("Dony", () => {
  // BOT-2.4 (HTTP). He starts his first lift 3 s after he's called out.
  it("is drawn on the machine of the station he holds, not the lift his schedule picked", async () => {
    const { path, people } = await roomOf(["Mia", "Tom", "Ji-woo"]);
    // only the dumbbell rack is left free, so whatever lift he planned, he
    // does it on the rack
    await people[0].post(path, { action: "choose", exercise: "1" });
    await people[1].post(path, { action: "choose", exercise: "3" });
    await people[2].post(path, { action: "choose", exercise: "5" });
    expect((await people[0].post(path, { action: "dony", intent: "summon" })).status).toBe(303);

    let dony: Avatar | undefined;
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const html = await (await people[0].get(path)).text();
      dony = avatarsOf(html).find((a) => a.label.startsWith("Dony,"));
      if (dony?.label.startsWith("Dony, lifting,")) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(dony?.label).toMatch(/^Dony, lifting, .* on dumbbell rack 4$/);
    expect(dony).toMatchObject({ x: 8, y: 1, pose: "dumbbell-rack" });
  }, 20_000);
});

describe("the avatar editor", () => {
  // AV-1.1
  it("labels the long hair style Wolf cut, and still stores it as long", async () => {
    const b = new Browser();
    await signUp(b);
    const html = await (await b.get("/avatar")).text();
    const label = html.match(/<label[^>]*class="pick style"[^>]*>(?:(?!<\/label>)[\s\S])*?value="long"[\s\S]*?<\/label>/)?.[0];
    expect(label, "a hair tile whose radio's value is long").toBeDefined();
    const text = label!.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    expect(text).toBe("Wolf cut");
    // nothing overrides the visible name for a screen reader
    for (const named of label!.matchAll(/aria-label="([^"]*)"/g)) expect(named[1]).toBe("Wolf cut");

    const saved = await b.post("/avatar", { skin: "3", hair: "long", hair_colour: "dark-brown", shirt: "teal" });
    expect(saved.status).toBe(303);
    const after = await (await b.get("/avatar")).text();
    expect(after).toMatch(/name="hair" value="long" checked/);
    const { path } = await createRoom(b);
    expect(await (await b.get(path)).text()).toContain('data-look="3|long|dark-brown|teal"');
  });
});
