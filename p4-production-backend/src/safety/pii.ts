export function redactPii(text: string): string {
  // Redact emails: keep first char + domain hint
  text = text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => `${match[0]}***@***.***`,
  );

  // Redact phone numbers (common formats)
  text = text.replace(/(\+?\d[\d\s\-().]{7,}\d)/g, "***-***-****");

  // Redact SSNs (123-45-6789)
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****");

  return text;
}
