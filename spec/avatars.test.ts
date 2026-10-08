import { describe, expect, it } from "vitest";
import { Browser, createRoom, freshEmail, openEvents } from "./helpers.ts";

// AV-1, AV-3: each account has a look of four choices, stored as JSON, which
// a new account gets at random and can edit straight away.

const FIELDS = ["skin", "hair", "hair_colour", "shirt"] as const;

// the editor's checked radio in each group: the look it's showing
async function editorLook(b: Browser): Promise<Record<string, string>> {
  const html = await (await b.get("/avatar")).text();
  return Object.fromEntries(
    FIELDS.map((f) => [f, html.match(new RegExp(`name="${f}" value="([\\w-]+)" checked`))?.[1] ?? ""]),
  );
}

async function newAccount() {
  const b = new Browser();
  const res = await b.post("/signup", { email: freshEmail(), password: "correct horse", display_name: "Looker" });
  return { b, res };
}

describe("avatars", () => {
  it("give a new account a random look and open the editor straight away", async () => {
    const { b, res } = await newAccount();
    expect(res.headers.get("location")).toBe("/avatar?new=1&next=/");
    const page = await b.follow(res);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("We rolled you a random look");
    for (const value of Object.values(await editorLook(b))) expect(value).not.toBe("");
  });

  it("save a look, and show it to the room", async () => {
    const { b } = await newAccount();
    const saved = await b.post("/avatar", { skin: "6", hair: "curls", hair_colour: "blue", shirt: "grey" });
    expect(saved.headers.get("location")).toBe("/avatar?saved=1");
    expect(await editorLook(b)).toEqual({ skin: "6", hair: "curls", hair_colour: "blue", shirt: "grey" });

    const { path } = await createRoom(b);
    const stream = await openEvents(b, path);
    const e = await stream.next();
    stream.close();
    expect(e.members[0].look).toEqual({ skin: "6", hair: "curls", hairColour: "blue", shirt: "grey" });
  });

  it("refuse a choice that isn't in the palette, and keep the saved look", async () => {
    const { b } = await newAccount();
    const before = await editorLook(b);
    const res = await b.post("/avatar", { skin: "7", hair: "mohawk", hair_colour: "blue", shirt: "grey" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Couldn't save your avatar");
    expect(await editorLook(b)).toEqual(before);
  });

  it("show a roll without saving it", async () => {
    const { b } = await newAccount();
    const before = await editorLook(b);
    const res = await b.post("/avatar", { intent: "randomise" });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Not saved yet.");
    expect(await editorLook(b)).toEqual(before);
  });

  it("send someone signed out to sign in first", async () => {
    const res = await new Browser().get("/avatar");
    expect(res.headers.get("location")).toBe("/signin?next=/avatar");
  });
});
