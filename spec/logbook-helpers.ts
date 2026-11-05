import { JSDOM } from "jsdom";
import { expect, type TestContext } from "vitest";
import { Browser, createRoom, freshEmail, plainText, signUp, watchRoom, type RoomEvent } from "./helpers.ts";

// Shared by spec/logbook.test.ts and spec/logbook-plans.test.ts, which check
// docs/product/criteria/logbook.md against the contract at the top of
// spec/logbook.test.ts. Everything here reads the HTML hooks that contract
// names, never the page's design.

export const EX = {
  run: "1",
  bench: "3",
  incline: "4",
  squat: "5",
  ohp: "6",
  curl: "7",
  lateral: "8",
  pullUp: "11",
  plank: "16",
} as const;

export const DAY = 24 * 60 * 60 * 1000;
export const HOUR = 60 * 60 * 1000;

// ---------- people and rooms ----------

export type Person = { b: Browser; email: string; name: string };

export async function person(name = "Mia"): Promise<Person> {
  const b = new Browser();
  const { email } = await signUp(b, freshEmail(), "correct horse", name);
  return { b, email, name };
}

// Mia's room, with Tom in it too
export async function gym() {
  const Mia = await person("Mia");
  const Tom = await person("Tom");
  const { path, passcode } = await createRoom(Mia.b);
  await Tom.b.post("/join", { passcode });
  return { path, passcode, Mia, Tom };
}

// one person alone in a room of her own
export async function solo(name = "Mia"): Promise<{ b: Browser; path: string }> {
  const { b } = await person(name);
  return { b, path: (await createRoom(b)).path };
}

// leave this room (closing it if she was the last) and open a new one
export async function newRoom(b: Browser, oldPath: string): Promise<string> {
  await b.post(oldPath, { action: "leave" });
  return (await createRoom(b)).path;
}

// ---------- reading pages ----------

export const parse = (html: string): Document => new JSDOM(html).window.document;
export const page = async (b: Browser, path: string): Promise<Document> => parse(await (await b.get(path)).text());
export const textOf = (el: Element | null | undefined): string => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
export const textOfDoc = (d: Document): string => plainText(d.body.innerHTML);

export type SetMark = { text: string; type: string | null; records: string[]; match: boolean };
export const setMark = (el: Element): SetMark => ({
  text: textOf(el),
  type: el.getAttribute("data-type"),
  records: (el.getAttribute("data-records") ?? "").split(/\s+/).filter(Boolean).sort(),
  match: el.hasAttribute("data-match"),
});
export const setsIn = (root: ParentNode | null | undefined): SetMark[] =>
  root ? [...root.querySelectorAll("[data-set]")].map(setMark) : [];

// the room sheet's Last time list
export const lastTime = (d: Document): SetMark[] => setsIn(d.querySelector("[data-last]"));
// the sets of the open workout on the room page (This workout): every set on
// the page that is neither in Last time nor the "Set logged" stamp
export const workoutSets = (d: Document): SetMark[] =>
  [...d.querySelectorAll("[data-set]")].filter((e) => !e.closest("[data-last]") && !e.closest(".stamp")).map(setMark);
// the set on the "Set logged" stamp
export const stampSet = (d: Document): SetMark | null => {
  const el = d.querySelector(".stamp [data-set], .stamp[data-set]");
  return el ? setMark(el) : null;
};

// the set form's type and RPE as the page leaves them (radio buttons or a select)
export function formType(d: Document): string | null {
  const checked = d.querySelector<HTMLInputElement>('input[name="set_type"]:checked');
  if (checked) return checked.value;
  const select = d.querySelector<HTMLSelectElement>('select[name="set_type"]');
  return select ? select.value : null;
}
export const formRpe = (d: Document): string | null =>
  d.querySelector<HTMLInputElement | HTMLSelectElement>('[name="rpe"]')?.value ?? null;
export const formValue = (d: Document, name: string): string | null =>
  d.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? null;

// the fields of the form holding a hidden action=<action>
export function formFields(d: Document, action: string): Record<string, string> | null {
  const form = d.querySelector(`input[name="action"][value="${action}"]`)?.closest("form");
  if (!form) return null;
  return fieldsOf(form);
}
// a form's fields as it submits them; the button pressed (if it has a name)
// wins over a field of the same name, as the one value the server reads
export function fieldsOf(form: Element, submitter?: Element | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const el of form.querySelectorAll<HTMLInputElement>("input[name], select[name], textarea[name]")) {
    if ((el.type === "radio" || el.type === "checkbox") && !el.checked) continue;
    out[el.name] = el.value;
  }
  const button = submitter as HTMLButtonElement | null | undefined;
  if (button?.name) out[button.name] = button.value;
  return out;
}

// the loaded plan on the room sheet
export type PlanItem = { exercise: string; done: number; planned: number; next: boolean; text: string };
export function planItems(d: Document): PlanItem[] {
  return [...d.querySelectorAll("[data-plan] [data-plan-item]")].map((el) => {
    const text = textOf(el);
    const m = text.match(/(\d+) of (\d+)/);
    return {
      exercise: el.getAttribute("data-exercise") ?? "",
      done: m ? Number(m[1]) : NaN,
      planned: m ? Number(m[2]) : NaN,
      next: el.hasAttribute("data-next") || !!el.querySelector("[data-next]"),
      text,
    };
  });
}
export const counts = (d: Document): Record<string, string> =>
  Object.fromEntries(planItems(d).map((i) => [i.exercise, `${i.done}/${i.planned}`]));
export const upNext = (d: Document): string | null => planItems(d).find((i) => i.next)?.exercise ?? null;

// ---------- doing things ----------

// The sheet is read at the address the server last redirected to (contract,
// settled 2: after Done, /rooms/<id>?exercise=3&rested=1); a bare GET of the
// room shows no exercise. So each person's last room redirect is kept, and
// sheet() reads the room there, as her browser would.
const where = new WeakMap<Browser, string>();
export async function act(b: Browser, path: string, fields: Record<string, string>): Promise<Response> {
  const res = await b.post(path, fields);
  const to = res.headers.get("location");
  if (to && (to === path || to.startsWith(`${path}?`))) where.set(b, to);
  else if (to) where.delete(b);
  return res;
}
export const sheet = (b: Browser, path: string): Promise<Document> => {
  const at = where.get(b);
  return page(b, at && (at === path || at.startsWith(`${path}?`)) ? at : path);
};

// Done: logs a set of exercise ex and answers the page it lands on
export async function done(b: Browser, path: string, ex: string, fields: Record<string, string> = {}) {
  const base: Record<string, string> =
    ex === EX.run ? { distance_km: "5", minutes: "25", seconds: "0" }
    : ex === EX.plank ? { minutes: "1", seconds: "0" }
    : ex === EX.pullUp ? { reps: "8", weight_kg: "" }
    : { weight_kg: "40", reps: "8" };
  const res = await act(b, path, { exercise_id: ex, ...base, ...fields });
  expect(res.status, `Done on exercise ${ex} ${JSON.stringify(fields)}`).toBe(303);
  return parse(await (await b.follow(res)).text());
}

// Start set, which answers 200 with the Lifting page itself (contract, settled 1)
export async function start(b: Browser, path: string, fields: Record<string, string>): Promise<{ status: number; d: Document }> {
  const res = await act(b, path, { action: "start", ...fields });
  expect(res.status, "Start set answers the Lifting page").toBe(200);
  return { status: res.status, d: parse(await res.text()) };
}

// the ids of the sets the room page offers to edit
export const editIds = async (b: Browser, path: string): Promise<Set<string>> =>
  new Set([...(await (await b.get(path)).text()).matchAll(/[?&]edit=(\d+)/g)].map((m) => m[1]));

// Done, answering the new set's id
export async function doneId(b: Browser, path: string, ex: string, fields: Record<string, string> = {}): Promise<string> {
  const before = await editIds(b, path);
  await done(b, path, ex, fields);
  const added = [...(await editIds(b, path))].filter((id) => !before.has(id));
  expect(added, "one new set to edit").toHaveLength(1);
  return added[0];
}

export async function finish(b: Browser, path: string): Promise<string> {
  const res = await act(b, path, { action: "finish" });
  expect(res.status).toBe(303);
  return res.headers.get("location")!.match(/^\/workouts\/(\d+)/)![1];
}

// the id of her open workout in this room, from the sheet's data-workout
// (contract, settled 3)
export async function openWorkoutId(b: Browser, path: string): Promise<string> {
  const id = (await sheet(b, path)).querySelector("[data-workout]")?.getAttribute("data-workout");
  expect(id, "the sheet's data-workout").toMatch(/^\d+$/);
  return id!;
}

export const choose = (b: Browser, path: string, ex: string) => act(b, path, { action: "choose", exercise: ex });

// ---------- plans ----------

export async function planIds(b: Browser): Promise<string[]> {
  const d = await page(b, "/plans");
  return [...new Set([...d.querySelectorAll<HTMLInputElement>('input[name="plan_id"]')].map((i) => i.value))];
}

// logs these sets (each [exercise, working sets]), finishes, saves it as a plan
export async function planFrom(b: Browser, path: string, sets: [string, number][], name = "") {
  for (const [ex, n] of sets) for (let i = 0; i < n; i++) await done(b, path, ex);
  const workout = await finish(b, path);
  const before = await planIds(b);
  const res = await b.post(`/workouts/${workout}`, { action: "save-plan", name });
  expect(res.status, "save as plan").toBe(303);
  const added = (await planIds(b)).filter((id) => !before.includes(id));
  expect(added, "one new plan").toHaveLength(1);
  return { workout, plan: added[0] };
}

// ---------- the room as others see it ----------

export const member = (e: RoomEvent, name: string) => e.members.find((m) => m.name === name);

// the room as it is now, from a fresh stream's first event
export async function roomNow(b: Browser, path: string): Promise<RoomEvent> {
  const w = await watchRoom(b, path);
  try {
    return await w.next("room", () => true, 2000);
  } finally {
    w.close();
  }
}

// Tom watches the room while Mia does `quiet`; then Tom chooses an exercise,
// and the first event after Mia's actions must be Tom's own. Anything Mia's
// actions sent would arrive before it.
// A sentinel choose first lets anything the stream's opening sends arrive
// before the quiet actions start.
export async function nothingSent(ctx: TestContext, watcher: Browser, watcherName: string, path: string, quiet: () => Promise<void>) {
  const w = await watchRoom(watcher, path);
  ctx.onTestFinished(() => w.close());
  await choose(watcher, path, EX.curl);
  await w.next("room", (e) => member(e, watcherName)?.exercise === "Dumbbell curl", 2000);
  const others = () => w.all("interaction").length + w.all("say").length + w.all("emote").length;
  const before = others();
  await quiet();
  await choose(watcher, path, EX.lateral);
  const first = await w.next("room", () => true, 2000);
  expect(member(first, watcherName)?.exercise, "the first event after the quiet actions is the watcher's own choose").toBe("Lateral raise");
  expect(others(), "no other events").toBe(before);
}

// ---------- calendar (the app runs in Australia/Sydney) ----------

const SYD = "Australia/Sydney";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function sydParts(t: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SYD,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(new Date(t));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    year: +get("year"),
    month: +get("month"),
    day: +get("day"),
    hour: +get("hour"),
    minute: +get("minute"),
    second: +get("second"),
    weekday: get("weekday"),
  };
}
// Sydney's offset from UTC at t, in ms
const offsetAt = (t: number) => {
  const p = sydParts(t);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
};
// Monday 00:00 in Sydney of the week holding t
export function weekStart(t: number): number {
  const p = sydParts(t);
  const local = Date.UTC(p.year, p.month - 1, p.day - WEEKDAYS.indexOf(p.weekday));
  return local - offsetAt(local - offsetAt(local));
}
// Monday 00:00 of the week n weeks before this one
export function weekStartAgo(n: number, now = Date.now()): number {
  let start = weekStart(now);
  for (let i = 0; i < n; i++) start = weekStart(start - 3.5 * DAY);
  return start;
}
// a moment in the middle of the week n weeks ago (Thursday, around noon)
export const midWeekAgo = (n: number) => weekStartAgo(n) + 3.5 * DAY;

// a day as history writes it when it isn't Today or Yesterday: "Tue 27 Oct"
export function dayPattern(t: number): RegExp {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: SYD, weekday: "short", day: "numeric", month: "short" }).formatToParts(new Date(t));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return new RegExp(`${get("weekday")},? ${get("day")} ${get("month")}`);
}
