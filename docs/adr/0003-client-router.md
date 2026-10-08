# ADR 0003: Astro's client router over plain page loads

Status: accepted, 8 Oct 2026. Builds on ADR 0001; draft by the agent, edit
before citing.

## Context

ADR 0001 chose server-rendered pages with a plain form post and a redirect
after each action. It works without JavaScript and `spec/` drives it over
HTTP, but every action loads a new page: the screen flashes and scrolls back
to the top. In the gym that meant logging a set threw you to the top of the
page, which the user called out. The room got a small script that posts in
the background and swaps the room in place; the user then asked for the
same on every page, and whether that meant switching to React.

## Options

- **Switch to a single-page app (React).** Every page rewritten, the server
  turned into a JSON API, most of `spec/` rewritten, and `/readme/` would
  still need server rendering, since the course checks the HTML the server
  sends with no script run. Days of work in the week the live gym is due.
- **Hand-written swaps on every page**, like the room's. Works, but each page
  would carry its own copy of the same fetch-and-replace code.
- **Astro's `<ClientRouter />`**, built into the framework already in use.
  One line in the layout makes every same-origin link and form load in the
  background and swap the page; without JavaScript they are plain links and
  forms again.

## Decision

`<ClientRouter fallback="swap" />` in `Layout.astro`, with
`transition:animate="none"` on `<html>`: pages cut rather than fade, which
suits the pixel style and needs no design change.

The router scrolls to the top on every navigation, which is right between
pages but wrong inside the gym. So the room keeps its own in-place swap for
everything that stays in the room (logging, editing, deleting, the rest
buttons, the pencil, the lift chips, Change, Cancel), and cancels the event
so the router leaves it alone. Finish, Leave and End room go to another page,
so the router takes them.

## Consequences

- A page's `<script>` now runs once per visit to the site, not once per
  page, so each one listens for `astro:page-load` and first checks it is on
  its own page.
- Server, forms, redirects and `spec/` are unchanged: the router fetches the
  same URLs a browser would.
- A response that isn't HTML (the plain-text 404s) falls back to a normal
  page load.
- If a later page needs rich client state (the gym map, week 10), it can be
  one island component inside this setup rather than a reason to change
  stack; that would be its own ADR.
