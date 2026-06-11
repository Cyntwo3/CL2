# RagaMuffin — "AI assistant" app that's secretly a dad-and-son chat

(Repo name: CL2. App name: **RagaMuffin**.)

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

## Works at school (key requirement)

The son wants to message Dad **during the school day**, from his tablet. This
drives several things:

- **Must work over the internet from anywhere** — his tablet (school wi-fi or
  cellular) reaching Dad wherever he is, with messages arriving instantly. This
  is why a hosted real-time backend is *required* (see backend decision — it's
  now effectively settled in favor of Supabase).
- **Convincing cover at school:** the app should read as a **homework / study
  AI helper** — a kid on a study app draws zero attention.
- **Quiet notifications:** when Dad replies, the tablet nudges the son, but the
  lock-screen preview is generic (e.g. *"Your study summary is ready"*) — never
  the actual message text.
- **One-tap panic hide:** a quick gesture instantly returns to the plain AI
  screen; a PIN unlocks the hidden chat again. Teacher walks by → one tap → it's
  just a chatbot.
- **Nothing that looks like a messaging app:** no chat-bubble icons, no
  text-style notification badges.

**Honest note for Dad:** most schools restrict device messaging during class;
the disguise doesn't change school rules, and the realistic downside if a
teacher catches on is the tablet getting confiscated. Dad + Mom should agree
with the son on *when* it's okay to use (lunch, breaks) so it stays a fun thing.

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

## Backend: DECIDED → Supabase

The "chat at school" requirement settled this: we need hosted accounts, live
messaging, and push notifications that work over the internet from anywhere.

- **Supabase (chosen).** Ready-made "backend in a box" — accounts, invite
  codes, *live* messaging, and the building blocks for notifications, on a
  generous free tier. Fastest and most reliable path; least code to maintain.
- (Rejected: building it by hand on Railway/Postgres — far more work to make
  live chat + notifications reliable, with no real upside here.)

## Rough phases

1. ~~Pick the backend~~ → done (Supabase).
2. Get a blank Expo app running on the son's tablet ("hello world").
3. The AI assistant half (real, working Claude chat).
4. The hidden chat half (Dad ↔ son live messages, AI-styled).
5. The disguise: persona list + unlock + invite codes.
6. Polish for tablet, then build the installable app via EAS.

## Status

- [x] Repo created locally (`C:\Users\wkayf\cl2`)
- [ ] Pushed to GitHub (`Cyntwo3/CL2`) — waiting on internet
- [x] Backend decision → Supabase
- [x] App name → RagaMuffin
- [ ] Everything else

## Notes / things to confirm

- Which tablet is it? (Android tablet vs iPad — affects how we install it.)
