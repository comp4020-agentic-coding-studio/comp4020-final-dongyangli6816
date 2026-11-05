import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { openRoom, person, post } from "./helpers.ts";

// LB-7, an exercise's animation in the logbook (docs/product/criteria/
// logbook.md, D36 to D43), with the page's styles running: the motion, the
// size and place beside the name, and the tap. The HTML is checked over HTTP
// in spec/logbook-art.test.ts. Each test names the criteria it covers.

const LOOK = { skin: "2", hair: "ponytail", hair_colour: "pink", shirt: "white" };
const SET: Record<string, Record<string, string>> = {
  "1": { distance_km: "2", minutes: "10", seconds: "0" },
  "3": { weight_kg: "82.5", reps: "8" },
  "5": { weight_kg: "100", reps: "5" },
  "9": { weight_kg: "120", reps: "3" },
  "11": { reps: "8", weight_kg: "" },
  "4": { weight_kg: "50", reps: "10" },
};

// A page for this person. On `astro dev` (a worktree's server) the dev
// toolbar floats over the page's foot and takes its taps; a built app has none
// (the same workaround as spec/browser/logbook.spec.ts).
async function open(who: BrowserContext): Promise<Page> {
  const page = await who.newPage();
  await page.addInitScript(() => {
    new MutationObserver(() => document.querySelector("astro-dev-toolbar")?.remove()).observe(document, { childList: true, subtree: true });
  });
  return page;
}

// Mia, in her look, with a finished workout of these exercises, two sets each
// (so each group has a Best line), the second a record; she stays in the room
async function mia(browser: import("@playwright/test").Browser, exercises: string[]) {
  const who = await person(browser, "Mia");
  expect((await post(who, "/avatar", LOOK)).status()).toBe(303);
  const { path } = await openRoom(who);
  for (const ex of exercises) {
    const s = SET[ex];
    expect((await post(who, path, { exercise_id: ex, ...s })).status()).toBe(303);
    const more = s.weight_kg ? { ...s, weight_kg: String(Number(s.weight_kg) + 2.5) } : s.reps ? { ...s, reps: String(Number(s.reps) + 1) } : { ...s, distance_km: "3" };
    expect((await post(who, path, { exercise_id: ex, ...more })).status()).toBe(303);
  }
  const workout = (await post(who, path, { action: "finish" })).headers().location.match(/^\/workouts\/(\d+)/)![1];
  return { who, path, workout };
}

// the frame swap as the page's styles have it, read from the computed style
const motion = (p: Page) =>
  p.locator(".ex-art").evaluateAll((arts) =>
    arts.map((art) => {
      const f1 = art.querySelector("g.frame-1")!;
      const f2 = art.querySelector("g.frame-2")!;
      const s1 = getComputedStyle(f1);
      const s2 = getComputedStyle(f2);
      return {
        pose: art.getAttribute("data-pose"),
        names: [s1.animationName, s2.animationName],
        durations: [s1.animationDuration, s2.animationDuration],
        counts: [s1.animationIterationCount, s2.animationIterationCount],
        shown: [s1.visibility, s2.visibility],
      };
    }),
  );

// two boxes overlap (by more than a hair)
const overlaps = (a: DOMRect | { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

// Scenario 1. LB-7.9 (two frames, the gym's rates, styles alone), LB-7.11 (at
// 360, 390 and 1280: beside or above the name, covering nothing, no sideways
// scroll, a whole 1x, one size), LB-7.12 (a folded week's art isn't shown)
test("Mia's history plays each exercise's art at the gym's rate, beside her names, at every width", async ({ browser }) => {
  const { who, path } = await mia(browser, ["3", "4", "5", "9", "11", "1"]);
  // workouts one, two and five weeks back: history folds the weeks after the
  // first two before this one, so the five-week-old one is in a folded week
  let old = "";
  for (const weeks of [1, 2, 5]) {
    expect((await post(who, path, { exercise_id: "5", ...SET["5"] })).status()).toBe(303);
    old = (await post(who, path, { action: "finish" })).headers().location.match(/^\/workouts\/(\d+)/)![1];
    expect((await post(who, `${path}/qa`, { op: "backdate", ms: String(weeks * 7 * 86_400_000), workout: old })).status()).toBe(204);
  }

  const page = await open(who);
  await page.goto("/history");

  // the motion: every piece, from its styles: two steps per cycle of two frames
  const m = await motion(page);
  expect(m.length, "art on the page").toBeGreaterThanOrEqual(6);
  for (const a of m) {
    const frame = a.pose === "treadmill" ? 0.25 : 0.4;
    expect(a.names.every((n) => n && n !== "none"), `${a.pose}: both frames animate`).toBe(true);
    expect(a.names[0], `${a.pose}: two different keyframes`).not.toBe(a.names[1]);
    expect(a.durations, `${a.pose}: a cycle of two ${frame * 1000} ms frames`).toEqual([`${frame * 2}s`, `${frame * 2}s`]);
    expect(a.counts, `${a.pose}: forever`).toEqual(["infinite", "infinite"]);
  }
  expect(new Set(m.map((a) => a.pose)), "the treadmill is among them").toContain("treadmill");

  // a folded week's art isn't shown: the five-week-old workout's week is
  // folded, and nothing of it (art included) is visible until it's opened
  const oldLink = page.locator(`a[href="/workouts/${old}"]`);
  if ((await oldLink.count()) > 0) {
    expect(await oldLink.evaluate((a) => !!a.closest("details:not([open])")), "the old workout is in a folded week").toBe(true);
    const art = await page.locator("details:not([open]) .ex-art").evaluateAll((els) => els.map((e) => e.checkVisibility()));
    expect(art.length, "the folded week holds its art").toBeGreaterThan(0);
    expect(art.every((v) => !v), "art in a folded week isn't shown").toBe(true);
  }
  // (a folded week that renders nothing until opened passes as well: no art, no cost)
  await expect(page.locator("details:not([open])"), "a folded week on the page").not.toHaveCount(0);

  for (const width of [360, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.locator(".log th.lift").evaluateAll((ths) =>
      ths
        .filter((th) => th.querySelector(".ex-art") && (th as HTMLElement).offsetParent)
        .map((th) => {
          const art = th.querySelector(".ex-art")!;
          const nm = th.querySelector(".nm") ?? th.querySelector("a")!;
          const range = document.createRange();
          range.selectNodeContents(nm);
          const others = [...th.querySelectorAll(".badge, .best")].map((e) => e.getBoundingClientRect());
          const row = th.closest("tr")!;
          const cells = [...row.querySelectorAll("td")].map((e) => e.getBoundingClientRect());
          return {
            art: art.getBoundingClientRect().toJSON(),
            name: [...range.getClientRects()].map((r) => r.toJSON()),
            others: others.map((r) => r.toJSON()),
            cells: cells.map((r) => r.toJSON()),
            th: th.getBoundingClientRect().toJSON(),
          };
        }),
    );
    expect(layout.length, `${width}: rows with art`).toBeGreaterThanOrEqual(6);
    for (const [i, r] of layout.entries()) {
      expect([Math.round(r.art.width), Math.round(r.art.height)], `${width}, row ${i}: 32 px, a whole 1x, the same at every width`).toEqual([32, 32]);
      for (const n of r.name) expect(overlaps(r.art, n), `${width}, row ${i}: covers no part of the name`).toBe(false);
      for (const o of r.others) expect(overlaps(r.art, o), `${width}, row ${i}: covers no badge or Best line`).toBe(false);
      for (const c of r.cells) expect(overlaps(r.art, c), `${width}, row ${i}: covers no set`).toBe(false);
      expect(r.art.x + r.art.width, `${width}, row ${i}: inside its row header`).toBeLessThanOrEqual(r.th.x + r.th.width + 0.5);
    }
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(fits, `${width}: no sideways scroll`).toBe(true);
    // the figures themselves (a run's pace sits on its own line by design,
    // history spec Nov 4) stay on one line
    const wraps = await page.locator(".log td.set [data-set]").evaluateAll((els) =>
      els
        .filter((e) => {
          const r = document.createRange();
          r.setStart(e, 0);
          const pace = e.querySelector(".pace, .rpe");
          if (pace) r.setEndBefore(pace);
          else r.setEnd(e, e.childNodes.length);
          const tops = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
          return tops.size > 1;
        })
        .map((e) => e.textContent),
    );
    expect(wraps, `${width}: no set's figures wrap`).toEqual([]);
  }
});

// Scenario 2. LB-7.10
test("with reduced motion, every piece of art on history, the summary and the exercise page holds frame 1", async ({ browser }) => {
  const { who, workout } = await mia(browser, ["3", "1", "11"]);
  const page = await open(who);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const at of ["/history", `/workouts/${workout}`, "/exercises/1"]) {
    await page.goto(at);
    const m = await motion(page);
    expect(m.length, `${at}: art`).toBeGreaterThan(0);
    for (const a of m) {
      expect({ names: a.names, shown: a.shown }, `${at}, ${a.pose}`).toEqual({ names: ["none", "none"], shown: ["visible", "hidden"] });
    }
  }
  // and without it, the same pages move (so the check above can fail)
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/exercises/1");
  expect((await motion(page))[0].names[0]).not.toBe("none");
});

// Scenario 3. LB-7.13
test("tapping the art beside Back squat on a summary opens Back squat's page; the link is still just its name", async ({ browser }) => {
  const { who, workout } = await mia(browser, ["3", "5"]);
  const page = await open(who);
  await page.goto(`/workouts/${workout}`);
  const link = page.locator('.log th.lift a[href="/exercises/5"]');
  await expect(link).toHaveAccessibleName("Back squat");
  const box = await link.boundingBox();
  expect(box!.height, "the tap target, name and art, at least 44 px").toBeGreaterThanOrEqual(44);
  await link.locator(".ex-art").click();
  await expect(page).toHaveURL(/\/exercises\/5$/);
  await expect(page.locator("h1")).toHaveText("Back squat");
});
