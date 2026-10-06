# ADR 0001: Astro on Node, SQLite on the volume, server-rendered forms

Status: accepted, 6 Oct 2026 (Crit 8). Draft by the agent; edit before citing.

## Context

Spotter has to fit the course's fixed setup (`fly.toml`, `Dockerfile`,
`spec/README.md`): one `shared-cpu-1x` machine with 256 MB, one volume at
`/data` as the only durable storage, no database server, a machine that stops
when idle, and `/readme/` serving `README.md` in the HTML the server sends.
Week 9 needs accounts, rooms with passcodes, set logging and history; week 10
adds a live gym that has to push state changes to every open screen within a
second.

## Options

| Layer | Options weighed |
| --- | --- |
| Framework | Astro (server mode, `@astrojs/node`) · Hono · plain `node:http` |
| Database | `better-sqlite3` + Drizzle · `node:sqlite` |
| Pages | Server-rendered forms · a single-page app |
| Real-time (week 10) | Server-sent events · WebSockets · polling |

## Decision

- **Astro in server mode on Node 24.** Deployed to Fly once already in Crit 7,
  so the deploy path is known. Pages, layouts and escaping come built in, and
  `/readme/` is one page that renders the Markdown on the server. Hono is
  lighter and more direct for the streaming routes week 10 needs, but it is new
  to me and the week-9 cutoff is a day away.
- **SQLite in `/data/spotter.db` via `better-sqlite3` and Drizzle.** The volume
  is the only storage there is. Drizzle's migrations run at startup, so a fresh
  volume (or CI's throwaway `/data`) builds itself. `node:sqlite` would avoid a
  native module, but it is not yet marked stable in Node 24.
- **Plain HTML forms with a redirect after each POST.** They work without
  JavaScript, and `spec/` can drive them with `fetch` exactly as a browser does.
- **Server-sent events for week 10** (to confirm then). The gym's traffic is
  low-rate and one-to-many, and `EventSource` reconnects by itself after the
  machine stops and starts.

## Consequences

- `better-sqlite3` is a native module, so the Docker build stage carries build
  tools in case no prebuilt binding matches.
- Astro's origin check refuses cross-site POSTs, so the spec's test browser
  sends an `Origin` header like a real one.
- Only open event streams will live in memory; every state the gym shows must
  be derivable from SQLite after a cold start.
- If the real-time routes fight Astro, the fallback is to move them (or the
  whole server) to Hono, with a new ADR saying why.
