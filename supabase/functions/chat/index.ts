// Supabase Edge Function — proxies AI messages to Anthropic.
// The ANTHROPIC_API_KEY secret is set in the Supabase dashboard and never
// reaches the device.

import Anthropic from "npm:@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Muffin, a friendly and encouraging AI study assistant for kids and teens. You help with homework, explain concepts clearly, answer curiosity questions, and keep things age-appropriate and positive.

Guidelines:
- Keep answers clear and easy to understand — short paragraphs, not walls of text
- Be warm, enthusiastic, and encouraging
- If a question is off-topic or inappropriate, gently redirect to study topics
- Never produce harmful, adult, or scary content
- Use examples and analogies when explaining tricky concepts
- Occasionally use light emojis to keep the tone friendly (don't overdo it)`;

const client = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, authorization",
      },
    });
  }

  try {
    const { messages } = await req.json() as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages?.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const reply =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return Response.json(
      { reply },
      { headers: { "Access-Control-Allow-Origin": "*" } },
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "AI request failed" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }
});
