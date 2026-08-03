# M2 — Harness Engineering: Planning + Sub-Agent Isolation Learnings

## What We Built
Copied P5's multi-agent article pipeline and restructured it into two layers:
a thin **orchestrator** that only ever sees a task's final summary, and a
**subagent** that does the real multi-step work (research → write → critique
→ revise) and logs its full trace to a separate file. Added an explicit
`write_todos` planning tool the orchestrator calls before and after
delegation.

---

## Setup Commands

```powershell
cd "E:\AI agents"
cp -r p5-multi-agent/. p7-advanced-modules/m02-harness-planning/   # excluding node_modules
cd p7-advanced-modules/m02-harness-planning
pnpm install
pnpm run demo "a topic to research and write about"
pnpm run typecheck
```

---

## Key Files

```
m02-harness-planning/
  src/
    agents/
      researcher.ts, writer.ts, critic.ts, reviser.ts  ← unchanged from P5, single LLM call each
    tools/
      write_todos.ts   ← in-memory + logs/todos.json plan state, called by the orchestrator
    subagent.ts         ← runs all 4 agent steps, records a full trace, returns {summary, artifactPaths} only
    orchestrator.ts      ← writes initial plan, delegates once, updates plan, tracks its own context size
    index.ts             ← CLI entry, calls runOrchestrator()
    types.ts              ← added TodoItem, TraceStep, SubagentResult
  logs/
    todos.json            ← current plan state (overwritten on every write_todos call)
    subagents/<run-id>.json  ← one full trace file per worker run
  HANDOFF.md
```

---

## Concepts Learned

### 1. Harness engineering vs. prompt engineering
The model (Claude) only ever sees whatever's in the messages array of the
API call it receives. The **harness** is everything else: what tools exist,
what gets logged where, what crosses from one agent's context into another's.
None of that is a prompting problem — it's architecture around the model.
M2 is entirely about that architecture layer, not about making any individual
LLM call smarter.

### 2. A "no-op" planning tool still works because it externalizes state
`write_todos` doesn't call an LLM and doesn't make any decision — it just
writes a plan to a file and prints it. It's valuable anyway because it forces
whatever's calling it (a human, or in a fuller version an LLM choosing to
call it as a tool) to make the plan **explicit and inspectable** instead of
implicit in the model's own reasoning, which you can't see or check between
steps.

### 3. Context quarantine — the actual technique, with real numbers
Ran the full pipeline once and measured it directly instead of assuming:
- Orchestrator's own tracked context grew from 354 → 613 chars across the
  entire delegation — **259 chars total**, exactly one summary string.
- The worker's full trace file for that same run: **28,489 chars**.

That's roughly a 110x gap between what the worker actually did and what the
orchestrator ever saw. The technique isn't "do less work" — the same 4 LLM
calls (research, write, 2x critique/revise) still happened. The technique is
**where the output of that work is allowed to go**. Only a summary crosses
the boundary back to the orchestrator; the full research brief, full draft,
full critic feedback (strengths/weaknesses/suggestions arrays), all stayed in
the subagent's trace file, never touched the orchestrator's context.

### 4. Trace vs. summary — different audiences
- **Trace** (`logs/subagents/<run-id>.json`) — for a human debugging later,
  or a future tool inspecting what happened. Complete, verbose, per-step.
- **Summary** (`SubagentResult.summary`) — for the *next agent step*. Just
  enough for the orchestrator to know the task succeeded and where to find
  more if it's ever needed (`artifactPaths`).
Conflating these (returning the trace itself as "the summary") would defeat
the entire point — the orchestrator's context would grow exactly as fast as
if there were no isolation boundary at all.

### 5. Restructuring an existing pipeline into layers, not rewriting it
None of the actual research/write/critique/revise logic changed from P5 —
same 4 functions, same prompts, same tool schemas. What changed was purely
*who calls what and who sees the return value*. This is a useful pattern to
recognize: harness changes are often about re-drawing boundaries around
existing logic, not rewriting the logic itself.

### 6. `orchestratorContext` is a simulation, not live application logic
This tripped me up hard and is worth writing down precisely. `orchestratorContext`
(the array `contextSize()` measures) is **not read by anything downstream** —
it doesn't feed into a second Claude call, it doesn't affect program behavior
at all. It exists purely as an instrument to make an otherwise-invisible
architectural decision visible as a number.

The scenario it's standing in for: if the orchestrator were itself an LLM
agent (not the deterministic TypeScript code we actually wrote), it would
need to resend its *entire* conversation history on every subsequent API
call — same "Claude has no memory, you resend history" fact from P1. The
368 → 634 char growth is simulating how much *that* history would have grown
by after one delegation, under our design (worker returns summary only) vs.
the alternative bad design (worker returns its full trace and the
orchestrator absorbs all of it — which would have produced a jump into the
tens of thousands of chars instead, matching the trace file size).

In a toy script with one delegation and no second orchestrator call, this
number has zero functional consequence. Its only job is proving the
concept before we trust it in a system where the consequence (cost, latency,
context rot per M3) would be real.

### 7. Why the todo list lives in the orchestrator, not the subagent
Initially assumed `write_todos` should move into `subagent.ts` since "all the
history and logic is in subagent." The actual distinction: the todo list and
the subagent's `trace` array answer different questions at different
granularities.
- **Todos** = the orchestrator's own checklist of *delegation-level*
  milestones ("has research+writing finished? has review finished?"). This
  has to live wherever can see across *all* delegations.
- **Trace** = one worker's internal step-by-step record of *how it did its
  own assigned chunk*. Only relevant to that one worker's own task.

The case that makes the ownership obvious: imagine the orchestrator
delegating to three different workers (write, fact-check, SEO) instead of
one. There would still be exactly one overall checklist tracking all three
delegations — and no single worker could own it, since each only knows about
its own slice. That's why todos belong to the thing coordinating the
delegations (the orchestrator), not the thing doing one delegated task (the
subagent) — even in our current one-worker case, the architecture is written
as if there could be more than one.

---

## Bugs We Hit & Why

| Bug | Cause | Fix |
|---|---|---|
| `ENOENT: no such file or directory, open '...\logs\todos.json'` | `write_todos.ts` called `writeFile` on `logs/todos.json` before the `logs/` directory existed (first run, nothing had created it yet) | Added `await mkdir("logs", { recursive: true })` before the write |
| Leftover `src/evals/run-evals.ts` from the P5 copy broke typecheck | It imported `runPipeline` from the old `agents/orchestrator.ts`, which no longer existed after restructuring into `subagent.ts` + `orchestrator.ts` | Deleted `src/evals/` — evals aren't in scope for M2; P5's own eval suite is untouched in `p5-multi-agent/` |
| `package.json` still said `"name": "p5-multi-agent"` and had a stale `evals` script after copying | Copy brought over P5's full `package.json` verbatim | Renamed to `m02-harness-planning`, replaced `pipeline`/`evals` scripts with `demo`/`typecheck` |
| No console output for ~20-30 seconds while the worker ran — indistinguishable from a hang | When P5's `runPipeline` was split into `subagent.ts`, the original `console.log("[Researcher]...")` etc. progress lines got dropped in the restructuring and were never carried over | Added `console.log` before/after each of the 4 internal steps (research, write, critic, revise) in `subagent.ts`. These print for the human only — confirmed they don't touch `orchestratorContext`, so they don't affect the context-size measurement |

---

## Where My Understanding Was Off (from live Q&A) — worth re-reading before M3

- **Assumed `write_todos` belonged in `subagent.ts`** because "all the history
  is there." Actual answer: todos are the orchestrator's own delegation-level
  checklist, not the worker's internal step record — different granularity,
  different owner. See Concept #7 above.
- **Didn't realize `orchestratorContext` was a measurement instrument, not
  real application logic.** Assumed the before/after numbers reflected some
  functional behavior of the program. They don't — nothing downstream reads
  that array. It exists solely to make the summary-vs-full-trace design
  decision visible as a number, standing in for what *would* happen if the
  orchestrator were a real LLM agent resending its history on every call.
  See Concept #6 above — this is the one worth re-reading most carefully.
- **Needed the full index → orchestrator → write_todos → subagent →
  researcher/writer/critic/reviser call chain traced explicitly**, line by
  line, before the summary-only return value actually clicked as "the one
  line that matters" rather than just one detail among many.

---

## Explain-It-Back

1. **What does the harness control that the model does not?** Which tools
   exist, what gets logged, and — the core of this module — what context
   crosses from one agent's turn/call into another's. The model only ever
   reasons over whatever's in the messages array it's handed; the harness
   decides what goes into that array.
2. **Why can a no-op planning tool still improve long tasks?** It forces
   state (the plan) out of the model's implicit reasoning and into something
   explicit and inspectable between steps — useful even without any LLM logic
   inside the tool itself.
3. **Why should a parent agent not see every worker message?** Every message
   it sees is context it's paying for (tokens) and reasoning over on every
   subsequent call. A worker's full trace (research brief, draft, detailed
   critique) is only relevant to debugging that one step — carrying all of it
   forward degrades and slows every later decision for no benefit.
4. **Difference between a trace and a summary?** Trace = complete record for
   a human/debugger, written once and read rarely. Summary = the minimum a
   caller needs to keep working, and the only thing structurally allowed to
   cross the isolation boundary.
5. **How did the demo prove isolation worked?** Directly measured both sides:
   orchestrator's tracked context grew by 259 chars; the worker's trace file
   for the identical run was 28,489 chars. The gap is the proof — not an
   assumption, a measured ~110x difference between work done and context grown.

---

## M2 — COMPLETE ✓

Built: orchestrator/subagent split, `write_todos` planning tool, per-run
trace logging, measured context-size before/after delegation.

## Next Up — M3
Context engineering: compaction and budgets *within* a single agent's own
growing history (as opposed to M2's technique of preventing history from
crossing agent boundaries in the first place). Build a `ContextManager` that
tracks token count, triggers compaction before the real window limit, and
verifies the system prompt is never touched by any compaction/summarization
pass.
