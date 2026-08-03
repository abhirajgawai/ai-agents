import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { runResearcher } from "./agents/researcher.js";
import { runWriter } from "./agents/writer.js";
import { runCritic } from "./agents/critic.js";
import { runReviser } from "./agents/reviser.js";
import type { Draft, FinalArticle, SubagentResult, TraceStep } from "./types.js";

const QUALITY_THRESHOLD = 0.8;
const MAX_ITERATIONS = 2;

function record(trace: TraceStep[], step: string, input: unknown, output: unknown, startedAt: string): void {
  trace.push({ step, input, output, startedAt, finishedAt: new Date().toISOString() });
}

/**
 * Runs the full research -> write -> critique -> revise worker loop.
 * Every step's full input/output is captured in `trace` and persisted to its
 * own log file. The caller (the orchestrator) never sees `trace` directly —
 * it only gets back the returned SubagentResult, which is the isolation
 * boundary this module exists to demonstrate.
 */
export async function runSubagent(topic: string): Promise<SubagentResult> {
  const runId = randomUUID();
  const trace: TraceStep[] = [];

  console.log("  [Worker] Researching...");
  let t0 = new Date().toISOString();
  const brief = await runResearcher(topic);
  record(trace, "research", { topic }, brief, t0);
  console.log(`  [Worker] Research done. ${brief.keyPoints.length} key points found.`);

  console.log("  [Worker] Writing first draft...");
  t0 = new Date().toISOString();
  const draft = await runWriter(brief);
  record(trace, "write", brief, draft, t0);
  console.log(`  [Worker] Draft done. ${draft.wordCount} words.`);

  let currentDraft: Draft = draft;
  let finalArticle: FinalArticle | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`  [Worker] Critiquing draft (round ${i + 1})...`);
    t0 = new Date().toISOString();
    const feedback = await runCritic(currentDraft);
    record(trace, `critic_${i + 1}`, currentDraft, feedback, t0);
    console.log(`  [Worker] Critic score: ${feedback.score}`);

    if (feedback.score >= QUALITY_THRESHOLD) {
      console.log("  [Worker] Quality threshold met.");
      finalArticle = {
        title: currentDraft.title,
        content: currentDraft.content,
        wordCount: currentDraft.wordCount,
        qualityScore: feedback.score,
      };
      break;
    }

    console.log(`  [Worker] Revising draft (round ${i + 1})...`);
    t0 = new Date().toISOString();
    const revised = await runReviser(currentDraft, feedback);
    record(trace, `revise_${i + 1}`, { currentDraft, feedback }, revised, t0);
    console.log(`  [Worker] Revision done. ${revised.wordCount} words.`);

    currentDraft = {
      title: revised.title,
      content: revised.content,
      wordCount: revised.wordCount,
    };

    if (i === MAX_ITERATIONS - 1) {
      finalArticle = revised;
    }
  }

  const article = finalArticle!;

  await mkdir("logs/subagents", { recursive: true });
  const tracePath = `logs/subagents/${runId}.json`;
  await writeFile(
    tracePath,
    JSON.stringify({ runId, topic, stepCount: trace.length, trace, finalArticle: article }, null, 2),
  );

  const summary =
    `Produced a ${article.wordCount}-word article titled "${article.title}" ` +
    `(quality score ${article.qualityScore.toFixed(2)}) after ${trace.length} internal steps ` +
    `(research, write, ${trace.length - 2} critique/revision round(s)). Full trace: ${tracePath}`;

  return { summary, artifactPaths: [tracePath] };
}
