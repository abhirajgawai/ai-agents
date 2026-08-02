# M1 - Automation Decision Framework

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M1. The master plan tells you what the module is. This file tells you how to approach it, what to build first, how to verify it, and what you should understand before moving on.

---

## 1. What This Module Is About

M1 teaches the most important senior AI engineering habit: do not start by asking "How do I build an agent?" Start by asking "Should this be automated, and if yes, what is the simplest reliable automation?"

The output of this module is a small TypeScript CLI tool that scores a task against four filters and recommends one of four approaches:

- `rules`: deterministic automation, scripts, RPA, workflows, cron jobs
- `ai_automation`: fixed pipeline where an LLM handles one narrow step
- `agentic`: an LLM plans or chooses tools across multiple steps
- `dont_automate_yet`: the process is too unclear, unverifiable, rare, or broken

This module is intentionally not flashy. It is the judgment layer that prevents you from overbuilding agents where rules or process cleanup would work better.

---

## 2. What You Are Building

Build a CLI command:

```powershell
pnpm run score "Review inbound support emails and route them to the right team"
```

The tool should ask questions for the four filters:

1. Frequency x volume
2. Rule-based vs judgment-based
3. Verifiability
4. Process health

Then it should print:

- the score for each filter
- the final recommendation
- a short written justification
- a warning when the task should not become an agent project yet

Example final output shape:

```text
Task: Review inbound support emails and route them to the right team

Filter scores:
- Frequency x volume: 4/5
- Rule clarity: 3/5
- Verifiability: 4/5
- Process health: 3/5

Recommendation: ai_automation

Why:
This task happens often enough to justify automation. The routing decision has some judgment, but it can likely be constrained with labels, examples, and a human fallback. Because the output can be checked against known routing categories, a fixed pipeline is safer and cheaper than a fully agentic system.
```

---

## 3. Concepts To Understand Before Coding

Understand these before creating files:

- **Rules automation** means the machine follows deterministic logic. Example: "If invoice amount is over $10,000, route to finance lead."
- **AI automation** means the system flow is fixed, but an LLM handles one judgment step. Example: "Classify this email into one of five categories."
- **Agentic automation** means the LLM chooses steps or tools dynamically. Example: "Research this vendor, compare options, write a recommendation, and ask for approval before sending."
- **Verifiability** means you can tell whether the output is correct. If you cannot verify the result, automation is risky.
- **Process health** means the underlying human process is clear enough to automate. A broken process should be fixed before adding AI.

The core lesson: automation is not automatically valuable. A bad manual process plus AI usually becomes a faster bad process.

---

## 4. Recommended File Structure

Create this structure inside this module:

```text
m01-decision-framework/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md              # create after completion
  examples/
    sample-tasks.md
  src/
    filters.ts
    recommend.ts
    index.ts
  test-cases/
    completed-scores.md
```

File responsibilities:

- `src/filters.ts`: scoring logic for the four filters
- `src/recommend.ts`: maps scores to final recommendation
- `src/index.ts`: CLI entry point
- `examples/sample-tasks.md`: candidate tasks you will test
- `test-cases/completed-scores.md`: final scored examples and explanations
- `HANDOFF.md`: what you learned, what works, limitations, and how to run it later

---

## 5. Setup Steps

From this folder:

```powershell
cd "E:\AI agents\p7-advanced-modules\m01-decision-framework"
pnpm init
pnpm add -D typescript tsx @types/node
```

Create a basic TypeScript config:

```powershell
pnpm tsc --init
```

In `package.json`, you want scripts shaped like this:

```json
{
  "scripts": {
    "score": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

Then the command should eventually work like this:

```powershell
pnpm run score "your task description here"
```

---

## 6. Implementation Path

### Step 1 - Define the scoring model

Create `src/filters.ts`.

Start with clear types:

```typescript
export type FilterScore = 1 | 2 | 3 | 4 | 5;

export interface DecisionScores {
  frequencyVolume: FilterScore;
  ruleClarity: FilterScore;
  verifiability: FilterScore;
  processHealth: FilterScore;
}
```

Use a 1-5 scale:

- `1`: weak signal for automation
- `3`: maybe, but needs constraints
- `5`: strong signal for automation

Do not make this too complex. The point is judgment, not mathematical precision.

### Step 2 - Write scoring prompts

Still in `src/filters.ts`, define the questions your CLI will ask:

```typescript
export const filterQuestions = [
  {
    key: "frequencyVolume",
    label: "Frequency x volume",
    question: "How many hours per month does this task consume?",
  },
  {
    key: "ruleClarity",
    label: "Rule clarity",
    question: "Could a new hire execute this from a written checklist?",
  },
  {
    key: "verifiability",
    label: "Verifiability",
    question: "Can the output be checked against a rubric or ground truth?",
  },
  {
    key: "processHealth",
    label: "Process health",
    question: "Is the current process stable and well-defined?",
  },
] as const;
```

You can start by asking the user to enter a number from 1 to 5 for each filter. Later, you can improve it by asking richer questions and mapping answers to scores.

### Step 3 - Implement the recommendation logic

Create `src/recommend.ts`.

Use simple rules first:

- If `processHealth <= 2`, recommend `dont_automate_yet`
- If `verifiability <= 2`, recommend `dont_automate_yet`
- If `ruleClarity >= 4`, recommend `rules`
- If `ruleClarity` is `2` or `3` and `verifiability >= 3`, recommend `ai_automation`
- If `ruleClarity <= 2`, `frequencyVolume >= 4`, `verifiability >= 4`, and `processHealth >= 4`, recommend `agentic`

Important: agentic should be the narrowest recommendation, not the default. If the tool recommends `agentic` too often, the framework is weak.

### Step 4 - Build the CLI

Create `src/index.ts`.

It should:

1. Read the task description from `process.argv`.
2. Ask the four filter questions.
3. Validate that each answer is a number from 1 to 5.
4. Call `recommend()`.
5. Print the recommendation and explanation.

Use Node's built-in `readline/promises` package. Avoid adding extra CLI libraries for M1. This module should stay small.

### Step 5 - Add three real task examples

Create `examples/sample-tasks.md`.

Pick three real tasks from your own life, work, learning, freelancing, or job search. At least one must be boring and should not become an agent.

Use this format:

```markdown
# Sample Tasks

## Task 1
Description:

Why it might be automated:

Expected recommendation:

## Task 2
Description:

Why it might be automated:

Expected recommendation:

## Task 3
Description:

Why it might be automated:

Expected recommendation:
```

Good candidate examples:

- Summarize job descriptions and compare them against your resume
- Rename and organize downloaded invoices
- Monitor a website for new postings
- Reply to customer support emails
- Decide whether a messy business process is ready for automation

### Step 6 - Run the tool against your examples

For each task:

```powershell
pnpm run score "TASK DESCRIPTION HERE"
```

Save the final result in `test-cases/completed-scores.md`.

The goal is not to force a perfect score. The goal is to defend the recommendation.

---

## 7. Verification Checklist

M1 is complete only when all of these are true:

- `pnpm run score "some task"` runs successfully
- the CLI asks for all four filter scores
- invalid scores are rejected or re-asked
- the tool prints one of the four recommendations
- the recommendation includes a written justification
- you tested three real task examples
- at least one example recommends `rules` or `dont_automate_yet`
- `test-cases/completed-scores.md` contains the three final results
- `pnpm run typecheck` passes
- `HANDOFF.md` exists and explains what you built and learned

---

## 8. What To Put In HANDOFF.md

After finishing the code, create `HANDOFF.md` with this structure:

```markdown
# M1 Decision Framework - Handoff

## Status

Complete / partial / blocked

## How To Run

Exact command:

## What It Builds

Short explanation of the CLI.

## File Map

List each file and what it does.

## The Four Filters

Explain each filter in your own words.

## Three Scored Tasks

Summarize the three examples and recommendations.

## Most Important Learning

Explain why the framework does not default to agents.

## Limitations

What this tool does not handle yet.

## Next Module Readiness

What M1 teaches that helps with M2.
```

Do not skip this. The handoff is where you prove understanding, not just completion.

---

## 9. Explain-It-Back Questions

Before moving to M2, you should be able to answer these without reading the code:

1. Why is "build an agent" not the default answer?
2. What is the difference between rules automation, AI automation, and agentic automation?
3. Why does low verifiability block automation?
4. Why does a broken process need repair before automation?
5. What kind of task deserves an agentic approach?
6. What did one of your examples score, and why?

If you cannot answer these clearly, the module is not really done even if the code runs.

---

## 10. Suggested Completion Order

Use this order when working:

1. Read the M1 section in the master plan.
2. Read this README completely.
3. Scaffold the TypeScript project.
4. Create `src/filters.ts`.
5. Create `src/recommend.ts`.
6. Create `src/index.ts`.
7. Run one manual scoring flow.
8. Add three real examples.
9. Save results in `test-cases/completed-scores.md`.
10. Run `pnpm run typecheck`.
11. Create `HANDOFF.md`.
12. Answer the explain-it-back questions.

After that, M1 is complete and you are ready for M2.
