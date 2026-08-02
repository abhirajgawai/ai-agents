# M6 - Evals & Error Analysis, Properly

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M6. It explains how to turn a basic eval script into a real evaluation harness and learning workflow.

---

## 1. What This Module Is About

M6 teaches that evals are not just a pass/fail script. The real workflow is error analysis: reading traces, identifying failure modes, adding targeted cases, and proving regressions are caught.

You will upgrade P5's eval approach into a harness with:

- a golden set
- deterministic scorers
- limited LLM-as-judge use
- trajectory checks
- regression evidence

The core lesson: "the final answer looked good" is not enough for agent evaluation.

---

## 2. What You Are Building

Build an eval suite that runs 30-50 test cases and reports:

- pass/fail per case
- deterministic check results
- LLM judge result where needed
- tool trajectory result
- overall pass rate
- specific failed cases

The suite should catch both bad final outputs and suspicious paths that got the right answer for the wrong reason.

---

## 3. Concepts To Understand Before Coding

- **Golden set**: stable test cases that represent real expected behavior and known failures.
- **Deterministic scorer**: code-based check for schemas, regexes, expected tools, or exact conditions.
- **LLM-as-judge**: a model evaluates subjective output against a strict rubric.
- **Trajectory**: the ordered path of messages, tools, retrievals, and actions.
- **Regression**: a change that makes previously working behavior worse.

A 100 percent pass rate is suspicious unless the suite is tiny or too easy.

---

## 4. Recommended File Structure

```text
m06-evals-harness/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  eval-baseline.json
  golden-set/
    case-001.json
  traces/
  reports/
  src/
    run-suite.ts
    types.ts
    scorers/
      code-assertions.ts
      llm-judge.ts
      trajectory.ts
```

File responsibilities:

- `golden-set/`: fixed eval cases.
- `src/scorers/code-assertions.ts`: deterministic checks.
- `src/scorers/llm-judge.ts`: subjective checks with a binary rubric.
- `src/scorers/trajectory.ts`: expected tool/action path checks.
- `reports/`: saved eval outputs.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m06-evals-harness"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "eval-suite": "tsx src/run-suite.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

You can start with fewer than 30 cases while building, but the module is not complete until the golden set reaches 30-50 meaningful cases.

---

## 6. Implementation Path

### Step 1 - Define the eval case schema

Create `src/types.ts` with fields such as:

- `id`
- `input`
- `expectedSchema`
- `expectedTools`
- `rubric`
- `knownFailureMode`

### Step 2 - Create initial golden cases

Start with 5 cases to prove the harness works, then expand to 30-50. Include known failure modes, not only happy paths.

### Step 3 - Add deterministic scorers

Use code checks wherever possible:

- output is valid JSON
- required fields exist
- specific tool was called
- output contains or avoids a pattern

### Step 4 - Add LLM-as-judge only where needed

Use it for subjective questions such as tone, escalation quality, or usefulness. The rubric should return binary pass/fail, not a vague 1-5 score.

### Step 5 - Add trajectory checks

Check which tools were called and in what order. This catches cases where the final answer is acceptable but the agent skipped required grounding.

### Step 6 - Run regression proof

Deliberately weaken a prompt or behavior. Confirm the suite catches the regression. Then revert and confirm the score recovers.

---

## 7. Verification Checklist

M6 is complete only when:

- 30-50 golden cases exist
- deterministic scorers run
- LLM judge is used only for subjective cases
- LLM judge uses a written binary rubric
- trajectory checks exist
- suite reports pass rate and failed case ids
- pass rate is not artificially 100 percent
- deliberate regression lowers the pass rate
- reverting the regression restores the pass rate
- `HANDOFF.md` summarizes the top failure modes found

---

## 8. What To Put In HANDOFF.md

Include:

- how to run the suite
- number of golden cases
- scorer types implemented
- current pass rate
- examples of failures
- deliberate regression result
- what you learned from reading traces
- next eval improvements

---

## 9. Explain-It-Back Questions

Before moving to M7, answer:

1. Why is error analysis the workflow, not the eval script?
2. When should you avoid LLM-as-judge?
3. Why are trajectory checks useful?
4. Why can 100 percent pass rate be a warning?
5. What failure mode did your suite expose?
