import { writeTodos, updateTodoStatus } from "./tools/write_todos.js";
import { runSubagent } from "./subagent.js";
import type { SubagentResult, TodoItem } from "./types.js";

/**
 * Everything pushed into orchestratorContext is what a real orchestrator LLM
 * call would see on its next turn. We track it as plain strings here just to
 * measure size -- the point isn't the exact number, it's that this array only
 * ever grows by "one summary" per delegation, never by a worker's full trace.
 */
const orchestratorContext: string[] = [];

function contextSize(): number {
  return orchestratorContext.reduce((sum, entry) => sum + entry.length, 0);
}

export async function runOrchestrator(topic: string): Promise<SubagentResult> {
  const todos: TodoItem[] = [
    { id: "1", text: `Research and draft an article on: ${topic}`, status: "pending" },
    { id: "2", text: "Review draft quality and revise if needed", status: "pending" },
    { id: "3", text: "Return final summary to caller", status: "pending" },
  ];

  await writeTodos(todos);
  orchestratorContext.push(`Plan: ${JSON.stringify(todos)}`);

  await updateTodoStatus("1", "in_progress");
  orchestratorContext.push(`Delegating to worker for topic: ${topic}`);

  console.log(`\n[Orchestrator] Context size before delegation: ${contextSize()} chars`);
  const result = await runSubagent(topic);
  console.log(`[Orchestrator] Received back only: { summary, artifactPaths } (worker's full trace stayed in ${result.artifactPaths[0]})`);

  // This is the isolation boundary: only the summary string enters context,
  // never the worker's intermediate research/draft/feedback payloads.
  orchestratorContext.push(`Worker result: ${result.summary}`);
  console.log(`[Orchestrator] Context size after delegation: ${contextSize()} chars`);

  await updateTodoStatus("1", "done");
  await updateTodoStatus("2", "done");
  await updateTodoStatus("3", "done");

  return result;
}
