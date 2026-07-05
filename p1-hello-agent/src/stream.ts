import Anthropic from "@anthropic-ai/sdk";

export async function streamChat(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  system: string,
): Promise<string> {
  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system,
    messages,
  });

  process.stdout.write("\nClaude: ");

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
      fullText += event.delta.text;
    }
  }

  process.stdout.write("\n\n");
  return fullText;
}
