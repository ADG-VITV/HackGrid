# `teamsfix` branch — what changed and why

This branch reworks the Teams page and wires it to the auction so that the
product actually behaves the way the rulebook says: **one lead bids for the
team, everyone else follows along**. It also brings the Teams page into the
same visual language as the rest of the site.

## The problems this branch fixes

1. **Teams page looked like a different product.** It used `emerald-*`
   greens, `#051306` fills and dashed borders — none of which appear on the
   home page, navbar or bidding page (black ground, neon `#42ff5a` hairlines,
   mono uppercase labels, the cursor's targeting brackets). Content also sat
   under the fixed navbar, and `<Navbar />` was rendered twice on `/teams`
   and `/bidding` (once by the layout, once by the page).
2. **Nothing was wired together.** Team → "countdown window" → placeholder
   were three unrelated screens. No page knew whether you were the lead or a
   member; there was no place a member could see what the team was doing.
3. **Any member could bid.** Identity was "any email on the roster resolves
   to the team", and the socket handshake only checked `podId`/`teamId`, so a
   member could open `/bidding` and place bids for the team.
4. **No sign-in requirement.** `/teams` worked for anyone, using whatever
   email happened to be in `localStorage`.

## Files changed

### Design system

| File | Change | Why |
|---|---|---|
| `components/ui/panel.tsx` *(new)* | `Panel`, `Eyebrow`, `Chip`, `CornerMarks`, plus `primaryButton` / `ghostButton` / `inputField` class strings. | One place for the site's building blocks so `/teams` (and later `/bidding`) draw from the same vocabulary as home and the navbar. |
| `app/globals.css` | Defines `--neon: #42ff5a` on `:root`, points the Tailwind `neon` colour at it, adds a `text-glow-neon` utility. | The hero and login page already referenced `var(--neon)` but nothing defined it. The glow utility is the flip clock's text-shadow, reused on the team code. |

### Teams page

| File | Change | Why |
|---|---|---|
| `app/teams/page.tsx` | Drops the duplicate `<Navbar />`; title "Teams". | The layout already renders the navbar. |
| `app/teams/auction-team-client.tsx` | Rewritten. Join/Create cards and modal restyled; identity comes from `useViewerEmail`; requires sign-in in production; renders `TeamDashboard` once a team exists. | Design-language fix, plus the flow now depends on who is signed in rather than on guessed `localStorage` keys. |
| `app/teams/team-dashboard.tsx` *(new)* | The team dashboard: identity strip, the team details card, and the Resource Manager in the **same right-hand slot it has on `/bidding`**. | Replaces the separate countdown window and placeholder. Keeps the ledger in a fixed place across pages. |
| `app/teams/team-details.tsx` | Restyled team details, top to bottom: name, team code with copy, members in joining order (lead marked, "you" highlighted), your role, and one button — **Start auction** for the lead, **Watch** for a member. | Design-language fix; the page is just the team, with one thing to do next. |
| `app/teams/actions.ts` | Removed the unused `lookupTeamMemberAction`. | Its only consumer (`team-lookup.tsx`) was removed. |
| `app/teams/auction-dashboard.tsx` *(deleted)* | Countdown + "Skip countdown" + placeholder screen. | Superseded by the team dashboard. |
| `app/teams/team-lookup.tsx` *(deleted)* | "Look up any team by name + email" modal. | Not linked from anywhere; a debugging aid that leaked other teams' rosters. |

### Bidding page

| File | Change | Why |
|---|---|---|
| `app/bidding/page.tsx` | Drops the duplicate `<Navbar />`. | Same as above. |
| `app/bidding/bidding-client.tsx` | Identity from `useViewer` (Google session, or the person picked on `/teams` in development). Production UI only: the "Acting as" picker, Organiser strip, Force buttons, Remainder Pod box and Server Log are gone — organiser controls live on `/admin`. Renders `MemberView` when the server says the viewer is a member. Members never open a socket; they poll the DB (4 s while a round is live, 10 s otherwise). The lead's email travels in the socket handshake. | The page is now role-aware. A member in the socket room would also count towards quorum, so members must not connect. |
| `app/bidding/member-view.tsx` *(new)* | The member's watch view: the tier the lead is bidding on right now, pod, timer, running order, and the Resource Manager in reveal-on-round-close mode. | Members see the current item and what the team has won — nothing else. |
| `app/bidding/resource-manager.tsx` | New props `revealLive` and `showBidCap`. With `revealLive=false` the live capsule shows "in progress — revealed when the round closes" and its cost is not yet counted. | Members' ledger updates only when the lead finishes a capsule; the bid cap is a lead-only concern. |
| `app/bidding/actions.ts` | `BiddingContext` gains `viewerRole` and `currentLot`. | The UI needs to know the viewer's role and what is on the block. |
| `app/bidding/use-auction-socket.ts` | Takes `email` and sends it in the handshake; no connection without it. | Lets the server admit the lead only. |

### Server / engine

| File | Change | Why |
|---|---|---|
| `lib/auction-engine.mjs` + `.d.mts` | `getBiddingContext` returns `viewerRole` (lead vs member, derived from the email vs `team.leaderId`), `team.leadName`, and `currentLot` (the OPEN lot in the team's pod). | Single source of truth for role and "what is my lead bidding on", shared by the app and the REST API. |
| `lib/auction-hub.mjs` | `attach` refuses a socket whose email is not the pod membership's `leadEmail` (`ROOM_ERROR` + eject). | Enforces "only the lead bids" on the server. |
| `server.mjs` | `io.use` requires an `email` in the handshake and passes it to `attach`. | Same. |
| `lib/socket-events.ts` | `SocketAuth` gains `email`. | Type for the above. |

### Identity / auth

| File | Change | Why |
|---|---|---|
| `lib/use-viewer.ts` *(new)* | `useViewer()` — email, name, photo and `signOut` for the Google session; in development a person picked on `/teams` (`startActingAs`) stands in for the session until `stopActingAs` (Logout in the navbar). | One definition of "who is this" for every page — the navbar, `/teams` and `/bidding` all read it. |
| `app/ClientLayout.tsx` | Passes `useViewer()` into `<Navbar user loading onSignOut>`. | The navbar component (from PR #20) knows nothing about acting-as; the layout hands it whoever is currently the viewer. |
| `lib/use-local-storage.ts` *(new)* | `localStorage` as a React external store (`useSyncExternalStore`). | Reads agree between server render and hydration, and writes notify every hook on the page. Replaces ad-hoc `localStorage.getItem` in effects, which the React lint rule flags. |

## How it behaves now

- **Signed out:** `/teams` shows the Join / Create cards; clicking either opens a "Sign in to …" popup whose button goes to `/login`, which returns to `/teams` after Google sign-in. Same in development.
- **No team yet:** Join / Create cards; the email field is the session's email and read-only.
- **Lead:** team dashboard with **Start auction**; `/bidding` is the pod room. The socket is admitted only if the handshake email matches the pod membership's `leadEmail`.
- **Member:** team dashboard with **Watch** and the ledger; `/bidding` is the watch view (current tier + ledger). No socket is ever opened; the page polls the database.
- **Ledger:** the lead sees a tier the moment it settles; a member sees a round only after the lead has moved past it.

## Known limits

- Identity is still client-asserted: there is no Firebase ID-token
  verification in the server actions or the socket handshake, so the gates
  stop ordinary use, not a deliberate spoof. Adding token verification is the
  next step if that matters for the event.
- `/bidding` is not behind a sign-in gate (it shows an empty "sign in" state
  when signed out), and neither is the `/teams` landing — only the forms are.
- The navbar is the one from the `navbar` branch (PR #20), untouched here.
  It takes `user` / `loading` / `onSignOut` props; `app/ClientLayout.tsx`
  fills them from `useViewer()`, which is the only way this branch reaches
  the navbar. Design changes belong on that branch, not this one.

## Development: acting as a person

Development mode is visible in exactly one place: a third box beside Join /
Create on `/teams`, headed "I only come in development". Its dropdown lists
everyone in the `users` table (`listUsersAction`, empty in production) with a
search field; leads are red, members blue, people on no team grey.

Picking someone calls `startActingAs` (`lib/use-viewer.ts`), which stores
`hackgrid:actAs` and mirrors the email into `hackgrid:gmail`. From then on
`useViewer()` reports that person — the navbar's avatar and menu (via the
props `ClientLayout` passes it), the teams dashboard, and `/bidding` all
behave exactly as production would for them:
a lead gets the pod room (the hub admits their email), a member gets the
watch view. Nothing on `/bidding` is development-only any more; the organiser
controls that used to sit there live on `/admin`.

**Logout** in the navbar ends the impersonation (it does not touch a real
Google session, if one exists) and clears both keys. The old "Skip team
making" fake-lead button and the typed-email flow are gone — pick a real
person instead.
