# M3 - Context Engineering: Compaction & Budgets

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M3. It turns the master-plan spec into an implementation path and understanding checklist.

---

## 1. What This Module Is About

M3 teaches that context length is not just a hard limit. Quality degrades before the model hits the maximum window. A production agent needs a context manager that tracks budget, compacts low-value content, summarizes only when needed, and protects system rules from accidental deletion.

The core lesson: context management is an engineering system, not just "send fewer tokens."

---

## 2. What You Are Building

Build a `ContextManager` around an agent message history.

It should:

- track an approximate or real token count
- decide when compaction should happen
- compact reversible content first
- summarize old content only after compaction is not enough
- keep system prompts and safety rules pinned
- log before/after counts for every compaction event

The demo should simulate a long session and show that the pinned system prompt is unchanged after compaction.

---

## 3. Concepts To Understand Before Coding

- **Context budget**: the amount of model window you allow yourself to use before intervention.
- **Context rot**: quality loss as the conversation fills with stale or distracting material.
- **Compaction**: reversible reduction, such as replacing a long tool output with "saved to file."
- **Summarization**: lossy reduction, useful but risky.
- **Pinned context**: messages that must never be rewritten or removed.

Prefer compaction over summarization. Compaction preserves the ability to re-read the original artifact. Summaries can silently lose important details.

---

## 4. Recommended File Structure

```text
m03-context-engineering/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  logs/
    compaction-events.jsonl
  src/
    context-manager.ts
    compaction.ts
    token-count.ts
    demo.ts
  tests/
    context-manager.test.ts
```

File responsibilities:

- `src/context-manager.ts`: owns message history, thresholds, and compaction flow.
- `src/compaction.ts`: implements reversible compaction and lossy summarization.
- `src/token-count.ts`: centralizes token counting or approximation.
- `src/demo.ts`: simulates a long session.
- `tests/context-manager.test.ts`: verifies pinned prompt behavior.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m03-context-engineering"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Use this script shape in `package.json`:

```json
{
  "scripts": {
    "demo": "tsx src/demo.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

You can add a test runner later, but the first required proof can be a deterministic demo script.

---

## 6. Implementation Path

### Step 1 - Define message and budget types

Create `src/context-manager.ts` with types for role, content, pinned state, and token count. Keep the structure close to the message shape used in earlier agents.

### Step 2 - Implement `shouldCompact()`

Add a threshold such as 70 percent of the allowed budget. Do not wait until the context is full. The method should return true before the system is in danger.

### Step 3 - Implement reversible compaction

Create `src/compaction.ts`.

Start with this rule:

- if a tool result includes long file content, replace it with `Output saved to <path>`
- keep the path so the agent can re-read the original file if needed

### Step 4 - Implement summarization as a second stage

Only summarize older non-pinned turns after reversible compaction does not reduce enough. For the first version, you can use a deterministic fake summarizer. The concept matters more than calling an LLM.

### Step 5 - Pin the system prompt

Mark the system prompt and safety rules as `pinned: true`. Add a test or demo assertion that their content is byte-identical before and after compaction.

### Step 6 - Simulate a long session

Create `src/demo.ts` that creates 30+ turns, crosses the threshold, compacts, and logs:

- token count before
- token count after
- which messages changed
- proof that pinned messages did not change

---

## 7. Verification Checklist

M3 is complete only when:

- a `ContextManager` tracks message history and budget
- `shouldCompact()` triggers before the limit
- reversible compaction works
- summarization exists as a fallback
- pinned messages are never changed
- a 30+ turn demo triggers compaction
- logs show before/after counts
- there is explicit proof that the system prompt stayed identical
- `pnpm run typecheck` passes, if TypeScript is configured
- `HANDOFF.md` explains compaction vs summarization in your own words

---

## 8. What To Put In HANDOFF.md

Include:

- how to run the demo
- configured budget and threshold
- examples of compacted messages
- before/after count from a real run
- pinned-prompt proof
- when summarization is acceptable
- what you would change before using this in production

---

## 9. Explain-It-Back Questions

Before moving to M4, answer:

1. Why is context rot different from hitting a hard context limit?
2. Why is compaction safer than summarization?
3. What content should be pinned?
4. What can go wrong if a summarizer rewrites safety rules?
5. How did your demo prove the manager works?
