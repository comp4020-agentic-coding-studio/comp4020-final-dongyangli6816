import { describe, expect, it } from "vitest";
import { Browser, freshEmail, signUp } from "./helpers.ts";

// ADR 0006: who can see and change what, decided on the server. Checked the
// way someone poking at the app from outside its pages would.

describe("after signing in, you stay on this site", () => {
  const offSite = ["//evil.example", "/\\evil.example", "https://evil.example"];

  it("ignores a next that points at another host, on sign-in", async () => {
    const { email, password } = await signUp(new Browser());
    for (const next of offSite) {
      const res = await new Browser().post(`/signin?next=${encodeURIComponent(next)}`, { email, password });
      expect(res.headers.get("location")).toBe("/");
    }
  });

  it("ignores it on sign-up, and still follows a path on this site", async () => {
    for (const next of offSite) {
      const res = await new Browser().post(`/signup?next=${encodeURIComponent(next)}`, {
        email: freshEmail(),
        password: "correct horse",
        display_name: "Tester",
      });
      expect(res.headers.get("location")).toBe("/avatar?new=1&next=/");
    }
    const res = await new Browser().post("/signup?next=/history", {
      email: freshEmail(),
      password: "correct horse",
      display_name: "Tester",
    });
    expect(res.headers.get("location")).toBe("/history");
  });

  it("ignores it when saving a look, and never links to it", async () => {
    const b = new Browser();
    await signUp(b);
    const page = await (await b.get("/avatar?new=1&next=//evil.example")).text();
    expect(page).not.toContain("evil.example");
  });
});
