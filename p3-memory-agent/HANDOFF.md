# P3 Memory Agent — Session Handoff

## Status

P1 ✓, P2 ✓, P3 ✓ — all complete and working.

---

## What P3 Is

A TypeScript CLI agent that can **learn** from documents and **answer questions** about them later.

Two commands when done:
```
pnpm run teach "notes.md"                           ← chunk, embed, store in LanceDB
pnpm run ask "What did I write about pricing?"      ← embed query, search, answer with Claude
```

---

## Stack — Fully Local (no external services except Anthropic)

| What | Tool | Why |
|---|---|---|
| Embeddings | Ollama (`nomic-embed-text`) | Local, free, no API key, 768-dim vectors |
| Vector DB | LanceDB (npm package) | Local files, zero setup, no server needed |
| LLM | Claude via Anthropic SDK | Same as P1/P2 |

### Why LanceDB instead of pgvector?
pgvector has no pre-built Windows binary for PostgreSQL 18. LanceDB is a proper vector database
that installs as an npm package — same RAG concepts, zero infrastructure friction.

---

## Prerequisites — Done

- [x] Ollama installed (v0.30.10)
- [x] nomic-embed-text model pulled (274MB, 768 dimensions)
- [ ] Project scaffolded

---

## Target File Structure

```
p3-memory-agent/
  src/
    embeddings.ts     ← calls Ollama HTTP API to convert text → float[]
    chunker.ts        ← splits long documents into overlapping chunks
    vectorstore.ts    ← wraps LanceDB: upsert chunks, similarity_search
    rag-pipeline.ts   ← orchestrates: chunk → embed → store (teach) / embed → search → answer (ask)
    index.ts          ← CLI entry: reads command (teach/ask) and file/question from argv
  .lancedb/           ← auto-created by LanceDB, stores vector data
  .env                ← ANTHROPIC_API_KEY
  package.json
  tsconfig.json
```

---

## Key Concepts

### Embeddings
Text → array of floats (768 numbers with nomic-embed-text). Similar meaning = numerically close vectors.

### Cosine similarity
Score 0.0 = unrelated, 1.0 = identical. LanceDB computes this automatically during search.

### Chunking
Split documents into ~500 character pieces with 100-character overlap before embedding.
Why: embedding models have token limits; smaller chunks give more precise retrieval.

### RAG loop (teach path)
```
Read file → split into chunks → embed each chunk (Ollama) → store in LanceDB
```

### RAG loop (ask path)
```
Embed the question (Ollama) → similarity search in LanceDB → get top 5 chunks
→ inject chunks into Claude prompt → Claude answers using only the retrieved context
```

---

## Packages to Install

```bash
cd "E:\AI agents\p3-memory-agent"
pnpm init
pnpm add @anthropic-ai/sdk @lancedb/lancedb dotenv
pnpm add -D typescript @types/node tsx
```

---

## .env Template

```
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Build Order

1. Scaffold project (pnpm init, install deps, tsconfig, package.json scripts)
2. Build `src/embeddings.ts` — test it embeds a sentence and prints the vector length (should be 768)
3. Build `src/chunker.ts` — test it splits a paragraph into chunks
4. Build `src/vectorstore.ts` — test it can upsert a chunk and search
5. Build `src/rag-pipeline.ts` — wire teach and ask flows together
6. Build `src/index.ts` — CLI entry point

---

## Teaching Style Note

Per CLAUDE.md: Abhiraj types the code. Claude instructs one step at a time.
Explain the WHY and WHAT before each step — every tool, concept, and decision.
Wait for confirmation before moving on.
