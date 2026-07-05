# Project 5 — Multi-Agent Orchestrator Learnings

## What We Built

A content pipeline multi-agent system. You give it a topic and it autonomously produces a polished article:

```
Topic → Researcher → Writer → [Critic → Reviser loop] → FinalArticle
```

Five agents, each a TypeScript function with one job. An Orchestrator coordinates them. An evals harness tests the pipeline's reliability.

---

## Setup Commands

```bash
cd "E:\AI agents\p5-multi-agent"

pnpm init
pnpm add @anthropic-ai/sdk dotenv
pnpm add -D typescript @types/node tsx

pnpm tsc --init   # use pnpm not npx — this project is configured for pnpm
```

Folder structure:
```
src/
  agents/
    researcher.ts
    writer.ts
    critic.ts
    reviser.ts
  evals/
    run-evals.ts
  types.ts
  orchestrator.ts
  index.ts
```

---

## tsconfig.json

Same as P2-P4:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## package.json scripts

```json
"scripts": {
  "pipeline": "tsx src/index.ts",
  "evals": "tsx src/evals/run-evals.ts"
}
```

Run the pipeline:
```bash
pnpm run pipeline "The future of AI agents in 2026"
```

Run evals:
```bash
pnpm run evals
```

---

## Key Concept 1 — Why Multiple Agents Instead of One

One big agent with everything in one prompt gets confused, expensive, and hard to debug. Specialized agents are:
- **Cheaper** — use the right model for each job (Haiku for simple evaluation, Sonnet for writing)
- **Easier to test** — you can test each agent independently
- **Independently improvable** — improve the Researcher without touching the Writer

The Critic doesn't need to know how to write. It just needs to critique. Specialization = reliability.

---

## Key Concept 2 — Agent-to-Agent Communication via Structured Output (the tool_use trick)

Agents pass **typed JSON** to each other, not prose. This is the same tool_use trick from P4, now used as the backbone of every agent.

**How it works:**
- Define a tool whose only purpose is to return the agent's output
- Set `tool_choice: { type: "tool", name: "your_tool" }` to **force** Claude to call it
- Read `toolUse.input` as your typed data

**Why `tool_choice` is critical:**
Without it, Claude might call the tool OR just reply with text — no guarantee. With `tool_choice: { type: "tool", name: "..." }`, Claude has no choice but to return structured JSON every time. This is what makes it reliable enough to pass between agents.

```typescript
tool_choice: { type: "tool", name: "return_research_brief" }
```

**Pattern repeated in every agent:**
```typescript
const toolUse = response.content.find((block) => block.type === "tool_use");
if (!toolUse || toolUse.type !== "tool_use") {
  throw new Error("Agent did not return expected output");
}
return toolUse.input as YourType;
```

---

## Key Concept 3 — Shared Types (src/types.ts)

All agents communicate via TypeScript interfaces defined in one place:

```typescript
export interface ResearchBrief {
  topic: string;
  keyPoints: string[];
  sources: string[];
  context: string;
}

export interface Draft {
  title: string;
  content: string;
  wordCount: number;
}

export interface Feedback {
  score: number;        // 0.0 to 1.0
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface FinalArticle {
  title: string;
  content: string;
  wordCount: number;
  qualityScore: number;
}
```

**Why this matters:**
- **Reliability** — agents can't accidentally receive malformed data
- **Debuggability** — log any agent's input/output and instantly understand it
- **Composability** — swap out any agent as long as its output shape stays the same

---

## Key Concept 4 — Context Isolation

Each agent only sees what it needs:
- The Writer receives a `ResearchBrief` — not raw search results, not the Researcher's chain of thought
- The Critic receives a `Draft` — not the research that informed it
- The Reviser receives a `Draft` + `Feedback` — only what it needs to revise

**Why:** keeps token counts low, keeps responses focused, reduces confusion.

---

## Key Concept 5 — Quality Loop (Orchestrator)

The Orchestrator runs Critic → Reviser in a loop until quality threshold is met or max iterations reached:

```typescript
const QUALITY_THRESHOLD = 0.8;
const MAX_ITERATIONS = 3;

for (let i = 0; i < MAX_ITERATIONS; i++) {
  const feedback = await runCritic(currentDraft);
  if (feedback.score >= QUALITY_THRESHOLD) {
    // done — quality met
    break;
  }
  const revised = await runReviser(currentDraft, feedback);
  currentDraft = revised;
}
```

**Why loops instead of hoping the first run is good enough:** Consistent quality requires iteration. This is how you build reliable AI outputs — not by trusting a single generation.

---

## Key Concept 6 — LLM-as-Judge (Evals)

Use a second Claude call to score the output of the first against a rubric. The only reliable way to evaluate open-ended outputs like articles — you can't write `assert output === expected` for a 1000-word article.

```typescript
// Use Haiku for the judge — it's a simple evaluation task, 10x cheaper than Sonnet
model: "claude-haiku-4-5-20251001"
```

Returns: `{ pass: boolean, score: number, reasoning: string }`

**Two different "critics" — don't confuse them:**
- **Critic agent** — lives inside the pipeline, drives quality loops, runs in every production call
- **Judge** — lives only in the evals harness, scores the final output, never runs in production

---

## Key Concept 7 — Evals Harness

A fixed set of test cases run after every prompt change:

```typescript
interface EvalCase {
  topic: string;
  mustContain: string[];   // concepts the article must cover
  minWordCount: number;
}
```

**Why hardcoded topics:** The test cases are not for covering all possible user inputs. They're a regression suite — representative cases that catch if the pipeline breaks. Same as unit tests for regular code.

**The workflow:**
```
Change a prompt → Run evals → Pass rate dropped? → Fix the prompt → Repeat
```

**Right model for the right job:** Use Haiku for the judge, not Sonnet. Simple evaluation task — Haiku is fast and 10x cheaper.

---

## Questions Asked During This Session

### Q: Why is P4 required before starting P5?
P4 is only needed for Step 9 — the very last step — where the pipeline gets wired into P4's Express server as a `POST /pipeline/run` route. Steps 1-8 (all the actual agent work) run completely standalone. You can build the entire multi-agent pipeline without P4.

### Q: Why is Brave API key needed? We didn't use it in P2.
In P2, we didn't actually call Brave's API. We defined a `web_search` tool and Claude filled in the results from its own training knowledge — it simulated search. We did the same in P5. No external search API needed; Claude's training knowledge is the "search results."

### Q: What does `tool_choice: { type: "tool", name: "..." }` do exactly?
It forces Claude to call that specific tool — no prose response allowed. Without it, Claude might call the tool OR reply with text. With it, you're guaranteed structured JSON every time. That's what makes agent-to-agent communication reliable.

### Q: What if an eval fails?
The harness reports FAIL and moves on — it doesn't fix anything automatically. That's intentional. The harness surfaces failures to you, the developer. Your options: fix the prompt, lower the quality threshold, increase MAX_ITERATIONS, or fix the test case criteria. The key metric is pass rate over time — if it trends down after a prompt change, you broke something.

### Q: Can we make articles shorter to save tokens during evals?
Yes — and you should. For evals you want speed and cost efficiency, not production-quality articles. Changes made for evals:
- Writer minimum: 800 words → 300 words
- Researcher key points: 5-8 → 3-4
- MAX_ITERATIONS: 3 → 2
- EvalCase minWordCount: 600 → 200

---

## Subtle Bug Worth Knowing

The final `qualityScore` displayed in the output comes from the **Reviser's self-assessment**, not from the Critic's last score. In the session:
- Critic scored 0.78 on the last iteration
- But output showed `Quality Score: 0.89` — the Reviser's own estimate

**Lesson:** Self-assessed quality ≠ independently judged quality. In production, always use the Critic's score as the authoritative number.

---

## What P5 Unlocks

This is the architecture behind Perplexity, Devin, and enterprise AI automation:
- Not one giant agent doing everything
- Specialized agents with clear responsibilities
- A coordinator managing the flow
- Quality loops ensuring reliable output
- Evals catching regressions before they reach users
