import Anthropic from "@anthropic-ai/sdk";
import { ResearchBrief } from "../types.js";

const client = new Anthropic();

export async function runResearcher(topic: string): Promise<ResearchBrief> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    tools: [
      {
        name: "return_research_brief",
        description: "Return the completed research brief",
        input_schema: {
          type: "object" as const,
          properties: {
            topic: { type: "string" },
            keyPoints: {
              type: "array",
              items: { type: "string" },
              description: "2-3 key points about the topic",
            },
            sources: {
              type: "array",
              items: { type: "string" },
              description: "Relevant sources or references",
            },
            context: {
              type: "string",
              description: "Background context and current state of the topic",
            },
          },
          required: ["topic", "keyPoints", "sources", "context"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "return_research_brief" },
    messages: [
      {
        role: "user",
        content: `You are a research specialist. Research the following topic thoroughly and return a structured research brief.\n\nTopic: ${topic}`,
      },
    ],
    cache_control: { type: "ephemeral" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Researcher did not return a research brief");
  }

  return toolUse.input as ResearchBrief;
}
