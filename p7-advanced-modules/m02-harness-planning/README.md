# M2 - Harness Engineering: Planning + Sub-Agent Isolation

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M2. The master plan defines the module. This file explains how to approach the build, what to understand first, and how to know the module is complete.

---

## 1. What This Module Is About

M2 teaches the difference between the model and the harness around the model. The model generates reasoning and tool calls. The harness decides what tools exist, what context is visible, what gets logged, and what crosses agent boundaries.

You are adding two production patterns to a copy of the P5 multi-agent orchestrator:

- a visible planning tool called `write_todos`
- a sub-agent isolation boundary that keeps worker traces out of the orchestrator context

The core lesson: long-running agents improve when planning state and worker traces are handled by the system, not left entirely inside the model's context window.

---

## 2. What You Are Building

Copy P5 into this module, then modify the copy only. Do not change `p5-multi-agent`.

Expected result:

```text
orchestrator starts
orchestrator writes todos
orchestrator delegates to worker
worker performs 5+ internal steps
worker saves full trace separately
orchestrator receives only { summary, artifactPaths }
orchestrator updates todos
```

The final demo should show that the worker did meaningful internal work while the orchestrator context stayed small.

---

## 3. Concepts To Understand Before Coding

- **Harness engineering**: controlling the runtime, tools, logs, context, and boundaries around the model.
- **Planning tool**: a tool whose main job is to externalize state. It can be simple and still useful.
- **Context quarantine**: keeping verbose worker history out of the parent agent.
- **Trace vs summary**: the trace is for debugging; the summary is for the next agent step.

If the orchestrator sees every worker message, the context grows fast and later decisions get noisier. If it sees only the final summary, the system stays cheaper and easier to reason about.

---

## 4. Recommended File Structure

```text
m02-harness-planning/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  logs/
    subagents/
  src/
    orchestrator.ts
    subagent.ts
    types.ts
    tools/
      write_todos.ts
```

File responsibilities:

- `src/tools/write_todos.ts`: stores and updates visible todo state.
- `src/subagent.ts`: runs a worker loop and returns only `{ summary, artifactPaths }`.
- `src/orchestrator.ts`: coordinates the task and uses both planning and isolation.
- `logs/subagents/`: stores full worker traces for inspection.
- `HANDOFF.md`: explains the architecture and evidence from the run.

---

## 5. Setup Steps

From the repo root:

```powershell
Copy-Item -Recurse "p5-multi-agent\*" "p7-advanced-modules\m02-harness-planning"
cd "E:\AI agents\p7-advanced-modules\m02-harness-planning"
pnpm install
```

If P5 is not complete, scaffold this module as a small TypeScript project and build a simplified orchestrator. The point of M2 is not article generation; the point is planning state and sub-agent isolation.

---

## 6. Implementation Path

### Step 1 - Add shared result types

Create or update `src/types.ts`:

```typescript
export interface TodoItem {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "done";
}

export interface SubagentResult {
  summary: string;
  artifactPaths: string[];
}
```

### Step 2 - Build the `write_todos` tool

Create `src/tools/write_todos.ts`.

It should accept a list of todo items, write them to memory or a local JSON file, and log every update. Keep the first version simple. The important behavior is visibility: you should be able to see when the orchestrator planned and when it updated the plan.

### Step 3 - Wrap worker execution

Create `src/subagent.ts`.

The wrapper should:

1. accept a task
2. run several internal worker steps
3. save the full trace to `logs/subagents/<run-id>.json`
4. return only `{ summary, artifactPaths }`

The orchestrator must not receive the worker's full message history.

### Step 4 - Modify the orchestrator

Update `src/orchestrator.ts` so the flow is:

1. write initial todos
2. delegate to a worker through `runSubagent()`
3. receive only the summary
4. update todos
5. produce final output

Add simple token or message-size logging before and after delegation. A rough character count is acceptable at first if you do not have a token counter wired yet.

### Step 5 - Run a demo

Run a task where the worker performs at least five internal steps. Save:

- orchestrator log
- sub-agent trace log
- final output

---

## 7. Verification Checklist

M2 is complete only when:

- P5 was copied or a small equivalent orchestrator was scaffolded inside this module
- `write_todos` is called before and after delegation
- the worker performs 5+ internal steps
- the worker full trace is saved separately
- the orchestrator receives only a summary and artifact paths
- the orchestrator context size stays mostly flat across delegation
- there is a saved run log proving the behavior
- `pnpm run typecheck` passes, if TypeScript is configured
- `HANDOFF.md` explains the harness boundary clearly

---

## 8. What To Put In HANDOFF.md

Include:

- how to run the demo
- what changed from P5
- where todo state is stored
- where sub-agent traces are stored
- a short before/after context-size note
- one example of a worker trace that did not enter orchestrator context
- what this teaches you before M3

---

## 9. Explain-It-Back Questions

Before moving to M3, answer:

1. What does the harness control that the model does not?
2. Why can a no-op planning tool still improve long tasks?
3. Why should a parent agent not see every worker message?
4. What is the difference between a trace and a summary?
5. How did your demo prove isolation worked?
