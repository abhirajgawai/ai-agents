import { mkdir, writeFile } from "node:fs/promises";
import type { TodoItem } from "../types.js";

const TODOS_LOG_PATH = "logs/todos.json";

let currentTodos: TodoItem[] = [];

export function getTodos(): TodoItem[] {
  return currentTodos;
}

export async function writeTodos(todos: TodoItem[]): Promise<void> {
  currentTodos = todos;
  console.log("\n[write_todos] Plan updated:");
  for (const todo of todos) {
    const marker = todo.status === "done" ? "[x]" : todo.status === "in_progress" ? "[~]" : "[ ]";
    console.log(`  ${marker} ${todo.id}: ${todo.text}`);
  }
  await mkdir("logs", { recursive: true });
  await writeFile(TODOS_LOG_PATH, JSON.stringify(todos, null, 2));
}

export async function updateTodoStatus(id: string, status: TodoItem["status"]): Promise<void> {
  const next = currentTodos.map((t) => (t.id === id ? { ...t, status } : t));
  await writeTodos(next);
}
