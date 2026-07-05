export interface ResearchBrief {
  topic: string;
  keyPoints: string[];
  sources: string[];
  context: string;
}

export interface Draft {
  title: string;
  content: string;
  wordCount: number;
}

export interface Feedback {
  score: number; // 0.0 to 1.0
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface FinalArticle {
  title: string;
  content: string;
  wordCount: number;
  qualityScore: number;
}
