# M21 - Document Forgery / Authenticity Detection

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M21. It applies earlier document AI and decision-framework lessons to authenticity checks for financial-style documents.

---

## 1. What This Module Is About

M21 teaches that forgery detection should start with cheap deterministic checks before asking an LLM to judge whether something "looks fake." Many document edits leave structural evidence: metadata changes, inconsistent text layers, font differences, or arithmetic errors.

You will extend the M10 pipeline with authenticity checks over synthetic bank statements or safe public sample documents.

The core lesson: rules first, judgment second, human review for uncertainty.

---

## 2. What You Are Building

Build a document authenticity pipeline that outputs:

- risk score
- specific flagged reasons
- per-check evidence
- human review recommendation

Checks should include:

- metadata check
- text layer check
- font consistency check
- arithmetic reconciliation
- combined risk score

Never use a real person's actual bank statement. Use synthetic or public-safe samples.

---

## 3. Concepts To Understand Before Coding

- **Metadata trail**: creator, producer, timestamps, and edit markers.
- **Text-layer mismatch**: suspicious selectable text over a scanned-looking page.
- **Font consistency**: edited values may use different font metrics.
- **Arithmetic reconciliation**: balances should match transactions.
- **Specific reason**: "balance does not reconcile on row 12" is useful; "suspicious" is not.

An LLM may help explain ambiguous anomalies, but it should not be the first detector.

---

## 4. Recommended File Structure

```text
m21-document-forgery/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  test-fixtures/
    genuine/
    forged/
  reports/
    fixture-results.md
  src/
    run-forensics.ts
    forensics/
      metadata-check.ts
      text-layer-check.ts
      font-consistency-check.ts
      arithmetic-check.ts
      risk-score.ts
```

File responsibilities:

- `test-fixtures/`: safe genuine and deliberately edited samples.
- `src/forensics/`: independent checks.
- `src/run-forensics.ts`: runs all checks on fixtures.
- `reports/fixture-results.md`: maps each forged fixture to the check that caught it.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m21-document-forgery"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Add PDF inspection libraries only after choosing fixture format. Keep the first pass small and understandable.

Script shape:

```json
{
  "scripts": {
    "forensics": "tsx src/run-forensics.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 6. Implementation Path

### Step 1 - Create safe fixtures

Create several synthetic genuine statements and several deliberately edited versions. Example edits:

- change one balance
- change one date
- change one transaction amount
- paste text using a different font

### Step 2 - Implement metadata check

Inspect producer/creator fields, creation vs modification timestamps, and edit markers where available.

### Step 3 - Implement arithmetic check

Parse transactions and verify:

```text
balance[i] = balance[i - 1] + transaction[i]
```

This is the highest-signal check. Build it early.

### Step 4 - Implement text-layer and font checks

Flag suspicious overlays or inconsistent text runs. This can be approximate at first, but it must output a concrete reason.

### Step 5 - Combine risk score

Create `risk-score.ts` that returns:

- score
- severity
- reasons
- recommended action

### Step 6 - Run fixture report

For every forged fixture, record which check caught it. For genuine fixtures, record whether any false positives occurred.

---

## 7. Verification Checklist

M21 is complete only when:

- safe genuine fixtures exist
- deliberately forged fixtures exist
- metadata check runs
- arithmetic check runs
- text-layer check runs or limitation is documented
- font consistency check runs or limitation is documented
- risk score combines specific reasons
- all forged fixtures are flagged with specific reasons
- genuine fixtures do not produce unexplained false positives
- `reports/fixture-results.md` maps each forgery to the catching check
- `HANDOFF.md` explains why deterministic checks came first

---

## 8. What To Put In HANDOFF.md

Include:

- fixture strategy
- checks implemented
- command to run pipeline
- fixture result table
- strongest check
- false positives
- where an LLM would add value
- why real personal documents were not used

---

## 9. Explain-It-Back Questions

Before moving to M22, answer:

1. Why not ask an LLM first whether a document is fake?
2. Why is arithmetic reconciliation high-signal?
3. What metadata can reveal editing?
4. Why must flagged reasons be specific?
5. Which forged sample was hardest to catch and why?
