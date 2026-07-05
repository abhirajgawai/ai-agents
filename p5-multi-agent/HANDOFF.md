# P5 Multi-Agent Orchestrator — Session Handoff

## Project Status

- P1 ✓ — Hello Agent (CLI Chat, streaming)
- P2 ✓ — Tool Agent (Research Bot, agentic loop)
- P3 ✓ — Memory Agent (RAG pipeline, Ollama + LanceDB)
- P4 ✓ — Production Backend (Express REST API, SSE, Redis, BullMQ, Langfuse)
- P5 — Multi-Agent Orchestrator ← **start here**
- P6 — SaaS Capstone

P5 folder exists. Nothing scaffolded yet.

---

## Who is Abhiraj

Angular/.NET developer learning AI agents from scratch in TypeScript. Goals: get job-ready in AI engineering, explore what's possible, eventually build a monetizable SaaS.

He is comfortable with TypeScript from Angular — don't over-explain TS syntax, focus on agent concepts.

---

## CRITICAL — Teaching Style

**Abhiraj types the code. Claude instructs.**

This is the most important rule. Do NOT write code and paste it for him to copy. Instead:

- Explain the concept and the WHY **before** giving the instruction — what it is, why it exists, why this choice over alternatives
- Give **one small step at a time** — wait for confirmation it worked before moving on
- After he types something, explain what just happened under the hood
- Ask "what did you see?" or "did that work?" before the next step
- **Only write code yourself** if he is stuck, explicitly asks, or needs a complete reference example
- When introducing any tool, library, model, or service: explain what it is, what problem it solves, why we chose it over alternatives, and how it fits the bigger picture

Abhiraj wants **COMPLETE understanding** — not just step-by-step execution. Every new concept is worth explaining properly. Treat every "why does this exist?" question as an invitation to teach deeply, not to summarize briefly.

This style has been validated over 4 projects — stick to it exactly.

---

## What P5 Is

A "content pipeline" multi-agent system. You give it a topic and it autonomously:

```
Topic → Researcher → Writer → Critic → Reviser → Polished Article
```

Five agents, each a TypeScript function with one job. The Orchestrator coordinates them all.

**Why this is a big step up from P1-P4:**
- P1-P4 had one agent doing everything
- P5 has specialized agents that communicate with each other via typed JSON
- This is the architecture behind products like Perplexity, Devin, and enterprise AI automation

---

## The Five Agents

| Agent | Input | Output | Tools |
|-------|-------|--------|-------|
| Orchestrator | topic (string) | final article | delegates to all others |
| Researcher | topic | ResearchBrief (typed JSON) | web_search, read_url, search_memory |
| Writer | ResearchBrief | Draft (typed JSON) | none — pure generation |
| Critic | Draft | Feedback (typed JSON) | none — pure evaluation |
| Reviser | Draft + Feedback | FinalArticle (typed JSON) | none — pure generation |

---

## Build Order for P5

### Step 0 — Deploy P4 to Railway (before any P5 code)
P4 was built but never deployed. P5 starts by shipping it to Railway so agents have a live API.
- Push p4-production-backend to GitHub
- Create Railway project (Node.js service + Redis plugin)
- Set .env variables in Railway dashboard
- Verify POST /agent/run works on the live URL

### Step 1 — Scaffold p5-multi-agent
- pnpm init + install deps + tsconfig

### Step 2 — Shared types
- `src/types.ts` — TypeScript interfaces for ResearchBrief, Draft, Feedback, FinalArticle
- All agents communicate via these typed schemas (tool_use trick from P4)

### Step 3 — Researcher agent
- `src/agents/researcher.ts`
- Tools: web_search (Brave API), read_url, search_memory (P3 RAG wired in)
- Returns ResearchBrief

### Step 4 — Writer agent
- `src/agents/writer.ts`
- Takes ResearchBrief, returns Draft
- Uses prompt caching for the system prompt

### Step 5 — Critic agent
- `src/agents/critic.ts`
- Takes Draft, returns structured Feedback with scores
- Introduces LLM-as-judge pattern

### Step 6 — Reviser agent
- `src/agents/reviser.ts`
- Takes Draft + Feedback, returns FinalArticle
- Quality loop: if Critic score < threshold, loop Critic → Reviser again (max 3 iterations)

### Step 7 — Orchestrator
- `src/orchestrator.ts`
- Coordinates the full pipeline
- Researcher runs multiple queries in parallel with Promise.all
- Passes typed outputs between agents

### Step 8 — Evals harness
- `src/evals/run-evals.ts`
- 10 regression test cases (topic → expected article properties)
- LLM-as-judge scorer for article quality
- Results logged to Langfuse

### Step 9 — Wire into P4's REST API
- Add POST /pipeline/run to the P4 Express server
- Queues the full pipeline as a BullMQ job
- Fires webhook with the final article when done

---

## Key New Concepts to Teach (in order)

### 1. Why multiple agents instead of one
One big agent with everything in one prompt gets confused, expensive, and hard to debug. Specialized agents are cheaper (use the right model for each job), easier to test, and independently improvable. The Critic doesn't need to know how to write — it just needs to critique.

### 2. Agent-to-agent communication via structured output
Agents pass typed JSON to each other, not prose. This is the tool_use trick from P4 applied between agents. The Researcher returns a `ResearchBrief` interface, not a string. The Writer receives it with full TypeScript types.

### 3. Parallelism with Promise.all
The Researcher runs multiple search queries simultaneously. `await Promise.all([search1, search2, search3])` is the production pattern — never run independent work sequentially.

### 4. Quality loops
Critic → Reviser can run multiple times. The Critic returns a numeric score. If score < 0.8, loop again. This is how you get consistent quality — not by hoping the first run is good enough.

### 5. Context management
Each agent only sees what it needs. The Writer doesn't get the raw search results — it gets a structured ResearchBrief. The Critic doesn't get the Researcher's chain of thought — it gets the Draft. This keeps token counts low and responses focused.

### 6. LLM-as-judge (evals)
Use a second Claude call to score the output of the first against a rubric. The only way to evaluate open-ended outputs like articles. Returns a numeric score + reasoning. This is the industry standard for agent evals.

### 7. Regression evals
A fixed set of test cases you run every time you change a prompt. If pass rate drops, you broke something. This is the equivalent of unit tests for AI agents.

### 8. Receiving webhooks
External events (GitHub PRs, Stripe payments, Slack messages) can trigger agent runs. Pattern: expose POST /webhooks/:source, validate the incoming signature, enqueue a BullMQ job.

---

## Stack for P5

| What | Tool | Why |
|------|------|-----|
| HTTP server | P4's Express API (already built) | Reuse, don't rebuild |
| Agents | Raw Anthropic SDK | No framework — understand what they abstract |
| Web search | Brave Search API (from P2) | Already know it |
| Memory | P3 LanceDB RAG pipeline | Wire in as search_memory tool |
| Observability | Langfuse (from P4) | Trace every agent in the pipeline |
| Queue | BullMQ + Redis (from P4) | Async pipeline execution |

---

## Packages to Install

```bash
cd "E:\AI agents\p5-multi-agent"
pnpm init
pnpm add @anthropic-ai/sdk dotenv
pnpm add -D typescript @types/node tsx
```

P5 is intentionally lean on new dependencies — the point is agent architecture, not new libraries. It reuses P3 (RAG) and P4 (API + queue).

---

## .env Template

```
ANTHROPIC_API_KEY=same-key-as-other-projects
BRAVE_API_KEY=same-key-as-p2
```

---

## Reference Files for This Session

| File | Why read it |
|------|-------------|
| `E:\AI agents\CLAUDE.md` | Teaching style — Abhiraj types, Claude instructs |
| `E:\AI agents\AI-Agents-Learning-Plan.md` | Full P5 spec |
| `E:\AI agents\notes\p2-learnings.md` | Agentic loop + tool calling patterns |
| `E:\AI agents\notes\p4-learnings.md` | Structured output trick, Langfuse tracing, middleware patterns |
| `E:\AI agents\p2-tool-agent\src\` | Tool definitions to reuse (web_search, read_url) |
| `E:\AI agents\p3-memory-agent\src\` | RAG pipeline to wire in as search_memory tool |
| `E:\AI agents\p4-production-backend\src\` | Express server to extend with /pipeline/run route |

---

## What Success Looks Like

By the end of P5:

```bash
pnpm run pipeline "The future of AI agents in 2026"
```

Produces a 1500-word polished article in under 3 minutes with zero human input. Langfuse shows 5 separate agent traces with costs and latencies. The eval harness runs 10 test cases and reports a pass rate.

---

## Current Status of Prerequisites

- ✅ Anthropic API key — working (used in P1-P4)
- ✅ Brave Search API key — working (used in P2)
- ✅ P3 RAG pipeline — working locally (Ollama + LanceDB)
- ✅ P4 REST API — working locally (not yet deployed to Railway)
- ✅ Redis — running via Docker
- ✅ Langfuse — account set up, traces working
- ⬜ P4 deployed to Railway ← first thing to do in P5
