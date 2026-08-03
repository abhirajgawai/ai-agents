# M1 Decision Framework - Handoff

## Status

Complete.

## How To Run

```powershell
cd "E:\AI agents\p7-advanced-modules\m01-decision-framework"
pnpm run score "your task description here"
```

Answer the four prompts with a number from 1 to 5. Run `pnpm run typecheck` to verify types.

## What It Builds

A CLI tool that scores a described task against four filters (frequency x volume,
rule clarity, verifiability, process health) and prints one of four recommendations:
`rules`, `ai_automation`, `agentic`, or `dont_automate_yet`, along with a written
justification and a warning when the task should not be automated yet.

## File Map

- `src/filters.ts` — the `DecisionScores` type, the four `filterQuestions`, and
  `isValidScore` for input validation.
- `src/recommend.ts` — pure function `recommend(scores)` that maps filter scores to
  a verdict + reason. No I/O, fully unit-testable in isolation.
- `src/index.ts` — CLI entry point. Reads the task from `process.argv`, asks the four
  questions via `readline/promises`, calls `recommend()`, prints the result.
- `examples/sample-tasks.md` — three real candidate tasks with expected verdicts.
- `test-cases/completed-scores.md` — the three tasks actually run through the tool,
  with real scores and the reasoning behind each.

## The Four Filters

- **Frequency x volume** — how much time/month does this actually cost? Rare tasks
  aren't worth automating regardless of how automatable they look.
- **Rule clarity** — could a new hire follow a written checklist to do this? High
  clarity means you don't need an LLM at all; a script suffices.
- **Verifiability** — can you tell if the output is correct? No rubric/ground truth
  means you can't trust an automated result, so don't automate yet.
- **Process health** — is the underlying human process itself well-defined and
  stable? A broken or undocumented process automated as-is just fails faster.

## Three Scored Tasks

1. **Rename/organize invoices** → `rules` (5/5 rule clarity, 5/5 process health — pure
   mechanical checklist, no LLM needed).
2. **Route support emails to teams** → `dont_automate_yet` — looked like a clean
   `ai_automation` case on rule clarity and verifiability alone, but process health
   (2/5, routing rules aren't consistently documented) blocked it. This was the most
   instructive run — the framework caught a case that *felt* automatable.
3. **Decide if a messy approval process is automation-ready** → `dont_automate_yet` —
   both verifiability (1/5) and process health (2/5) failed; no rubric for "correct"
   and no consistent rule set to encode.

## Most Important Learning

The framework does not default to `agentic`, and the code enforces this structurally:
`agentic` is the last branch checked in `recommend()` and requires all four filters to
score high simultaneously (frequency ≥4, rule clarity ≤2, verifiability ≥4, process
health ≥4). Every other combination — including most "this feels like it needs an
agent" cases — resolves to something cheaper first. `dont_automate_yet` is checked
*before* anything else, because low verifiability or bad process health should veto
automation regardless of how appealing the task looks otherwise.

## Limitations

- Scoring is manual/subjective (a human enters 1-5); there's no rubric enforcing
  score consistency across different people scoring the same task.
- The four-filter model is a heuristic, not a formula — edge cases near threshold
  boundaries (e.g. rule clarity exactly 3) can go either way and deserve human
  judgment, not blind trust in the printed verdict.
- No persistence — each run is one-off; there's no history of past scored tasks
  beyond what's manually saved to `test-cases/`.
- Hit a real Node.js bug during build: sequential `rl.question()` calls hang when
  reading from non-TTY (piped/redirected) stdin — works fine in a live terminal, but
  broke automated testing. Fixed by switching to `rl[Symbol.asyncIterator]()` and
  reading lines via `for`-await style iteration instead of repeated `question()`
  calls, which doesn't hit the same bug.

## Next Module Readiness

M2 copies a P5 orchestrator and adds a planning tool + sub-agent isolation. M1's
core lesson — agentic is the narrow, expensive, last-resort verdict — is exactly
why M2 bothers to add explicit planning and context quarantine around agentic
behavior at all: if you're going to build the expensive thing, build the harness
discipline (todos, isolation) around it properly rather than letting an agent run
unconstrained.
