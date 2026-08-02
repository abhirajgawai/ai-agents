# M10 - Document AI: Hybrid Extraction with Citations

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M10. It explains how to build a document extraction pipeline that combines OCR, vision reasoning, validation, confidence, and citations.

---

## 1. What This Module Is About

M10 teaches that document AI is not "send PDF to an LLM and trust the answer." Production extraction needs grounding, per-field confidence, citations, and validation.

You will build a hybrid pipeline:

```text
document -> OCR -> VLM structure extraction -> merge -> validate -> JSON with citations
```

The core lesson: OCR and VLMs solve different parts of the problem. Use both, then cross-check.

---

## 2. What You Are Building

Pick one domain-neutral document type:

- invoices
- receipts
- resumes
- simple forms

Run 5-10 sample documents through the pipeline. Output structured JSON where every extracted field has:

- value
- confidence
- citation
- page or source line
- `needsReview` when confidence or validation fails

---

## 3. Concepts To Understand Before Coding

- **OCR**: extracts text and coordinates; cheap and deterministic, but weak at layout reasoning.
- **VLM**: vision-language model; understands visual structure, but can hallucinate and lacks calibrated confidence.
- **Citation**: where the extracted value came from.
- **Validation**: consistency checks such as totals matching line items.
- **Human review routing**: low-confidence fields should be flagged, not hidden.

If a human will act on the result, every important field needs a source.

---

## 4. Recommended File Structure

```text
m10-document-ai/
  package.json
  tsconfig.json
  README.md
  HANDOFF.md
  samples/
  outputs/
  src/
    ocr.ts
    vlm-extract.ts
    schema.ts
    merge.ts
    validate.ts
    run-extraction.ts
```

File responsibilities:

- `samples/`: 5-10 safe test documents.
- `src/ocr.ts`: OCR text and coordinates.
- `src/vlm-extract.ts`: structure and region extraction.
- `src/schema.ts`: Zod schema for output.
- `src/merge.ts`: combines OCR and VLM outputs.
- `src/validate.ts`: catches inconsistencies and routes review.
- `outputs/`: saved JSON outputs.

---

## 5. Setup Steps

```powershell
cd "E:\AI agents\p7-advanced-modules\m10-document-ai"
pnpm init
pnpm add zod
pnpm add -D typescript tsx @types/node
pnpm tsc --init
```

Add OCR or PDF/image tooling based on your chosen document type. Tesseract.js is acceptable for local OCR. Hosted OCR is acceptable if you document cost and privacy tradeoffs.

Script shape:

```json
{
  "scripts": {
    "extract": "tsx src/run-extraction.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 6. Implementation Path

### Step 1 - Pick the document type

Choose one type and define the target fields. Example for receipts:

- vendor
- date
- line items
- subtotal
- tax
- total

### Step 2 - Define the schema

In `src/schema.ts`, every field should include confidence and citation, not just value.

### Step 3 - Implement OCR

Extract raw text, coordinates if available, and OCR confidence. Save raw OCR output for debugging.

### Step 4 - Implement VLM extraction

Use a vision-capable model to identify layout and field candidates. Keep the output structured.

### Step 5 - Merge OCR and VLM outputs

Use OCR for exact critical values such as dates, names, and numbers. Use VLM for structure and layout. If they disagree, lower confidence or mark `needsReview`.

### Step 6 - Validate extracted data

Add simple checks:

- line items sum to subtotal
- subtotal + tax equals total
- required fields exist
- confidence threshold is met

### Step 7 - Run messy-document case

Include at least one low-quality or messy document and prove it routes to review instead of returning silent wrong data.

---

## 7. Verification Checklist

M10 is complete only when:

- 5-10 safe sample documents exist
- OCR output is produced
- VLM extraction is produced
- Zod schema validates output
- every field has confidence and citation
- merge logic handles disagreement
- validation flags bad or uncertain output
- at least one messy document routes to `needsReview: true`
- outputs are saved as JSON
- `HANDOFF.md` explains OCR vs VLM tradeoffs

---

## 8. What To Put In HANDOFF.md

Include:

- document type selected
- sample count
- how to run extraction
- output schema
- example citation
- validation rules
- messy document behavior
- known limitations
- what should become eval cases in M6

---

## 9. Explain-It-Back Questions

Before moving to M11, answer:

1. Why should OCR and VLM be combined?
2. Why is calibrated confidence hard for VLMs?
3. What makes a citation useful?
4. When should a field route to human review?
5. What validation rule caught a real issue?
