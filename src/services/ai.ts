// Calls the AI proxy endpoint — a Supabase Edge Function that holds the
// Anthropic key server-side so it never ships on the device.
//
// Set EXPO_PUBLIC_AI_URL in your EAS environment to the Edge Function URL.
// For local dev, run `supabase functions serve` and point to localhost.

const AI_URL =
  process.env.EXPO_PUBLIC_AI_URL ||
  "https://placeholder.supabase.co/functions/v1/chat";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(history: Message[]): Promise<string> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { reply?: string; error?: string };
  if (!data.reply) throw new Error(data.error || "No reply from AI");
  return data.reply;
}
