# Project 1 — Hello Agent Learnings

## What We Built
A TypeScript CLI that talks to Claude (Haiku model) in real time, maintains full conversation history, and runs in the terminal.

---

## Setup Commands

```bash
# Create project folder
mkdir p1-hello-agent
cd p1-hello-agent

# Initialize project
pnpm init

# Install runtime dependencies
pnpm add @anthropic-ai/sdk dotenv

# Install dev dependencies (TypeScript tooling)
pnpm add -D typescript @types/node tsx

# Run the app
pnpm dev

# If pnpm blocks build scripts
pnpm approve-builds
```

---

## Key Files

```
p1-hello-agent/
  src/
    agent.ts    ← talks to Claude, manages conversation history
    index.ts    ← CLI loop, reads user input
  .env          ← API key (never commit this)
  .gitignore    ← excludes .env and node_modules
  package.json  ← project config and scripts
  tsconfig.json ← TypeScript compiler config
```

---

## Concepts Learned

### 1. How LLM API calls work
Every call to Claude sends an HTTP request with:
- A **model** (which Claude to use — Haiku is fast/cheap, Sonnet is smarter)
- A **system prompt** (rules/persona Claude follows — not part of conversation)
- A **messages array** (the full conversation history)
- `max_tokens` (max length of reply — controls cost)

```typescript
client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 1024,
  system: "You are a helpful assistant.",
  messages: messageHistory,
});
```

### 2. Claude has NO memory — you provide it
Claude is stateless. Every API call is independent. The only reason Claude "remembers" previous messages is because YOUR CODE sends the full history every time. If you don't send history, Claude has no idea what was said before.

### 3. Message format
Every message is an object with exactly two things:
```typescript
{ role: "user" | "assistant", content: "text here" }
```
You push user messages AND assistant replies into the same array.

### 4. Response structure
Claude returns `response.content` — an array of content blocks.
Each block has a `type` — usually `"text"`, but could be `"thinking"` (reasoning).
You must check the type before accessing `.text`:
```typescript
const textBlock = response.content.find((block) => block.type === "text");
const assistantMessage = textBlock?.text ?? "";
```

### 5. TypeScript discriminated unions
When a value can be one of several types, TypeScript won't let you access
type-specific properties until you narrow the type with a check.
This is a safety feature — it stops runtime crashes.

### 6. `"type": "module"` in package.json
Tells Node.js to use modern ES module syntax (`import/export`).
Must match `"module": "NodeNext"` in tsconfig.json.
Import paths use `.js` extension even for `.ts` files.

### 7. `dotenv` — keeping secrets safe
- Store API keys in `.env` file
- Call `dotenv.config()` at the top of your code
- This loads the key into `process.env.ANTHROPIC_API_KEY`
- Always add `.env` to `.gitignore` — never commit secrets

### 8. `tsx` — run TypeScript directly
Instead of compiling `.ts` → `.js` first, `tsx` lets you run TypeScript
files directly with Node.js. Great for development.

### 9. Recursive CLI loop
The CLI keeps running by calling itself:
```typescript
function askQuestion() {
  rl.question("You: ", async (input) => {
    // ... handle input
    askQuestion(); // calls itself again to wait for next input
  });
}
```

### 10. Tokens
- Tokens ≈ word fragments (roughly 1 token = 0.75 words)
- You pay per token (input + output)
- `max_tokens` caps how long Claude's reply can be
- Claude Haiku is ~20x cheaper than Claude Opus

---

## What Happens Under the Hood (one full turn)

```
You type "Hello"
  → pushed to messageHistory as { role: "user", content: "Hello" }
  → HTTP POST to api.anthropic.com with full messageHistory
  → Claude processes all messages
  → Returns response.content array
  → You extract the text block
  → Push to messageHistory as { role: "assistant", content: "..." }
  → Print to terminal
  → Wait for next input
```

---

## Bugs We Hit & Why

| Bug | Cause | Fix |
|-----|-------|-----|
| `Property 'text' does not exist on type 'ContentBlock'` | `ContentBlock` can be `TextBlock` or `ThinkingBlock` — TypeScript won't let you access `.text` without checking which one it is | Use `.find(block => block.type === "text")` to narrow the type first |
| `[ERR_PNPM_IGNORED_BUILDS]` | pnpm blocks build scripts by default for security | Run `pnpm approve-builds` and approve `esbuild` |
| `rootDir must be set` | TypeScript needs explicit `rootDir` when `outDir` is set | Add `"rootDir": "./src"` to tsconfig |

---

## Streaming — How It Works

Two ways to call Claude:

| Method | How | When to use |
|--------|-----|-------------|
| `client.messages.create()` | Waits for full response | Background tasks, processing |
| `client.messages.stream()` | Chunks arrive in real time | Any user-facing chat UI |

### The streaming loop
```typescript
const stream = await client.messages.stream({ model, max_tokens, system, messages });

for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text); // print without newline
    fullText += event.delta.text;           // accumulate for history
  }
}
```

- `for await` — async iterator, loops over chunks as they arrive from the network
- `content_block_delta` — the event type that carries actual text chunks
- `process.stdout.write()` — prints without newline (unlike console.log)
- You return `fullText` at the end so the caller can add it to message history

### Bug we hit
Claude was printing twice — once from `stream.ts` (real-time) and once from `index.ts` (after the fact). Fix: remove the `console.log` in `index.ts` since `stream.ts` already handles output.

---

## Project 1 — COMPLETE ✓

Built: TypeScript CLI with streaming, conversation memory, and proper API key management.

## Next Up — Project 2
- Tool calling (give Claude the ability to search the web, read URLs, save files)
- The ReAct loop (Reason → Act → Observe → repeat)
- How agents make decisions autonomously
