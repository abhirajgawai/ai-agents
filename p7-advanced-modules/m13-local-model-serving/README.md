# M13 - Local Model Serving: Ollama to vLLM

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M13. It explains how to compare local-development model serving with production-style GPU serving.

---

## 1. What This Module Is About

M13 teaches the path from local open-weight model experimentation to production-grade inference serving. Ollama is convenient for local development. vLLM is built for higher-throughput serving.

You will serve the same 7-8B model through both, point an existing agent at each, and measure performance and cost.

The core lesson: local vs cloud vs rented GPU is an engineering tradeoff, not an ideology.

---

## 2. What You Are Building

Build a model backend switch:

```text
MODEL_BACKEND=ollama | vllm | cloud
```

Then benchmark:

- Ollama local
- vLLM on rented GPU
- existing cloud API

Measure:

- latency
- tokens/sec
- rough cost per 1M tokens
- setup complexity

---

## 3. Concepts To Understand Before Starting

- **Ollama**: local model runner, good for development and single-user workflows.
- **vLLM**: production inference server optimized for throughput and batching.
- **Quantization**: smaller/lower-precision model weights for cheaper serving.
- **OpenAI-compatible endpoint**: API shape that lets clients swap providers by changing base URL.
- **Crossover point**: volume where self-hosting becomes cheaper than APIs.

Do not self-host just because it sounds advanced. Measure.

---

## 4. Recommended File Structure

```text
m13-local-model-serving/
  README.md
  HANDOFF.md
  DECISION.md
  benchmark-results.md
  src/
    model-client.ts
    benchmark.ts
    sample-agent-call.ts
  deployment/
    vllm-run-command.md
    ollama-setup.md
```

File responsibilities:

- `src/model-client.ts`: switches base URL by backend.
- `src/benchmark.ts`: sends fixed prompts and records throughput.
- `benchmark-results.md`: comparison table.
- `DECISION.md`: when to pick each backend.
- `deployment/`: exact setup commands used.

---

## 5. Setup Path

### Step 1 - Install and test Ollama

Install Ollama locally, pull one 7-8B model, and confirm the OpenAI-compatible endpoint works at:

```text
http://localhost:11434
```

Save setup notes in `deployment/ollama-setup.md`.

### Step 2 - Add backend switching

Create a model client where only config changes between:

- Ollama base URL
- vLLM base URL
- cloud provider base URL

### Step 3 - Rent GPU time for vLLM

Use a short-lived GPU instance such as RunPod or Lambda Labs. Start vLLM with the same or comparable model.

Save the exact command in `deployment/vllm-run-command.md`.

### Step 4 - Benchmark all three

Run the same prompt set through each backend. Use enough prompts to see rough throughput, but avoid unnecessary cost.

### Step 5 - Write the decision

In `DECISION.md`, explain when you would choose each backend using measured numbers.

---

## 6. Verification Checklist

M13 is complete only when:

- Ollama serves a local model
- vLLM serves a model on rented GPU
- existing agent can switch backend by config
- benchmark runs against Ollama
- benchmark runs against vLLM
- benchmark runs against cloud API
- `benchmark-results.md` compares latency, tokens/sec, and cost
- `DECISION.md` explains when to use each
- credentials and rented instance details are not committed

---

## 7. What To Put In HANDOFF.md

Include:

- model selected
- Ollama setup command
- vLLM setup command
- backend config variables
- benchmark command
- result table path
- final backend decision
- cost and cleanup notes

---

## 8. Explain-It-Back Questions

Before moving to M14, answer:

1. Why is Ollama better for local dev than production serving?
2. What does vLLM optimize?
3. What is quantization trading off?
4. When is cloud API still the right answer?
5. What did your benchmark change your mind about?
