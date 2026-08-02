# M16 - Browser/Computer-Use Agent

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M16. It explains how to build a browser automation agent safely, with deterministic automation first and human approval before state-changing actions.

---

## 1. What This Module Is About

M16 teaches browser automation as a last-resort integration pattern. If an API exists, use the API. If no API exists, use Playwright and add AI only where the page is ambiguous.

You will build a browser agent that completes one real no-API workflow and stops for human confirmation before any submit, purchase, delete, or irreversible action.

The core lesson: browser agents need control gates, not blind autonomy.

---

## 2. What You Are Building

Build a Playwright-based agent that:

- opens a real website or portal you are allowed to use
- navigates a workflow
- extracts or fills data
- pauses before state-changing action
- saves screenshots and logs

Do not automate anything that violates a website's rules or touches sensitive accounts without care.

---

## 3. Concepts To Understand Before Coding

- **DOM-driven automation**: Playwright uses selectors and page structure; reliable and token-efficient.
- **Vision-driven automation**: model reasons from screenshots; flexible but less reliable.
- **Hybrid 80/20 pattern**: deterministic Playwright for known steps, AI only for ambiguous interpretation.
- **Human gate**: explicit confirmation before state change.
- **No-API task**: use browser automation only after checking that no better integration exists.

---

## 4. Recommended File Structure

```text
m16-browser-agent/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  screenshots/
  logs/
  src/
    browser-agent.ts
    human-gate.ts
    selectors.ts
    run-demo.ts
```

File responsibilities:

- `src/browser-agent.ts`: Playwright workflow.
- `src/human-gate.ts`: blocks state-changing actions until approved.
- `src/selectors.ts`: page selectors and stable locators.
- `screenshots/`: evidence from the run.
- `logs/`: action trail.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m16-browser-agent"
pnpm init
pnpm add playwright
pnpm add -D typescript tsx @types/node
pnpm exec playwright install
pnpm tsc --init
```

Script shape:

```json
{
  "scripts": {
    "demo": "tsx src/run-demo.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 6. Implementation Path

### Step 1 - Pick a safe no-API workflow

Good examples:

- search a public website and extract results
- fill a draft form but stop before submit
- collect data from a portal you own

Avoid payments, deletes, account changes, or private data until the human gate is proven.

### Step 2 - Check for an API

Document whether an API exists. If an API exists and is accessible, use the API instead and explain why browser automation is unnecessary.

### Step 3 - Implement deterministic Playwright steps

Use selectors, waits, and assertions. Avoid asking an LLM to click around when the DOM is predictable.

### Step 4 - Add optional AI reasoning only for ambiguity

If needed, use AI for interpreting extracted text or choosing among ambiguous options. Keep the browser actions deterministic.

### Step 5 - Add human gate

Before any submit-like action, call `confirmBeforeAction()` and require explicit approval.

### Step 6 - Save evidence

Save screenshots and logs showing:

- navigation
- extracted or filled data
- pause at human gate
- action blocked until approval

---

## 7. Verification Checklist

M16 is complete only when:

- Playwright workflow runs end to end
- API availability was checked and documented
- deterministic selectors handle predictable steps
- human gate blocks state-changing action
- screenshots are saved
- logs show the action trail
- no sensitive secret or private data is committed
- `HANDOFF.md` explains DOM vs vision tradeoffs

---

## 8. What To Put In HANDOFF.md

Include:

- target workflow
- why browser automation was needed
- how to run the demo
- selectors used
- human-gate behavior
- screenshot/log paths
- failure cases observed
- what would be needed before production use

---

## 9. Explain-It-Back Questions

Before moving to M17, answer:

1. Why is browser automation a last resort?
2. Why is DOM automation usually better than vision automation?
3. Which actions require human approval?
4. What makes a selector reliable?
5. How did your run prove the gate worked?
