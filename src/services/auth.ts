import { supabase } from '@/lib/supabase';

// Pre-created Supabase users — emails are internal identifiers, not real addresses.
// The invite codes ARE the passwords for these accounts.
const USER_MAP = [
  { email: 'fwmcynical@gmail.com', role: 'dad', displayName: 'Dad' },
  { email: 'son@ragamuffin.local', role: 'son', displayName: 'Son' },
];

export async function signInWithCode(code: string): Promise<void> {
  for (const user of USER_MAP) {
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: code,
    });
    if (!error) {
      await ensureProfile(user.role, user.displayName);
      return;
    }
  }
  throw new Error('Invalid invite code. Check your code and try again.');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function ensureProfile(role: string, displayName: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('profiles').upsert(
    { id: user.id, role, display_name: displayName },
    { onConflict: 'id' },
  );
}
