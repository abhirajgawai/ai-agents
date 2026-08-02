# M18 - AI Product/UX Trust Patterns

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M18. It explains how to make AI output inspectable, correctable, and useful for future evals.

---

## 1. What This Module Is About

M18 teaches that trust is designed into the product surface. Users need to see citations, confidence, review states, and correction paths. Silent AI output is not enough when people act on the result.

You will apply trust patterns to M10's document extraction output.

The core lesson: every human correction should improve the system's eval set.

---

## 2. What You Are Building

Build a small UI or formatted CLI output that shows:

- extracted fields
- confidence per field
- citation per field
- low-confidence warning state
- correction capture
- saved correction as a new eval/golden case

This does not need to be a full SaaS UI. It needs to make trust signals visible and corrections persistent.

---

## 3. Concepts To Understand Before Coding

- **Show your work**: expose sources, not just answers.
- **Confidence display**: make uncertainty visible.
- **Failure-state design**: low confidence is a normal state, not an exception.
- **Correction capture**: store human fixes in a structured way.
- **Eval flywheel**: corrections become future test cases.

Trust does not mean pretending the system is always right. It means making uncertainty actionable.

---

## 4. Recommended File Structure

```text
m18-trust-ux/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  corrections/
  golden-set-additions/
  src/
    render-output.ts
    correction-capture.ts
    run-demo.ts
```

File responsibilities:

- `src/render-output.ts`: displays extraction with confidence and citations.
- `src/correction-capture.ts`: persists human corrections.
- `corrections/`: raw correction records.
- `golden-set-additions/`: generated eval cases for M6.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m18-trust-ux"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "demo": "tsx src/run-demo.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Use saved M10 output as input. If M10 is not done, create a realistic fixture shaped like M10's expected JSON.

---

## 6. Implementation Path

### Step 1 - Create or import extraction fixture

Use an output containing:

- high-confidence fields
- at least one low-confidence field
- citations

### Step 2 - Render confidence clearly

In CLI, use labels such as:

```text
TOTAL: 104.20 [confidence: 0.92] [source: page 1, line 18]
TAX: 4.20 [confidence: 0.48] [needs review]
```

In UI, use visual distinction but keep it simple.

### Step 3 - Capture correction

When a human corrects a field, store:

- original value
- corrected value
- field name
- citation
- document id
- timestamp

### Step 4 - Generate eval case

Convert the correction into a golden-set case that M6 can later consume.

### Step 5 - Demo the loop

Trigger a low-confidence field, correct it, and show the correction appears in `golden-set-additions/`.

---

## 7. Verification Checklist

M18 is complete only when:

- M10 output or realistic fixture is displayed
- confidence is visible per field
- citations are visible per field
- low-confidence field is flagged
- correction can be entered or simulated
- correction is persisted
- correction creates a new eval/golden case
- `HANDOFF.md` explains the trust loop

---

## 8. What To Put In HANDOFF.md

Include:

- input fixture used
- how to run the demo
- example rendered output
- correction record format
- generated golden case path
- what trust pattern was applied
- what a better UI would add later

---

## 9. Explain-It-Back Questions

Before moving to M19, answer:

1. Why should confidence be visible?
2. Why are citations necessary for extraction?
3. What is a useful failure state?
4. How does correction capture improve evals?
5. What did your demo make easier for a human reviewer?
