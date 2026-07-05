const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*:/i,
  /you\s+are\s+now\s+a/i,
  /forget\s+(everything|all|your)/i,
  /new\s+instructions?\s*:/i,
  /disregard\s+(all\s+)?(previous|prior)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /<\s*system\s*>/i,
];

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
