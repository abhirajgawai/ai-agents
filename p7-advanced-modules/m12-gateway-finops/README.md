# M12 - LLM Gateway + FinOps

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M12. It explains how to put a gateway in front of LLM calls and measure cost, caching, and workflow-level spend.

---

## 1. What This Module Is About

M12 teaches that once you call more than one model or spend real money, direct SDK calls become harder to govern. A gateway centralizes routing, caching, retries, virtual keys, and cost tracking.

You will self-host LiteLLM in front of an existing agent and measure the difference caching makes.

The core lesson: FinOps is an engineering concern, not just a billing-page concern.

---

## 2. What You Are Building

Build a gateway setup where:

- agent calls go through LiteLLM
- cost and tokens are logged per workflow
- exact-match caching is enabled
- repeated prompts show cache hits
- a before/after cost report is produced

Run the same 20 prompts twice and compare.

---

## 3. Concepts To Understand Before Coding

- **Gateway**: one controlled entry point for model calls.
- **Virtual key**: app-specific key managed by the gateway.
- **Fallback**: routing to another model/provider on failure.
- **Caching**: serving repeated identical prompts without paying again.
- **Workflow-level cost**: cost tagged to a feature, not just the whole account.

Aggregate spend tells you that money was spent. Workflow spend tells you where.

---

## 4. Recommended File Structure

```text
m12-gateway-finops/
  README.md
  HANDOFF.md
  litellm-config.yaml
  docker-compose.yml
  reports/
    cost-before-after.md
  src/
    client.ts
    cost-log.ts
    run-workload.ts
```

File responsibilities:

- `litellm-config.yaml`: gateway model and cache configuration.
- `docker-compose.yml`: runs gateway and cache dependencies if needed.
- `src/client.ts`: points an agent/workload at the gateway.
- `src/cost-log.ts`: logs tokens and cost by workflow.
- `reports/`: before/after cache and cost evidence.

---

## 5. Setup Steps

Install LiteLLM using Docker or the recommended current setup from its docs. Keep secrets out of git.

Create `.env.example` only, never `.env` with real keys.

Script shape for the local workload:

```json
{
  "scripts": {
    "workload": "tsx src/run-workload.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

If you use Docker Compose, include the command in `HANDOFF.md`.

---

## 6. Implementation Path

### Step 1 - Configure LiteLLM

Create `litellm-config.yaml` with at least one model route. Add cache settings if your chosen LiteLLM version supports them in config.

### Step 2 - Route a workload through the gateway

Create `src/client.ts` that sends calls to the gateway base URL instead of directly to the provider.

### Step 3 - Add workflow tags

Every request should include a workflow or feature label such as:

```text
workflow: m12-cache-test
```

### Step 4 - Log cost and tokens

Create `src/cost-log.ts` to capture:

- prompt id
- model
- token usage
- estimated cost
- cache hit if available
- latency

### Step 5 - Run 20 prompts twice

First pass should populate cache. Second pass should show faster, cheaper responses if exact-match caching is working.

### Step 6 - Write the report

Create `reports/cost-before-after.md` with:

- total first-pass cost
- total second-pass cost
- cache hit rate
- latency comparison
- what caching did and did not help

---

## 7. Verification Checklist

M12 is complete only when:

- LiteLLM gateway runs locally or on a server
- workload calls the gateway, not the provider SDK directly
- cost/tokens are logged per workflow
- exact-match caching is enabled
- same 20 prompts are run twice
- second pass shows cache hits or documented reason it does not
- before/after report exists
- secrets are not committed
- `HANDOFF.md` explains gateway value and limitations

---

## 8. What To Put In HANDOFF.md

Include:

- how to start the gateway
- config file path
- model route used
- how the client points to the gateway
- workload command
- cache hit rate
- cost report path
- operational risks

---

## 9. Explain-It-Back Questions

Before moving to M13, answer:

1. Why use a gateway instead of direct provider calls?
2. What does caching save?
3. Why tag spend by workflow?
4. What are virtual keys useful for?
5. What did the before/after report prove?
