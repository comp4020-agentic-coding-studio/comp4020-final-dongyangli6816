#!/usr/bin/env node
// PreToolUse hook on Edit|Write (registered in .claude/settings.json). When
// the agent is about to edit a page file and that page has no design newer
// than the file's last commit, it reminds the agent of the "Designing pages"
// rule in CLAUDE.md. It never blocks: the edit goes ahead either way.
//
// "Fresh" means the page's docs/design/<page>/mockup.html was modified after
// the page file was last committed, i.e. a designer has drawn it since. For
// the shared shell (Layout.astro, src/components/) any fresh mockup counts.
// Each reminder is logged to .shots/design-gate.log, so how often it fires
// can be counted later.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

// src/pages/<file> -> docs/design/<page>/
const PAGES = { index: "home", "rooms/[id]": "room" };

function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const file = input.tool_input?.file_path;
  if (!file) return;
  const rel = relative(root, file);

  let pages;
  const page = rel.match(/^src\/pages\/(.+)\.astro$/);
  if (page) pages = [PAGES[page[1]] ?? page[1]];
  else if (rel === "src/layouts/Layout.astro" || rel.startsWith("src/components/")) pages = designedPages();
  else return;

  const committed = lastCommit(rel);
  const fresh = pages.some((p) => {
    const mockup = join(root, "docs/design", p, "mockup.html");
    return existsSync(mockup) && statSync(mockup).mtimeMs / 1000 > committed;
  });
  if (fresh) return;

  const which = page ? `the ${pages[0]} page` : "the shared page shell";
  log(`${new Date().toISOString()} remind ${rel}`);
  console.log(
    JSON.stringify({
      systemMessage: `design-gate: ${rel} edited with no fresh design`,
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        additionalContext:
          `design-gate: you are editing ${which} (${rel}), and no design for it is newer than its last commit. ` +
          `Check this against "Designing pages" in CLAUDE.md: if the change adds, removes or moves anything on a ` +
          `page, changes its layout or adds a state, stop and send it to the designer for that page's group first. ` +
          `A server-side change, a fix that doesn't change how the page looks, a typo, or bringing the page back in ` +
          `line with its mockup can go ahead. Say which it is.`,
      },
    }),
  );
}

// seconds since the epoch; 0 for a file that has never been committed
function lastCommit(rel) {
  try {
    return Number(execFileSync("git", ["log", "-1", "--format=%ct", "--", rel], { cwd: root, encoding: "utf8" })) || 0;
  } catch {
    return 0;
  }
}

function designedPages() {
  const dir = join(root, "docs/design");
  return existsSync(dir) ? readdirSync(dir).filter((d) => existsSync(join(dir, d, "mockup.html"))) : [];
}

function log(line) {
  mkdirSync(join(root, ".shots"), { recursive: true });
  appendFileSync(join(root, ".shots/design-gate.log"), `${line}\n`);
}

// a reminder must never break an edit, so any failure stays silent
try {
  main();
} catch {}
