import "dotenv/config";
import { teach, ask } from "./rag-pipeline.js";

const command = process.argv[2];
const input = process.argv[3];

if (!command || !input) {
  console.error("Usage: pnpm run teach <file> OR pnpm run ask <question>");
  process.exit(1);
}

if (command === "teach") {
  await teach(input);
} else if (command === "ask") {
  await ask(input);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
