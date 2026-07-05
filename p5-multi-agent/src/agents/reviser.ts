import Anthropic from "@anthropic-ai/sdk";
import { Draft, Feedback, FinalArticle } from "../types.js";

const client = new Anthropic();

export async function runReviser(
  draft: Draft,
  feedback: Feedback,
): Promise<FinalArticle> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8096,
    tools: [
      {
        name: "return_final_article",
        description: "Return the revised, polished final article",
        input_schema: {
          type: "object" as const,
          properties: {
            title: { type: "string" },
            content: {
              type: "string",
              description: "Fully revised article content",
            },
            wordCount: { type: "number" },
            qualityScore: {
              type: "number",
              description: "Expected quality score after revisions",
            },
          },
          required: ["title", "content", "wordCount", "qualityScore"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "return_final_article" },
    messages: [
      {
        role: "user",
        content: `You are an expert editor. Revise this article based on the feedback provided. ONLY 100 WORDS

            ORIGINAL ARTICLE:
            Title: ${draft.title}
            Content:
            ${draft.content}

            FEEDBACK (score: ${feedback.score}/1.0):
            Weaknesses:
            ${feedback.weaknesses.map((w) => `- ${w}`).join("\n")}

            Suggestions:
            ${feedback.suggestions.map((s) => `- ${s}`).join("\n")}

            Address every suggestion. Preserve the strengths. Return a polished final article.`,
      },
    ],
    cache_control: { type: "ephemeral" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Reviser did not return a final article");
  }

  return toolUse.input as FinalArticle;
}
