import "dotenv/config";
import { runPipeline } from "../src/agents/orchestrator.js";
const topic = process.argv[2];

if (!topic) {
  console.error("Usage: pnpm run pipeline <topic>");
  process.exit(1);
}

runPipeline(topic).then((article) => {
  console.log("\n========== FINAL ARTICLE ==========");
  console.log(`Title: ${article.title}`);
  console.log(`Words: ${article.wordCount}`);
  console.log(`Quality Score: ${article.qualityScore}`);
  console.log("\n" + article.content);
  console.log("====================================");
});
