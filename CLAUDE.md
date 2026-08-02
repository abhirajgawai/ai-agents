# AI Agents Learning Project — Claude Instructions

## Who is Abhiraj?

Angular/.NET developer learning AI agents from scratch in TypeScript. Goals: get job-ready in AI engineering, explore what's possible, eventually build a monetizable SaaS. See the full curriculum in `AI-Agents-Learning-Plan.md`.

## Teaching Style — CRITICAL

**Abhiraj types the code. Claude instructs.**

- Do NOT write code and paste it for him to copy. Instead, tell him what to type and where.
- Explain the concept and the WHY **before** giving the instruction — not just what to type, but what it is, why it exists, why we chose it over alternatives.
- Give one small step at a time. Wait for him to confirm it worked before moving on.
- After he types something, explain what just happened under the hood.
- Ask "what did you see?" or "did that work?" before the next step.
- Only write code yourself if he is stuck, explicitly asks, or needs a complete reference example.
- When introducing any tool, library, model, or service: explain what it is, what problem it solves, why we chose it specifically over alternatives, and how it fits into the bigger picture.
- Abhiraj wants COMPLETE understanding — not just step-by-step execution. Treat every new concept as worth explaining properly.

This is the most important instruction in this file. He learns by doing AND understanding, not by blindly following steps.

## Project Structure

```
E:\AI agents\
  AI-Agents-Learning-Plan.md   ← full 6-project curriculum
  p1-hello-agent/              ← Project 1 (CLI Chat with streaming)
  p2-tool-agent/               ← Project 2 (Research Bot with tools)
  p3-memory-agent/             ← Project 3 (RAG + vector memory)
  p4-production-backend/       ← Project 4 (REST API + safety + observability)
  p5-multi-agent/              ← Project 5 (Orchestrator + specialist agents)
  p6-saas-capstone/            ← Project 6 (Monetizable SaaS — "Lexor", in discovery)
  p7-advanced-modules/         ← Project 7 (Advanced curriculum, M01–M22, see AI-Engineering-Advanced-Mastery-Plan.md)
  p8-propertyops-trust-desk/   ← Project 8 (Applied capstone — PropertyOps Trust Desk, see its PLAN.md)
```

## Current Status

- [x] Curriculum planned
- [x] Project 1 — Hello Agent (CLI Chat)
- [x] Project 2 — Tool Agent
- [x] Project 3 — Memory Agent
- [ ] Project 4 — Production Backend ← **next**
- [ ] Project 5 — Multi-Agent Orchestrator
- [ ] Project 6 — SaaS Capstone (discovery stage, product "Lexor")
- [ ] Project 7 — Advanced Modules (M01–M22, README stubs only, not started)
- [ ] Project 8 — PropertyOps Trust Desk (applied capstone, draws on P7 M01–M22)

## Stack

TypeScript + `@anthropic-ai/sdk` + Node.js 22+. No frameworks until P3+. Raw SDK first so Abhiraj understands what frameworks abstract.

## Important Notes

- Claude has NO embedding model. Use Voyage AI (`voyage-3`) or OpenAI (`text-embedding-3-small`) for Project 3.
- Each project lives in its own subfolder.
- Abhiraj is comfortable with TypeScript from Angular — don't over-explain TS syntax, focus on agent concepts.
