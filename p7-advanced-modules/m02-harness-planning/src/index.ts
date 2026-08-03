import "dotenv/config";
import { runOrchestrator } from "./orchestrator.js";

const topic = process.argv[2];

if (!topic) {
  console.error('Usage: pnpm run demo "topic"');
  process.exit(1);
}

runOrchestrator(topic).then((result) => {
  console.log("\n========== ORCHESTRATOR FINAL OUTPUT ==========");
  console.log(result.summary);
  console.log("Artifacts:", result.artifactPaths);
  console.log("=================================================");
});
