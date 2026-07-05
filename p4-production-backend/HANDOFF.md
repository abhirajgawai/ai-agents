# P4 Production Backend — Session Handoff

## Status

- P1 ✓ — Hello Agent (CLI Chat, streaming)
- P2 ✓ — Tool Agent (Research Bot, agentic loop)
- P3 ✓ — Memory Agent (RAG pipeline, Ollama + LanceDB)
- P4 — Production Backend ← **start here**

P4 folder exists. Nothing scaffolded yet.

---

## What P4 Is

Wrap a Claude agent in a production-grade REST API. Instead of running from the CLI, the agent is now accessible over HTTP — from Postman, Angular, or any client.

By the end:
```
POST /agent/run        ← sync: streams response via SSE
POST /agent/task       ← async: queues long task, fires webhook when done
GET  /health           ← service status
```

Full production concerns: auth, rate limiting, cost controls, safety, structured outputs, prompt caching, observability.

---

## Stack

| What | Tool | Why |
|---|---|---|
| HTTP server | Express + TypeScript | Industry standard Node.js framework |
| Logging | Pino | Structured JSON logs, fast |
| Rate limiting | Redis + ioredis | Shared state across instances |
| Task queue | BullMQ + Redis | Battle-tested async job queue |
| Observability | Langfuse | Traces every LLM call, tool call, cost, latency |
| LLM | Claude via Anthropic SDK | Same as P1-P3 |

---

## Prerequisites — Do Before Writing Code

### 1. Redis (local)
Redis is needed for rate limiting and the task queue. Install via Windows:
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `sudo apt install redis-server && redis-server`
- Or Docker: `docker run -d -p 6379:6379 redis`
- Verify: `redis-cli ping` → should print `PONG`

### 2. Langfuse (free cloud account)
Langfuse traces every agent run so you can see LLM calls, tool calls, latency, and cost.
- Sign up at: https://langfuse.com (free tier is enough)
- Create a project, get: `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`
- Host: `https://cloud.langfuse.com`

---

## Target File Structure

```
p4-production-backend/
  src/
    server.ts                   ← Express app, registers routes + middleware
    routes/
      agent.ts                  ← POST /agent/run, POST /agent/task, GET /health
    middleware/
      auth.ts                   ← API key validation (x-api-key header)
      rate-limit.ts             ← Redis token-bucket: 10 req/min per key
      cost-guard.ts             ← reject if user exceeds daily token budget
    agent/
      runner.ts                 ← core agent loop (reused from P2 concepts)
      structured-output.ts      ← tool_use trick to get typed JSON from Claude
    queue/
      producer.ts               ← adds tasks to BullMQ queue
      worker.ts                 ← processes tasks, fires webhook on completion
    safety/
      prompt-injection.ts       ← detects + blocks injection attempts
      pii.ts                    ← redacts PII before logging
    observability/
      logger.ts                 ← Pino structured logger
      tracer.ts                 ← Langfuse integration
  .env
  package.json
  tsconfig.json
```

---

## Key Concepts to Teach (in order)

### 1. Why wrap an agent in a REST API?
P1-P3 were CLI tools — one user, one terminal. A REST API lets multiple clients (Angular app, mobile, other services) call the same agent concurrently over HTTP. This is how every real AI product works.

### 2. Streaming via SSE (Server-Sent Events)
Claude streams tokens. HTTP is request/response. SSE bridges them: the server holds the connection open and pushes chunks as they arrive.
Why SSE over WebSockets: SSE is one-directional (server → client), simpler, and perfect for streaming LLM responses.

### 3. Structured outputs (the tool_use trick)
Claude has no native JSON mode. The trick:
- Define a single tool with your desired output schema
- Force Claude to call it: `tool_choice: { type: "tool", name: "your_tool" }`
- Claude MUST call that tool — its input IS your structured output
Why: agents passing data to other agents need typed JSON, not prose.

### 4. Prompt caching
Add `cache_control: { type: "ephemeral" }` to your system prompt.
Anthropic caches it server-side for 5 minutes. Cached tokens cost 90% less.
Every production agent should do this for long system prompts.

### 5. Rate limiting (token bucket via Redis)
Each API key gets a bucket of tokens that refills over time.
Redis stores the bucket state — so rate limits work even if you run multiple server instances.
Return `429 Too Many Requests` with `Retry-After` header when limit exceeded.

### 6. Cost controls
Before every LLM call, count tokens: `client.messages.countTokens()`
Store cumulative daily usage per user in Redis (TTL = 86400s).
Reject if over budget. This prevents one runaway user from bankrupting your API key.

### 7. Prompt injection defense
Users can try to override your system prompt by putting instructions in their input.
Fix: wrap all user input in explicit delimiters:
```
<user_input>
{userMessage}
</user_input>
```
Never concatenate user text directly into the system prompt string.

### 8. PII handling
Detect emails/phones/SSNs in user input before logging.
Redact in logs: `j***@gmail.com` not `john@gmail.com`.
Why: logs are often stored long-term and accessible to many people. PII in logs is a compliance risk.

### 9. Async task queue (BullMQ)
Some agent runs take >30 seconds. Don't hold an HTTP connection open that long.
Pattern: POST /agent/task → returns taskId immediately → BullMQ worker runs agent → POSTs result to webhook URL when done.
Dead letter queue: failed jobs go to a separate queue for inspection/retry.

### 10. Observability (Langfuse)
Langfuse wraps every LLM call and records: input, output, latency, token count, cost.
In production you NEED this — blind agents are impossible to debug or optimise.
Also integrate Pino for structured JSON logs (not console.log).

---

## Build Order

1. `pnpm init` + install deps + tsconfig + package.json scripts
2. `src/observability/logger.ts` — Pino logger (used everywhere else)
3. `src/server.ts` + `src/routes/agent.ts` — basic Express server, GET /health
4. `src/middleware/auth.ts` — API key check on every route
5. `src/agent/runner.ts` — core agent loop (POST /agent/run with SSE streaming)
6. `src/agent/structured-output.ts` — tool_use trick for typed JSON
7. `src/middleware/rate-limit.ts` — Redis token bucket
8. `src/middleware/cost-guard.ts` — token counting + daily budget
9. `src/safety/prompt-injection.ts` + `src/safety/pii.ts` — input sanitisation
10. `src/queue/producer.ts` + `src/queue/worker.ts` — BullMQ async queue
11. `src/observability/tracer.ts` — Langfuse integration

Test at the end with Postman (or curl):
- `POST /agent/run` with `x-api-key` header → see SSE stream
- `POST /agent/run` without key → 401
- Hit rate limit → 429 with Retry-After
- Prompt injection attempt → blocked
- `POST /agent/task` → get taskId, see webhook fire
- Open Langfuse dashboard → see full trace

---

## Packages to Install

```bash
cd "E:\AI agents\p4-production-backend"
pnpm init
pnpm add @anthropic-ai/sdk express pino ioredis bullmq langfuse dotenv
pnpm add -D typescript @types/node @types/express tsx
```

---

## .env Template

```
ANTHROPIC_API_KEY=your-anthropic-key
API_KEY=any-secret-string-for-auth     ← clients send this in x-api-key header
REDIS_URL=redis://localhost:6379
LANGFUSE_PUBLIC_KEY=your-public-key
LANGFUSE_SECRET_KEY=your-secret-key
LANGFUSE_HOST=https://cloud.langfuse.com
PORT=3000
```

---

## Reference Files for This Session

| File | Why read it |
|---|---|
| `E:\AI agents\CLAUDE.md` | Teaching style — Abhiraj types, Claude instructs, explain WHY before each step |
| `E:\AI agents\AI-Agents-Learning-Plan.md` | Full P4 spec with Safety & Production Depth section |
| `E:\AI agents\notes\p2-learnings.md` | The agentic loop pattern — reused in runner.ts |
| `E:\AI agents\notes\p3-learnings.md` | RAG pipeline — will be wired into P5 as search_memory tool |
| `E:\AI agents\p3-memory-agent\src\` | P3 source code for reference |

---

## Teaching Style — CRITICAL

Per `E:\AI agents\CLAUDE.md`:
- **Abhiraj types the code. Claude instructs.**
- Explain the concept and the WHY **before** any instruction — what it is, why it exists, why this choice over alternatives.
- One small step at a time. Wait for confirmation before moving on.
- Ask "what did you see?" or "did that work?" after each step.
- Only write code yourself if he is stuck or explicitly asks.
- He wants COMPLETE understanding, not just steps to follow.
