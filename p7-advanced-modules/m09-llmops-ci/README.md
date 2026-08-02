# M9 - LLMOps / CI Gate for Prompts

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M9. It explains how to turn M6's eval suite into a CI gate that catches prompt regressions.

---

## 1. What This Module Is About

M9 teaches that prompts are production artifacts. If a prompt change can break behavior, it needs versioning, review, and automated regression checks.

You will run the M6 eval suite in GitHub Actions and fail the check when prompt quality regresses beyond a defined threshold.

The core lesson: prompt changes should be tested like code changes.

---

## 2. What You Are Building

Build a CI workflow that:

- installs dependencies
- runs `pnpm run eval-suite`
- reads the current eval baseline
- fails if the pass rate drops more than the allowed threshold
- blocks a deliberately bad prompt change

You will also move prompts into named, versioned constants.

---

## 3. Concepts To Understand Before Coding

- **Prompt versioning**: prompts have names and change notes.
- **Eval baseline**: last known-good score.
- **Regression threshold**: allowed drop before CI fails.
- **CI gate**: an automated check that blocks bad changes.
- **Canary bucketing**: deterministic routing for future gradual rollout.

This module builds the offline eval gate. It does not need a full deployment pipeline yet.

---

## 4. Recommended File Structure

```text
m09-llmops-ci/
  README.md
  HANDOFF.md
  eval-baseline.json
  package.json
  tsconfig.json
  .github/
    workflows/
      eval-gate.yml
  src/
    prompts/
      index.ts
    canary-bucket.ts
    check-regression.ts
```

File responsibilities:

- `.github/workflows/eval-gate.yml`: runs the eval gate on PRs.
- `eval-baseline.json`: stores last known-good score.
- `src/prompts/`: prompt constants and versions.
- `src/check-regression.ts`: compares current result to baseline.
- `src/canary-bucket.ts`: deterministic rollout helper.

---

## 5. Setup Steps

Start from M6's eval harness. Either copy it here or wire this module to run M6 directly.

```powershell
cd "E:\AI agents\p7-advanced-modules\m09-llmops-ci"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "eval-suite": "tsx src/run-suite.ts",
    "check-regression": "tsx src/check-regression.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

If you reuse M6's suite, document the exact path in `HANDOFF.md`.

---

## 6. Implementation Path

### Step 1 - Establish the baseline

Create `eval-baseline.json`:

```json
{
  "passRate": 0.82,
  "caseCount": 40,
  "updatedReason": "Initial M6 baseline"
}
```

Use your real M6 result when available.

### Step 2 - Move prompts into versioned constants

Create `src/prompts/index.ts`. Each prompt should have:

- name
- version
- text
- change note

Avoid anonymous prompt strings scattered through the code.

### Step 3 - Implement regression comparison

`src/check-regression.ts` should fail the process if current pass rate drops more than the threshold, for example 2 percent.

### Step 4 - Add GitHub Actions workflow

Create `.github/workflows/eval-gate.yml` that runs:

```powershell
pnpm install
pnpm run eval-suite
pnpm run check-regression
```

Use Linux commands inside GitHub Actions unless you intentionally choose Windows runners.

### Step 5 - Add deterministic canary helper

Implement:

```text
hash(user_id + prompt_name) % 100
```

This does not need real traffic. The point is learning stable rollout assignment.

### Step 6 - Prove the gate catches regressions

Deliberately weaken a prompt, open or simulate a PR run, and save evidence that the gate fails. Revert and prove it passes again.

---

## 7. Verification Checklist

M9 is complete only when:

- prompts are named and versioned
- `eval-baseline.json` exists
- regression threshold is implemented
- GitHub Actions workflow exists
- CI runs the eval suite
- deliberate prompt regression fails the gate
- reverting the regression passes the gate
- canary bucketing function exists
- `HANDOFF.md` explains how baseline updates are controlled

---

## 8. What To Put In HANDOFF.md

Include:

- how the eval suite is invoked
- current baseline score
- regression threshold
- workflow file path
- deliberate failure evidence
- revert/pass evidence
- prompt versioning convention
- when baseline should be updated

---

## 9. Explain-It-Back Questions

Before moving to M10, answer:

1. Why should prompts be versioned?
2. Why should baseline updates be intentional?
3. What does the CI gate protect?
4. Why use a regression threshold instead of requiring exact equality?
5. How does deterministic canary bucketing help later?
