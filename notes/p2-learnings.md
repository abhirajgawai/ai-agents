# Project 2 — Tool Agent Learnings

## What We Built
A TypeScript research agent that takes a question from the CLI, uses `web_search` to find information autonomously, and saves the findings to a local markdown file.

---

## Setup Commands

```bash
mkdir p2-tool-agent
cd p2-tool-agent

pnpm init
pnpm add @anthropic-ai/sdk dotenv
pnpm add -D typescript @types/node tsx

pnpm dev "your research question here"
pnpm approve-builds   # if tsx blocks on first run
```

---

## Key Files

```
p2-tool-agent/
  src/
    index.ts          ← CLI entry point — reads question, calls runAgent()
    agent.ts          ← agentic loop — calls Claude, handles tool results
    tools/
      index.ts        ← tool registry — lists every tool Claude can use
      save_note.ts    ← save_note tool definition + implementation
  notes/
    research.md       ← output file (created at runtime)
  .env                ← ANTHROPIC_API_KEY
```

---

## Concepts Learned

### 1. Two types of tools

| Type | Who runs it | Example | How it appears |
|------|-------------|---------|----------------|
| **Server-side** | Anthropic's servers | `web_search_20260209` | You declare it, they execute it automatically |
| **Client-side** | Your code | `save_note` | Claude sends a `tool_use` block, you run the function, you return a `tool_result` |

Server-side tools require no execution code from you. Client-side tools require you to wire up the logic yourself.

### 2. The agentic loop (ReAct pattern)

```
User question
  → Claude decides what to do
  → If tool_use: your code runs the tool, returns result → back to Claude
  → If end_turn: Claude is done, save output and exit
```

The loop continues until `stop_reason === "end_turn"`. Claude decides on its own when it has enough information.

### 3. `stop_reason` — how you know what Claude wants

| `stop_reason` | Meaning |
|---------------|---------|
| `"tool_use"` | Claude wants to call a tool — handle it and loop |
| `"end_turn"` | Claude is done — exit the loop |
| `"max_tokens"` | Hit the token limit — response was cut off |

### 4. Content block types you'll see in P2

| Block type | Meaning |
|------------|---------|
| `text` | Claude's written response |
| `tool_use` | Claude wants YOU to run a client-side tool |
| `server_tool_use` | Claude called a server-side tool (web_search, bash, etc.) |
| `web_search_tool_result` | Result of a web search |
| `code_execution_tool_result` | Server-side code was executed |

### 5. The circular import trap
`agent.ts` imports `tools` from the tool registry. If it had imported from `index.ts` (the entry point) instead, TypeScript would have created a circular import: `index.ts → agent.ts → index.ts`. Always import from the correct source file, not from the entry point.

### 6. Module-level vs function-level variables
Variables declared at module level are shared across ALL calls to the module.
Variables declared inside a function are reset every time the function runs.
`textOutput` and `filename` must live inside `runAgent()` so they reset on each run.

### 7. `as const` for TypeScript literal types
TypeScript infers `"object"` as the broad type `string` by default.
The Anthropic SDK requires `input_schema.type` to be the exact literal `"object"`.
Adding `as const` tells TypeScript: "keep this as the literal value, don't widen it."

```typescript
// Wrong — TypeScript sees type: string
type: "object"

// Right — TypeScript sees type: "object" (the literal)
type: "object" as const
```

### 8. The unexpected server-side sandbox behaviour
`web_search_20260209` on `claude-sonnet-4-6` auto-enables additional server-side tools: `bash`, `text_editor`, `code_execution`. Claude used these to "save" the file on **Anthropic's sandbox** instead of calling our `save_note` tool.

The fix: don't rely on Claude to call `save_note`. Instead, collect all text output in an array during the loop, then save it programmatically after `end_turn`.

```typescript
// Collect text throughout the loop
if (block.type === "text") {
  textOutput.push(block.text);
}

// Save once Claude is done
if (response.stop_reason === "end_turn") {
  const filename = "notes/research.md";
  await saveNote(filename, textOutput.join("\n"));
}
```

---

## Tool Definition Structure (client-side)

```typescript
export const saveNoteSchema = {
  name: "save_note",
  description: "...",
  input_schema: {
    type: "object" as const,   // ← must be literal, not string
    properties: {
      filename: { type: "string", description: "..." },
      content:  { type: "string", description: "..." },
    },
    required: ["filename", "content"],
  },
};
```

---

## Bugs We Hit & Why

| Bug | Cause | Fix |
|-----|-------|-----|
| `tools` import from wrong file | `agent.ts` imported from `./index.js` (entry point) instead of `./tools/index.js` (registry) | Fix import path |
| `textOutput` never resets | Declared at module level — shared across calls | Move inside `runAgent()` |
| `Type 'string' is not assignable to type '"object"'` | TypeScript widened `"object"` to `string` | Add `as const` to `input_schema.type` |
| Claude saved file to Anthropic's sandbox | `web_search` auto-enables server-side bash/code tools, Claude used those instead of `save_note` | Collect text output in array, save programmatically after `end_turn` |

---

## What Happens Under the Hood (one full run)

```
pnpm dev "top 3 AI agent frameworks?"
  → index.ts reads argv, calls runAgent(question)
  → agent.ts sends question to Claude with tools list
  → Claude returns stop_reason: "tool_use" (web_search)
  → Your loop sees server_tool_use blocks — no action needed (server handles it)
  → Claude returns stop_reason: "end_turn" with findings as text
  → Your code saves textOutput[] to notes/research.md
  → Done
```

---

## Project 2 — COMPLETE ✓

Built: Autonomous research agent with server-side web search and local file saving.

## Next Up — Project 3: Memory Agent
- Vector embeddings — turning text into numbers so you can search by meaning
- Voyage AI for generating embeddings (Claude has no embedding model)
- A local vector store (SQLite or file-based)
- RAG loop: embed query → find relevant past notes → inject into prompt → answer
