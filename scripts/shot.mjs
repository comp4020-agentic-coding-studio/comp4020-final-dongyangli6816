#!/usr/bin/env node
// Screenshots a page at phone and desktop width with headless Chrome, so an
// agent can look at what it built instead of trusting the markup.
//
//   node scripts/shot.mjs <url-or-html-file> <out-prefix> [--cookies <jar>] [--run <js>]
//
// writes <out-prefix>-mobile.png (390 wide) and <out-prefix>-desktop.png
// (1280), each the whole page. Working shots go under .shots/ (gitignored).
//
//   --cookies  a curl cookie jar (curl -c jar ...) whose sid signs the page in
//   --run      JavaScript to run after load, e.g. to fill and submit a form
//
// It drives Chrome over the DevTools protocol rather than with --window-size,
// because headless Chrome won't lay a window out narrower than 500 px. It
// exits 1 if either pixel font failed to load, since a fallback font changes
// every line's height and the shot would be wrong.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const jar = flag("--cookies");
const js = flag("--run");
const [target, out] = args;
if (!target || !out) {
  console.error("usage: node scripts/shot.mjs <url-or-html-file> <out-prefix> [--cookies <jar>] [--run <js>]");
  process.exit(2);
}
const url = /^(https?|file):\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(`${tmpdir()}/shot-`);
const proc = spawn(
  chrome,
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let page;
for (let i = 0; i < 50 && !page; i++) {
  try {
    page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {}
  if (!page) await sleep(200);
}
if (!page) {
  console.error(`couldn't start Chrome at ${chrome} (set CHROME to its path)`);
  proc.kill();
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  pending.get(m.id)?.(m.result);
  pending.delete(m.id);
});
const send = (method, params = {}) =>
  new Promise((r) => {
    pending.set(++id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
if (jar) {
  const line = readFileSync(jar, "utf8").split("\n").find((l) => l.split("\t")[5] === "sid");
  if (!line) console.error(`no sid cookie in ${jar}; the page will be signed out`);
  else await send("Network.setCookie", { name: "sid", value: line.trim().split("\t")[6], url: new URL(url).origin, path: "/" });
}

mkdirSync(dirname(out), { recursive: true });
for (const [name, width] of [["mobile", 390], ["desktop", 1280]]) {
  const viewport = (height) =>
    send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: name === "mobile" });
  await viewport(800);
  await send("Page.navigate", { url });
  await sleep(1500);
  if (js) {
    await evaluate(js);
    await sleep(1500);
  }
  // Astro's dev toolbar isn't part of the page
  await evaluate("document.querySelectorAll('astro-dev-toolbar').forEach((e) => e.remove()); document.fonts.ready.then(() => 0)");
  const fonts = await evaluate("[...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).join('|')");
  if (!/VT323/.test(fonts) || !/Press Start 2P/.test(fonts)) {
    console.error(`pixel fonts missing in ${out}-${name}.png (loaded: ${fonts || "none"})`);
    process.exitCode = 1;
  }
  // grow the viewport to the whole page, so sticky and pinned parts sit where
  // they do at the end of a scroll
  let height = 800;
  for (let i = 0; i < 3; i++) {
    const h = Math.max(800, Math.ceil((await send("Page.getLayoutMetrics")).cssContentSize.height));
    if (h === height && i > 0) break;
    height = h;
    await viewport(height);
    await sleep(300);
  }
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  writeFileSync(`${out}-${name}.png`, Buffer.from(shot.data, "base64"));
  console.log(`${out}-${name}.png`);
}
ws.close();
proc.kill();
await sleep(200);
rmSync(profile, { recursive: true, force: true });
