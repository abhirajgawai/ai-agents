import fs from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { chunkText } from "./chunker.js";
import { addChunks, search } from "./vectorstore.js";

const client = new Anthropic();

export async function teach(filePath: string): Promise<void> {
  const text = await fs.readFile(filePath, "utf-8");
  const chunks = chunkText(text);
  console.log(
    `Read ${text.length} characters, split into ${chunks.length} chunks`,
  );
  await addChunks(chunks, filePath);
  console.log("Done teaching.");
}

export async function ask(question: string): Promise<void> {
  const chunks = await search(question);

  if (chunks.length === 0) {
    console.log("No relevant context found.");
    return;
  }

  const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:
      "Answer the user's question using only the provided context. If the context doesn't contain enough information, say so.",
    messages: [
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer = response.content[0];
  if (answer.type === "text") {
    console.log("\nAnswer:", answer.text);
    console.log(
      "\nSources:",
      [...new Set(chunks.map((c) => c.source))].join(", "),
    );
  }
}
