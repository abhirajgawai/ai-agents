# M2 Harness Engineering - Handoff

## Status

Complete.

## How To Run

```powershell
cd "E:\AI agents\p7-advanced-modules\m02-harness-planning"
pnpm install
pnpm run demo "a topic to research and write about"
pnpm run typecheck
```

## What Changed From P5

P5's `src/agents/orchestrator.ts` (a linear `runPipeline()` function) was
split into two separate concerns:

- **`src/subagent.ts`** — the worker. Runs the exact same
  research → write → critique → revise sequence P5 had, but now records a
  `TraceStep` after every call (input, output, timestamps) and persists the
  full trace to `logs/subagents/<run-id>.json`. Returns only
  `{ summary, artifactPaths }` to its caller — never the trace itself.
- **`src/orchestrator.ts`** — new. A thin harness-level coordinator that
  writes an initial plan, delegates the entire task to `runSubagent()` as one
  call, and only ever sees that function's return value.

Nothing about the underlying research/write/critique/revise logic changed —
only who sees what.

## Where Todo State Is Stored

`src/tools/write_todos.ts` keeps the current plan in an in-memory array and
mirrors every update to `logs/todos.json`. The orchestrator calls it once
before delegating (initial plan) and three more times after (marking each
todo done as the run completes).

## Where Sub-Agent Traces Are Stored

`logs/subagents/<run-id>.json` — one file per worker run, containing every
step's full input, full output, and start/finish timestamps. This file is
never read by the orchestrator; it exists purely for a human (or a future
debugging tool) to inspect.

## Before/After Context-Size Note (real numbers from a live run)

```
[Orchestrator] Context size before delegation: 354 chars
[Orchestrator] Context size after delegation: 613 chars
```

The orchestrator's own tracked context grew by 259 characters — exactly one
summary string. The worker's full trace file for that same run was
**28,489 characters** — about 110x larger than what the orchestrator ever
saw. That ratio is the entire point of the module: the orchestrator did not
get cheaper by doing less work, it got cheaper because the work it delegated
never entered its own context in the first place.

## One Example Trace That Never Entered Orchestrator Context

From `logs/subagents/051520fd-ffe2-4fe5-b768-68a629309400.json`, step
`critic_1` — the full structured feedback object returned by the critic agent
(score, strengths array, weaknesses array, suggestions array — several
hundred characters of detailed editorial feedback). The orchestrator's log
shows only the aggregate fact that "4 critique/revision rounds" happened;
it never saw a single strength, weakness, or suggestion the critic wrote.

## What This Teaches Before M3

M3 is about compaction and context budgets *within* a single agent's growing
history. M2 is the complementary technique: instead of managing a large
context after the fact, prevent it from becoming large in the first place by
never letting verbose intermediate work cross an agent boundary. M3 will
apply compaction/summarization to the orchestrator's own history once it
grows past a threshold — but the summary discipline used here (return only
`{summary, artifactPaths}`, never the trace) is the same instinct M3's
summarization strategy formalizes for a single agent's own turns.
