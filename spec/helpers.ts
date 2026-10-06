import { inject } from "vitest";

export const baseUrl = inject("baseUrl");

// One browser: keeps its own cookies across requests, follows nothing on its
// own (so tests see each redirect), and sends the Origin header a real form
// post carries, since the app refuses cross-site POSTs.
export class Browser {
  private cookies = new Map<string, string>();

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    if (init.method === "POST") headers.set("origin", new URL(baseUrl).origin);
    const res = await fetch(new URL(path, baseUrl), { ...init, headers, redirect: "manual" });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const [name, value] = pair.split("=");
      const expired = attrs.some((a) => /expires=Thu, 01 Jan 1970/i.test(a) || /max-age=0/i.test(a.trim()));
      if (expired || value === "") this.cookies.delete(name.trim());
      else this.cookies.set(name.trim(), value);
    }
    return res;
  }

  get = (path: string) => this.request(path);
  post = (path: string, fields: Record<string, string>) =>
    this.request(path, { method: "POST", body: new URLSearchParams(fields) });

  // the page at path, following the redirect a form post answers with
  async follow(res: Response): Promise<Response> {
    const to = res.headers.get("location");
    return to ? this.get(to) : res;
  }
}

// CI starts every run on an empty /data, but a local database keeps earlier
// runs' accounts, so every account a test makes is new.
export const freshEmail = (): string => `t${Date.now()}${Math.random().toString(36).slice(2, 8)}@example.test`;

export async function signUp(b: Browser, email = freshEmail(), password = "correct horse", name = "Tester") {
  const res = await b.post("/signup", { email, password, display_name: name });
  return { res, email, password };
}

export async function createRoom(b: Browser): Promise<{ path: string; passcode: string }> {
  const res = await b.post("/rooms", {});
  const path = res.headers.get("location")!;
  const html = await (await b.get(path)).text();
  const passcode = html.match(/class="passcode"[^>]*>([A-Z0-9]{6})</)![1];
  return { path, passcode };
}
