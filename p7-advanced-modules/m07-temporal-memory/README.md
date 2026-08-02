# M7 - Agent Memory Beyond a Vector Store

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M7. It explains how to build temporal memory on top of earlier RAG work and how to verify stale facts are handled correctly.

---

## 1. What This Module Is About

M7 teaches that memory is not just "store embeddings and retrieve similar chunks." Some facts change over time. If the agent keeps both old and new facts without temporal rules, it may confidently answer with stale information.

You will add a temporal-fact layer where old facts are superseded instead of silently coexisting with new facts.

The core lesson: memory needs update semantics, not just storage.

---

## 2. What You Are Building

Build a small temporal memory system that supports:

- inserting facts
- superseding old facts
- retrieving only current facts by default
- explaining historical changes when asked

Example:

```text
Old fact: user's role is Engineer
New fact: user's role is Manager
Current query: What is the user's role?
Answer: Manager
History query: Did this change?
Answer: Yes. It used to be Engineer, then changed to Manager on <date>.
```

---

## 3. Concepts To Understand Before Coding

- **Personal memory**: facts about a user or preference.
- **Institutional memory**: facts about a company, policy, or shared domain.
- **Temporal memory**: facts with validity over time.
- **Supersession**: marking an old fact as replaced by a new one.
- **Current fact query**: returns only facts where `valid_to` is empty/null.

The "Day-2 failure" is when the agent passes Monday's eval and fails Wednesday because the real world changed.

---

## 4. Recommended File Structure

```text
m07-temporal-memory/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  DECISION.md
  data/
  src/
    temporal-memory.ts
    update-fact.ts
    query-with-memory.ts
    demo.ts
  tests/
    temporal-memory.test.ts
```

File responsibilities:

- `DECISION.md`: hand-rolled table vs Mem0/Zep/Graphiti.
- `src/temporal-memory.ts`: stores and retrieves facts.
- `src/update-fact.ts`: supersedes conflicting facts.
- `src/query-with-memory.ts`: demonstrates current and historical answers.
- `tests/`: proves stale facts are not returned as current.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m07-temporal-memory"
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

Start with a local JSON or SQLite/Postgres-backed implementation. If you choose a memory library, document the tradeoff in `DECISION.md`.

---

## 6. Implementation Path

### Step 1 - Choose the storage approach

Recommended first implementation: hand-roll the temporal fact model. It is easier to understand than hiding the behavior behind a memory platform.

Use this shape conceptually:

```text
facts(subject, predicate, object, valid_from, valid_to, superseded_by)
```

### Step 2 - Implement fact insertion

`insertFact(subject, predicate, object)` should create a current fact with `valid_to` empty/null.

### Step 3 - Implement supersession

When a new fact has the same subject and predicate but a different object:

1. mark the old fact's `valid_to`
2. link it to the new fact with `superseded_by`
3. insert the new current fact

### Step 4 - Implement current retrieval

Current retrieval must return only non-superseded facts.

### Step 5 - Implement history retrieval

Historical retrieval should show the old and new values with dates.

### Step 6 - Demo the role-change case

Create `src/demo.ts` that inserts:

- user's role is Engineer
- user's role is now Manager

Then query current role and change history.

---

## 7. Verification Checklist

M7 is complete only when:

- `DECISION.md` explains storage choice
- facts can be inserted
- contradictory facts supersede old rows
- current retrieval excludes superseded facts
- history retrieval explains the change
- the Engineer -> Manager demo works
- stale fact risk is explained in `HANDOFF.md`
- `pnpm run typecheck` passes, if TypeScript is configured

---

## 8. What To Put In HANDOFF.md

Include:

- storage approach selected
- how to run the demo
- fact schema
- example before and after fact rows
- current query result
- history query result
- limitations around conflict detection
- what this teaches before M8

---

## 9. Explain-It-Back Questions

Before moving to M8, answer:

1. Why is vector memory alone not enough for changing facts?
2. What does `valid_to` mean?
3. Why should current queries exclude superseded facts?
4. When would you need historical memory?
5. How did your demo prove stale memory was fixed?
