# Interlude — Frameworks Tour + Fine-Tuning Awareness

**Not a project — a one-session reading and thinking exercise between P5 and P6.**

The purpose: after building P1-P5 from scratch, look at the major frameworks and understand what they abstract — and when they'd save time vs. get in the way. Also understand fine-tuning and MCP so you can speak to them in interviews.

---

## Part 1 — Frameworks Tour

### The key insight first

Every framework is doing exactly what you did in P1-P5:
- Tool definitions (P2)
- Agentic loops (P2)
- Structured outputs / tool_use trick (P4)
- Agent coordination with quality loops (P5)
- RAG pipelines (P3)

They just wrap it in abstraction. You built it all from scratch, so you can now evaluate any framework critically, debug through it, and choose it deliberately instead of defaulting to it out of ignorance.

Most developers go the other way — start with LangChain, follow a tutorial, get something working, have no idea why. When it breaks they're lost.

---

### Framework Comparison Table

| Framework | Language | What it abstracts | When to use |
|-----------|----------|-------------------|-------------|
| **LangChain** | PY/TS | Tools, memory, prompts, document loaders, 100+ integrations | When you need many third-party integrations fast |
| **LangGraph** | PY/TS | Stateful multi-agent graphs — nodes, edges, loops, human-in-the-loop | Complex workflows with branching, cycles, resumability. **Industry standard for P5-style systems.** |
| **CrewAI** | PY/TS | Role-based multi-agent — each agent gets role, goal, backstory. Crew = team. | When agents map to human roles. Very popular, common in job descriptions. |
| **OpenAI Agents SDK** | PY/TS | Lightweight agents — tools, handoffs, guardrails | Simple multi-agent systems. Clean reference implementation. Claude-compatible. |
| **AutoGen** | PY | Conversational multi-agent — agents talk in a loop until task is done | Research-oriented. Microsoft Research. Python-only. |
| **Semantic Kernel** | .NET/PY/TS | Enterprise agent framework — plugins, planners, memory. Microsoft/Azure ecosystem. | **.NET shops** — given your Angular/.NET background, enterprise employers will ask about this. |
| **LlamaIndex** | PY/TS | RAG pipelines, document ingestion, chunking, indexing | Document-heavy apps — better RAG tooling than LangChain |
| **Vercel AI SDK** | TS | Streaming, tool calling, multi-model switching | Full-stack TypeScript/Next.js apps |
| **Mastra** | TS | Agent workflows, memory, evals — TypeScript-native | TypeScript agents in production. Closest to what you built in P5. |

---

### LangChain vs LangGraph — the key distinction

LangChain's original "chain" model is **linear**: A → B → C. Too rigid for real agents that loop and branch.

LangGraph fixes this:
- **Nodes** = agents or functions
- **Edges** = transitions between nodes
- **Conditional edges** = "if score < 0.8, go back to Reviser"
- **Cycles allowed** = quality loops, retry logic

Your P5 pipeline is exactly what LangGraph models. If you rebuilt P5 in LangGraph, the quality loop would be a conditional edge instead of a for-loop.

**LangGraph is the industry standard for P5-style systems right now. You will see it in job descriptions constantly.**

---

### What frameworks add beyond what you built

At P1-P5 scale, frameworks are wrappers — you're right. But for larger systems:

- **State management** — LangGraph tracks which node you're in and can resume after a crash. Your P5 Orchestrator has no persistence — if it crashes mid-pipeline, you start over.
- **Human-in-the-loop** — pause a pipeline, wait for human approval, then continue. You'd have to build this yourself.
- **Built-in observability hooks** — callbacks for every agent step automatically.
- **Error recovery** — retry logic, fallback agents, dead letter handling built in.
- **Scale** — managing 50 agents with shared memory across distributed workers is where frameworks earn their complexity.

The judgment call — "do I reach for a framework or build it myself?" — is something most junior AI engineers can't make. You can, because you understand both sides.

---

## Part 2 — MCP (Model Context Protocol)

### The problem it solves

Before MCP, every AI product wrote custom integration code for every tool. You did this in P2 — you wrote a `web_search` tool definition specifically for your agent. Someone else building a different agent would write the same thing again from scratch.

Multiply that by every tool that exists: GitHub, Slack, databases, Stripe, Notion, Google Drive. Thousands of duplicate integrations across the industry.

### What MCP is

MCP is an open standard created by Anthropic. It separates tools into two pieces:

- **MCP Server** — a process that exposes tools over a standard protocol. Someone builds a GitHub MCP server once. It exposes `create_pr`, `read_file`, `list_issues`. Done — anyone can use it.
- **MCP Client** — your agent. Connects to any MCP server and gets its tools automatically, without knowing how they're implemented.

**The analogy:** Before USB, every peripheral had its own connector. USB standardized it — one plug, everything works. MCP is USB for AI tools.

### How it works

```
MCP Client (your agent)  ←→  MCP Server (exposes tools)
```

- MCP server exposes tools with name, description, and input schema — exactly like the tool definitions you've been writing in P2-P5
- The difference: instead of passing tools directly to `client.messages.create()`, you expose them over a standard protocol (stdio or HTTP) that any MCP client can discover and call
- The agent never needs to know how the tool is implemented — just the schema

### The connection to what you built

Every tool you built manually across P1-P5 could be packaged as an MCP server:
- P2's `web_search` and `read_url` → an MCP server
- P3's `search_memory` → an MCP server
- P5's entire pipeline → an MCP server with one tool: `run_pipeline`

Once packaged, any MCP-compatible client can use your tools instantly — Claude Desktop, Cursor, VS Code Copilot, any agent built by anyone.

### Why it matters for your career

MCP is moving fast. Claude Desktop supports it. Cursor uses it. Most serious AI products are adding MCP support right now.

You've been using MCP without realizing it — the tools Claude has access to in the Claude Code session (Google Drive, Gmail, Notion, browser automation) are all MCP servers connected to the session.

For P6: consider building your SaaS as an MCP server — this makes it instantly compatible with Claude Desktop, Cursor, and any other MCP client.

**Read:** `modelcontextprotocol.io` quickstart. It'll look very familiar.

---

## Part 3 — Fine-Tuning Awareness

### What fine-tuning actually is

When you call Claude, you're using a model with weights Anthropic trained on massive data. Fine-tuning means doing additional training on your own dataset to permanently shift the model's behavior.

The result is a new model — your version — that behaves differently from the base model.

### The decision tree — most important thing to understand

There are three tools for improving model output. Most people reach for fine-tuning when they should be using one of the first two:

| Approach | What it does | Use when |
|----------|-------------|----------|
| **Better prompting** | Clearer instructions, examples, structure | Output format is wrong, model misunderstands the task |
| **RAG** | Adds external knowledge at query time | Model lacks domain knowledge, knowledge changes frequently |
| **Fine-tuning** | Permanently adjusts model weights | Style/tone must be perfectly consistent, task is highly repetitive, prompt is too long to fit in context |

**The correct order is always: prompting → RAG → fine-tuning**

### Why fine-tuning is almost never the first answer

Fine-tuning:
- Costs thousands of dollars in training compute
- Requires hundreds or thousands of labeled examples
- Creates a model you have to maintain forever
- Every time the base model improves, your fine-tuned version is stuck on the old one

Most teams that think they need fine-tuning actually just need better prompts. This mistake costs real money.

### When fine-tuning genuinely makes sense

- A legal firm wants every output to match their exact house style — not just "formal", but something that can't be described in a prompt
- A company runs 50 million classification calls per day — a fine-tuned smaller model is 10x cheaper than prompting a large model
- A task requires knowledge too large to fit in any context window and doesn't chunk well for RAG

### What employers are really asking

When an interviewer asks "would you fine-tune for this use case?" — they're testing whether you'll reach for the expensive tool unnecessarily.

**The right answer almost always starts with:** "I'd try prompting and RAG first, and only consider fine-tuning if..."

That demonstrates engineering judgment. It separates senior AI engineers from juniors who just follow tutorials.

---

## Summary — What the Interlude Gives You

| Skill | What you can now do |
|-------|---------------------|
| Framework literacy | Evaluate LangChain/LangGraph/CrewAI/Mastra critically. Know what they abstract and when they're worth it. |
| LangGraph specifically | Explain nodes, conditional edges, cycles — and map your P5 pipeline to it. Common in job descriptions. |
| Semantic Kernel | Know it exists for .NET enterprise employers — your Angular/.NET background makes this relevant. |
| MCP awareness | Explain what it is, why it matters, and how it connects to the tool definitions you've been writing since P2. |
| Fine-tuning judgment | Know the decision tree: prompting → RAG → fine-tuning. Know why fine-tuning is almost never the first answer. |
