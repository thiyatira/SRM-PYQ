# Question Paper Transcription & Schema Guide

This document contains instructions, schemas, and prompts to transcribe raw, unstructured university exam papers (OCR text, PDFs, or images) into the structured JSON schema used by the SRM-PYQ application.

---

## 1. Target JSON Schema

The frontend ([src/components/PyqSection.tsx](src/components/PyqSection.tsx)) and data stores expect individual paper JSON files formatted as:

```json
{
  "paper_title": "B.Tech./M.Tech(Integrated) DEGREE EXAMINATION, JULY 2023 - 21CSC101T - OBJECT ORIENTED DESIGN AND PROGRAMMING",
  "source": "JULY 2023",
  "questions": [
    {
      "question_number": "1",
      "question_text": "A member function can always access the data\n(A) in the object of which it is a member\n(B) in the class of which it is a member\n(C) in any object of the class of which it is a member\n(D) in the public part of its class",
      "marks": 1,
      "answer": "(A) in the object of which it is a member. Explanation: A member function operates on the specific object that calls it and has access to its data members.",
      "answer_source": "provided",
      "chapter": "Unit 1: Introduction to OOP"
    },
    {
      "question_number": "21. a.",
      "question_text": "With a suitable example C++ program explain how to design a class.",
      "marks": 8,
      "answer": "A class is a blueprint for creating objects...\n\n```cpp\n#include <iostream>\nusing namespace std;\nclass BankAccount { ... };\n```",
      "answer_source": "generated",
      "chapter": "Unit 1: Introduction to OOP"
    }
  ]
}
```

### Key Field Requirements:
- `paper_title` *(string)*: Full examination and subject title from the paper header.
- `source` *(string)*: Short session identifier matching the file naming scheme (e.g., `2024-01 ET`, `2023_July`, `2024-10-01 CT1`).
- `questions` *(array)*:
  - `question_number` *(string)*: Question label exactly as seen on paper (`"1"`, `"2"`, `"21. a."`, `"Part B - 14"`).
  - `question_text` *(string)*: Full question text. For MCQs, keep all options `(A)`, `(B)`, `(C)`, `(D)` separated by newlines `\n`.
  - `marks` *(integer | null)*: Allocated marks (e.g., `1`, `2`, `8`, `15`) or `null` if unstated.
  - `answer` *(string)*: Answer or explanation. Transcribe accurately if an answer key exists, otherwise generate a clear, accurate explanation.
  - `answer_source` *(string)*: `"provided"` (if taken from an official key) or `"generated"` (if AI answered).
  - `chapter` *(string)*: **Important:** Must include `"Unit 1"`, `"Unit 2"`, `"Unit 3"`, `"Unit 4"`, or `"Unit 5"` (e.g. `"Unit 1: Introduction"`), as the UI filter categorizes questions using the regex `/Unit\s*([1-5])/i`.

### Formatting Rules:
- **Math & Equations:** Use LaTeX KaTeX delimiters — `$inline_math$` for inline formulas and `$$display_math$$` for standalone formulas.
- **Code:** Wrap source code in standard markdown code fences (e.g., ` ```cpp ... ``` ` or ` ```python ... ``` `).

---

## 2. LLM Transcription Prompt (Copy & Paste)

Use this prompt in ChatGPT, Claude, Gemini, or via API scripts to process raw paper text, OCR dumps, or PDF files.

```markdown
You are an expert academic assistant specializing in university education. Your task is to analyze and transcribe raw, unstructured university exam papers (or answer keys) into a strictly valid JSON object matching the exact schema below.

### Output Constraints:
- Output MUST be a single, valid JSON object and nothing else.
- Do NOT include conversational text or markdown wrappers like ```json unless requested.
- Ensure every question and sub-division (e.g., "21. a.", "21. b.") is separated into its own object in the `questions` array.

### JSON Structure:
{
  "paper_title": "<Full examination title, course code, and subject from the header>",
  "source": "<Short exam session or filename, e.g., 'JULY 2023' or '2024-01 ET'>",
  "questions": [
    {
      "question_number": "<e.g., '1', '2', '21. a.', '3(b)'>",
      "question_text": "<Full question text. For MCQs, retain options (A), (B), (C), (D) on separate lines. Use $...$ for inline math, $$...$$ for block math, and markdown code blocks for code>",
      "marks": <Integer mark value or null if not indicated>,
      "answer": "<If answer key is provided in source, transcribe it exactly. If not provided, generate a concise, accurate, university-level answer and explanation. For MCQs, state correct letter and brief rationale.>",
      "answer_source": "<'provided' if from an answer key, otherwise 'generated'>",
      "chapter": "<Must start with 'Unit X:' where X is 1 to 5 based on the syllabus. Example: 'Unit 1: Evolution of Programming'>"
    }
  ]
}

### Formatting Guidelines:
1. Formulas & Symbols: Wrap math in KaTeX syntax: `$E = mc^2$` for inline, `$$\int_0^\pi \sin(x)dx$$` for display.
2. Code Blocks: Format code blocks using markdown syntax with language tags (e.g., ```c, ```cpp, ```python).
3. Unit Tagging: The 'chapter' value MUST contain 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', or 'Unit 5' to enable UI filtering.

---
### Course Syllabus (For Unit Mapping):
[INSERT SYLLABUS UNITS 1-5 HERE]

---
### Source / Metadata:
- Source Name: [INSERT SOURCE NAME, e.g., 2023-12 ET]
- Paper Title: [INSERT PAPER TITLE, e.g., B.Tech DEGREE EXAMINATION - 21CSS101J]

---
### Raw Unstructured Exam Paper Text / OCR:
[PASTE RAW QUESTION PAPER HERE]
```

---

## 3. Reference Existing Scripts

The repository also includes automated python scripts that upload PDFs to Gemini and run this prompt:
- [public/scripts/3_ai_transcription.py](public/scripts/3_ai_transcription.py) — General transcription script.
- [public/pdf/CHEM/3_ai_transcription.py](public/pdf/CHEM/3_ai_transcription.py) — Subject-specific transcription script.
- [public/scripts/_. naming.txt](public/scripts/_.%20naming.txt) — File naming rules (`[Date/Year]_[ExamType]_[SetInfo]_[DocumentType].pdf`).
