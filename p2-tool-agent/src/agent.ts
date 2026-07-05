import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { tools } from "./tools/index.js";
import { saveNote } from "./tools/save_note.js";

dotenv.config();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runAgent(userMessage: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const textOutput: string[] = [];

  console.log(`\nAgent starting: "${userMessage}"\n`);

  while (true) {
    console.log("\n[Agent] Calling Claude...");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system:
        "You are a research agent. You have exactly two tools: web_search and save_note. Use web_search to find information. When done researching, you MUST call the save_note tool to save findings to the user's local machine — never use code execution or bash to write files. Always save to 'notes/research.md'.",
      tools,
      messages,
    });

    console.log(`[Agent] stop_reason: ${response.stop_reason}`);
    console.log(
      `[Agent] content blocks: ${response.content.map((b) => b.type).join(", ")}`,
    );

    // Print any text Claude outputs this turn
    for (const block of response.content) {
      if (block.type === "text") {
        process.stdout.write(block.text);
        textOutput.push(block.text);
      }
    }

    // Done — Claude has finished
    if (response.stop_reason === "end_turn") {
      const filename = "notes/research.md";
      await saveNote(filename, textOutput.join("\n"));
      console.log(`\n\n[Agent] Done. Saved to ${filename}`);
      break;
    }

    // Claude wants to call a client-side tool (save_note)
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use" && block.name === "save_note") {
          const input = block.input as { filename: string; content: string };
          console.log(`\n[Tool] Saving → ${input.filename}`);
          const result = await saveNote(input.filename, input.content);
          console.log(`[Tool] ${result}`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
