# Spotter

Spotter is a shared cartoon gym for a few friends who used to train together
and now live apart. Everyone logs their own sets, and everyone can see who is
lifting, who is resting, and who has been resting far too long.

## Who it's for

A squad of two to eight friends. Usually one of them is the disciplined one,
and the rest of us trained because that person was there. When I moved to
Australia I stopped going to the gym entirely; the gym hadn't changed, but
nobody was watching anymore.

So Spotter is not for strangers, and it is not trying to grow. It is built for
two situations: friends at different gyms, each with a phone in one hand
between sets; and the showcase, a room of people on laptops with nobody lifting
at all.

## What good means here

1. **Your friends can see you, and only your friends.** A room is opened with a
   passcode and holds at most twelve people. There are no public rooms.
2. **Being seen does the work.** The app's job is to make it obvious when
   someone is slacking, and easy for a friend to do something about it,
   playfully rather than as a punishment.
3. **Logging never slows you down.** If logging a set is slower than in the app
   the disciplined friend already uses, that friend leaves, and so does the
   reason everyone else came. Weight and reps pre-fill from last time.
4. **Nothing you log is lost.** A set logged today is in your history next week,
   whatever happened to the server in between.

## What I read and looked at

Clay Shirky's [Situated Software](http://shirky.com/essays/situated-software/)
(2004) argues for software built "for a specific social group, rather than for
a generic set of users", and that "the N-squared problem is only a problem if N
is large". Robin Sloan's
[An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/)
(2020) is a messaging app for his family that "no one else will ever use".
Together they gave me permission to cut everything that only matters at scale.

[Feltz, Kerr and Irwin (2011)](https://doi.org/10.1123/jsep.33.4.506) found the
Köhler effect with a partner who was only virtually present: the weaker partner
works harder when their effort is visible to a stronger one. That is exactly my
roommate and me. [Eagle et al. (2024)](https://dl.acm.org/doi/full/10.1145/3689648)
on body doubling found the same thing in people's own words (companionship,
accountability, guilt), but also that being watched by a stranger can make
people anxious. That is a second reason the rooms are for friends.

[Tong et al. (2021)](https://doi.org/10.1145/3474711) studied *Animal Crossing:
New Horizons*, where visiting needs an access code and a gathering is capped at
eight. Players described it as semi-private, and friendlier than public worlds.
Spotter's passcode rooms copy that shape. Ben Hoyt's
[The small web is beautiful](https://benhoyt.com/writings/the-small-web-is-beautiful/)
backs the build: one small server, mostly plain HTML.

## What I chose not to build

No public rooms or matchmaking, and so no reporting, blocking or age checks.
There are no email verification or password resets, since there is no email
service, and no push notifications or offline mode. The exercise list is short,
and weights are in kilograms only.

## Enforced and judged

Enforced by the checks in [`spec/`](spec/core-loop.test.ts):

- a logged set is still in history after signing out and back in;
- weight and reps pre-fill from your last set of that exercise;
- a wrong passcode gets one generic error, and non-members can't see a room;
- one account per email, and the password is never sent back.

Judged, not tested: whether logging is fast enough between sets, whether the
gym is fun to watch, and whether a nudge feels friendly. I will judge these by
using it with friends and at the crit, and record what I find here.

This is version 1, written for week 9. The live gym, avatars and nudges arrive
in weeks 10 and 11, and this page will change with them.
