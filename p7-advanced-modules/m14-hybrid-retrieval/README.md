# M14 - Retrieval Stack Depth: Hybrid Search + Reranking

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M14. It explains how to extend dense-vector retrieval with keyword search, fusion, reranking, and precision measurement.

---

## 1. What This Module Is About

M14 teaches that vector search alone is not the whole retrieval stack. Dense embeddings are useful for semantic similarity, but they can miss exact identifiers, names, codes, and rare phrases.

You will extend P3's retrieval with:

- sparse keyword search
- dense vector search
- hybrid fusion
- reranking
- precision@k evaluation

The core lesson: retrieval quality must be measured, not assumed.

---

## 2. What You Are Building

Build three retrieval modes:

```text
dense-only
hybrid
hybrid + rerank
```

Then run the same eval cases through all three and compare precision@k.

The goal is to prove whether each stage improves retrieval on your dataset.

---

## 3. Concepts To Understand Before Coding

- **Dense retrieval**: vector similarity from embeddings.
- **Sparse retrieval**: keyword or BM25-style matching.
- **Hybrid search**: combines dense and sparse signals.
- **Reciprocal rank fusion**: combines ranked lists without overfitting score scales.
- **Reranking**: rescoring top candidates with a stronger relevance model.
- **Precision@k**: whether expected docs appear in the top k results.

Retrieval failures often come from chunking and data quality, not just the search algorithm.

---

## 4. Recommended File Structure

```text
m14-hybrid-retrieval/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  data/
  eval/
    retrieval-cases.json
    measure-precision.ts
  src/
    dense-search.ts
    sparse-search.ts
    hybrid-search.ts
    rerank.ts
    run-query.ts
```

File responsibilities:

- `src/dense-search.ts`: baseline P3-style vector search.
- `src/sparse-search.ts`: keyword/BM25-style search.
- `src/hybrid-search.ts`: fuses dense and sparse results.
- `src/rerank.ts`: reranks top-N candidates.
- `eval/measure-precision.ts`: compares modes.

---

## 5. Setup Steps

Start from P3's RAG pipeline or copy the relevant retrieval code into this module.

```powershell
cd "E:\AI agents\p7-advanced-modules\m14-hybrid-retrieval"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "eval": "tsx eval/measure-precision.ts",
    "query": "tsx src/run-query.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Use a small fixed document set first. Expand only after measurement works.

---

## 6. Implementation Path

### Step 1 - Recreate dense baseline

Wire up the existing P3 dense search. Save baseline results before changing retrieval.

### Step 2 - Add sparse search

Implement simple keyword scoring first. BM25 is better, but a clear sparse baseline is enough to learn the pattern.

### Step 3 - Add hybrid fusion

Use reciprocal rank fusion or a weighted sum. Reciprocal rank fusion is safer when dense and sparse scores are on different scales.

### Step 4 - Add reranking

Take top-N hybrid results and rerank them with a cross-encoder or hosted rerank API. If you avoid external APIs, use a deterministic scoring approximation and document the limitation.

### Step 5 - Build retrieval eval cases

Create 10-20 query -> expected document cases. Include exact term cases where dense search may struggle.

### Step 6 - Compare precision

Run:

- dense-only
- hybrid
- hybrid + rerank

Save the results in `HANDOFF.md` or a separate report.

---

## 7. Verification Checklist

M14 is complete only when:

- dense baseline runs
- sparse search runs
- hybrid fusion runs
- reranking runs
- 10-20 retrieval eval cases exist
- precision@k is measured for all three modes
- results show measured comparison, even if not all improvements are positive
- limitations around chunking/data quality are documented
- `pnpm run typecheck` passes, if TypeScript is configured

---

## 8. What To Put In HANDOFF.md

Include:

- data source used
- retrieval modes implemented
- eval case count
- precision@k table
- one query where hybrid helped
- one query where it did not
- reranker decision
- what you would improve next

---

## 9. Explain-It-Back Questions

Before moving to M15, answer:

1. What does dense search miss?
2. What does sparse search miss?
3. Why is hybrid search usually a better default?
4. What does reranking add?
5. What did your precision@k eval prove?
