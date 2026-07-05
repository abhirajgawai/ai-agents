# AI Agents Learning Journey — Progressive Project Ladder

## Context

You're an Angular/.NET developer who has already built a chatbot (C# + SignalR + Angular) and experimented with a Next.js SaaS AI platform. You want to deeply understand AI agents — how they work, what they can do, what tools they use, and how to safely deploy them in production — using TypeScript/Node.js. The goal is threefold: get job-ready in the AI space, explore what's possible, and eventually build something monetizable.

The approach: **learn by doing, through 6 escalating projects**. Each project introduces new concepts at the moment you need them. You won't use frameworks until you understand what they abstract, so you build real intuition, not just framework knowledge.

---

## Stack (used across all projects)

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 22+ |
| LLM API | `@anthropic-ai/sdk` (Claude) |
| Vector DB | LanceDB (local, npm package, no server needed) |
| Task Queue | BullMQ + Redis |
| API Layer | Express or Fastify |
| Observability | Langfuse (agent tracing) + Pino (logging) |
| Deployment | Railway (easy, cheap, supports Redis + Postgres) |
| Package Manager | pnpm |

---

## Core Concepts (woven across projects)

**What agents are:** An agent is an LLM in a loop. It gets a task, reasons about what to do, calls a tool, observes the result, reasons again, calls another tool — until it decides it's done. That loop is the heart of all agent systems.

**What tools are:** Functions the LLM can call. You define them with a name, description, and input schema. The LLM decides when to call them. Examples: `web_search`, `read_file`, `query_database`, `send_email`, `run_code`, `call_api`.

**What memory is:** LLMs are stateless. You give them memory via: (1) conversation history in the context window (short-term), (2) vector database lookups (long-term semantic memory), (3) key-value stores for facts.

**What multi-agent means:** Multiple specialized LLMs working together — one orchestrator that plans and delegates, worker agents that execute, reviewer agents that verify quality.

**What production means for agents:** Cost controls, rate limits, async task queues, streaming, observability, prompt injection defense, PII handling, output filtering, budget hard limits.

---

## Project 1 — Hello Agent (CLI Chat)

**What you build:** A TypeScript CLI that streams Claude responses in real time, maintains conversation history, and accepts a configurable system prompt via CLI args.

**Key files:**
- `src/index.ts` — CLI entry point, reads stdin
- `src/agent.ts` — wraps Anthropic SDK, manages message history
- `src/stream.ts` — handles streaming events and terminal output

**Concepts introduced:**
- The Anthropic SDK: `client.messages.create()` vs `client.messages.stream()`
- What a "message" is: `{role: 'user' | 'assistant', content: string}`
- System prompts and how they shape agent behavior
- Token counting: `input_tokens`, `output_tokens`, `stop_reason`
- Context window limits (200k for Claude 3.5 Sonnet) and what happens when you hit them
- Temperature, `max_tokens`, `stop_sequences`

**Setup:** Scaffold manually with `@anthropic-ai/sdk`.

**Verification:** Can hold a multi-turn conversation where the agent remembers what was said 10 messages ago. Streaming visibly prints word-by-word in the terminal.

---

## Project 2 — Tool Agent (Research Bot)

**What you build:** A CLI agent that can browse the web to answer research questions. Given "What are the top 5 AI agent frameworks in 2025?", it searches the web, reads pages, synthesizes an answer, and saves it to a markdown file.

**Key files:**
- `src/agent.ts` — the core agentic loop (process tool calls until `stop_reason === 'end_turn'`)
- `src/tools/web_search.ts` — Brave Search API integration
- `src/tools/read_url.ts` — fetches and strips HTML from a URL
- `src/tools/save_note.ts` — writes markdown files to disk
- `src/tools/index.ts` — tool registry with JSON schemas

**Concepts introduced:**
- Tool definitions: `{name, description, input_schema}` following JSON Schema
- Tool calling loop: `stop_reason === 'tool_use'` → execute tools → add `tool_result` messages → call LLM again
- The ReAct pattern: Reason → Act → Observe → Reason → Act...
- Why tool descriptions matter (the LLM reads them to decide when to call)
- Parallel tool calls (Claude can call multiple tools in one turn)
- Tool errors: what to return when a tool fails, how the agent recovers

**APIs needed:** Brave Search API (free tier) or Tavily API.

**The agentic loop (core pattern, reused in every subsequent project):**
```typescript
while (stop_reason !== 'end_turn') {
  response = await llm.call(messages)
  if (stop_reason === 'tool_use') {
    results = await executeTools(response.tool_calls)
    messages.push(assistant_message, tool_results)
  }
}
```

**Verification:** Given a research question, the agent autonomously searches 2-3 sources, reads them, and saves a structured markdown summary — without any human input after the initial prompt.

---

## Project 3 — Memory Agent (Personal Knowledge Base)

**What you build:** A CLI agent that you can "teach" things to. `pnpm run teach "my-notes.pdf"` reads, chunks, embeds, and stores. Then `pnpm run ask "What did I write about pricing strategy?"` finds relevant chunks and answers.

**Key files:**
- `src/embeddings.ts` — calls Ollama (`nomic-embed-text`) locally for embeddings *(Claude has no embedding model; we run Ollama locally — no API key needed)*
- `src/chunker.ts` — splits documents into overlapping chunks (~500 chars, 100 overlap)
- `src/vectorstore.ts` — wraps local PostgreSQL + pgvector: `upsert`, `similarity_search`
- `src/rag-pipeline.ts` — orchestrates chunk → embed → store → retrieve → generate
- `src/index.ts` — CLI entry: `teach <file>` or `ask <question>`

**Local setup (one-time):**
- Install Ollama + pull `nomic-embed-text` model (done)
- LanceDB installs via npm — no server, no SQL, no extensions needed

**Concepts introduced:**
- Embeddings: text → float[] vectors that encode semantic meaning
- Cosine similarity: why similar text produces numerically close vectors
- Chunking strategies: fixed-size with overlap
- RAG pipeline: Retrieve relevant context → Augment the prompt → Generate with context
- Why RAG beats "put everything in context" (cost, latency, precision)
- Vector databases: how similarity search works under the hood
- Metadata filtering: search only within a specific document or tag
**Verification:** After feeding it 3 different documents, it correctly answers questions by finding the right document and section — not hallucinating from training data.

---

## Project 4 — Production Agent Backend

**What you build:** A REST API wrapping an agent. An Angular frontend (or Postman) calls `POST /agent/run` and gets a streaming SSE response. Long tasks go into a queue and call a webhook when done. Full observability, safety, and cost controls.

**Key files:**
- `src/server.ts` — Express app, routes, middleware
- `src/routes/agent.ts` — POST /agent/run (sync streaming), POST /agent/task (async queue)
- `src/middleware/auth.ts` — API key validation
- `src/middleware/rate-limit.ts` — Redis-backed per-user rate limiting
- `src/middleware/cost-guard.ts` — hard budget limit per user per day
- `src/queue/agent-worker.ts` — BullMQ worker that processes agent tasks
- `src/safety/prompt-injection.ts` — detects and blocks injection attempts
- `src/safety/pii.ts` — redacts PII before logging
- `src/safety/output-filter.ts` — filters harmful content from responses
- `src/observability/tracer.ts` — Langfuse integration for agent traces
- `src/structured-output.ts` — typed JSON responses from Claude using tool_use trick

### Safety & Production Depth

**Prompt Injection Defense:**
- Wrap user input in explicit delimiters: `<user_input>...</user_input>`
- Never concatenate user input directly into system prompts
- Validate that tool call arguments don't contain injection patterns
- Log and alert on detected injection attempts

**PII Handling:**
- Detect PII in user input (email, phone, SSN) using regex + classification prompt
- Redact from logs: `"email": "j***@gmail.com"`
- Never store raw PII in vector databases without encryption
- Implement data deletion endpoints (GDPR right to erasure)

**Structured Outputs:**
- Claude has no native JSON mode — use the tool_use trick: define a single tool with your desired JSON schema, force Claude to call it via `tool_choice: {type: "tool", name: "..."}`. The tool input IS your structured output.
- Why it matters: agents passing data to other agents need typed, predictable output — not prose

**Prompt Caching:**
- Cache your system prompt with `cache_control: {type: "ephemeral"}` — Anthropic stores it server-side for 5 minutes
- Cached tokens cost 90% less on re-reads. On long system prompts + many requests, this saves serious money
- Every production agent should use this for its system prompt and any large static context

**Cost Controls:**
- Count tokens before each LLM call: `client.messages.countTokens()`
- Reject requests that would exceed per-user daily budget
- Store cumulative usage in Redis with TTL=86400 (1 day)
- Model-aware pricing: Claude Haiku 4.5 = cheapest, Sonnet 4.6 = mid, Opus = expensive. Pick per task.

**Rate Limiting:**
- Token-bucket algorithm via Redis: 10 requests/minute per API key
- Return `Retry-After` headers on 429

**Async Task Queue:**
- BullMQ + Redis for long-running agent tasks (>30 seconds)
- Webhook callback when task completes: `POST {callbackUrl} {taskId, result}`
- Dead letter queue for failed tasks; retry with exponential backoff

**Streaming via SSE:**
```
GET /agent/stream?taskId=xyz
data: {"type":"text","text":"I found "}
data: {"type":"tool_call","name":"web_search","input":{...}}
data: {"type":"tool_result","name":"web_search","result":{...}}
data: {"type":"done","usage":{"input":1240,"output":380}}
```

**Observability:**
- Langfuse: trace every agent run, see every LLM call, tool call, latency, and cost
- Pino: structured JSON logs (level, userId, requestId, durationMs, tokens)
- Health endpoint: `GET /health` returns service status

**Deployment:** Railway (Node.js API + Redis + Postgres in one platform).

**Verification:** POST from Angular receives streaming tokens. Slow task queues and fires webhook on completion. Langfuse shows full trace. Prompt injection attempt is logged and blocked. Structured output returns typed JSON. Prompt cache hit visible in usage response.

---

## Prompt Engineering Patterns — Mini-Module (between P4 and P5)

**Not a full project — one focused session before starting P5.**

Prompt engineering is a real discipline. A better prompt can outperform a bigger model at a fraction of the cost. Every AI job interview will test this. Learn these patterns before P5 because you'll use all of them across the five agents.

### Pattern 1 — Chain of Thought (CoT)
Ask the model to reason step by step before giving the final answer. Dramatically improves accuracy on complex tasks.

```
Bad:  "Is this contract clause enforceable?"
Good: "Think through this step by step: what does this contract clause say,
       what jurisdiction applies, what case law is relevant, then give your
       conclusion on enforceability."
```

### Pattern 2 — Few-Shot Examples
Show 2–3 examples of input → output before the real request. The model learns the exact format and style you want from examples, not just instructions.

```
Here are examples of how to classify customer feedback:

Input: "The app crashed when I tried to export."
Output: {"category": "bug", "severity": "high", "department": "engineering"}

Input: "I wish there was a dark mode."
Output: {"category": "feature_request", "severity": "low", "department": "product"}

Now classify this:
Input: "My invoice shows the wrong amount."
Output:
```

### Pattern 3 — XML Structuring
Claude (and most models) respond better to prompts with clear XML structure. Use tags to separate instructions, context, and user input.

```xml
<instructions>
You are a financial analyst. Analyse the report below and extract key metrics.
</instructions>

<report>
{reportText}
</report>

<output_format>
Return JSON with: { revenue, profit_margin, yoy_growth, risk_factors[] }
</output_format>
```

### Pattern 4 — Role Prompting
Give the model a specific identity. It shifts vocabulary, reasoning style, and confidence level.

```
"You are a senior security engineer with 15 years of experience reviewing
production Node.js APIs for OWASP vulnerabilities."
```

### Pattern 5 — Prompt Versioning
Track which prompt produced which result. Simple approach: keep prompts in `src/prompts/` as named constants with a version comment. When you change a prompt, note what changed and why. In P5 you'll use Langfuse to see which prompt version produced which output.

```typescript
// v2 — added "be concise" after outputs were too verbose in testing
export const RESEARCHER_PROMPT = `You are a research specialist...`
```

### When to use each
| Pattern | Use when |
|---------|----------|
| Chain of thought | Complex reasoning, multi-step problems, math, analysis |
| Few-shot | You need exact output format, style, or schema |
| XML structuring | Long prompts with multiple sections, Claude specifically |
| Role prompting | Domain-specific tasks where expertise tone matters |
| Prompt versioning | Any production agent where prompts change over time |

---

## Project 5 — Multi-Agent Orchestrator

**What you build:** A "content pipeline" multi-agent system. Give it a topic, it autonomously: researches it → writes a draft → critiques the draft → revises → outputs a polished article.

### Step 0 — Deploy P4 to Production (before writing any P5 code)

P4 was built but never deployed. P5 starts by shipping P4 to Railway so the agents have a real live API to call — not localhost.

**Deploy to Railway (free tier available):**
1. Push `p4-production-backend` to a GitHub repo
2. Create a Railway project — add a Node.js service + Redis plugin
3. Set all `.env` variables in Railway's environment settings
4. Railway auto-deploys on every git push

**What you learn:**
- Managing secrets in production (never commit `.env`)
- Connecting to a cloud Redis instance instead of `localhost`
- Reading production logs from a live service
- The difference between `pnpm dev` (tsx watch) and `pnpm start` (compiled dist/)

**Verification:** `POST /agent/run` works from Postman hitting the live Railway URL before writing a single line of P5 code.

**Agents:**
- **Orchestrator** — breaks task into subtasks, delegates, aggregates results
- **Researcher** — web search + read URL tools; produces structured research brief
- **Writer** — takes research brief; produces draft article
- **Critic** — takes draft; produces structured feedback (tone, accuracy, gaps, SEO)
- **Reviser** — takes draft + feedback; produces final version

**Key concepts:**

### Agent-to-agent communication
Each agent is a TypeScript function: `(input: T) => Promise<U>`. Agents pass typed JSON to each other using the tool_use structured output trick from P4. No prose passed between agents — only validated schemas.

```typescript
// Each agent is a function: (input: T) => Promise<U>
const research = await researcher.run({ topic })
const draft = await writer.run({ research })
const feedback = await critic.run({ draft })
const final = await reviser.run({ draft, feedback })
```

### Parallelism
Multiple research queries run simultaneously with `Promise.all`. This is how you make multi-agent systems fast — independent work runs in parallel, not sequentially.

```typescript
const [results1, results2, results3] = await Promise.all([
  researcher.search(query1),
  researcher.search(query2),
  researcher.search(query3),
])
```

### Quality loops
Critic → Reviser can iterate 2–3 times until a quality threshold is met. The Critic returns a structured score; if below threshold, loop again. This is how you get consistently high-quality output from agents.

### Context window management
In multi-agent systems, context grows fast. Each agent should only receive the context it needs — not the full conversation history of every other agent. Strategies:
- Pass only the output of the previous agent, not its full trace
- Summarize long outputs before passing downstream
- Use structured schemas so agents receive dense, information-rich JSON rather than verbose prose
- Monitor token counts per agent call in Langfuse and alert when approaching limits

### Memory-aware agents
The Researcher agent gets a `search_memory` tool wired to P3's RAG pipeline. Before searching the web, it checks local memory for relevant cached research. Avoids redundant API calls and speeds up repeat topics.

### Receiving webhooks to trigger agent runs
In production, agent runs are often triggered by external events, not just direct API calls:
- A new GitHub PR → trigger a code review agent
- A Stripe payment → trigger an onboarding agent
- A new Slack message → trigger a support agent

Pattern: expose a `POST /webhooks/:source` endpoint, validate the incoming signature (each service signs its webhooks — Stripe uses `stripe-signature`, GitHub uses `x-hub-signature-256`), then enqueue an agent job via BullMQ.

```typescript
app.post("/webhooks/github", (req, res) => {
  verifyGithubSignature(req); // throws if invalid
  const { pull_request } = req.body;
  agentQueue.add("review-pr", { prUrl: pull_request.url });
  res.status(202).json({ received: true });
});
```

---

### Agent Evals — Full Treatment

**Why evals are the most important skill most AI engineers lack:**
Everyone can call an LLM. Almost nobody systematically measures if it's working correctly. Without evals:
- You change a prompt and don't know if quality got better or worse
- You upgrade a model and don't know if it broke edge cases
- You can't compare two approaches objectively
- You're flying blind in production

**Three types of evals to build:**

**1. Exact match evals** — for deterministic outputs
```typescript
// Does the classifier always get obvious cases right?
const tests = [
  { input: "I hate this product", expected: "negative" },
  { input: "Absolutely love it!", expected: "positive" },
];
for (const test of tests) {
  const result = await classifySentiment(test.input);
  assert(result.sentiment === test.expected);
}
```

**2. LLM-as-judge evals** — for subjective quality
Use a second Claude call to score the output of the first. Give it a rubric.
```typescript
const score = await judge.evaluate({
  task: "Write a summary of this article",
  output: agentOutput,
  rubric: "Score 1-5: Is it accurate? Concise? Does it cover the main points?",
});
// Returns { score: 4, reasoning: "..." }
```
This is the industry standard for evaluating open-ended agent outputs — you can't use exact match for a 500-word article, but you can have a judge LLM score it against a rubric.

**3. Regression evals** — run before every prompt change
A fixed set of 10–20 test cases you run every time you modify a prompt or upgrade a model. If pass rate drops, the change broke something.

```typescript
// eval-harness.ts
const REGRESSION_SUITE = [/* 20 test cases */];

async function runEvals() {
  let passed = 0;
  for (const test of REGRESSION_SUITE) {
    const result = await runAgent(test.input);
    if (scoreOutput(result, test.expected) >= 0.8) passed++;
  }
  console.log(`Evals: ${passed}/${REGRESSION_SUITE.length} passed`);
}
```

**What to build in P5:**
- 10-case regression suite for the full pipeline (topic in → article out)
- LLM-as-judge scorer for article quality (accuracy, structure, length)
- Eval results logged to Langfuse so you can track quality over time

**Verification:** Given a topic, produces a 1500-word article in under 3 minutes with no human input. Langfuse shows all 5 agent traces, costs, and latencies. Eval harness runs 10 test cases and reports pass rate. Regression suite catches a deliberate prompt degradation.

---

## Interlude — Frameworks Tour + Fine-Tuning Awareness (between P5 and P6)

**Not a project — a one-session reading and thinking exercise.**

### Part 1 — Frameworks Tour

After building everything from scratch, spend one session looking at the major agent frameworks to understand what they abstract — and when they'd save you time vs. get in your way.

| Framework | Lang | What it abstracts | When to use |
|---|---|---|---|
| **LangChain** | PY/TS | Tools, memory, prompts, document loaders, integrations | Broad ecosystem; many third-party integrations needed |
| **LangGraph** | PY/TS | Stateful multi-agent graphs — nodes, conditional edges, loops, human-in-the-loop | Complex agent workflows with branching and cycles. Built on LangChain. Industry standard for P5-style systems. |
| **CrewAI** | PY/TS | Role-based multi-agent — each agent gets a role, goal, and tools. Crew = team of agents. | When agents map to human roles (Researcher, Writer, Reviewer). Very popular, common in job descriptions. |
| **OpenAI Agents SDK** | PY/TS | Lightweight agents — tools, handoffs between agents, guardrails | Clean reference implementation. Claude-compatible in practice. Good for simple multi-agent systems. |
| **AutoGen** | PY | Conversational multi-agent — agents talk to each other in a loop until task is done | Research-oriented systems. Microsoft Research. Python-only so less directly relevant, but know it exists. |
| **Semantic Kernel** | .NET/PY/TS | Enterprise agent framework — plugins, planners, memory. Microsoft/Azure ecosystem. | .NET shops building AI agents. Given your .NET background, this is what enterprise employers will ask about. |
| **LlamaIndex** | PY/TS | RAG pipelines, document ingestion, chunking, indexing | Document-heavy apps — better RAG tooling than LangChain |
| **Vercel AI SDK** | TS | Streaming, tool calling, multi-model switching | Full-stack TypeScript/Next.js apps |
| **Mastra** | TS | Agent workflows, memory, evals — TypeScript-native | TypeScript agents in production, closest to what you built |

**LangChain vs LangGraph — the key distinction:**
LangChain's original "chain" model is linear (A → B → C) — too rigid for real agents that loop and branch.
LangGraph fixes this: nodes = agents/functions, edges = transitions (conditional), cycles allowed.
Your P5 pipeline (Researcher → Writer → Critic → Reviser with quality loops) is exactly what LangGraph models.

**The key insight after doing P1-P5 from scratch:** frameworks are shortcuts, not magic. You now understand every layer they hide. You can evaluate them critically, debug through them, and choose them deliberately instead of defaulting to them out of ignorance.

**What to do:** Read each framework's "quickstart" page. Notice what they abstract vs. what you built manually. You don't need to build anything — just map their concepts to yours.

---

### Part 2 — MCP (Model Context Protocol)

**What it is:** MCP is an open standard created by Anthropic for connecting AI agents to external tools and data sources. Think of it as USB-C for AI — a universal plug that lets any agent connect to any tool without custom integration code.

**Why it matters:** Before MCP, every AI product had to write custom integration code for every tool (Slack, GitHub, databases, file systems). With MCP, tool providers write one MCP server, and any MCP-compatible agent can use it instantly. Claude Desktop, VS Code Copilot, and most major AI products now support MCP.

**How it works:**
- An **MCP server** exposes tools, resources, and prompts over a standard protocol
- An **MCP client** (your agent) connects to the server and calls its tools
- The agent never needs to know how the tool is implemented — just the schema

**The connection to what you've built:** Every tool you've built manually (web search, read URL, save file) could be packaged as an MCP server. Any other MCP-compatible agent could then use your tools without any extra code.

**What to do:** Read the MCP quickstart at modelcontextprotocol.io. In P6, consider building your SaaS as an MCP server — this makes it instantly compatible with Claude Desktop, Cursor, and any other MCP client.

---

### Part 3 — Fine-Tuning Awareness (no code needed)

You don't need to fine-tune models to be a great AI engineer. But you need to know *when* fine-tuning is the right answer — because employers and clients will ask, and defaulting to fine-tuning when RAG or better prompting would work is an expensive mistake.

**The three approaches and when to use each:**

| Approach | What it does | Use when |
|----------|-------------|----------|
| **Better prompting** | Clearer instructions, examples, structure | Output format is wrong, model misunderstands the task |
| **RAG** | Adds external knowledge at query time | Model lacks domain knowledge, knowledge changes frequently |
| **Fine-tuning** | Permanently adjusts model weights | Style/tone must be perfectly consistent, task is highly repetitive, prompt is too long to fit in context |

**The key insight:** Fine-tuning is almost never the first answer. The correct order is:
1. Try better prompting + few-shot examples first
2. If the model lacks knowledge → add RAG
3. If you still need consistent style/format at massive scale → consider fine-tuning

Fine-tuning costs thousands of dollars, requires labeled training data, and creates a model you have to maintain. Most teams that think they need fine-tuning actually just need better prompts. Only reach for it when the other two options are genuinely exhausted.

---

## Project 6 — Monetizable SaaS Capstone

**Use case:** Decided after Project 5, once you know what you enjoy building and what's feasible.

**Candidate ideas:**

| Idea | What it does | Monetization |
|---|---|---|
| AI Content Engine | Research → write → schedule blog posts | $29-99/month per workspace |
| AI Code Reviewer | GitHub PR agent that comments on code | $15/seat/month |
| AI Lead Researcher | Researches companies + drafts outreach | $49/month per 500 leads |
| AI Document Q&A | Upload PDFs, ask questions, extract data | $19/month per user |
| AI Social Media Agent | Research trends, draft + schedule posts | $39/month |

**Full product stack (beyond the agent):**
- **Auth:** Clerk or Better Auth
- **Billing:** Stripe Subscriptions with usage-based tiers
- **Frontend:** Angular (your strength) calling the Node.js agent API
- **Database:** Supabase Postgres
- **Deployment:** Railway (backend) + Vercel (Angular frontend)
- **Analytics:** PostHog (user behavior) + Langfuse (agent behavior)

**P6 must include:**
- Real deployment on Railway (not localhost) — build on the P4 deployment addendum
- Stripe webhook handling to activate/deactivate subscriptions (triggers agent run via BullMQ)
- Per-user cost tracking wired to billing tier (free tier = 10k tokens/day, pro = 500k)
- Eval harness for the core agent flow (regression suite runs in CI before deploy)

---

## What Employers Want to See

After these 6 projects, you can demonstrate:

1. **Fundamentals** — built an agentic loop from scratch (P1-P2), not just "used LangChain"
2. **Memory/RAG** — built a full vector search pipeline from scratch (P3)
3. **Production thinking** — cost controls, safety, rate limiting, observability, prompt caching (P4)
4. **Structured outputs** — typed agent-to-agent communication (P4)
5. **Prompt engineering** — CoT, few-shot, XML structuring, versioning (Prompt module)
6. **Multi-agent patterns** — orchestration, delegation, quality loops, context management (P5)
7. **Evals** — regression suites, LLM-as-judge, measurable quality (P5)
8. **Framework literacy** — can evaluate LangChain/LangGraph/Mastra critically (Interlude)
9. **MCP awareness** — understands the emerging tool protocol standard (Interlude)
10. **Fine-tuning judgment** — knows when NOT to fine-tune (Interlude)
11. **Product execution** — auth, billing, deployment, real use case (P6)

**Portfolio artifacts:** 6 GitHub repos, 1 live SaaS, Langfuse traces, eval results, blog post or README explaining design decisions for each project.

---

## Where to Start — Project 1 Setup

```bash
# In E:\AI agents\
mkdir p1-hello-agent && cd p1-hello-agent
pnpm init
pnpm add @anthropic-ai/sdk dotenv
pnpm add -D typescript @types/node tsx
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

Structure:
```
p1-hello-agent/
  src/
    index.ts    ← CLI entry point
    agent.ts    ← message history + API wrapper
    stream.ts   ← streaming output handler
  .env
  package.json
  tsconfig.json
```
