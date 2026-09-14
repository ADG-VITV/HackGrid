# `teamsfix` — what changed against `main`, and why

`git diff main...teamsfix` — 28 files, +1535 / −1214.

The branch does two things. It makes the Teams and Bidding pages behave the
way the rulebook says — **one lead bids for the team, everyone else follows
along** — and it settles a question this branch got tangled in along the way:
**who owns the navbar**.

---

## 1. The navbar problem this branch was stuck on

### What was going wrong

`teamsfix` needs the navbar to show whoever the site currently treats as
signed in — the Google session, or, in development, the person picked with the
"act as" box on `/teams`. The first attempt did that by **editing
`components/ui/Navbar.tsx` directly**: swapping `useAuth()` for `useViewer()`
inside the component, and patching `components/ui/dropdown.tsx` so the account
menu would actually open.

At the same time, PR #20 (`navbar`, Anshul) was the **design-approved navbar
rewrite** — pixel typography, the rounded shell, the mobile panel, its own
account menu. Two branches were now changing the same component for different
reasons. Whichever merged second would have had to redo the other's work, and
the design-team version would have ended up carrying `teamsfix`-only concepts
like "acting as".

### What was done about it

1. **PR #20 was fixed first and merged into `main`** (`9f39310`). The fixes
   that went in with it are Anshul's component, corrected — not new design:
   - the signed-in **account menu was never visible** (rendered inside a shell
     with `overflow-hidden` + `clip-path`); it now renders beside the shell;
   - the `user` prop could not be controlled — `user ?? auth.user` meant
     passing `null` silently fell back to the session; it now means
     "signed out";
   - the `<style jsx>` block was **absent from the server HTML** (styled-jsx
     needs a registry in the App Router), so the navbar first painted
     unstyled; `app/styled-jsx-registry.tsx` + a wrapper in `app/layout.tsx`
     fix that;
   - `Rules` links to the `/rules` page (a `#rules` anchor never existed), and
     the scroll-spy observer uses a viewport middle band instead of a 30%
     ratio that could never fire for the 2400vh timeline.
2. **`teamsfix` dropped every navbar edit it had.** `Navbar.tsx` and
   `dropdown.tsx` are untouched on this branch; `git diff main` shows no
   change to either.
3. **The one remaining touchpoint is `app/ClientLayout.tsx`.** The navbar
   already accepts `user`, `loading` and `onSignOut` props. The layout reads
   `useViewer()` and hands those in. The navbar has no idea what "acting as"
   is; it just shows who it is told to show, and its Logout calls whatever
   `onSignOut` it was given — which, while acting as someone, is
   `stopActingAs`.

So the design-approved navbar persists as-is, and this branch's identity
model still reaches it. Verified end to end: pick a person on `/teams` → the
navbar shows their initials and name → `/bidding` renders the right view for
them → Logout in the navbar clears the impersonation and the navbar flips back
to LOGIN.

**Left alone on purpose (they live in `main`, not here):** the About and
Timeline nav links still point at `/#about` / `/#timeline`, which do not exist
on the home page, and `components/timeline/timeline.tsx` forces
`scrollTo(0,0)` on mount, which would cancel a hash jump even if they did.
Page top padding (`pt-20 / sm:pt-24`) also sits flush against the new 96px
navbar. Both are navbar/home-page follow-ups, out of this branch's scope.

---

## 2. The product problems this branch fixes

| # | Problem on `main` | Where it showed |
|---|---|---|
| 1 | **Any member could bid.** Identity was "any email on the roster resolves to the team", and the socket handshake only checked `podId`/`teamId`. A member who opened `/bidding` got the same room and bid buttons as the lead. | `lib/auction-hub.mjs`, `server.mjs`, `bidding-client.tsx` |
| 2 | **Members had nowhere to look.** There was no view of "what is my lead bidding on right now" and no ledger that only reveals a round after it settles. | `/bidding` |
| 3 | **Nothing was wired together.** `/teams` went Team → countdown window → placeholder; none of those screens knew whether you were the lead or a member, and none led to the auction. | `app/teams/*` |
| 4 | **`/teams` never asked you to sign in.** The old page guessed who you were: it looked in the browser's `localStorage` for an email under any of five key names, then scanned every key with "firebase" in it, and used the first email it found. Anyone with a leftover email in storage was "signed in"; anyone else typed an email into the form. | `auction-team-client.tsx` |
| 5 | **Three pages, three ideas of who you are.** The navbar asked Firebase (`useAuth()`), `/teams` did the storage guessing above, and `/bidding` read yet another storage key (`hackgrid:actAsTeamId`) or fell back to the same guessing. Nothing kept them in step, so the navbar could show one person while the page below served another. | everywhere |
| 6 | **Organiser controls were on the player's page.** In development `/bidding` carried Start event / Reset / Force buttons, a "Remainder Pod" box and a server log. `main` has since grown `/admin` for exactly this. | `bidding-client.tsx` |
| 7 | **The Teams page looked like another product** — `emerald-*` greens, `#051306` fills, dashed borders. The rest of the site is black ground, neon `#42ff5a` hairlines, mono uppercase labels. Content also sat under the fixed navbar, and `<Navbar />` was mounted twice on `/teams` and `/bidding`. | `app/teams/*`, `app/*/page.tsx` |
| 8 | **A debugging modal leaked rosters.** "Look up any team by name + email" showed any team's members to anyone who knew one email on it. | `team-lookup.tsx` |

---

## 3. File-by-file

### Identity — one answer to "who is looking"

| File | Change | Issue → fix |
|---|---|---|
| `lib/use-viewer.ts` *(new)* | `useViewer()` returns `{ email, name, photoURL, signedIn, actingAs, loading, signOut }`. **Production:** the Google session and nothing else; the session's email is mirrored into `localStorage` (`hackgrid:gmail`) so a tab that later signs out still knows the last real identity. **Development:** a person picked on `/teams` (`startActingAs`) stands in for the session until `stopActingAs`. That person is kept in **`sessionStorage`** — one tab's storage, gone when the tab closes — and development **never writes `localStorage`** (it also clears any `hackgrid:*` keys an earlier build left there). | Fixes #5: every page reads the same hook. Fixes #4: nothing guesses from storage any more. The per-tab store is deliberate: `localStorage` is shared by every tab on the origin, so acting as someone in one tab used to make every new tab that person too. Now a new tab starts as nobody and can be someone else — a lead in one tab, a member in the next. A reload keeps the tab's person. |
| `lib/use-local-storage.ts` *(new)* | Web storage as a React external store (`useSyncExternalStore`), in two flavours: `readLocal` / `writeLocal` / `useLocalStorageValue` for `localStorage`, and `readSession` / `writeSession` / `useSessionStorageValue` for `sessionStorage`. Writes notify every hook on the page. | Server render and hydration both see `null`, so no mismatch. Replaces the ad-hoc `localStorage.getItem` inside effects that the React lint rule flags. |
| `app/ClientLayout.tsx` | Calls `useViewer()` and passes `user` / `loading` / `onSignOut` to `<Navbar>`. | The only navbar touchpoint on this branch — see §1. |

### Teams page

| File | Change | Issue → fix |
|---|---|---|
| `app/teams/page.tsx` | Drops the duplicate `<Navbar />`; title "Teams". | #7 — the layout already renders the navbar. |
| `app/teams/auction-team-client.tsx` | Rewritten. Identity comes from `useViewer()`. The Join / Create cards are open to everyone; clicking either when signed out opens a **"Sign in to …" prompt** whose button goes to `/login`. When signed in, the email field is the session's email and read-only. Once a team exists it renders `TeamDashboard`. The "Skip Team Making" fake-lead button and the typed-email flow are gone. In development a third card, `ActAsCard`, sits beside the two. | #4 (a session is required to act), #5 (no local `localStorage` logic), #7 (built from `components/ui/panel.tsx`). Two subtle correctness points: the roster lookup is tagged with the email it answered for, so a lookup for a previous identity is never shown after switching; and a just-submitted form result is shown only if the current viewer is on that roster. |
| `app/teams/team-dashboard.tsx` *(new)* | Where a team lands once it exists: identity strip (email, team · code, lead/member chip, balance), `TeamDetails` in the main column, and the **Resource Manager in the same right-hand slot it has on `/bidding`**. Polls the ledger every 10 s; nobody bids from here. | #3 — replaces the countdown window and placeholder. Keeping the ledger in a fixed place means moving between `/teams` and `/bidding` never moves the thing you were reading. |
| `app/teams/team-details.tsx` | Restyled top to bottom: name, member count, team code with copy (clipboard failure is caught), members in **joining order** with the lead marked and "you" highlighted, your role, and **one button** — **Start auction** for the lead, **Watch** for a member — both going to `/bidding`. | #3, #7. The page is just the team and the one thing to do next. |
| `app/teams/act-as-card.tsx` *(new)* | Development only. Lists everyone in the `users` table with a search box; leads red, members blue, people on no team grey. Picking one calls `startActingAs` for **this tab**. | Replaces the fake "Skip Team Making" lead with a real person, so every flow can be walked as them — lead or member — without their Google account. Open a second tab to be a second person. |
| `app/teams/actions.ts` | Removed `lookupTeamMemberAction`. Added `listUsersAction()` — the roster for the act-as card; **returns `[]` outside development**. | #8 — the lookup's only consumer was the removed modal. The new action cannot list people in production. |
| `app/teams/auction-dashboard.tsx` *(deleted)* | Countdown + "Skip countdown" + placeholder screen. | #3 — superseded by `team-dashboard.tsx`. |
| `app/teams/team-lookup.tsx` *(deleted)* | "Look up any team by name + email" modal. | #8 — not linked from anywhere; leaked other teams' rosters. |

### Bidding page

| File | Change | Issue → fix |
|---|---|---|
| `app/bidding/page.tsx` | Drops the duplicate `<Navbar />`. | #7. |
| `app/bidding/bidding-client.tsx` | Identity from `useViewer()`; the server says whether that email leads the team (`viewerRole`). **A member renders `MemberView` and never opens a socket.** The lead's email travels in the socket handshake. Refreshes the context on every room event (lot closed, capsule opened/closed, event complete). Polling: 4 s for a member while a round is live, 10 s for anyone with no room; off once the lead's socket is open. All development-only UI removed — the "Acting as" picker, Organiser strip (Start / Reset), Force buttons, Remainder Pod box and Server Log. Context fetched for one identity is discarded the moment the identity changes (sign-out drops straight to the empty shell). | #1 (a member cannot reach the room), #2 (the member view), #5, #6 (organiser controls live on `/admin`). A member in the socket room would also have counted towards quorum, which is why members poll the database instead. |
| `app/bidding/member-view.tsx` *(new)* | The member's watch view: status chip (Following / Live / Standby), team and lead name, **the tier on the block right now** with its timer, the running order of rounds, and the Resource Manager in reveal-on-round-close mode. Link back to the team dashboard. | #2. Members see the current item and what the team has won — nothing else. |
| `app/bidding/resource-manager.tsx` | New props `revealLive` (default `true`) and `showBidCap` (default `true`). With `revealLive=false` the live capsule shows "in progress — revealed when the round closes", and coins-left / spent are recomputed from **closed** rounds only. `showBidCap=false` hides the bid cap and reserve lines. | #2. A member's ledger updates only when the lead finishes a round; the bid cap is a lead-only concern. The lead's view is unchanged. |
| `app/bidding/identity-bar.tsx` *(renamed from `act-as-bar.tsx`)* | The dev `<select>` of teams is gone; the strip shows connection state, the signed-in team, its pod this round and the balance. | #5, #6. |
| `app/bidding/actions.ts` | `BiddingContext` gains `viewerRole` and `currentLot`; `team` gains `leadName`. Removed `startEventAction`, `startCapsuleAction`, `resetEventAction`, `listTeamsAction` and the hub-notify helpers. | #6 — those actions were the dev-only organiser controls; `/admin` has its own. The UI needs to know the viewer's role and what is on the block. |
| `app/bidding/use-auction-socket.ts` | Takes `email` and sends it in the handshake `auth`; no connection is attempted without it. | #1 — lets the server admit the lead only. |
| `app/bidding/dev-console.tsx` *(deleted)* | Server log panel. | #6. |
| `app/bidding/second-view.tsx` *(deleted)* | "Who is in the Remainder Pod" box. | #6. |

### Server and engine — enforce "only the lead bids"

| File | Change | Issue → fix |
|---|---|---|
| `server.mjs` | `io.use` now also requires an `email` in the handshake (must contain `@`), normalises it and passes it to `hub.attach`. | #1 — the room needs to know who is asking, not just which team. |
| `lib/auction-hub.mjs` | `attach` refuses a socket whose email is not the pod membership's `leadEmail`: emits `ROOM_ERROR` ("Only the team lead's account can enter the bidding room.") and returns `false`, which disconnects it. | #1, enforced server-side. The membership row snapshots the lead for the round. |
| `lib/auction-engine.mjs` | `getBiddingContext` returns `viewerRole` (`MEMBER` if the email is on the team but is not the leader's; a numeric id — the old dev picker — always counts as `LEADER`), `team.leadName`, and `currentLot` — the `OPEN` lot in the team's pod (`name`, `tierRank`, `closesAt`). | #2 — one source of truth for role and "what is my lead bidding on", shared by the app and the REST API. |
| `lib/auction-engine.d.mts` | Types for the above. | — |
| `lib/socket-events.ts` | `SocketAuth` gains `email`. | — |

### Design system

| File | Change | Issue → fix |
|---|---|---|
| `components/ui/panel.tsx` *(new)* | `Panel`, `Eyebrow`, `Chip`, `CornerMarks`, plus `primaryButton` / `ghostButton` / `inputField` class strings. | #7 — one vocabulary for `/teams` and `/bidding`, matching the home page and navbar. |
| `app/globals.css` | Defines `--neon: #42ff5a` on `:root` and points Tailwind's `neon` colour at it; adds a `text-glow-neon` utility (the flip clock's text-shadow, reused on the team code). | The hero and login page already referenced `var(--neon)` but nothing defined it. The navbar's font variables from PR #20 sit alongside, untouched. |

---

## 4. How it behaves now

- **Signed out:** `/teams` shows the Join / Create cards; clicking either opens
  "Sign in to …" → `/login`, which returns to `/teams` after Google sign-in.
  `/bidding` shows the empty "sign in" state.
- **No team yet:** Join / Create; the email field is the session's and
  read-only.
- **Lead:** team dashboard with **Start auction**; `/bidding` is the pod room.
  The socket is admitted only if the handshake email matches the pod
  membership's `leadEmail`. Ledger updates the moment a tier settles.
- **Member:** team dashboard with **Watch**; `/bidding` is the watch view —
  current tier, timer, running order, ledger. No socket is ever opened; the
  page polls (4 s live, 10 s otherwise). A round appears in the ledger only
  after the lead has moved past it.
- **Navbar:** shows the viewer from `ClientLayout`; Logout ends a dev
  impersonation or the real session, whichever is in effect.
- **Storage:** production writes one `localStorage` key (`hackgrid:gmail`,
  the session's email). Development writes none — the acted-as person lives
  in the tab's `sessionStorage`.

## 5. Development: acting as a person

Development mode is visible in exactly one place: the third card on `/teams`,
"I only come in development". Pick anyone from the `users` table
(`listUsersAction`, empty in production). `startActingAs` writes
`hackgrid:actAs` to **this tab's `sessionStorage`**; from then on `useViewer()`
in this tab reports that person and every page behaves exactly as production
would for them — a lead gets the pod room (the hub admits their email), a
member gets the watch view. A reload keeps them; closing the tab forgets them.

To test two roles at once, open a second tab and pick someone else there — it
starts as nobody, because nothing is written to the shared `localStorage`.
**Logout in the navbar** ends the impersonation in that tab; a real Google
session, if any, is untouched.

## 6. Known limits

- Identity is still client-asserted: the server actions and the socket
  handshake trust the email they are given. The gates stop ordinary use, not a
  deliberate spoof. Firebase ID-token verification is the next step if that
  matters for the event.
- `/bidding` and the `/teams` landing are not behind a sign-in gate — only the
  forms are.
- `components/ui/dropdown.tsx` is now unused (the navbar has its own menu);
  left in place, untouched.
