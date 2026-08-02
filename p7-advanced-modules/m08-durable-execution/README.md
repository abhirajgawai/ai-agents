# M8 - Durable Execution & Reliability

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M8. It explains how to build a resumable workflow and prove that crashes do not duplicate side effects.

---

## 1. What This Module Is About

M8 teaches the production difference between "the code ran once" and "the workflow can survive failure." Long-running AI workflows need checkpointing, idempotency, and replay-safe behavior.

You will build a four-step pipeline:

```text
fetch -> process -> LLM-call -> write-result
```

Then you will kill it mid-run, restart it, and prove completed steps are not repeated.

---

## 2. What You Are Building

Build a workflow runner where each step:

- has a stable `run_id`
- has a stable `step_id`
- records completion
- checks for prior completion before running
- uses an idempotency key for side effects

The result should resume from the first incomplete step after a crash.

---

## 3. Concepts To Understand Before Coding

- **Checkpointing**: saving completed step state.
- **Durable execution**: workflow state survives process failure.
- **Idempotency**: repeating a request does not duplicate the side effect.
- **Replay safety**: workflow logic produces the same result when replayed.
- **Side effect**: external action such as writing a row, sending an email, or billing an LLM call.

Session memory is not durable execution. If the process dies, memory dies with it.

---

## 4. Recommended File Structure

```text
m08-durable-execution/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  DECISION.md
  data/
    workflow-state.json
  scripts/
    kill-mid-run.ps1
  src/
    workflow.ts
    state-store.ts
    demo.ts
    steps/
      fetch.ts
      process.ts
      llm-call.ts
      write-result.ts
```

File responsibilities:

- `DECISION.md`: hand-rolled checkpointing vs Temporal/DBOS/Inngest.
- `src/state-store.ts`: persists step status.
- `src/workflow.ts`: coordinates step execution.
- `src/steps/`: each idempotent step.
- `scripts/kill-mid-run.ps1`: failure test helper.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m08-durable-execution"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "demo": "tsx src/demo.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

For the first pass, a JSON file state store is acceptable. The concept is checkpoint behavior. You can move to Postgres or Temporal later.

---

## 6. Implementation Path

### Step 1 - Choose the durability approach

Recommended first implementation: hand-rolled checkpoint table or JSON state. This makes the mechanics visible.

Document the choice in `DECISION.md`.

### Step 2 - Define step state

Track:

- `run_id`
- `step_id`
- `status`
- `result`
- `completed_at`
- `idempotency_key`

### Step 3 - Implement `runStep()`

Before a step runs, check if it is already completed. If yes, return the saved result. If no, run the step and persist the result.

### Step 4 - Build the four steps

Use simple side effects:

- `fetch`: read or create input
- `process`: transform input
- `llm-call`: simulate or call an LLM once
- `write-result`: write output

For the LLM step, log enough to prove it was not billed or simulated twice after restart.

### Step 5 - Add crash testing

Add an option to crash after step 2. Restart with the same `run_id`. Steps 1 and 2 should be skipped, not repeated.

### Step 6 - Save evidence

Save logs showing:

- first run completed steps 1-2
- process crashed
- restart skipped steps 1-2
- workflow resumed from step 3

---

## 7. Verification Checklist

M8 is complete only when:

- workflow state persists outside process memory
- each step checks prior completion
- each side-effect step has an idempotency key
- crash after step 2 is reproducible
- restart resumes from step 3
- steps 1 and 2 are not repeated
- logs prove no duplicate side effect occurred
- `pnpm run typecheck` passes, if TypeScript is configured
- `HANDOFF.md` explains checkpointing vs durable execution

---

## 8. What To Put In HANDOFF.md

Include:

- how to run the normal workflow
- how to run the crash test
- state-store format
- example step records
- evidence that completed steps were skipped
- idempotency key strategy
- limitations compared with Temporal or DBOS

---

## 9. Explain-It-Back Questions

Before moving to M9, answer:

1. Why is retry without idempotency dangerous?
2. What makes a step side-effecting?
3. Why can `Date.now()` or randomness cause replay issues?
4. What does checkpointing protect against?
5. How did your crash test prove reliability?
