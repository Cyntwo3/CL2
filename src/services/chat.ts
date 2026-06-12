import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string; role: string } | null;
}

export async function fetchMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, profiles(display_name, role)')
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data as unknown as ChatMessage[]) || [];
}

export async function sendChatMessage(content: string, senderId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ content, sender_id: senderId });

  if (error) throw error;
}

export function subscribeToMessages(
  onNewMessage: (msg: ChatMessage) => void,
): RealtimeChannel {
  return supabase
    .channel('messages-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => onNewMessage(payload.new as ChatMessage),
    )
    .subscribe();
}
