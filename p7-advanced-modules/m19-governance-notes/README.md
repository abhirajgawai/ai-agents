# M19 - Generalized AI Governance & Compliance Artifact

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M19. It explains how to write practical governance notes tied to real modules instead of generic policy text.

---

## 1. What This Module Is About

M19 teaches the habit of documenting data use, human oversight, audit trails, and readiness limits. This is not country-specific legal advice. It is a reusable engineering governance pattern.

You will write two short governance notes:

- one for M10 document AI
- one for M15 multi-tenant isolation

The core lesson: governance is easier when it references actual system behavior.

---

## 2. What You Are Building

Create two artifacts:

```text
governance/m10-document-ai-governance.md
governance/m15-multi-tenant-governance.md
```

Each must answer:

- What data does this touch?
- What is the minimum data needed?
- Where is human oversight required?
- What audit trail exists?
- What must change before using real regulated data?

---

## 3. Concepts To Understand Before Writing

- **Data minimization**: collect and process only what is needed.
- **Human oversight**: decide which actions need review before action.
- **Audit trail**: who/what/when/why for important decisions.
- **AI inventory**: knowing what systems exist and what they touch.
- **Readiness boundary**: honest statement of what is not production-safe yet.

Governance artifacts should be specific enough that an engineer can change the system based on them.

---

## 4. Recommended File Structure

```text
m19-governance-notes/
  README.md
  HANDOFF.md
  governance/
    m10-document-ai-governance.md
    m15-multi-tenant-governance.md
  templates/
    governance-checklist.md
```

File responsibilities:

- `templates/governance-checklist.md`: reusable checklist.
- `governance/`: completed notes tied to real modules.
- `HANDOFF.md`: summarizes gaps and production readiness.

---

## 5. Implementation Path

### Step 1 - Read M10 and M15 outputs

Do not write generic notes. Reference the actual files, data flow, and verification evidence from those modules.

### Step 2 - Create the checklist template

Create `templates/governance-checklist.md` with:

```markdown
# Governance Checklist

## Data touched

## Data minimization

## Human oversight

## Audit trail

## Production readiness gaps
```

### Step 3 - Write M10 governance note

Address:

- documents processed
- extracted fields
- citations
- human review for low-confidence fields
- what logs are captured
- what would change for regulated documents

### Step 4 - Write M15 governance note

Address:

- tenant documents
- tenant identity
- authorization filtering
- RLS backstop
- cross-tenant test evidence
- what would change for real customer data

### Step 5 - Review for specificity

Every claim should point to a module behavior or file. Remove vague statements like "we protect data" unless you explain how.

---

## 6. Verification Checklist

M19 is complete only when:

- governance template exists
- M10 governance note exists
- M15 governance note exists
- each note answers all checklist questions
- each note references real module behavior or files
- production gaps are stated honestly
- `HANDOFF.md` summarizes the governance lessons

---

## 7. What To Put In HANDOFF.md

Include:

- note paths
- most important data minimization decision
- human oversight points
- audit trail gaps
- production readiness gaps
- how this habit applies to future modules

---

## 8. Explain-It-Back Questions

Before moving to M20, answer:

1. What data does M10 process?
2. What data does M15 protect?
3. Where should a human review be mandatory?
4. What should an audit trail capture?
5. What is not ready for regulated production use?
