# M20 - Running an Automation Program

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M20. It explains how to evaluate automation as an operating program, not just a set of technical builds.

---

## 1. What This Module Is About

M20 teaches how to think like someone responsible for automation outcomes. The question is not only "does the agent work?" It is "what process does this replace, who owns it, how is success measured, and how safely was it introduced?"

You will retroactively apply an operating checklist to M10 and M8.

The core lesson: automation needs ownership, baseline, success metrics, and rollout discipline.

---

## 2. What You Are Building

No new app is required. Create two operating reviews:

```text
reviews/m10-document-ai-program-review.md
reviews/m08-durable-execution-program-review.md
```

Each review should answer:

- What baseline does this replace?
- Who would own this process?
- What success metric matters to the owner?
- Was it shipped in shadow mode first?
- What would be needed before auto-widening?

---

## 3. Concepts To Understand Before Writing

- **Baseline**: current manual cost, time, error rate, or pain.
- **Owner**: the person/team accountable for the process.
- **Business metric**: success in user or business terms, not just model accuracy.
- **Shadow mode**: system recommends, humans still decide.
- **Auto-widening**: increasing autonomous scope only after evidence supports it.

Learning projects can honestly say "shadow mode was skipped." The value is recognizing the gap.

---

## 4. Recommended File Structure

```text
m20-automation-program/
  README.md
  HANDOFF.md
  reviews/
    m10-document-ai-program-review.md
    m08-durable-execution-program-review.md
  templates/
    automation-program-checklist.md
```

File responsibilities:

- `templates/automation-program-checklist.md`: reusable operating checklist.
- `reviews/`: completed reviews for M10 and M8.
- `HANDOFF.md`: overall lessons from applying the checklist.

---

## 5. Implementation Path

### Step 1 - Create the checklist template

Use this structure:

```markdown
# Automation Program Review

## Baseline

## Process Owner

## Success Metric

## Shadow Mode Plan

## Rollout / Auto-Widening Criteria

## Risks

## Next Action
```

### Step 2 - Review M10

For document AI, think in terms of:

- manual review time per document
- extraction accuracy
- human review rate
- reviewer trust
- correction loop

### Step 3 - Review M8

For durable execution, think in terms of:

- failed workflow recovery time
- duplicate side effects avoided
- run reliability
- operator debugging time

### Step 4 - State honest gaps

If there was no real baseline, say how you would measure it. If shadow mode was skipped because this is a learning project, say that clearly.

---

## 6. Verification Checklist

M20 is complete only when:

- checklist template exists
- M10 review exists
- M8 review exists
- each review has baseline, owner, metric, shadow mode, rollout criteria, and risks
- honest learning-project limitations are stated
- `HANDOFF.md` explains automation-program thinking

---

## 7. What To Put In HANDOFF.md

Include:

- review paths
- strongest baseline metric
- weakest or missing metric
- owner assumptions
- shadow-mode gaps
- what this changes about how you choose future automation projects

---

## 8. Explain-It-Back Questions

Before moving to M21, answer:

1. Why is accuracy not always the business success metric?
2. Why does every automation need an owner?
3. What is shadow mode for?
4. What evidence should exist before auto-widening?
5. Which reviewed module had the clearer operational value?
