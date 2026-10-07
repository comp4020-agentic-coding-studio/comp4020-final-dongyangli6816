# `/readme/` design spec

Mockup: `docs/design/readme/mockup.html` (open it directly in a browser).
Screenshots: `shot-mobile.png`, `shot-desktop.png`.

## 1. Plan

**Who and when.** Three kinds of visitor, none of them mid-set:

- a course marker or crit pod member, on a laptop, reading the whole page
  once from top to bottom;
- a friend who's been sent the app, tapping the footer link "What Spotter is
  for" on a phone, skimming before deciding whether to sign up;
- the user at the showcase, scrolling it on the projector while talking.

It's read once and slowly, so this is the one page where long-form reading
comfort matters more than glanceability.

**The one job.** Make the README easy to read and skim: the pitch, then the
four things "good" means, then the reading and the scope. The page doesn't
need a primary action. The only action is a quiet way back into the app
after the last line (**Sign up** when signed out, **Go lift** when signed in).

**Hierarchy.**

1. The title and the one-paragraph pitch (what Spotter is).
2. The four numbered principles under "What good means here". They are the
   page's argument, so their opening phrases (the `**bold**` in the
   Markdown) need to stand out to someone skimming.
3. Section headings, so someone skimming can find "What I chose not to build"
   or "Enforced and judged".

The only numbers are list numbers and, in later READMEs, table figures (kg,
seconds). Those use VT323 and are right-aligned and tabular.

**Reuse.** `.card` holds the article. The global `h1`–`h3`, `p`, `a` and
`table` styles stay underneath. The `.bubble` shape is reused for
blockquotes, the `.badge` look for the section tags, and the `.passcode`
colouring (leaf on ink) for code. The `.button` and `.actions` classes are
used for the way back in. Nothing new becomes a component: every new rule is
typography for marked's output, under `.prose`.

**Template check.** My first pass was "nice prose in a card": a centred
column, green headings and blue-ish links. With other colours that's any blog
or documentation theme. What changed:

- The README *is* Spotter's logbook, so it's styled like one. The title
  sits in a deep-green **cover band** like a label on a logbook. Each `h2`
  gets a small leaf **"Set 1", "Set 2" … "Final set"** tag, so the page
  reads like a session you work through.
- The four principles become **numbered blocks** (a big VT323 number on an
  ink square with a green pixel shadow), drawn like the rep counts in the
  gym, rather than a plain `1.` list.
- Bold text can't be bold in a pixel font, so it becomes a **leaf
  highlighter mark**. That's the app's "Lifting" and badge colour, and it's
  what makes the principles skimmable.
- `code` uses the **passcode colours** (leaf on ink), and quotes become the
  gym's **speech bubble**, since README quotes will be friends' comments
  from the crits. `---` is drawn as **three pixel squares**, like plates on
  a bar.

## 2. Requirements covered

| Requirement (source) | Met by |
| --- | --- |
| "`/readme/` serves `README.md` in full, headings in the server-sent HTML … rendered from Markdown on the server, never by client script" (`docs/spotter-spec-4-weeks.md`, fixed constraints) | No change to the rendering. `marked.parse` runs on the server into `<article class="card prose" set:html>`, and the design is CSS only. The "Set n" tags are CSS `::before` content, so they aren't part of the HTML or of `textContent`, and `spec/invariants.test.ts` still sees each heading once, in order. |
| "`/readme/` README.md rendered in full" (`docs/spotter-spec-4-weeks.md`, Screens) | Every Markdown element marked emits has a style: h1–h3, p, strong, em, a, inline code, pre, ul/ol (nested too), blockquote, hr, img, table with column alignment. The third state in the mockup shows the ones today's README doesn't use. |
| "images under `docs/` served as static files" (same, stack table) | `.prose img`: full width at most, ink border, green pixel shadow. See open question 1 about the URL. |
| `/readme/` is a Paper page (`system.md` §4) | Paper surface, `.card`, checker background. |
| Display text on the 8 px grid; VT323 never below 20 px (`system.md` §6) | h1 24 → 16 on phones, h2 and h3 16, the set tag 8 (a short label), body 22 → 21, lead 26 → 24, code and pre 22 → 21, table cells 24. |
| No bold or italic; "emphasis comes from size, colour or a `--leaf` highlight" (`system.md` §6) | `strong` gets a leaf highlight. `em` gets `font-style: normal` and a quiet `--paper` tint. The lead paragraph is a size up. |
| Numbers right-aligned and tabular in tables (`system.md` §6) | Columns marked `---:` in Markdown come out as `align="right"`; `.prose [align="right"]` makes them right-aligned, tabular and kept on one line. |
| No horizontal scroll at any width (`system.md` §8, §12) | `pre` and `table` scroll inside the card (`overflow-x: auto`; tables are `display: block; max-width: 100%`); images have `max-width`. Checked at a true 390 px: page `scrollWidth` equals the viewport. |
| Square corners, hard shadows, `--px` grid, tokens only (`system.md` §5, §7) | Every new rule uses tokens, `--px` and the 4/8/12/16/24/32 px scale. No radius, no blur. |
| Focus ring on Paper is ink (`system.md` §12, Known gap 1) | Proposed as a layout change below. In the mockup it's applied in the page block. |
| Footer links here ("What Spotter is for", `Layout.astro`) | `aria-current="page"` on the footer link while on `/readme/`, drawn as a leaf square with no underline (layout change). |

## 3. Structure

Top to bottom, as the layout renders it:

1. **`header.topbar`** (unchanged). Signed out: Sign in, Sign up. Signed in:
   History, Sign out.
2. **`main`**:
   1. **`article.card.prose`** containing marked's HTML, unchanged:
      - `h1` (first child): the **cover band**. It cancels the card padding
        with negative margins (`-1.25rem`, or `-1rem` at ≤ 420 px), with a
        `--deep` fill, `--leaf` text, 24 px (16 px on phones) and a `--px`
        ink rule under it.
      - `h1 + p`: the **lead**, VT323 at 26 px (24 on phones), line height 1.3.
      - `h2`: 16 px, `--green`, 2 rem above. `::before` is the **set tag**:
        `"Set " counter(set)` (or `"Final set"` on `h2:last-of-type`), in the
        8 px display font, ink on leaf with a 2 px ink border. It uses the
        `/ ""` alt-text syntax so screen readers skip it, with a plain
        `content` line before it as a fallback for older browsers.
      - `h3`: 16 px ink, with a hanging 8 px `--green` square.
      - `ol > li`: 56 px (48 on phones) left padding. `::before` is a 40 × 40
        ink block with `counter(rep)` in VT323 32 px `--leaf` and a `--px`
        green shadow. `strong` inside it is the leaf highlight.
      - `ul > li`: an 8 px `--green` square bullet. Nested `ul` gets a
        hollow square.
      - `strong`: leaf fill, `--px` padding, `box-decoration-break: clone` so
        it wraps cleanly over lines.
      - `em`: upright, `--paper` tint.
      - `a`: the global link style; on hover, ink on leaf.
      - `code`: leaf on ink at the surrounding size. `pre`: an ink block with
        a `--px` `--green` border, VT323 22 px, scrolling sideways.
      - `blockquote`: the `.bubble` shape (leaf fill, ink border, pixel tail).
      - `hr`: three 8 px ink squares, 24 px apart, centred.
      - `img`: block, `max-width: calc(100% - var(--px))`, an ink border and a
        green `--px` shadow.
      - `table`: the global table, plus `display: block; width: max-content;
        max-width: 100%; overflow-x: auto`.
   2. **`section.readme-end`** (new, outside the card, 2 rem below it). It
      holds one `p` and a `.actions` row:
      - signed out: `That's the whole log. Want a spot in the squad's gym?`,
        with `a.button` **Sign up** → `/signup` and a plain link **Sign in**
        → `/signin`;
      - signed in: `That's the whole log. Your gym's this way.`, with
        `a.button` **Go lift** → `/`.

      Read `Astro.locals.user` the way `Layout.astro` does. `aria-label`:
      "Get started" or "Back to the app".
3. **`footer`**: the link gets `aria-current="page"` on this page (layout
   change).

**Where the CSS goes.** The `<style id="page">` block of the mockup, minus the
`layout change` and `mockup only` sections, goes into `readme.astro` as
`<style is:global>`. Every selector there is already prefixed with `.prose` or
`.readme-end`. It has to be global because `set:html` content doesn't get
Astro's scope attribute. Remove the three old `.prose` rules from the
layout's `/* /readme/ */` section, and the existing scoped `img` rule in
`readme.astro`, because the new block replaces them.

The `.state-label` rules and elements are for the mockup only. Don't build
them.

## 4. States

| State | What changes | Trigger |
| --- | --- | --- |
| **Default, signed out** | Full README; the end section offers Sign up (primary) and Sign in (link). | No session. The page is public. |
| **Signed in** | The top bar shows History and Sign out; the end section offers Go lift → `/` (primary). | `Astro.locals.user` is set. |
| **README v2 content** | Not a runtime state. It shows how the h3, table (with right-aligned kg and seconds columns), quote bubble, rule, code block, nested list and image will look once the README grows in weeks 10 and 11. | Whatever `README.md` contains. |
| Empty | Not applicable. `spec/invariants.test.ts` fails if the README has no headings, so an empty README never ships. | — |
| Error | Not designed. If `README.md` can't be read, the server returns its 500, which is the same for every page. | — |
| Pending, success | Not applicable: there's no form and no client script. | — |
| Narrow and wide | Checked at a true 390 px and at 1280 px. At ≤ 420 px: cover band 16 px with tighter padding, lead 24 px, a narrower indent for the numbered blocks, `pre` 21 px. | Width. |

Note for whoever checks screenshots: headless Chrome won't lay out narrower
than 500 px, so `scripts/shot.sh`'s "mobile" image is a 500 px layout cropped
to 390, and text looks cut off at the right edge. I checked the true 390 px
layout by loading the mockup in a 390 px iframe. That fix belongs in
`shot.sh` (for example, wrapping the target in an iframe), outside this page.

## 5. Departures

None from `system.md`. Two judgement calls the critic may want to look at:

- **`h3` is 16 px, the same size as `h2`.** The scale allows 8 → 16, but 8 px
  is only for short labels and a README `h3` can be a phrase. The levels are
  told apart by colour (green vs ink), by the set tag on `h2`, and by the
  square on `h3`.
- **Body text stays 22 px on laptops**, which gives about 70 characters a
  line inside the card, above the "about 60" in §6. Making it 24 px would
  break the body scale. If the user wants shorter lines, the right fix is a
  `max-width` on `.prose > p, .prose li` (about 36rem), not a bigger font.

## Layout changes

These belong in `Layout.astro`, to be reconciled with the other six designs.
The mockup's global block is the current layout, and the page block applies
these under `/* layout change: … */` comments.

1. **Ink focus ring on Paper** (Known gap 1): `:focus-visible { outline-color:
   var(--ink) }`, keeping `--focus` for `body.night`.
2. **Display sizes on the 8 px grid** (Known gap 3): `h1` 24 px (16 px at
   ≤ 420 px) instead of `clamp(18px, 5vw, 26px)`; `h2` and `h3` 16 px; `th`
   8 px with line height 2. The badge (9 → 8) and button (12 → 8 or 16) sizes
   aren't visible on this page; I leave them to the pages that use them.
3. **Footer marks the current page**: add `aria-current={Astro.url.pathname
   .startsWith("/readme") ? "page" : undefined}` to the footer link, styled
   `footer a[aria-current="page"]` with no underline and an 8 px `--leaf`
   square before it.
4. **Remove the `/* /readme/ */` section** (`.prose h1`, `.prose h2`,
   `.prose li`) from the global block; the page's own block replaces it.
5. Not shown, but touched by this page: the button hover hex (Known gap 2)
   and the `#dbe7c6` / `#eef5e1` hex values (Known gap 5) show up here
   through `.button` and table rows. Tokenise them as the system says.

## Open questions

1. **Relative links in README.md are broken at `/readme/`.** marked
   leaves `href="spec/core-loop.test.ts"` as it is. From `/readme/` that
   resolves to `/readme/spec/core-loop.test.ts`, which is a 404, and a
   future `![…](docs/x.png)` would resolve to `/readme/docs/x.png`, not to
   the `/docs/[...path]` route. That's not a design issue, but the page
   doesn't work fully until it's fixed: for example, a marked `walkTokens`
   hook that turns relative hrefs and srcs into root-relative ones
   (`/docs/…`), with links into `spec/` pointing at the GitHub repo.
2. **The way back in after the card** (`.readme-end`) is the only content
   not taken from README.md. Drop it if the user wants the page to be the
   README and nothing else.
