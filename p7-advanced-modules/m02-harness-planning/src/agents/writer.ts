import Anthropic from "@anthropic-ai/sdk";
import { ResearchBrief, Draft } from "../types.js";

const client = new Anthropic();

export async function runWriter(brief: ResearchBrief): Promise<Draft> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8096,
    tools: [
      {
        name: "return_draft",
        description: "Return the completed article draft",
        input_schema: {
          type: "object" as const,
          properties: {
            title: { type: "string" },
            content: {
              type: "string",
              description: "Full article content, minimum 100 words",
            },
            wordCount: { type: "number" },
          },
          required: ["title", "content", "wordCount"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "return_draft" },
    messages: [
      {
        role: "user",
        content: `You are an expert writer. Write a compelling, well-structured article based on this research brief.

        Topic: ${brief.topic}

        Key Points:
        ${brief.keyPoints.map((p) => `- ${p}`).join("\n")}

        Context:
        ${brief.context}

      Write a ONLY 100-word article with a strong introduction, developed body paragraphs, and a clear conclusion.`,
      },
    ],
    cache_control: { type: "ephemeral" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Writer did not return a draft");
  }

  return toolUse.input as Draft;
}
