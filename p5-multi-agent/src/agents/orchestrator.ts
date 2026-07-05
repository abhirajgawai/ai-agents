import { runResearcher } from "../agents/researcher.js";
import { runWriter } from "../agents/writer.js";
import { runCritic } from "../agents/critic.js";
import { runReviser } from "../agents/reviser.js";
import { FinalArticle } from "../types.js";

const QUALITY_THRESHOLD = 0.8;
const MAX_ITERATIONS = 2;

export async function runPipeline(topic: string): Promise<FinalArticle> {
  console.log(`\n[Orchestrator] Starting pipeline for: "${topic}"`);

  console.log("[Researcher] Gathering research...");
  const brief = await runResearcher(topic);
  console.log(`[Researcher] Done. ${brief.keyPoints.length} key points found.`);

  console.log("[Writer] Writing first draft...");
  const draft = await runWriter(brief);
  console.log(`[Writer] Done. ${draft.wordCount} words.`);

  let currentDraft = draft;
  let finalArticle: FinalArticle | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`[Critic] Evaluating draft (iteration ${i + 1})...`);
    const feedback = await runCritic(currentDraft);
    console.log(`[Critic] Score: ${feedback.score}`);

    if (feedback.score >= QUALITY_THRESHOLD) {
      console.log("[Orchestrator] Quality threshold met. Finalizing.");
      finalArticle = {
        title: currentDraft.title,
        content: currentDraft.content,
        wordCount: currentDraft.wordCount,
        qualityScore: feedback.score,
      };
      break;
    }

    console.log("[Reviser] Improving draft...");
    const revised = await runReviser(currentDraft, feedback);
    console.log(`[Reviser] Done. ${revised.wordCount} words.`);

    currentDraft = {
      title: revised.title,
      content: revised.content,
      wordCount: revised.wordCount,
    };

    if (i === MAX_ITERATIONS - 1) {
      finalArticle = revised;
    }
  }

  return finalArticle!;
}
