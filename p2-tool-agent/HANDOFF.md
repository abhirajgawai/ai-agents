# P2 Tool Agent — Session Handoff

## Where We Are

P2 is partially working but has two bugs introduced during the session that need to be fixed before it's clean.

The agent DOES run — it searches the web and produces output. But the file structure got messy and needs a quick cleanup at the start of the next session.

---

## Current File Structure

```
p2-tool-agent/
  src/
    agent.ts        ← core agentic loop (has 2 bugs — see below)
    index.ts        ← MESSY: accidentally contains tools array + CLI entry point mixed together
    tools/
      save_note.ts  ← correct and complete
      (index.ts is MISSING — was never created)
  .env              ← has ANTHROPIC_API_KEY
  package.json      ← type: module, pnpm dev = tsx src/index.ts
  tsconfig.json     ← has "types": ["node"]
```

---

## Bug 1 — `src/index.ts` is broken

`src/index.ts` currently has the tools array AND the CLI entry point merged together (they got accidentally combined). It should ONLY be the CLI entry point.

**What `src/index.ts` currently looks like (wrong):**
```typescript
import { saveNoteSchema } from "./tools/save_note.js";
import { runAgent } from "./agent.js";

export const tools = [           // ← THIS SHOULD NOT BE HERE
  {
    type: "web_search_20260209" as const,
    name: "web_search" as const,
  },
];

const question = process.argv.slice(2).join(" ");
if (!question) {
  console.error('Usage: pnpm dev "your research question here"');
  process.exit(1);
}
runAgent(question).catch(console.error);
```

**What needs to happen:**

1. Create the MISSING file `src/tools/index.ts` with the correct tool registry:
```typescript
import { saveNoteSchema } from "./save_note.js";

export const tools = [
  {
    type: "web_search_20260209" as const,
    name: "web_search" as const,
  },
  saveNoteSchema,
];
```

2. Fix `src/index.ts` to be ONLY the CLI entry point:
```typescript
import { runAgent } from "./agent.js";

const question = process.argv.slice(2).join(" ");

if (!question) {
  console.error('Usage: pnpm dev "your research question here"');
  process.exit(1);
}

runAgent(question).catch(console.error);
```

---

## Bug 2 — `agent.ts` has module-level variables and a wrong import

**Current `agent.ts` import (wrong):**
```typescript
import { tools } from "./index.js";   // ← should be "./tools/index.js"
```

**Current `agent.ts` has these at module level (wrong — should be inside the function):**
```typescript
const textOutput: string[] = [];
const filename = "notes/research.md";
```

**What agent.ts should look like (clean version):**
```typescript
import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
import { tools } from "./tools/index.js";
import { saveNote } from "./tools/save_note.js";

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runAgent(userMessage: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  const textOutput: string[] = [];

  console.log(`\nAgent starting: "${userMessage}"\n`);

  while (true) {
    console.log("\n[Agent] Calling Claude...");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system:
        "You are a research agent. Use web_search to find information. When done researching, collect your findings and they will be saved automatically.",
      tools,
      messages,
    });

    console.log(`[Agent] stop_reason: ${response.stop_reason}`);
    console.log(
      `[Agent] content blocks: ${response.content.map((b) => b.type).join(", ")}`,
    );

    for (const block of response.content) {
      if (block.type === "text") {
        process.stdout.write(block.text);
        textOutput.push(block.text);
      }
    }

    if (response.stop_reason === "end_turn") {
      const filename = "notes/research.md";
      await saveNote(filename, textOutput.join("\n"));
      console.log(`\n\n[Agent] Done. Saved to ${filename}`);
      break;
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use" && block.name === "save_note") {
          const input = block.input as { filename: string; content: string };
          console.log(`\n[Tool] Saving → ${input.filename}`);
          const result = await saveNote(input.filename, input.content);
          console.log(`[Tool] ${result}`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
```

---

## What We Discovered (Important Concepts Learned This Session)

### Server-side vs Client-side tools
- **Server-side** (`web_search_20260209`): Anthropic runs these automatically. You declare them, they execute on Anthropic's servers, results come back in the response. No tool_use block for you to handle.
- **Client-side** (`save_note`): YOU define and execute these. Claude sends a `tool_use` block, your code runs the function, you return a `tool_result`.

### The unexpected issue we hit
`web_search_20260209` on `claude-sonnet-4-6` auto-enables additional server-side tools (bash, text editor, code execution). Claude used these server-side tools to "save" the file on Anthropic's sandbox instead of calling our `save_note` tool. The fix: save the text output programmatically in agent.ts after the loop ends, rather than depending on Claude to call save_note.

### Content block types we saw
- `server_tool_use` — Claude called a server-side tool (web_search, bash, etc.)
- `web_search_tool_result` — result of a web search
- `code_execution_tool_result` — result of server-side code execution
- `text_editor_code_execution_tool_result` — server-side text editor
- `bash_code_execution_tool_result` — server-side bash
- `tool_use` — Claude wants YOU to execute a client-side tool
- `text` — Claude's text response

---

## Next Steps After Fixing the Bugs

1. Apply the fixes above (create `src/tools/index.ts`, fix `src/index.ts`, fix `agent.ts`)
2. Run: `pnpm dev "What are the top 3 AI agent frameworks in 2026?"`
3. Verify that `notes/research.md` is created in the project folder
4. Write P2 learnings notes (like `E:\AI agents\notes\p2-learnings.md`)
5. Move on to Project 3 — Memory Agent

---

## Commands to Know

```bash
# Run the agent
pnpm dev "your question here"

# If tsx errors on builds
pnpm approve-builds
```
