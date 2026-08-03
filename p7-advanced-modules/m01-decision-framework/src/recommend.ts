import type { DecisionScores } from "./filters.js";

export type Verdict = "rules" | "ai_automation" | "agentic" | "dont_automate_yet";

export interface Recommendation {
  verdict: Verdict;
  reason: string;
}

export function recommend(scores: DecisionScores): Recommendation {
  const { frequencyVolume, ruleClarity, verifiability, processHealth } = scores;

  if (processHealth <= 2) {
    return {
      verdict: "dont_automate_yet",
      reason:
        "The underlying process is not well-defined enough to automate. Automating a broken or unclear process makes it fail faster, not better. Fix the process first, then revisit automation.",
    };
  }

  if (verifiability <= 2) {
    return {
      verdict: "dont_automate_yet",
      reason:
        "There is no reliable way to check whether the output is correct. Without a rubric or ground truth, you cannot trust an automated result enough to act on it. Build the verification method before automating.",
    };
  }

  if (ruleClarity >= 4) {
    return {
      verdict: "rules",
      reason:
        "This task can be executed from a written checklist with little judgment involved. A deterministic script, workflow, or RPA step will be cheaper, faster, and more auditable than any LLM-based approach.",
    };
  }

  if (ruleClarity >= 2 && ruleClarity <= 3 && verifiability >= 3) {
    return {
      verdict: "ai_automation",
      reason:
        "This task happens often enough to justify automation. It involves some judgment that resists a fixed rule set, but the output can be checked, so a fixed pipeline with an LLM handling one narrow step is safer and cheaper than a fully agentic system.",
    };
  }

  if (ruleClarity <= 2 && frequencyVolume >= 4 && verifiability >= 4 && processHealth >= 4) {
    return {
      verdict: "agentic",
      reason:
        "This task requires real judgment across multiple steps, happens often enough to matter, the output is verifiable, and the underlying process is healthy. These are the narrow conditions where letting an LLM plan its own steps is actually justified.",
    };
  }

  return {
    verdict: "dont_automate_yet",
    reason:
      "This task does not clearly satisfy the conditions for rules, ai_automation, or agentic. Either the volume is too low to justify the investment, or the judgment/verifiability/process-health mix is too weak to trust an automated result yet.",
  };
}
