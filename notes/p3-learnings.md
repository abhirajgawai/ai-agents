# Project 3 — Memory Agent Learnings

## What We Built
A TypeScript CLI agent with long-term memory. Feed it documents with `pnpm run teach`, then ask questions with `pnpm run ask`. It retrieves the most relevant chunks from those documents and uses Claude Haiku to answer — without hallucinating from training data.

---

## Setup Commands

```bash
cd "E:\AI agents\p3-memory-agent"

pnpm init
pnpm add @anthropic-ai/sdk @lancedb/lancedb dotenv
pnpm add -D typescript @types/node tsx

pnpm approve-builds   # approve esbuild's native binary install

# One-time: install and pull the embedding model
# Download Ollama from https://ollama.com
ollama pull nomic-embed-text
```

---

## Key Files

```
p3-memory-agent/
  src/
    embeddings.ts     ← calls Ollama HTTP API → returns float[] (768 numbers)
    chunker.ts        ← splits text into overlapping 500-char chunks
    vectorstore.ts    ← wraps LanceDB: addChunks(), search()
    rag-pipeline.ts   ← teach() and ask() — wires everything together
    index.ts          ← CLI entry: reads teach/ask command from argv
  .lancedb/           ← auto-created by LanceDB, stores vector data on disk
  .env                ← ANTHROPIC_API_KEY
```

---

## Stack — Fully Local

| What | Tool | Why |
|---|---|---|
| Embeddings | Ollama (`nomic-embed-text`) | Local, free, no API key, 768-dim vectors |
| Vector DB | LanceDB (npm package) | Local files, zero setup, no server needed |
| LLM | Claude Haiku via Anthropic SDK | Cheap, fast — just answering from retrieved context |

**Why not Voyage AI / Supabase (the original plan)?**
- pgvector has no pre-built Windows binary for PostgreSQL 18
- Ollama + LanceDB are fully local with identical RAG concepts
- LanceDB installs as a plain npm package — no server, no SQL

---

## Concepts Learned

### 1. What embeddings are

Text → array of floats encoding semantic meaning. Similar text produces numerically close vectors.

```
"I love dogs"    → [0.12, -0.83, 0.44, ...]   (768 numbers)
"I adore dogs"   → [0.11, -0.81, 0.46, ...]   (very close — similar meaning)
"stock market"   → [0.73,  0.22, -0.91, ...]  (far away — different meaning)
```

Claude cannot produce embeddings — it's a generative model. Embedding models are a separate type, trained specifically to produce vector representations.

### 2. Why chunking is necessary

You can't embed a whole document as one vector — two problems:
- **Token limits** — embedding models have a max input size
- **Precision** — one vector for 10,000 words = "average meaning" of everything. You'd get the whole doc back instead of the specific paragraph that answers the question.

Fix: split into ~500 character chunks with 100-character overlap. Overlap ensures sentences at boundaries never get cut in half.

```typescript
function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
  }
  return chunks;
}
```

### 3. What a vector database does

Stores vectors (float arrays) and finds the closest ones to a query vector. LanceDB does this locally with files on disk — same concept as Pinecone, Supabase pgvector, or Weaviate, just without the server.

```typescript
// Store
await table.add([{ text, vector: await embed(text), source }]);

// Search — returns rows ordered by similarity to queryVector
const results = await table.search(queryVector).limit(5).toArray();
```

### 4. The RAG loop

**Teach path:**
```
Read file → split into chunks → embed each chunk (Ollama) → store in LanceDB
```

**Ask path:**
```
Embed the question → similarity search in LanceDB → get top 5 chunks
→ inject chunks into Claude prompt → Claude answers from context only
```

The key insight: Claude never sees the full document. It only sees the 5 most relevant chunks. This keeps cost low, latency fast, and answers precise.

### 5. Why we use Haiku not Sonnet for the ask step

The ask step is just reading a few short paragraphs and summarising. No complex reasoning. Haiku is 10x cheaper than Sonnet and more than capable for retrieval + summarisation tasks.

### 6. How Ollama works

Ollama runs AI models locally as an HTTP server on port 11434. After `ollama pull nomic-embed-text`, calling the embedding API is just a fetch:

```typescript
const response = await fetch("http://localhost:11434/api/embeddings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
});
const data = await response.json();
// data.embedding → number[] of length 768
```

### 7. LanceDB table initialisation trick

LanceDB infers the table schema from the first row you insert. To create the table before any real data arrives, insert a dummy `__init__` row with a zero vector, then filter it out during search:

```typescript
await db.createTable(TABLE_NAME, [
  { text: "__init__", vector: Array(768).fill(0), source: "" },
]);

// In search — filter the dummy row out
table.search(queryVector).where("text != '__init__'").limit(5).toArray();
```

### 8. `new Anthropic()` reads the API key automatically

No need to pass the key manually. The SDK reads `process.env.ANTHROPIC_API_KEY` on its own. As long as `dotenv/config` is imported first in `index.ts`, the key is set before any SDK call.

---

## Bugs We Hit & Why

| Bug | Cause | Fix |
|-----|-------|-----|
| `ERR_MODULE_NOT_FOUND` running tsx | Ran `npx tsx` from wrong directory | `cd` into project folder first |
| `EBADDEVENGINES` with npx | Project requires pnpm, used npx instead | Use `pnpm tsx` not `npx tsx` |
| `[ERR_PNPM_IGNORED_BUILDS]` | pnpm blocked esbuild's native install script | Run `pnpm approve-builds` |
| `distanceType` not found | LanceDB v0.30.0 has different API than docs | Remove `.distanceType()`, use `.where()` filter instead |
| Wrong search results on re-run | Chunks accumulated across multiple test runs | Delete `.lancedb` folder to reset |
| `__init__` row appearing in results | Dummy init row stored in same table as real data | Filter with `.where("text != '__init__'")` |

---

## What Happens Under the Hood (one full run)

```
pnpm run teach "notes/p2-learnings.md"
  → index.ts reads argv[2] = "teach", argv[3] = filepath
  → rag-pipeline.ts reads file → splits into ~N chunks
  → each chunk sent to Ollama → returns 768-number vector
  → vectorstore.ts stores {text, vector, source} rows in LanceDB
  → Done

pnpm run ask "what tools did we build in p2?"
  → index.ts reads argv[2] = "ask", argv[3] = question
  → rag-pipeline.ts sends question to Ollama → gets query vector
  → vectorstore.ts searches LanceDB → returns 5 closest chunks
  → chunks injected into Claude Haiku prompt
  → Haiku answers from context only
  → prints Answer + Sources
```

---

## Project 3 — COMPLETE ✓

Built: Full RAG pipeline — local embeddings, local vector storage, Claude answers from your own documents.

## Next Up — Project 4: Production Backend
- Wrap the agent in a REST API (Express/Fastify)
- Streaming via SSE
- Rate limiting, cost controls, prompt injection defense
- Async task queue with BullMQ + Redis
- Observability with Langfuse
