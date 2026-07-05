import { runAgent } from "./agent.js";

const question = process.argv.slice(2).join(" ");

if (!question) {
  console.error('Usage: pnpm dev "your research question here"');
  process.exit(1);
}

runAgent(question).catch(console.error);
