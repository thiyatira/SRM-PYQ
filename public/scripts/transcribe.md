# Question Paper Transcription & Schema Guide

This document contains instructions, schemas, and prompts to transcribe raw, unstructured university exam papers (OCR text, PDFs, or images) into the structured JSON schema used by the SRM-PYQ application.

---

## 1. Automated Python Pipeline (`transcribe_papers.py`)

A unified script is located at [`public/scripts/transcribe_papers.py`](public/scripts/transcribe_papers.py).

### Features:
- **Batch processes** all PDFs in a given folder.
- **Asks interactively** for the folder path containing PDFs (or accepts CLI arguments).
- **Gemini API integration** to transcribe questions, solutions, and math notation.
- **Auto-deduces formal filename** (`formal_filename`) according to repository rules (e.g., `2023-12_ET_SetA_QP.json`).
- **Writes output JSONs** directly to a `staging/` folder.

### Running the Script:

**Interactive mode:**
```bash
python public/scripts/transcribe_papers.py
```
*(Prompts for API key if `GEMINI_API_KEY` is not set, input folder path, and optional syllabus file).*

**Command-line arguments mode:**
```bash
python public/scripts/transcribe_papers.py --folder "path/to/pdfs" --output "path/to/staging" --syllabus "path/to/syllabus.txt"
```

---

## 2. Standardized File Naming Rules

Every paper JSON should follow the standardized filename pattern:
```
[Date/Year]_[ExamType]_[SetInfo]_[DocumentType].json
```

1. **`[Date/Year]`** (Required):
   - `YYYY-MM` for End Term exams (e.g., `2023-12`, `2024-01`, `2023-05`)
   - `YYYY-MM-DD` for specific Cycle Test dates (e.g., `2024-04-01`, `2023-11-03`)
   - `YYYY-YY` for general academic year sessions (e.g., `2023-24`, `2024-25`)
2. **`[ExamType]`** (Required):
   - `ET`: End Term Examination
   - `CT1`, `CT2`, `CT3`: Cycle Tests 1, 2, 3
   - `Quiz`: Assessment / Quiz
3. **`[SetInfo]`** (Optional):
   - `SetA`, `SetB`, `SetC`, `Set1`, `SetA_B1`, etc. (Omitted if no set)
4. **`[DocumentType]`** (Required):
   - `QP`: Question Paper
   - `Key`: Official Answer Key
   - `QP-Key`: Question Paper + Key
   - `Sample-QP`: Model / Practice paper
   - `MCQ-Key`: Multiple-choice answer key only

---

## 3. Target JSON Schema

The frontend ([src/components/PyqSection.tsx](src/components/PyqSection.tsx)) and data stores expect individual paper JSON files formatted as:

```json
{
  "formal_filename": "2023-12_ET_SetA_QP.json",
  "paper_title": "B.Tech. DEGREE EXAMINATION, DECEMBER 2023 - 21CSC101T - OBJECT ORIENTED DESIGN AND PROGRAMMING",
  "source": "2023-12 ET Set A",
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
- `formal_filename` *(string)*: Standardized filename ending in `.json`.
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

## 4. Master Prompt (For Manual Use / Direct API)

```markdown
You are an expert academic assistant and document transcription engine.
Your task is to analyze a university examination question paper (or answer key) PDF and produce a structured JSON object.

### Instructions:
1. Read the provided PDF / text thoroughly.
2. Deduce the formal standardized filename for this paper based on the file naming specification below.
3. Transcribe ALL questions and sub-questions in exact sequential order.
4. If the paper contains an answer key or solutions, transcribe them and set `answer_source` to "provided".
   If no answer key is present, generate high-quality, accurate, university-level solutions and set `answer_source` to "generated".
5. Map each question to its corresponding unit in the syllabus (must include "Unit 1", "Unit 2", "Unit 3", "Unit 4", or "Unit 5").
6. Output MUST be a single, valid JSON object and nothing else.
7. CRITICAL - Code Formatting: Whenever questions or answers contain code snippets, program fragments, or pseudocode (C, C++, Java, Python, SQL, etc.), you MUST wrap them in standard markdown code fences with the language identifier (e.g. ```java\n...\n```, ```c\n...\n```, ```python\n...\n```) and preserve exact indentation. Keep MCQ options (A, B, C, D) and question text outside the code block.

### File Naming Specification for `formal_filename`:
Pattern: `[Date/Year]_[ExamType]_[SetInfo]_[DocumentType].json`
- `[Date/Year]`:
    - Year-Month for End Term (e.g., `2023-12`, `2024-01`, `2023-05`)
    - Full Date if present for Cycle Tests (e.g., `2024-04-01`, `2023-11-03`)
    - Academic Year if specific date not available (e.g., `2023-24`, `2024-25`)
- `[ExamType]`: `ET` (End Term) or `CT1`, `CT2`, `CT3` (Cycle Test 1, 2, 3) or `Quiz`
- `[SetInfo]` (Optional): `SetA`, `SetB`, `SetC`, `Set1`, `SetA_B1`, etc. (Omit if not specified)
- `[DocumentType]`:
    - `QP`: Question Paper only
    - `Key`: Answer Key only
    - `QP-Key`: Question Paper with Answer Key
    - `Sample-QP`: Sample / Model Paper
    - `MCQ-Key`: MCQ Answer Key only

### JSON Structure:
{
  "formal_filename": "<Standardized filename following the rules above, ending in .json>",
  "paper_title": "<Full examination title, degree, subject code, and course name from the header>",
  "source": "<Short exam session label, e.g., '2023-12 ET' or '2024-04-01 CT2 Set B'>",
  "questions": [
    {
      "question_number": "<e.g., '1', '2', '21. a.', '3(b)'>",
      "question_text": "<Full exact text. Preserve MCQ options (A), (B), (C), (D) on newlines. Use $...$ for inline math and $$...$$ for block math. Use markdown code fences for code snippets.>",
      "marks": <Integer mark value, or null if not indicated>,
      "answer": "<Accurate solution/explanation. For MCQs, provide correct choice letter followed by concise rationale.>",
      "answer_source": "<'provided' or 'generated'>",
      "chapter": "<Must include 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', or 'Unit 5' (e.g. 'Unit 1: Introduction')>"
    }
  ]
}

---
### Course Syllabus:
[INSERT SYLLABUS HERE (OPTIONAL)]

---
### Paper / Document Content:
[PASTE DOCUMENT TEXT OR UPLOAD PDF]
```
