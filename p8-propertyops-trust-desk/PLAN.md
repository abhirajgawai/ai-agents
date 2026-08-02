# Project 8 — PropertyOps Trust Desk (Applied Capstone)

Status: **Not started**

Full curriculum source this project draws on:
`../AI-Engineering-Advanced-Mastery-Plan.md` (modules M01–M22)

This is the practical build plan for P8. Unlike p1–p6, this is not a new
concept ladder — it's an **applied capstone**: a real product built by
exercising and consolidating what P1–P5 and the M01–M22 module curriculum
already taught. Nothing here gets scaffolded wholesale. Per `CLAUDE.md`,
Abhiraj types every line; Claude explains the WHY before each step, one
milestone-slice at a time, and waits for confirmation before moving on.

---

## 1. What This Project Is

**PropertyOps Trust Desk** — a document review and decision workflow
platform for property teams. Property teams receive documents from
applicants, tenants, vendors, and contractors. The system extracts data,
checks trust signals, flags issues, routes cases to review, and produces
an evidence-backed decision report.

One product, three packaging levels (not three separate products):

- **Landlords** — simple upload, instant report, pay-per-check.
- **Small/mid property managers** — dashboard, cases, applicant/vendor
  history, review queue, PDF reports. **This is the beachhead buyer** —
  more pain and volume than a landlord, faster sales cycle than
  enterprise.
- **Large property management teams** — team roles, tenant isolation,
  audit trail, API, webhooks, PMS integrations, SSO (later).

Two initial workflows:

1. **Tenant Application Review** — pay stubs, bank statements, IDs,
   employment letters → income consistency, rent-to-income ratio,
   fraud/tamper signals → approve / review / reject recommendation.
2. **Vendor / Finance Document Review** — invoices, maintenance receipts,
   contractor quotes → duplicate invoice checks, subtotal/tax/total
   validation, vendor mismatch checks, suspicious payment flags →
   approval queue.

**MVP scope (do not expand beyond this):** login, organization/team,
create case, upload documents, classify document type, extract fields
with citations, run deterministic checks, webhooks, API keys, clean
case/document/status data model, audit log, tenant-safe database design.
Actual PMS integrations are deferred post-MVP. Packaging-tier UI
differences are **not** separate milestones — one core model, one API
surface; tiers are presentation/access-level concerns layered on later.

**Beachhead:** small/mid property managers first. Not landlords (too
price-sensitive, high-support). Not enterprise (slow sales cycle).

---

## 2. Tech Stack

Follows p1–p5 conventions: TypeScript strict, Node 22+, ESM
(`"type": "module"`), pnpm, `tsx` for dev.

Closest precedent is **p4-production-backend** — reuse its Express
bootstrap, middleware chain, pino logger, Langfuse tracer, BullMQ
producer/worker pattern, and structured-output-via-tool-use pattern
directly rather than re-deriving them.

**New for this project (first time in this repo):**

- **PostgreSQL + Prisma** — the database. Justification: tenant-safe
  design (M15) needs real relational integrity — foreign keys from every
  table to `orgId`, unique constraints scoped per tenant, and eventually
  row-level security. Postgres supports RLS natively; SQLite doesn't, and
  a document store makes "prove no cross-tenant row was ever queryable"
  much harder to demonstrate. Prisma over Drizzle: schema-first
  migrations and a generated client map more naturally onto the EF Core
  mental model Abhiraj already has from .NET, and its migration diffing
  is easier to teach step by step.
- **multer** — multipart file upload handling.
- **zod** — request + extraction-schema validation.
- **bcrypt/argon2 + session or JWT** — real user accounts with
  persistent auth (p4's auth was API-key-only, single-tenant; this is
  the first project with real users, orgs, and roles).
- **Local filesystem storage adapter** for MVP dev (`./uploads`,
  gitignored), built behind an interface so an S3-compatible backend can
  be swapped in later without touching callers.
- **LanceDB (stretch only)** — reuse p3's embeddings/vectorstore pattern
  for duplicate-invoice similarity detection (Milestone 11, optional).

---

## 3. Module Mapping — MVP Feature → P7 Module

| MVP Feature | Primary Module(s) | What it reinforces |
|---|---|---|
| Org/team/roles, tenant-scoped queries | **M15 — Multi-Tenant Isolation** | Structural (not prompt-based) prevention of cross-tenant leaks |
| Login / sessions / API keys | M04 (auth boundary security), M15 | Auth boundary as first trust boundary; API keys as machine-to-machine boundary |
| Case + document upload, status model | M02 — Harness Planning | Explicit workflow states over ad hoc flags |
| Document classification | **M10 — Document AI** | First stage of the hybrid extraction pipeline |
| Field extraction with citations | **M10 — Document AI** | Grounding, per-field confidence, citation to source region |
| Deterministic checks (income consistency, rent-to-income, duplicate invoice, tax/total math, vendor mismatch) | **M21 — Document Forgery**, **M22 — Transaction Triage** | Cheap deterministic checks before LLM judgment; layered rules-first triage |
| Fraud/tamper signals | **M21 — Document Forgery** | Structural evidence before "does this look fake" LLM calls |
| Decision report (approve/review/reject + evidence) | **M18 — Trust UX** | Citations, confidence, inspectable/correctable output |
| Audit log | **M18 — Trust UX**, **M19 — Governance Notes** | Audit trail as both UX trust feature and governance artifact |
| Webhooks | M11 — MCP Server, M12 — Gateway/FinOps | Safe, versioned outbound integration contract; retries/timeouts |
| API keys / external API surface | M11, M04 | Same external-caller trust-boundary discipline as MCP tool exposure |
| Async extraction/checks pipeline (BullMQ) | **M08 — Durable Execution** | Idempotency, retry-safety for long-running jobs |
| Eval harness | **M06 — Evals & Error Analysis** | Ground-truth test docs, extraction precision/recall, seeded-anomaly recall |
| Observability (Langfuse, pino) | Reused from p4 (M05/M09 lineage) | Production logging/tracing carried forward |
| Duplicate-document detection (stretch) | **M14 — Hybrid Retrieval** | Embedding similarity + exact-match fusion |

Several MVP features draw on two modules at once — real products blend
curriculum topics rather than exercising them in isolation.

---

## 4. Milestones

Each milestone is one teaching session: a concrete deliverable, plus the
concepts to explain (WHY) before Abhiraj types anything (HOW).

- **M0 — Scaffold & tooling.** `package.json`, `tsconfig.json`, pnpm
  workspace entry, `.env.example`, `src/server.ts` booting Express with
  `/health`. *Why a new independent package; env var discipline for a
  multi-service app.*
- **M1 — Database & tenant model (M15).** Postgres via Docker, Prisma
  init, first migration: `Org`, `User`, `Membership`. Every future table
  carries `orgId`. *Why tenant isolation is a schema-time decision, not
  bolted on later.*
- **M2 — Auth + org/team model.** Signup/login, password hashing,
  session/JWT, `/me`, role-check middleware. *Why role lives on the
  membership join, not the user — a person can belong to multiple orgs
  with different roles.*
- **M3 — Case + document upload.** `POST /cases`,
  `POST /cases/:id/documents` (multer), files to disk + `Document` row
  at status `uploaded`. *Why upload and AI processing are separate
  steps; storage adapter interface designed now.*
- **M4 — Document classification.** Async BullMQ job calling Claude to
  classify document type + confidence. *First live Claude call in this
  project; classification as its own pipeline stage.*
- **M5 — Field extraction with citations (M10).** Typed JSON output per
  document type: fields, values, confidence, citation to source
  location. *Grounding and citations — never "trust the JSON."*
- **M6 — Deterministic checks engine (M21/M22).** Pure-function checks
  (income consistency, rent-to-income ratio, tax/total math, duplicate
  invoice lookup, vendor mismatch) → `CheckResult`. *Cheap deterministic
  checks before any LLM judgment call; layered triage — most cases
  auto-clear on rules alone.*
- **M7 — Decision report (M18).** `Decision` record combining
  classification + extraction (with citations) + check results +
  recommendation + reason. *The report must show its work; reviewer
  overrides are themselves data.*
- **M8 — Audit log (M18/M19).** `AuditLog` table + service recording
  every state-changing action with actor/timestamp/org/before-after;
  `GET /cases/:id/audit`. *Append-only design; "who decided what and
  why" as a reviewable answer.*
- **M9 — API keys + webhooks (M11/M12/M04).** `ApiKey` model +
  api-key-auth middleware; `Webhook` model firing signed payloads on
  case status change with retry/backoff. *External trust boundary
  design; webhook signing/idempotency.*
- **M10 — Eval harness (M06).** `test/evals/` with a small ground-truth
  doc set (synthetic pay stubs/invoices, seeded fraud/duplicate cases),
  scored for extraction accuracy and check recall. *Evals as error
  analysis, not a pass/fail gate — same 100%-recall-on-seeded-anomalies
  bar as M22.*
- **M11 — Duplicate detection via embeddings (M14/p3, stretch,
  optional).** LanceDB similarity index over extracted invoice text,
  reusing p3's embeddings/vectorstore pattern.

---

## 5. Reuse vs. New

**Reused directly:** p1/p2 raw SDK + streaming basics; p4's Express
bootstrap, middleware ordering, pino logger, Langfuse tracer, BullMQ
producer/worker, structured-output-via-tool-use pattern, rate limiting.

**New to this repo:** relational DB + ORM (Postgres/Prisma); multi-tenant
data modeling and row-scoping discipline; file upload handling + storage
abstraction; real persistent user accounts/roles (not just API keys);
audit logging as a first-class model; webhooks as a general outbound
integration subsystem.

---

## 6. Verification per Milestone

Each milestone should end with something Abhiraj can run and see:
`curl`/Postman hitting the new endpoint, a Prisma Studio look at the new
table, or a manual document upload through to a visible classification/
extraction/check result. M10 (evals) is the first milestone with an
automated pass/fail signal — run `pnpm eval` (or equivalent script) and
check extraction accuracy + seeded-anomaly recall.
