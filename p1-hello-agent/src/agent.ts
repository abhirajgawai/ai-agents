import Anthropic from "@anthropic-ai/sdk";
import { streamChat } from "./stream.js";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const messageHistory: Anthropic.MessageParam[] = [];

export async function chat(userMessage: string): Promise<string> {
  messageHistory.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: "You are helpful assistant",
    messages: messageHistory,
  });

  const assistantMessage = await streamChat(
    client,
    messageHistory,
    "You are a helpful assistant.",
  );

  messageHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  return assistantMessage;
}
