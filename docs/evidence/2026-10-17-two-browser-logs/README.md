# Two people in two browsers, narrated from the server's log

Oct 17, 2026. The question: if two people use Spotter from separate browsers
and I only read the server's log, can I tell them apart, say what each one
did, and see the server refuse what one of them shouldn't be able to do to
the other? That is what Crit 10 checks.

## What happened

1. **Before this week the log said nothing.** `src/` had no `console.*` and no
   logger at all, so `flyctl logs` would have shown only Astro's startup line.
2. **A review of every request entry point** found the ownership checks sound
   (every `set_id` and workout id is matched against the signed-in person),
   plus four gaps. Three were fixed and one was written down (ADR 0006).
3. **Structured logs** ([`252a254`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/252a254)):
   one JSON line per request and per action, with the person's id and display
   name, and a line for every refusal.
4. **The gaps:** `?next=//host` sent people off-site after signing in
   ([`50655fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/50655fe));
   a room's live stream kept running after its person left, the room closed or
   they signed out ([`2801c15`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/2801c15));
   nothing limited password or passcode guessing
   ([`bd76143`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/bd76143),
   [`d8cdc97`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/d8cdc97)).
5. **This rehearsal** caught one bit of noise: a logged set wrote a second
   `station.claim` for a station the person already held. Fixed in
   [`69c937e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-dongyangli6816/commit/69c937e),
   and the run below is from after that fix.

Read from `actions.jsonl`, the narration goes:

> Mia and Tom make accounts (ids 1 and 2). Mia opens room 1 and her screen
> connects. Tom types a wrong code and is turned away, then the right one, and
> his screen connects. Mia takes the bench on station 2 and logs 60 kg × 8.
> Tom takes the squat rack on station 3. Then Tom tries to delete Mia's set,
> then to edit it: both refused (`set.denied`). He tries to end her room:
> refused, he isn't the host (`room.end_denied`, host 1). Mia finishes; Tom
> tries to open her summary: refused (`workout.denied`). Tom leaves, and his
> stream is hung up (`reason: left`). He tries to look back in: refused, both
> the page and the stream. Mia signs out.

## What's here

- `steps.txt`: what the two browsers did, step by step, with the HTTP status
  each hostile request got.
- `server-log.jsonl`: everything the server printed in the run, 62 lines.
- `actions.jsonl`: the same without the 39 `http` request lines, which is
  what was narrated above.

## How it was made

A throwaway Playwright script (not kept) started two separate browser
contexts, so the two people shared no cookies or storage, as two Chrome
profiles at the crit wouldn't. Mia and Tom signed up, opened and joined a
room, chose lifts and logged a set through the pages themselves. Tom's
hostile requests were then sent from his own context, with his own cookie,
as hand-made POSTs and GETs, which is what someone poking at the app from
the browser's dev tools would do. Mia's set id was read from the database,
standing in for someone guessing ids.

The server was the production build (`pnpm build`, then
`node dist/server/entry.mjs`) with an empty database in a temporary
directory, and its stdout was saved as it ran. The file holds only the lines
the app printed, without Astro's startup line.

## Things to know when judging it

- **This was local, not on Fly.** Fly shows the same stdout through
  `flyctl logs`, with its own prefix on each line. The rehearsal that counts,
  on the deployed app with two people, comes after this branch is merged.
- **Two contexts in one script are not two people.** The order is
  deterministic and nobody hesitates. It shows the log can be narrated, not
  that it's easy to follow while two people act at once.
- **The `stream.close` with `reason: gone`** just before Tom leaves is his
  page reloading (the script navigates to the room before posting Leave).
- **No line holds an email, password, passcode or session token.** That was
  checked by searching the file for `@` (none) and for those keys.
