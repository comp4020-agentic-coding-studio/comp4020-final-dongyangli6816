# ADR 0001: Astro on Node, SQLite on the volume, server-rendered forms

Status: Revised.

## Context

Spotter has to run inside the setup the course fixes for us (`fly.toml`,
`Dockerfile`, `spec/README.md`): one `shared-cpu-1x` machine with 256 MB of
memory, one volume mounted at `/data` as the only durable storage, no database
server, a machine that stops when nobody is using it, and `/readme/` serving
`README.md` in the HTML the server sends.

Two things decide the stack. First, the app needs accounts, rooms with
passcodes, set logging and history, so it needs real storage and real sessions,
not a static site. Second, the live gym has to push state changes to every open
screen within a second, so whatever I pick now has to leave room for streaming
later. 256 MB and a machine that sleeps also rule out anything that expects a
database process or a warm cache next to it.

## Options

| Layer | Options weighed |
| --- | --- |
| Framework | Astro (server mode, `@astrojs/node`) · Hono · plain `node:http` |
| Database | `better-sqlite3` + Drizzle · `node:sqlite` |
| Pages | Server-rendered forms · a single-page app |
| Real-time | Server-sent events · WebSockets · polling |

## Decision

**Astro in server mode on Node 24.** Routing, layouts and auto-escaped
templates come with it, and escaping is where I would most likely introduce a
bug if I wrote it myself. `/readme/` is one page that renders the Markdown on
the server, which is exactly what the spec asks for. Astro's API routes can
return a raw `Response`, so streaming is still open to me later. Hono is
lighter and would be more direct for streaming, but it leaves templating and
escaping to me, and I would be learning it at the same time as building on it.

**SQLite at `/data/spotter.db`, through `better-sqlite3` and Drizzle.** The
volume is the only storage there is. `better-sqlite3` is synchronous, which
suits one machine handling one request at a time, and it needs no connection
pool and no background process eating into the 256 MB. Drizzle gives me typed
queries and runs its migrations at startup, so a fresh volume, or CI's
throwaway `/data`, builds itself instead of needing a manual step.
`node:sqlite` would avoid a native module, but it is not marked stable in
Node 24 and I don't want its API moving under me.

**Plain HTML forms, with a redirect after every POST.** They work with no
JavaScript, which matters on a phone in a gym with bad reception. The redirect
means a refresh never resubmits a set. And `spec/` can drive these routes with
`fetch` exactly the way a browser does, so the tests exercise the real thing
rather than a separate API.

**Server-sent events for the live gym** (to confirm when I build it). The
traffic is one-to-many, low-rate and text only, which is all SSE does.
`EventSource` reconnects on its own and resends `Last-Event-ID`, so a machine
that stops and starts recovers without any code from me. WebSockets are
two-way, which I don't need, and would want their own keepalive. Polling every
second would keep waking a machine that is supposed to sleep.

## Consequences

- `better-sqlite3` is a native module, so the Docker build stage carries build
  tools in case no prebuilt binding matches the image.
- Astro's origin check refuses cross-site POSTs, so the spec's test browser has
  to send an `Origin` header like a real one does.
- Only the open event streams live in memory. Every state the gym shows has to
  be rebuildable from SQLite, because a cold start wipes the rest.
- One volume means one machine. Fanning out in memory is fine here, but it is
  the thing that breaks first if Spotter ever runs on two.
- If streaming turns out to fight Astro, the fallback is to move those routes,
  or the whole server, to Hono, with a new ADR saying why.