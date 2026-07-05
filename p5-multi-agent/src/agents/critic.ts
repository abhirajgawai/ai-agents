import Anthropic from "@anthropic-ai/sdk";
import { Draft, Feedback } from "../types.js";

const client = new Anthropic();

export async function runCritic(draft: Draft): Promise<Feedback> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    tools: [
      {
        name: "return_feedback",
        description: "Return structured feedback on the article draft",
        input_schema: {
          type: "object" as const,
          properties: {
            score: {
              type: "number",
              description: "Overall quality score from 0.0 to 1.0",
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "What the article does well",
            },
            weaknesses: {
              type: "array",
              items: { type: "string" },
              description: "What needs improvement",
            },
            suggestions: {
              type: "array",
              items: { type: "string" },
              description: "Specific actionable suggestions for improvement",
            },
          },
          required: ["score", "strengths", "weaknesses", "suggestions"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "return_feedback" },
    messages: [
      {
        role: "user",
        content: `You are a senior editor. Critically evaluate this article draft and return structured feedback.

Title: ${draft.title}

Content:
${draft.content}

Evaluate on: clarity, depth, structure, engagement, and accuracy. Be honest and specific.`,
      },
    ],
    cache_control: { type: "ephemeral" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Critic did not return feedback");
  }

  return toolUse.input as Feedback;
}
