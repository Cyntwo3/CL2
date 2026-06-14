import { supabase } from '@/lib/supabase';

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(
  history: Message[],
  mode: "adult" | "child" = "adult",
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("chat", {
    body: { messages: history, mode },
  });

  if (error) throw new Error(error.message || "AI request failed");
  if (!data?.reply) throw new Error(data?.error || "No reply from AI");
  return data.reply;
}
