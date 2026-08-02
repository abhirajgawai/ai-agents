# M17 - A2A / Agent Interoperability

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M17. It keeps the module intentionally small: the goal is to understand the shape of agent-to-agent communication over a boundary, not to build a full platform.

---

## 1. What This Module Is About

M17 teaches when agent interoperability matters. For your own internal agents, direct function calls are usually simpler. A2A-style communication becomes useful when agents cross process, team, vendor, or organization boundaries.

You will build two toy agents that exchange one task over HTTP.

The core lesson: interop protocols are boundary tools, not something to force into every local architecture.

---

## 2. What You Are Building

Build:

- Agent A: sends a structured task
- Agent B: accepts the task over HTTP and returns a structured result
- a minimal client/server demo

You may use an A2A SDK if practical, or a hand-rolled JSON-over-HTTP equivalent if the SDK is too heavy for the lesson.

---

## 3. Concepts To Understand Before Coding

- **In-process call**: direct function call, simplest for local systems.
- **HTTP boundary**: agents communicate over the network.
- **Task envelope**: structured request containing task id, input, and metadata.
- **Structured result**: predictable response shape.
- **Interop**: useful when independent systems need to cooperate.

Do not overbuild this module. The value is seeing the boundary shape.

---

## 4. Recommended File Structure

```text
m17-a2a-demo/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  src/
    agent-a-client.ts
    agent-b-server.ts
    types.ts
    run-demo.ts
```

File responsibilities:

- `src/types.ts`: task and result envelopes.
- `src/agent-b-server.ts`: HTTP receiver.
- `src/agent-a-client.ts`: sends task to Agent B.
- `src/run-demo.ts`: starts or demonstrates the exchange.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m17-a2a-demo"
pnpm init
pnpm add express
pnpm add -D typescript tsx @types/node @types/express
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "server": "tsx src/agent-b-server.ts",
    "client": "tsx src/agent-a-client.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 6. Implementation Path

### Step 1 - Define task envelope

Create a type with:

- `taskId`
- `kind`
- `input`
- `requestedBy`

### Step 2 - Define result envelope

Create a response type with:

- `taskId`
- `status`
- `result`
- `errors`

### Step 3 - Build Agent B server

Expose:

```text
POST /tasks
```

It should accept the envelope, perform a small task, and return structured JSON.

### Step 4 - Build Agent A client

Agent A sends one task and prints the structured response.

### Step 5 - Prove it is over the wire

Run Agent B as a server process and Agent A as a separate client process. Do not call Agent B as a local function.

---

## 7. Verification Checklist

M17 is complete only when:

- Agent B exposes an HTTP endpoint
- Agent A sends a structured task over HTTP
- Agent B returns a structured result
- demo uses two separate processes or an equivalent network boundary
- result includes task id correlation
- `HANDOFF.md` explains when A2A is useful and when it is unnecessary

---

## 8. What To Put In HANDOFF.md

Include:

- how to start Agent B
- how to run Agent A
- request and response example
- whether you used SDK or hand-rolled HTTP
- why this module is intentionally small
- when you would use MCP instead

---

## 9. Explain-It-Back Questions

Before moving to M18, answer:

1. Why not use A2A for every internal agent?
2. What does the HTTP boundary add?
3. Why do task ids matter?
4. How is A2A different from MCP?
5. What did your demo prove?
