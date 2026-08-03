# M1 — Automation Decision Framework Learnings

## What We Built
A TypeScript CLI (`p7-advanced-modules/m01-decision-framework/`) that scores a
described task against four filters and recommends one of four approaches:
`rules`, `ai_automation`, `agentic`, or `dont_automate_yet`.

---

## Setup Commands

```powershell
cd "E:\AI agents\p7-advanced-modules\m01-decision-framework"
pnpm init
pnpm add -D typescript tsx @types/node
pnpm approve-builds esbuild   # pnpm blocks postinstall scripts by default
pnpm tsc --init

pnpm run score "your task description here"
pnpm run typecheck
```

---

## Key Files

```
m01-decision-framework/
  src/
    filters.ts     ← DecisionScores type, the 4 filter questions, isValidScore()
    recommend.ts    ← pure function: scores in, {verdict, reason} out. No I/O.
    index.ts        ← CLI entry point — readline prompts, calls recommend(), prints result
  examples/sample-tasks.md       ← 3 real candidate tasks
  test-cases/completed-scores.md ← the 3 tasks actually run, with scores + reasoning
  HANDOFF.md                     ← full writeup, file map, limitations
  tsconfig.json, package.json, pnpm-lock.yaml, pnpm-workspace.yaml
```

---

## Concepts Learned

### 1. The four filters, and why they exist
- **Frequency × volume** — is this worth automating *at all* (any method)? Rare tasks aren't, regardless of how automatable they look.
- **Rule clarity** — could a new hire follow a written checklist? High clarity → you don't need an LLM at all, a script suffices.
- **Verifiability** — can you tell if the output is *correct*? No rubric/ground truth → can't trust an automated result → don't automate yet.
- **Process health** — is the underlying human process itself well-defined and stable? Automating a broken/undefined process just makes it fail faster and at higher volume — it doesn't make it better, and failures get harder to notice because they're now happening automatically instead of visibly, by hand.

### 2. Three automation tiers — the distinction that's easy to swap by mistake
| Tier | Who decides the steps | LLM's role | Example |
|---|---|---|---|
| `rules` | fully deterministic code | none | "if invoice > $10k, route to finance lead" |
| `ai_automation` | **fixed pipeline** (hardcoded flow) | LLM handles exactly **one** narrow judgment step | "classify this email into 1 of 5 categories" |
| `agentic` | **the LLM itself** | LLM chooses its own steps/tools dynamically | "research this vendor, compare options, write a recommendation" |

The mistake I made twice while learning this: calling `ai_automation` "autonomous" — that's actually the definition of `agentic`. `ai_automation` is still a fixed, hardcoded flow; only one step inside it is fuzzy/LLM-driven. `agentic` is the one where the LLM decides what happens next.

### 3. `agentic` is deliberately the narrowest, most gated verdict
In `recommend.ts`, the `agentic` branch requires **all four** filters to score
strong simultaneously: `ruleClarity <= 2` (needs real judgment — NOT clear
rules) AND `frequencyVolume >= 4` AND `verifiability >= 4` AND
`processHealth >= 4`. The order of checks matters too: `dont_automate_yet`
(via low `processHealth` or low `verifiability`) is checked **first**, before
`rules` is even considered — low verifiability or a broken process vetoes
everything else regardless of how good the task looks on other filters.

If a scoring tool recommends `agentic` easily/often, the framework has failed
— the senior default is the cheapest reliable solution, not the most capable one.

### 4. TypeScript module resolution with `nodenext` + `tsx`
Under `"module": "nodenext"`, import paths are written as they'll look
**after compilation** — `.js` — even though the actual source file is
`.ts` (e.g. `import { recommend } from "./recommend.js"` resolves to
`recommend.ts`). This isn't a typo; it's the Node ESM convention, and `tsx`
honors it at runtime the same way a real compiled Node app would.

Two ways to satisfy the type-checker here, and they're mutually exclusive:
- `allowImportingTsExtensions: true` + import with `.ts` extensions directly, or
- `allowImportingTsExtensions: false` (default/conventional) + import with `.js`
  extensions and let the resolver map them back to `.ts`.

An editor/linter flipped this flag on us mid-module — that's what caused the
`TS5097` errors. Fix was to match the imports to whichever setting is active,
not to fight the flag.

### 5. `readline/promises` has a real bug with piped/non-TTY stdin
Calling `rl.question()` repeatedly in a loop works fine in a live interactive
terminal, but hangs after the first call when stdin is piped or redirected
(a known Node.js issue, not specific to this code). Fixed by reading input
via async iteration instead: `rl[Symbol.asyncIterator]()` +
`await lines.next()`. Worth remembering for any future CLI that needs to be
scriptable/testable, not just used by hand.

### 6. `tsx` vs `tsc` — different jobs
`tsx` (esbuild-based) strips types and runs the code immediately — no actual
type-checking happens. `tsc --noEmit` is the real type-checker, run
separately via `pnpm run typecheck`. Running `pnpm run score` will happily
execute code with a type error in it; only the typecheck script catches those.

### 7. Node.js is a runtime, not "the backend"
Node is the equivalent of the .NET runtime/CLR — it can run a one-shot CLI
script (this module) just as easily as a long-running HTTP server. What
makes something "a backend" is the code you write on top (e.g. `app.listen()`
and request handlers), not the runtime itself. Frameworks like Express are a
convenience layer over Node's built-in `node:http` module — not a
requirement; raw Node can run a server with zero frameworks, same as raw
`HttpListener` can in .NET without ASP.NET Core.

---

## Bugs We Hit & Why

| Bug | Cause | Fix |
|---|---|---|
| `[ERR_PNPM_IGNORED_BUILDS]` on `pnpm add` | pnpm blocks postinstall scripts by default (supply-chain safety) | `pnpm approve-builds esbuild` — recorded in `pnpm-workspace.yaml` |
| `TS5097: import path can only end with '.ts'...` | `allowImportingTsExtensions` was `false` but imports used `.ts` extensions | Switched imports to `.js` extensions to match the active tsconfig setting |
| CLI hung after the first question when input was piped/redirected (only surfaced during automated testing, not real terminal use) | Node.js `readline/promises` bug: sequential `rl.question()` calls don't resolve past the first line on non-TTY stdin | Rewrote input loop using `rl[Symbol.asyncIterator]()` + `for`-await-style line reading |

---

## Explain-It-Back — where I got tripped up (worth re-reading before M2)

- Kept swapping `ai_automation` (fixed pipeline, one LLM step) and `agentic`
  (LLM chooses its own steps) — the "autonomous" word belongs to `agentic` only.
- Initially explained "why not default to an agent" purely in terms of low
  task frequency — that's actually the answer to "is this worth automating
  at all," a separate question from "which of the three methods."
- Initially restated "don't automate a broken process" as its own
  justification instead of the mechanism: automating a broken process
  executes the brokenness faster and at higher volume, which is what makes
  it worse, not better.

---

## M1 — COMPLETE ✓

Built: CLI decision tool, 4-filter scoring, 3 real tasks scored (1 `rules`,
2 `dont_automate_yet`), full HANDOFF.md.

## Next Up — M2
Harness engineering: copy the P5 orchestrator, add an explicit planning tool
(`write_todos`) and sub-agent context isolation (only a worker's summarized
result re-enters the orchestrator's context, not its full trace). M1's
"agentic is the narrow, expensive, last-resort verdict" is exactly why M2
bothers to add planning/isolation discipline around agentic behavior at all.
