# Completed Scores

## Task 1 — Rename and organize downloaded invoices into per-vendor folders

Filter scores:
- Frequency x volume: 3/5
- Rule clarity: 5/5
- Verifiability: 4/5
- Process health: 5/5

Recommendation: **rules**

Why: This can be executed from a written checklist with essentially no judgment. A deterministic script (read vendor name, move file) is cheaper, faster, and fully auditable — no LLM needed at all.

## Task 2 — Review inbound support emails and route them to the right team

Filter scores:
- Frequency x volume: 2/5
- Rule clarity: 5/5
- Verifiability: 4/5
- Process health: 2/5

Recommendation: **dont_automate_yet**

Why: Process health blocked this one. On paper this looks like a textbook `ai_automation` case (high rule clarity, decent verifiability), but scoring process health honestly at 2/5 (team boundaries and routing rules aren't actually written down consistently) means the framework correctly refuses to automate until the routing rules themselves are documented. This is the module's central lesson in action: a plausible-looking task can still fail the process-health gate.

## Task 3 — Decide whether a messy, undocumented internal approval process is ready for automation

Filter scores:
- Frequency x volume: 3/5
- Rule clarity: 2/5
- Verifiability: 1/5
- Process health: 2/5

Recommendation: **dont_automate_yet**

Why: Both verifiability and process health are weak — there's no rubric for "correct approval outcome" and no one can consistently describe the actual rule set. Automating this now would just make an already-inconsistent process fail faster and less visibly. Fix the process (write down the actual approval rules) before automating any part of it.
