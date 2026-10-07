# Room (the gym page): design spec

Page: `src/pages/rooms/[id].astro`. Mockup: `docs/design/room/mockup.html`
(the page block is `<style id="page">`; `<style id="mockup">` holds the state
labels only and is not part of the design).

## 1. Plan

**Who and when.** Mostly someone between sets, phone in one sweaty hand, 60 to
180 seconds of rest, glancing. It is usually mid-session with two to five of
the squad in the same room. They also land here right after creating or joining
a room, often alone, with the passcode still to send.

**The one job.** Log the next set: check the pre-filled weight and reps, then
press **Done**. Everything else on the page sits behind that one action.

**Hierarchy.**
1. The set panel: the weight and reps at 48 px VT323, then the lift name and
   set number, then a full-width **Done** in the thumb zone. The two numbers
   must read correctly at arm's length.
2. The logbook (This workout): what you've done this session, with the set
   count and kilograms moved.
3. The room: the passcode (you send it once, then rarely look again) and the
   squad list.

**Reuse.** `.passcode-box`/`.passcode`, `.badge`, `.bubble`, `table`/`.num`,
`.hint`, `.error`, `.actions`, `button`, `.button.secondary`, `.wide`, `label`,
`input`, `select` all carry over unchanged. New pieces: `.panel` (from the
system), the `.sheet` set panel (from the system, minus the live states), and
a few page-only parts: the panel title tab, the room's 12 pips, the people
rows, the ditto marks, the big number pair, and the "Change" picker.

**Template check, and what it changed.** The first draft was three stacked
dark cards with a form, which you could reskin into any app. These changes came
out of it:
- **Panel names sit on the top border**, like a Pokémon or RPG menu box,
  instead of a heading inside a card.
- **The room shows 12 pips, one per station** (ROOM-4, 12 people, 12
  stations), filled for each person in. "4 of 12 in" reads as a gym with spots
  free, not as a member count.
- **The logbook writes repeat lifts as ditto marks (`"`)**, the way people
  write a paper gym log, and sums the session as "5 sets · 2,912.5 kg moved
  so far".
- **The set reads as `140 kg × 5`**, the way lifters write it: weight, a ×,
  then reps, with the weight field wider than the reps field.
- **The lift name is the switch.** Tapping "Deadlift · Set 3 · Change" opens
  the picker, so switching lifts never takes space from the numbers or Done.

## 2. Requirements covered

| Requirement (source) | Element |
| --- | --- |
| "A normal set costs exactly two taps … Done logs the set with pre-filled values straight away" (MVP spec, Key screens) | Pre-filled 48 px number fields and one `.wide` Done at the bottom of `.sheet`. Today the server has no Start set, so Done is the only tap. |
| LOG-3 "Weight and reps pre-fill from the person's last set of that exercise" (4-week spec) | `weight_kg`/`reps` `value` from `lastSet`, unchanged. The "Last time **140 kg × 5**" line repeats it as text. |
| LOG-4 "Tapping Done logs the set and starts a rest timer (default 90 s)" | The `?rested=1` bubble "Set logged! Rest 90 s, then go again." at the top of the sheet (`role="status"`). There is no live timer yet; see Later work. |
| Lifting sheet: "exercise name, set number, last time's numbers, and a large Done" (MVP spec, Gym screen layout) | `.switch summary` (lift name + `.set-no`), `.last`, `.wide` Done at 16 px, 64 px tall. |
| Idle sheet: "Pick exercise, plus chips for recently used exercises" (MVP spec) and "grouped by equipment" (4-week spec, Screens) | The GET form: `<select name="exercise">` with an `<optgroup>` per equipment, plus `.recent` chips that link to `?exercise=<id>` for each lift already in this workout. |
| LOG-2, 16 exercises, two per piece of equipment | The 8 optgroups × 2 options. Option values are unchanged. |
| GYM-15 "a text list of everyone in the room" (4-week spec) | `.people` list in the Squad panel. State and equipment are added when presence exists. |
| ROOM-1/2, the passcode, and the invite hint | `.passcode` in the Room panel (`<h1>`), and a `.hint` with the join URL. |
| ROOM-4, 12 people max | `.pips` (12) with "N of 12 in". |
| LOG-1/LOG-7, this session's sets | The "This workout" table in the log panel, with `.tally`. |
| Finish the workout and go to history | The `action=finish` POST form, `.button.secondary` "Finish workout" at the foot of the log panel. |
| "Tap targets at least 48 px, with primary buttons in the bottom third" (MVP spec, UX rules) | `.sheet` is sticky at the bottom of the screen below 900 px. Done is 64 px tall, the fields 72 px, the chips and summary at least 44 to 48 px. |
| "Timers and weights readable at arm's length (at least 32 px numerals)" | Weight and reps at 48 px VT323, tabular. |
| "Taps only" | `<details>` opens with a tap. No gestures. |
| Night surface for the gym (system 4) | `body.night` plus the Night tokens (see Layout changes). |
| Copy bank "Just you so far. Send the passcode to the squad 📲" (system 3) | `.alone` under the people list when `members.length === 1`. |

## 3. Structure

Everything sits inside one `<div class="gym">` in `main`. Source order matters:
the sheet comes last so that `position: sticky; bottom: 0` pins it on phones.
At 900 px and up, `.gym` becomes a grid (`1fr 24rem`): the first three panels
stack on the left, and `.sheet` spans the right column, sticky at `top: 2rem`.

1. **Room panel**: `section.panel.sign`
   - `h1.panel-title` "Room"
   - `.passcode-box` holding `span.passcode` (keep **exactly** `class="passcode"`
     with the code as its only text; `spec/helpers.ts` scrapes it with
     `/class="passcode"[^>]*>([A-Z0-9]{6})</`), then `p.spots`:
     `span.pips[aria-hidden]` with 12 `<i>`, the first `members.length`
     getting `class="in"`, followed by `<span>{n} of 12 in</span>`.
   - `p.hint`: "Send the code to the squad. They join at {inviteUrl}." Keep
     `inviteUrl` (displaying it without `https://` is fine).
2. **Squad panel**: `section.panel`
   - `h2.panel-title` "Squad"
   - `ul.people`, one `li` per member. Your own row is `li.me` with
     `<span class="badge">You</span>`. Names must stay in the HTML (a spec test
     checks the friend sees "Tester"). The current query selects names only,
     so marking `.me` needs `users.id` added to the select. That is a read of
     existing data, not a new feature.
   - When `members.length === 1`: `p.alone` with the copy bank line.
3. **Log panel**: `section.panel`, only when `mySets.length > 0` (as today)
   - `h2.panel-title` "This workout"
   - `p.tally`: `<b>{sets}</b> sets · <b>{volume} kg</b> moved so far`, where
     volume = Σ weight × reps, formatted `toLocaleString("en-AU")`.
   - `table` with the `Exercise | kg | Reps` columns and `.num` as today. When a
     row's exercise matches the row above it, the first cell is
     `td.ditto` holding `<span aria-hidden="true">"</span><span class="vh">{name}</span>`,
     so screen readers still hear the name.
   - The finish form, unchanged: `method="post"`, hidden `action=finish`,
     `<button class="secondary button">Finish workout</button>` in `.actions`.
4. **Set panel**: `section.panel.sheet`
   - `h2.panel-title`: "Pick a lift" when no exercise is chosen, otherwise
     "Log a set". It is 8 px and `--dim`, because the lift name below carries
     the weight.
   - When `?rested` is set: `p.bubble[role=status]` "Set logged! Rest 90 s,
     then go again." (`DEFAULT_REST_S`).
   - **No exercise chosen (idle)**: the GET form shown directly. It holds
     `p.recent-label` "From this workout" plus `ul.recent` of links (only when
     there are sets), then `label[for=exercise]` "Exercise",
     `select#exercise[name=exercise]` with optgroups, and
     `<button type="submit" class="wide">Choose</button>`. Choose is primary
     here because it is the only action.
   - **Exercise chosen**: `details.switch` containing
     `summary` > `span.lift` {name} + `span.set-no` "Set {n}" + `span.change`
     "Change". Inside it is the same GET form as `form.picker`, with `.recent`
     chips (the current one has `aria-current="true"`), the select with the
     current exercise `selected`, and Choose as `.secondary.button` in
     `.actions`. After the details comes the POST `form.set-form`:
     - hidden `exercise_id`
     - `p.last`: "Last time **{w} kg × {r}**" when `prefill` exists, otherwise
       "First time on this one. Start light."
     - `.big-pair`: `.big` > `label[for=weight_kg]` "Weight" + `span.field` >
       `input#weight_kg` + `span.unit[aria-hidden]` "kg"; `span.times[aria-hidden]`
       "×"; `.big` > `label[for=reps]` "Reps" + `span.field` > `input#reps`.
       Keep every attribute of both inputs as today, and keep **`name` before
       `value`** (the pre-fill test matches `name="weight_kg"[^>]*value="100"`).
     - `p.error` when `error` (add `role="alert"`, plus `aria-describedby` and
       `aria-invalid` on the weight input or the reps input, whichever the
       message is about)
     - `<button type="submit" class="wide">Done</button>`
   - Set number: `n = mySets.filter(s => s.name === exercise.name).length + 1`.
     Recent chips: the distinct `mySets` names in first-done order, mapped back
     to ids through `EXERCISES` (names are unique). An `equipment` → label map
     gives the optgroup labels: Treadmill, Flat bench, Squat rack, Dumbbell
     rack, Lifting platform, Pull-up bar, Cable machine, Exercise mat.

The mockup suffixes ids (`weight_kg-1`, `exercise-3`) only because it shows
several states on one page. The real ids are `exercise`, `weight_kg` and `reps`.

## 4. States

| State | Trigger | What changes |
| --- | --- | --- |
| Idle | No `?exercise` | The sheet shows "Pick a lift", the select (first option, Run) and a primary Choose. Recent chips appear if there are sets. |
| Lifting (default in a session) | `?exercise=<id>` | The sheet shows the lift summary, Set n, "Last time …", the big pre-filled numbers and Done. |
| Change lift | Tap the lift name | `details[open]` shows the picker box (chips, select, secondary Choose) above the numbers. Done stays where it is. |
| First time on a lift | `?exercise` with no `lastSet` | "First time on this one. Start light." Values 0 kg × 8 (the server defaults). |
| Success | `?exercise=<id>&rested=1` after the POST redirect | The bubble at the top of the sheet. Set n goes up by one, the log has the new row, and the tally updates. |
| Error | The POST fails validation (400) | `.error` under the number pair. Note: the server re-renders the **pre-fill**, not the submitted value, so the field may show 140 beside "Weight is 0 to 1000 kg." The browser's `min`/`max` usually catch this first. Echoing the submitted values back would be a small server change; the main agent or the user should decide. |
| Empty | Alone and no sets | 1 of 12 pips, a single `li.me`, the `.alone` line, no log panel, and an idle sheet without chips. |
| Pending | Between Done and the response | **Later work, it needs a small script**: disable Done (label kept, `--dim` fill), make the fields `readonly`, and set `aria-busy` on the sheet. The CSS (`button:disabled`) is in the layout-change list, so it's ready. |
| Signed out | No session | A redirect to `/signin?next=…`, unchanged. Non-members still get a 404. |
| Reconnecting, other people's live states, timer, Slacking | — | Not drawn: they need the real-time features (week 10). |

## 5. Departures

- **Secondary button on Night**: the system doesn't define it. Here it is a
  `--night` fill with a `--paper` label, the notch drawn in `--edge` and a
  `#000` under-shadow, so Finish and Choose clearly rank below the leaf
  primary. It should be added to system section 9.
- **Panel title tab** (`.panel-title` on the top border) is a new visual
  pattern, not yet in the system. It uses only tokens and the `--px` grid.
- **The 8 px sheet title** uses Press Start 2P at 8 px for a two- or
  three-word uppercase label, which section 6 allows.
- **Not yet built from the system's `.sheet`**: the state chip, `.timer`,
  `.stepper`, ±15 s and Start set. They need server state or JavaScript.
  Steppers can't work without JS (a no-JS `+` button would have to submit and
  log a set), so the plain number inputs are the fallback for now.

## Later work (when presence and SSE land)

Add the own-state chip at the top of `.sheet`, the rest `.timer`, the
steppers on the just-logged set, Start set, a state chip and equipment on each
`.people` row, the gym map at the top of the left column (laptop) or above the
Squad panel (phone), and the pending script.

## Layout changes

These belong in `Layout.astro`, to be reconciled once across all pages. The
mockup shows them in `<style id="page">` under `/* layout change: … */`.

1. **Night and state tokens on `:root`**: `--night`, `--floor`, `--panel`,
   `--edge`, `--dim`, `--idle`, `--lifting`, `--resting`, `--slacking`,
   `--finished` (system 5, gap 4).
2. **A `surface` prop on Layout** (`"paper" | "night"`) that puts
   `class="night"` on `<body>`, plus `body.night` rules: `--paper` text,
   `color-scheme: dark`, and the `--night`/`--floor` checker.
3. **`body.night main { max-width: 64rem }`**, so the gym has room for its two
   columns at 900 px and up.
4. **Night overrides of the global components**: `h2` in `--leaf`; `label` in
   `--paper`; `.hint` in `--dim`; `main a` in `--leaf`; `.bubble` keeps
   `--ink` text; the primary button is `--leaf` with an `--ink` label (hover
   uses the existing `#d6ef86`, to be tokenised); `.button.secondary` as in
   Departures; `input`/`select` get a `--night` fill, `--paper` text, an
   `--edge` border, a `#000` inset shadow and a `--paper` select arrow;
   `th`/`td` borders in `--edge`, and even rows in `--floor`.
5. **`button:disabled`**: `--dim` fill, `--ink` label, no press movement, and
   `cursor: progress` (the pending state, system 13).
6. **`.badge` font-size 8 px** (gap 3). The "You" badge uses it.
7. The `:focus-visible` yellow ring is already correct on Night. The Paper
   pages still need the ink ring (gap 1).
