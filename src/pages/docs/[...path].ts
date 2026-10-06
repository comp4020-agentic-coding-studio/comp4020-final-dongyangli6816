import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

// Images README.md links relatively (docs/before.png) so they render on GitHub
// and at /readme/ alike. Images only, and only from inside docs/.
const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};
const root = resolve("docs");

export const GET: APIRoute = async ({ params }) => {
  const file = resolve(root, params.path ?? "");
  const type = TYPES[extname(file).toLowerCase()];
  if (!type || !file.startsWith(root + sep)) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(file), { headers: { "content-type": type } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
