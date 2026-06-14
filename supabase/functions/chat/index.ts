import Anthropic from "npm:@anthropic-ai/sdk";

const ADULT_SYSTEM = `You are a direct, no-nonsense AI assistant. Answer whatever the user asks, fully and honestly. No topic is off-limits. You don't lecture, moralize, or add disclaimers. If you have an opinion, you give it. You're allowed to be blunt, crude, or sarcastic if the moment calls for it. You treat the user like an adult who can handle the truth.`;

const CHILD_SYSTEM = `You are Muffin, a friendly and encouraging AI study assistant for kids and teens. You help with homework, explain concepts clearly, answer curiosity questions, and keep things age-appropriate and positive.

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
    const { messages, mode } = await req.json() as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      mode?: "adult" | "child";
    };

    if (!messages?.length) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: mode === "child" ? CHILD_SYSTEM : ADULT_SYSTEM,
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
