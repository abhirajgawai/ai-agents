export type FilterScore = 1 | 2 | 3 | 4 | 5;

export interface DecisionScores {
  frequencyVolume: FilterScore;
  ruleClarity: FilterScore;
  verifiability: FilterScore;
  processHealth: FilterScore;
}

export interface FilterQuestion {
  key: keyof DecisionScores;
  label: string;
  question: string;
}

export const filterQuestions: FilterQuestion[] = [
  {
    key: "frequencyVolume",
    label: "Frequency x volume",
    question:
      "How many hours per month does this task consume? (1 = negligible, 5 = major recurring cost)",
  },
  {
    key: "ruleClarity",
    label: "Rule clarity",
    question:
      "Could a new hire execute this from a written checklist? (1 = pure judgment call, 5 = fully mechanical)",
  },
  {
    key: "verifiability",
    label: "Verifiability",
    question:
      "Can the output be checked against a rubric or ground truth? (1 = no way to tell if it's right, 5 = trivially checkable)",
  },
  {
    key: "processHealth",
    label: "Process health",
    question:
      "Is the current human process stable and well-defined? (1 = chaotic/undefined, 5 = clear and consistent)",
  },
];

export function isValidScore(value: number): value is FilterScore {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}
