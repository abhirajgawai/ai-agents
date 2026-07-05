import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { runPipeline } from "../agents/orchestrator.js";

const client = new Anthropic();

interface EvalCase {
  topic: string;
  mustContain: string[];
  minWordCount: number;
}

const TEST_CASES: EvalCase[] = [
  {
    topic: "The impact of large language models on software development",
    mustContain: ["code generation", "developer productivity", "limitations"],
    minWordCount: 100,
  },
  {
    topic: "How vector databases work",
    mustContain: ["embeddings", "similarity search", "use cases"],
    minWordCount: 100,
  },
  {
    topic: "The role of reinforcement learning in AI agents",
    mustContain: ["reward", "policy", "environment"],
    minWordCount: 100,
  },
];

async function judgeArticle(
  article: string,
  evalCase: EvalCase,
): Promise<{ pass: boolean; score: number; reasoning: string }> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [
      {
        name: "return_judgment",
        description: "Return the evaluation judgment",
        input_schema: {
          type: "object" as const,
          properties: {
            pass: {
              type: "boolean",
              description: "Whether the article passes quality standards",
            },
            score: {
              type: "number",
              description: "Quality score from 0.0 to 1.0",
            },
            reasoning: {
              type: "string",
              description: "Brief explanation of the judgment",
            },
          },
          required: ["pass", "score", "reasoning"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "return_judgment" },
    messages: [
      {
        role: "user",
        content: `Evaluate this article against the criteria below.

ARTICLE:
${article}

CRITERIA:
- Minimum word count: ${evalCase.minWordCount}
- Must meaningfully discuss: ${evalCase.mustContain.join(",")}

Score 0.0-1.0. Pass if score >= 0.7 AND all required topics are covered.`,
      },
    ],
    cache_control: { type: "ephemeral" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Judge did not return a judgment");
  }

  return toolUse.input as { pass: boolean; score: number; reasoning: string };
}

async function runEvals() {
  console.log(`\nRunning ${TEST_CASES.length} eval cases...\n`);

  let passed = 0;
  const results = [];

  for (const evalCase of TEST_CASES) {
    console.log(`Topic: "${evalCase.topic}"`);

    try {
      const article = await runPipeline(evalCase.topic);
      const judgment = await judgeArticle(article.content, evalCase);

      if (judgment.pass) passed++;

      results.push({
        topic: evalCase.topic,
        pass: judgment.pass,
        score: judgment.score,
        reasoning: judgment.reasoning,
      });

      console.log(`  Result: ${judgment.pass ? "PASS" : "FAIL"}`);
      console.log(`  Score: ${judgment.score}`);
      console.log(`  Reason: ${judgment.reasoning}\n`);
    } catch (err) {
      console.error(`  ERROR: ${err}\n`);
      results.push({
        topic: evalCase.topic,
        pass: false,
        score: 0,
        reasoning: "Pipeline error",
      });
    }
  }

  const passRate = (passed / TEST_CASES.length) * 100;
  console.log("========== EVAL RESULTS ==========");
  console.log(`Passed: ${passed}/${TEST_CASES.length}`);
  console.log(`Pass rate: ${passRate.toFixed(0)}%`);
  console.log("==================================");
}

runEvals();
