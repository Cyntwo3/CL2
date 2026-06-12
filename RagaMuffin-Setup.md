# RagaMuffin — Setup Checklist
Last updated: 2026-06-12

Everything is built and pushed to GitHub (Cyntwo3/CL2).
These are the 4 steps left before the first working APK.

---

## Step 1 — Run the database setup in Supabase

Go to your Supabase project → SQL Editor → New query.
Paste and run this in two separate queries:

**First query — create the tables:**
Copy the full contents of this file from your repo:
  supabase/migrations/20260101000000_initial.sql

**Second query — create the two user accounts:**

  SELECT auth.create_user(
    '{"email": "dad@ragamuffin.local", "password": "PickDadsCode", "email_confirm": true}'::jsonb
  );

  SELECT auth.create_user(
    '{"email": "son@ragamuffin.local", "password": "PickSonsCode", "email_confirm": true}'::jsonb
  );

Replace PickDadsCode and PickSonsCode with the actual invite codes
you want to hand out. These ARE the passwords — keep them.

---

## Step 2 — Deploy the Edge Function (the AI brain)

In the Claude Code terminal, run:

  ! cd /c/Users/wkayf/cl2 && supabase link
  ! cd /c/Users/wkayf/cl2 && supabase secrets set ANTHROPIC_API_KEY=your-key-here
  ! cd /c/Users/wkayf/cl2 && supabase functions deploy chat

(The Anthropic key lives on Railway for CynLabs — RagaMuffin needs its own copy set here.)

---

## Step 3 — Add 4 env vars in EAS

Go to expo.dev → account trelio → project ragamuffin → Environment Variables → preview environment.

Add these four:

  EXPO_PUBLIC_SUPABASE_URL      Supabase → Project Settings → API → Project URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY Supabase → Project Settings → API → anon/public key
  EXPO_PUBLIC_AI_URL            https://<your-project-ref>.supabase.co/functions/v1/chat
  EXPO_PUBLIC_CHAT_PIN          Pick a 4-digit PIN — unlocks the hidden chat on Notes tab

---

## Step 4 — Build the APK

In the Claude Code terminal:

  ! cd /c/Users/wkayf/cl2 && eas build --platform android --profile preview

When it finishes, scan the QR code or open the link to install on the tablet.

---

## How the app works once installed

- Ask tab    — real AI study assistant (Muffin). Works for anyone.
- Notes tab  — shows fake "Study History" by default (the disguise).
              Type the PIN into "Filter sessions..." to unlock the real chat.
              Chat auto-hides when the app goes to background.
              Tap "Hide" to manually re-lock.
- First launch — shows an invite code screen. Dad enters his code, son enters his.

---

## Invite code summary (fill in after Step 1)

  Dad code:        _______________
  Son code:        _______________
  Chat unlock PIN: _______________
