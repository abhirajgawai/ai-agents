import Anthropic from "@anthropic-ai/sdk";
import { getLangfuse } from "../observability/tracker.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  "You are a helpful production assistant. Answer clearly and concisely.";

// Calls Claude with streaming. For each text chunk, invokes onChunk.
// Returns the full assembled text when done.
export async function runAgent(
  userMessage: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const lf = getLangfuse();
  const trace = lf.trace({ name: "agent-run" });
  const span = trace.span({ name: "claude-stream", input: userMessage });

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `<user_input>\n${userMessage}\n</user_input>`,
      },
    ],
  });

  let full = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      full += event.delta.text;
      onChunk(event.delta.text);
    }
  }
  span.end({ output: full });

  await lf.flushAsync();
  return full;
}
