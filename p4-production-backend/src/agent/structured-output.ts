import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The exact JSON shape we want back, expressed as a tool input schema.
const classifyTool: Anthropic.Tool = {
  name: "record_sentiment",
  description: "Record the sentiment analysis of the user's text.",
  input_schema: {
    type: "object",
    properties: {
      sentiment: {
        type: "string",
        enum: ["positive", "negative", "neutral"],
        description: "Overall sentiment of the text",
      },
      confidence: {
        type: "number",
        description: "Confidence from 0 to 1",
      },
      reason: {
        type: "string",
        description: "One short sentence explaining why",
      },
    },
    required: ["sentiment", "confidence", "reason"],
  },
};

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  reason: string;
}

export async function classifySentiment(
  text: string,
): Promise<SentimentResult> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    tools: [classifyTool],
    // Force Claude to call our tool — no prose allowed.
    tool_choice: { type: "tool", name: "record_sentiment" },
    messages: [
      {
        role: "user",
        content: `<user_input>\n${text}\n</user_input>`,
      },
    ],
  });

  // The tool_use block's input IS our structured output.
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Expected a tool_use block but got none");
  }

  return toolUse.input as SentimentResult;
}
