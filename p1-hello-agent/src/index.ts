import * as readline from "readline";
import { chat } from "./agent.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(): void {
  rl.question("You: ", async (input) => {
    const trimmed = input.trim();

    if (trimmed.toLowerCase() == "exit") {
      console.log("Goodbye");
      rl.close();
      return;
    }

    const response = await chat(trimmed);

    askQuestion();
  });
}

console.log('Chat started. Type "exit" to quit.\n');
askQuestion();
