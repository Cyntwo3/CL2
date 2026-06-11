# CL2 — "AI assistant" app that's secretly a dad-and-son chat

Plain-English plan. This file is the source of truth for what we're building.
Update it when something changes.

## What it is

A tablet app that **looks and works like a real AI assistant** — but tucked
inside it is a private chat between **Dad and his son** (and anyone else Dad
chooses to invite). The son's messages and Dad's messages are styled to read
like an AI conversation, so at a glance it looks like "just another chatbot."

This is a fun father–son project, not a secret — Mom knows all about it. The
"disguise" is the cool part, not a way to hide anything.

## Who it's for

- **Dad** (non-technical; explain everything in plain English).
- **His youngest son**, on his tablet.
- Maybe a couple more family members later, by invite.

## The two halves

1. **A real AI assistant.** Genuinely works. Kid-appropriate, friendly,
   safe answers. This is both a real tool the son can use *and* believable
   cover for the hidden chat.
2. **The hidden family chat.** Live back-and-forth messages between Dad and
   son, dressed up to look like AI replies.

## How the "disguise" works (the clever bit)

- The app opens to a list of "AI personas" — e.g. *Aria*, *Sage*, *Nova*.
  - Some of these really ARE the AI assistant (tap one, it chats back like a bot).
  - One of them is actually **the other person** (Dad ↔ son) wearing an
    AI-persona costume.
- An optional **unlock** — a PIN, or a secret phrase typed "to the AI" —
  reveals the human chat. Without it, the app is just an AI assistant.
- **Invites** are simple codes/links Dad hands out. Only code-holders join.

## Tablet-friendly

- Big, easy touch targets and text (a kid will use it).
- Works on his son's tablet (Android tablet or iPad — confirm which).

## Proposed build (the tech, in plain terms)

- **The app itself:** Expo / React Native — the same family of tools Dad
  already uses for the CynLabs mobile app (EAS account "trelio"). Runs on a
  tablet.
- **The "brain" + messaging behind it (the backend):** ONE decision still open
  — see below.
- **The AI:** Claude (Anthropic). The secret key stays on the server, never on
  the tablet.

## Open decision: the backend

The one thing that shapes everything else. Two options:

- **Option A — Supabase (recommended).** A ready-made "backend in a box."
  Handles accounts, invite codes, and *live* messaging out of the box, with a
  generous free tier. Fastest and most reliable for real-time chat; least code
  to maintain. Slightly less "built by us from scratch."
- **Option B — Build on the existing setup (Railway + same database tech as
  CynLabs).** More familiar and more "ours," but live chat and accounts are a
  lot more to build and maintain by hand.

Recommendation: **A**, because reliable live chat is the hard part and Supabase
gives it for free.

## Rough phases

1. Pick the backend (above).
2. Get a blank Expo app running on the son's tablet ("hello world").
3. The AI assistant half (real, working Claude chat).
4. The hidden chat half (Dad ↔ son live messages, AI-styled).
5. The disguise: persona list + unlock + invite codes.
6. Polish for tablet, then build the installable app via EAS.

## Status

- [x] Repo created locally (`C:\Users\wkayf\cl2`)
- [ ] Pushed to GitHub (`Cyntwo3/CL2`) — waiting on internet
- [ ] Backend decision
- [ ] Everything else

## Notes / things to confirm

- Which tablet is it? (Android tablet vs iPad — affects how we install it.)
- A name for the app? ("CL2" is just the repo name for now.)
