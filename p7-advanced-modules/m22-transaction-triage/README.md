# M22 - High-Volume Transaction Triage

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M22. It combines the decision framework, evals, durable execution, and FinOps patterns into a realistic high-volume triage pipeline.

---

## 1. What This Module Is About

M22 teaches the right shape for a 2,000-transactions-per-day review process. The answer is not "send every transaction to an agent." The right approach is layered:

```text
rules -> anomaly detection -> LLM for ambiguous residue -> human review
```

The core lesson: use the cheapest reliable method at each stage and reserve the LLM for judgment that rules and statistics cannot handle.

---

## 2. What You Are Building

Build a synthetic transaction triage system that:

- generates about 2,000 transactions
- plants known anomalies
- auto-clears obvious clean transactions
- flags obvious bad transactions with deterministic rules
- uses statistical anomaly detection for unusual behavior
- calls an LLM only for ambiguous residual cases
- routes low-confidence or high-risk cases to human review
- reports recall and false positives

---

## 3. Concepts To Understand Before Coding

- **Rules engine**: deterministic checks for obvious cases.
- **Anomaly detection**: statistical outlier detection against account-specific behavior.
- **LLM residue**: cases that need judgment after cheaper filters.
- **Recall**: did you catch the anomalies you planted?
- **False-positive rate**: how many clean transactions were unnecessarily routed to review?
- **Review queue rate**: how much human workload remains?

For this module, missing a seeded anomaly is a real bug.

---

## 4. Recommended File Structure

```text
m22-transaction-triage/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  data/
    synthetic-transactions.json
  reports/
    triage-results.md
  src/
    generate-synthetic-transactions.ts
    rules-engine.ts
    anomaly-detection.ts
    llm-judgment.ts
    review-queue.ts
  eval/
    measure-triage.ts
```

File responsibilities:

- `src/generate-synthetic-transactions.ts`: creates clean and anomalous data.
- `src/rules-engine.ts`: deterministic tier.
- `src/anomaly-detection.ts`: statistical tier.
- `src/llm-judgment.ts`: judgment only for ambiguous residue.
- `src/review-queue.ts`: routes final cases.
- `eval/measure-triage.ts`: reports metrics.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m22-transaction-triage"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "generate": "tsx src/generate-synthetic-transactions.ts",
    "triage": "tsx eval/measure-triage.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Use synthetic data only. Do not use real financial records.

---

## 6. Implementation Path

### Step 1 - Generate synthetic transactions

Create around 2,000 transactions with:

- normal accounts
- normal transaction ranges
- known seeded anomalies

Seed examples:

- amount over threshold
- sender or receiver on watchlist
- duplicate transaction id
- sudden velocity spike
- round-number structuring pattern
- name mismatch

### Step 2 - Implement rules engine

Rules should catch obvious cases cheaply and explain each decision.

Example reason:

```text
flagged_by_rule: receiver_on_watchlist
```

### Step 3 - Implement anomaly detection

Compare transactions against that account's own history, not a global average. Use simple mean/stddev or IQR first.

### Step 4 - Add LLM judgment for residue only

Only call the LLM for cases that:

- passed hard rules
- triggered soft anomaly signals
- contain ambiguous context

The LLM should return structured output with verdict, confidence, and reason.

### Step 5 - Route review queue

Auto-clear low-risk cases with logged reasons. Route low-confidence or high-risk cases to human review.

### Step 6 - Measure triage

Report:

- auto-clear rate
- review queue rate
- recall against seeded anomalies
- false-positive rate on clean transactions
- number of LLM calls avoided by rules/stats

---

## 7. Verification Checklist

M22 is complete only when:

- about 2,000 synthetic transactions are generated
- seeded anomalies are documented
- rules engine runs
- anomaly detection runs
- LLM judgment is only used for residue
- review queue output exists
- eval reports auto-clear rate
- eval reports review queue rate
- eval reports recall on seeded anomalies
- eval reports false-positive rate
- recall is 100 percent on seeded anomalies or misses are treated as bugs and fixed
- `HANDOFF.md` explains why not every transaction goes to an agent

---

## 8. What To Put In HANDOFF.md

Include:

- data generation command
- anomaly types seeded
- triage command
- metric table
- auto-clear rate
- review queue rate
- recall result
- false-positive result
- LLM call count
- what you would change for real financial data

---

## 9. Explain-It-Back Questions

Before considering P7 complete, answer:

1. Why is a fully agentic transaction reviewer the wrong default?
2. Which tier catches the cheapest obvious cases?
3. Why compare behavior per account instead of globally?
4. Why is recall on seeded anomalies critical?
5. What percentage of work did the pipeline keep away from the LLM?
