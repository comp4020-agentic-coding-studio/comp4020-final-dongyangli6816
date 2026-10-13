import { afterEach, describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents, signUp } from "./helpers.ts";

// BOT-1 to BOT-5: Dony's poster. Anyone in the room taps it to call him out
// and taps it again to send him back, at any moment; after a send back it
// rests 30 s before he can be called out again; a tap only acts if the
// poster is still as its tapper saw it. While he's out
// he's in the room's view but never among its members.
type DonyEvent = {
  members: { id: number; name: string }[];
  dony: { out: boolean; restingUntil: number; fresh: boolean; member: { name: string; state: string } | null };
};

const REST_MS = 30_000;
const streams: { close: () => void }[] = [];
afterEach(() => streams.splice(0).forEach((s) => s.close()));

async function room() {
  const host = new Browser();
  await signUp(host, freshEmail(), "correct horse", "Mia");
  const { path, passcode } = await createRoom(host);
  const friend = new Browser();
  await signUp(friend, freshEmail(), "correct horse", "Tom");
  await friend.post("/join", { passcode });
  const screen = await openEvents(host, path);
  streams.push(screen);
  const first = (await screen.next()) as unknown as DonyEvent;
  const until = (test: (e: DonyEvent) => boolean, ms?: number) =>
    screen.until((e) => test(e as unknown as DonyEvent), ms) as unknown as Promise<DonyEvent>;
  return { host, friend, path, first, until };
}

// as the page's script posts it: 204, and the room's stream says what happened
const tap = (b: Browser, path: string, intent: string) =>
  b.request(path, {
    method: "POST",
    body: new URLSearchParams({ action: "dony", intent }),
    headers: { "x-spotter": "poster" },
  });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Dony's poster", () => {
  it("starts full, and the page draws it as a button", async () => {
    const { host, path, first } = await room();
    expect(first.dony.out).toBe(false);
    expect(first.dony.member).toBeNull();
    const html = await (await host.get(path)).text();
    expect(html).toMatch(/class="poster[^"]*"[^>]*aria-label="Call Dony out of his poster"/);
    expect(html).toContain('form="dony"');
    // never summoned: the bulbs are lit
    expect(first.dony.fresh).toBe(true);
    expect(html).toContain('class="bulbs"');
  });

  it("calls him out for everyone, without counting him as a member", async () => {
    const { host, friend, path, until } = await room();
    const res = await tap(friend, path, "summon");
    expect(res.status).toBe(204);
    const e = await until((e) => e.dony.out);
    expect(e.dony.member?.name).toBe("Dony");
    expect(["idle", "lifting", "resting", "slacking"]).toContain(e.dony.member?.state);
    expect(e.members.map((m) => m.name)).toEqual(["Mia", "Tom"]);
    expect(e.dony.fresh).toBe(false);

    // the page after a reload: him in the list and on the map, the poster
    // empty and ready to send him back, and still two of twelve in
    const html = await (await host.get(path)).text();
    expect(html).toMatch(/class="avatar[^"]*"[^>]*aria-label="Dony, idle, no station yet"/);
    expect(html).toMatch(/aria-label="Send Dony back to his poster"/);
    expect(html).toContain("2 of 12 in");
  });

  it("ignores a stale tap, and a summon while the poster rests", async () => {
    const { friend, host, path, until } = await room();
    await tap(host, path, "summon");
    await until((e) => e.dony.out);
    // Tom saw a full poster too, a moment late: his summon does nothing
    expect((await tap(friend, path, "summon")).status).toBe(204);
    await expect(until((e) => !e.dony.out, 800)).rejects.toThrow();
    // but sending him back works straight away
    await tap(friend, path, "send-back");
    const back = await until((e) => !e.dony.out);
    expect(back.dony.restingUntil - Date.now()).toBeGreaterThan(REST_MS - 5000);
    // and calling him out again waits out the rest
    expect((await tap(host, path, "summon")).status).toBe(204);
    await expect(until((e) => e.dony.out, 1500)).rejects.toThrow();
  });

  it("answers a form post without a script by coming back to the room", async () => {
    const { host, path } = await room();
    const res = await host.post(path, { action: "dony", intent: "summon" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(path);
  });

  it.concurrent(
    "can be sent back by someone other than who called him, then called again",
    async () => {
      const { host, friend, path, until } = await room();
      await tap(host, path, "summon");
      await until((e) => e.dony.out);
      await tap(friend, path, "send-back");
      const back = await until((e) => !e.dony.out);
      expect(back.dony.member).toBeNull();
      expect(back.members.map((m) => m.name)).toEqual(["Mia", "Tom"]);
      await wait(REST_MS + 500);
      await tap(friend, path, "summon");
      const again = await until((e) => e.dony.out);
      expect(again.dony.member?.name).toBe("Dony");
    },
    60_000,
  );
});
