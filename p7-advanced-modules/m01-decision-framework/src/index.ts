import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { filterQuestions, isValidScore, type DecisionScores, type FilterScore } from "./filters.js";
import { recommend } from "./recommend.js";

async function askScore(
  lines: AsyncIterator<string>,
  prompt: string,
): Promise<FilterScore> {
  while (true) {
    stdout.write(`${prompt} (1-5): `);
    const { value, done } = await lines.next();
    if (done) {
      throw new Error("Input ended before all filters were answered.");
    }
    const num = Number(value.trim());
    if (isValidScore(num)) {
      return num;
    }
    console.log("Please enter a whole number from 1 to 5.");
  }
}

async function main() {
  const task = process.argv.slice(2).join(" ").trim();

  if (!task) {
    console.error('Usage: pnpm run score "task description"');
    process.exitCode = 1;
    return;
  }

  console.log(`\nTask: ${task}\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  const lines = rl[Symbol.asyncIterator]();
  const scores: Partial<DecisionScores> = {};

  try {
    for (const q of filterQuestions) {
      scores[q.key] = await askScore(lines, q.question);
    }
  } finally {
    rl.close();
  }

  const finalScores = scores as DecisionScores;
  const { verdict, reason } = recommend(finalScores);

  console.log("\nFilter scores:");
  for (const q of filterQuestions) {
    console.log(`- ${q.label}: ${finalScores[q.key]}/5`);
  }

  console.log(`\nRecommendation: ${verdict}`);
  console.log(`\nWhy:\n${reason}`);

  if (verdict === "dont_automate_yet") {
    console.log(
      "\nWarning: this task should not become an agent project yet. Address the blocking filter(s) above first.",
    );
  }
}

main();
