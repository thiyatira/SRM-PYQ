#!/usr/bin/env python3
"""
=============================================================================
SRM-PYQ: Question Paper Transcription & Schema Engine (Step 3)
=============================================================================

This script automates the transcription of split, standardized exam question 
paper PDFs into structured, high-fidelity JSON files used by the SRM-PYQ 
frontend and study portal.

-----------------------------------------------------------------------------
1. PIPELINE INTEGRATION & NAMING CONVENTION (from 1_split_plan.md)
-----------------------------------------------------------------------------
This script is Step 3 of the paper digitization pipeline:
  Step 1: public/scripts/1_split_plan.md
          (Analyze bundles, define booklet cuts, crops, rotations, and clean names)
  Step 2: public/scripts/2_split.py
          (Executes manifest.json from raw_pdfs/ to split_pdf/)
  Step 3: public/scripts/3_transcribe_papers.py [THIS SCRIPT]
          (Transcribes split_pdf/ directly to jsons/ using the EXACT PDF names)

Naming Convention:
Each PDF processed by this script has ALREADY been cleanly named according to 
`1_split_plan.md`:
    <ExamType>_<Date_or_Session>[_<Set>][_<Variant>].pdf
Examples:
    - CLA-T1_2023-09-08_Set-D_AnswerKey.pdf -> CLA-T1_2023-09-08_Set-D_AnswerKey.json
    - FJ1_2024-08-07_QP.pdf                 -> FJ1_2024-08-07_QP.json
    - EndSem_May_2025.pdf                   -> EndSem_May_2025.json
    - 18CSC205J_EndSem_June_2023.pdf        -> 18CSC205J_EndSem_June_2023.json

CRITICAL RULE:
This script NEVER renames or invents new filenames. The output JSON strictly 
inherits the stem of the input PDF (<pdf_stem>.json), and "formal_filename" 
inside the JSON is always set to this exact filename.

-----------------------------------------------------------------------------
2. TARGET JSON SCHEMA SPECIFICATION
-----------------------------------------------------------------------------
The frontend (src/components/PyqSection.tsx) and data stores expect individual
paper JSON files formatted as:

{
  "formal_filename": "EndSem_May_2025.json",
  "paper_title": "B.Tech. DEGREE EXAMINATION, MAY 2025 - 21CSC202J - OPERATING SYSTEMS",
  "source": "EndSem May 2025",
  "questions": [
    {
      "question_number": "1",
      "question_text": "Which of the following is not a state in the process life cycle?\\n(A) Running\\n(B) Ready\\n(C) Blocked\\n(D) Compiling",
      "marks": 1,
      "answer": "(D) Compiling. Explanation: Standard process states include New, Ready, Running, Waiting (Blocked), and Terminated. Compiling is a build-time phase, not an OS runtime process state.",
      "answer_source": "provided",
      "chapter": "Unit 1: Process Management"
    },
    {
      "question_number": "21. a.",
      "question_text": "Explain the Producer-Consumer problem using semaphores with a suitable code example.",
      "marks": 12,
      "answer": "The Producer-Consumer problem demonstrates race conditions and synchronization...\\n\\n```c\\n#include <semaphore.h>\\nsem_t mutex, empty, full;\\nvoid* producer(void* arg) {\\n    // implementation\\n}\\n```",
      "answer_source": "generated",
      "chapter": "Unit 2: Process Synchronization"
    }
  ]
}

Key Field Requirements:
- `formal_filename` (string): Standardized filename matching the PDF stem + '.json'.
- `paper_title` (string): Full examination title, subject code, and course name from the header.
- `source` (string): Short session identifier matching the exam, e.g. 'EndSem May 2025' or 'CLA-T1 Set D'.
- `questions` (array of objects):
    - `question_number` (string): Question label exactly as seen on paper (e.g. '1', '21. a.', 'Part B - 14').
    - `question_text` (string): Full question text. For MCQs, keep options (A), (B), (C), (D) on newlines.
    - `marks` (integer | null): Allocated marks (e.g. 1, 2, 8, 12, 15) or null if unstated.
    - `answer` (string): Answer or solution. If an official answer key/solution is present in the document, you MUST strictly transcribe it faithfully. Only when no answer key exists should an accurate university-level solution be generated.
    - `answer_source` (string): Strictly "provided" (if transcribed from official key in document) or "generated" (if AI solved).
    - `chapter` (string): MUST include "Unit 1", "Unit 2", "Unit 3", "Unit 4", or "Unit 5" (e.g. "Unit 1: Process Management"), matching the UI filter regex /Unit\\s*([1-5])/i.

Formatting Rules:
- Math & Equations: LaTeX KaTeX delimiters: $inline_math$ for inline math and $$display_math$$ for block math.
- Code: Wrap source code in standard markdown code fences with language tags (e.g. ```c ... ```, ```python ... ```).

-----------------------------------------------------------------------------
3. USAGE & CLI COMMANDS
-----------------------------------------------------------------------------
Basic Run (Processes public/scripts/split_pdf -> public/scripts/jsons):
    python public/scripts/3_transcribe_papers.py

Custom Paths:
    python public/scripts/3_transcribe_papers.py \\
        --folder "public/scripts/split_pdf" \\
        --output "public/data/21CSC202J" \\
        --syllabus "public/scripts/os_syllabus.txt"

Multi-Key Rate Limiting & High-Throughput:
    python public/scripts/3_transcribe_papers.py \\
        -k "AIzaSyKey1" "AIzaSyKey2" "AIzaSyKey3" \\
        --workers 3
=============================================================================
"""

import os
import sys
import json
import re
import time
import argparse
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import google.generativeai as genai

# Force utf-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# --- Thread-safe Logger & API Key Pool ---
print_lock = threading.Lock()
manifest_lock = threading.Lock()

def log(msg: str):
    """Thread-safe logging with immediate flush."""
    with print_lock:
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {msg}", flush=True)

class ApiKeyPool:
    """Manages multiple Gemini API keys with independent per-key rate limits and 429 backoff."""
    def __init__(self, keys: list[str], min_interval: float = 4.2):
        self.keys = list(keys)
        self.min_interval = min_interval
        self.lock = threading.Lock()
        self.key_last_used = {k: 0.0 for k in self.keys}
        self.key_backoff_until = {k: 0.0 for k in self.keys}
        self.clients = {}

        from google.generativeai import client
        for k in self.keys:
            cm = client._ClientManager()
            cm.configure(api_key=k)
            self.clients[k] = cm.get_default_client("generative")

    def acquire_key_and_client(self):
        """Acquires the next available key whose interval has passed and is not in backoff."""
        while True:
            with self.lock:
                now = time.time()
                best_key = None
                best_wait = float('inf')
                for k in self.keys:
                    if self.key_backoff_until[k] > now:
                        wait = self.key_backoff_until[k] - now
                    else:
                        elapsed = now - self.key_last_used[k]
                        wait = max(0.0, self.min_interval - elapsed)
                    if wait < best_wait:
                        best_wait = wait
                        best_key = k

                if best_wait <= 0.05 and best_key:
                    self.key_last_used[best_key] = time.time()
                    masked_key = f"...{best_key[-6:]}"
                    return best_key, self.clients[best_key], masked_key

            time.sleep(min(best_wait, 0.4))

    def mark_rate_limit(self, key: str, backoff_seconds: float):
        with self.lock:
            self.key_backoff_until[key] = time.time() + backoff_seconds

def update_manifest(output_folder: Path, pdf_name: str, json_name: str):
    """Safely records a completed PDF in .completed_manifest.json."""
    with manifest_lock:
        manifest_path = output_folder / ".completed_manifest.json"
        data = {}
        if manifest_path.exists():
            try:
                data = json.loads(manifest_path.read_text(encoding="utf-8"))
            except Exception:
                data = {}
        data[pdf_name] = json_name
        manifest_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

# --- Master Prompt Template ---
# The PDF name has already been standardized by 1_split_plan.md.
# We explicitly bind the output JSON filename to match the PDF stem.
PROMPT_TEMPLATE = """
You are an expert academic assistant and document transcription engine.
Your task is to analyze a university examination question paper (or answer key) PDF and produce a structured JSON object.

### Document Information:
- Input File: {pdf_name}
- Standardized Output Target: {target_json}

### Instructions:
1. Read the provided PDF thoroughly.
2. The formal filename for this paper is '{target_json}' (pre-standardized according to the project split plan). You MUST use this exact value for `formal_filename`. Do NOT modify or deduce an alternate filename.
3. Transcribe ALL questions and sub-questions in exact sequential order.
4. CRITICAL - Official Answer Key Fidelity:
   - If the paper contains an official answer key, solutions, or answer annotations anywhere in the PDF (e.g. at the end of the document, on subsequent pages, or alongside the questions), you MUST strictly transcribe and use the official answer key's answers rather than generating your own. Set `answer_source` to "provided". Do NOT override or rewrite official answers with AI alternatives.
   - ONLY if the document has NO answer key or solutions present should you generate accurate, high-quality, university-level solutions and set `answer_source` to "generated".
5. Map each question to its corresponding unit in the syllabus (must include "Unit 1", "Unit 2", "Unit 3", "Unit 4", or "Unit 5").
6. Output MUST be a single, valid JSON object and nothing else. Ensure all LaTeX math backslashes are properly escaped (e.g. \\\\int, \\\\alpha, \\\\theta).
7. CRITICAL - Code Formatting: Whenever questions or answers contain code snippets, program fragments, or pseudocode (C, C++, Java, Python, SQL, etc.), you MUST wrap them in standard markdown code fences with the language identifier (e.g. ```c\n...\n```, ```java\n...\n```, ```python\n...\n```) and preserve exact indentation. Keep MCQ options (A, B, C, D) and question text outside the code block.

### JSON Structure:
{{
  "formal_filename": "{target_json}",
  "paper_title": "<Full examination title, degree, subject code, and course name from the header>",
  "source": "<Short exam session label derived from filename/header, e.g., 'EndSem May 2025', 'CLA-T1 Set D', 'FJ1 Aug 2024'>",
  "questions": [
    {{
      "question_number": "<e.g., '1', '2', '21. a.', '3(b)'>",
      "question_text": "<Full exact text. Preserve MCQ options (A), (B), (C), (D) on newlines. Use $...$ for inline math and $$...$$ for block math. Use markdown code fences for code snippets.>",
      "marks": <Integer mark value, or null if not indicated>,
      "answer": "<If an official answer key/solution is present in the document, faithfully transcribe its solution and explanation. Otherwise, generate an accurate university-level solution. For MCQs, provide correct choice letter followed by concise rationale.>",
      "answer_source": "<'provided' (if the document has an official answer key/solution) or 'generated' (if AI solved it)>",
      "chapter": "<Must include 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', or 'Unit 5' (e.g. 'Unit 1: Process Management')>"
    }}
  ]
}}

### Syllabus for Context:
---
{syllabus}
---

Now analyze the document and return the complete JSON object.
"""

def clean_json_text(raw_text: str) -> str:
    """Removes markdown code block delimiters and whitespace."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def robust_json_load(raw_text: str):
    """Attempts to parse JSON with fallback regex repair for unescaped LaTeX backslashes."""
    cleaned = clean_json_text(raw_text)
    try:
        return json.loads(cleaned, strict=False)
    except Exception:
        # Fix unescaped backslashes commonly caused by LaTeX like \theta, \alpha, \int
        fixed = re.sub(r'\\(?![/\\bfnrtu"U]|u[0-9a-fA-F]{4})', r'\\\\', cleaned)
        return json.loads(fixed, strict=False)

DEFAULT_FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite"
]

def process_single_pdf(pdf_path: Path, output_folder: Path, models: list[str], syllabus: str, key_pool: ApiKeyPool, item_idx: int, total_items: int, retries_per_model: int = 3):
    """Processes a single PDF through an ordered model fallback chain, writing JSON directly matching the split plan's PDF stem."""
    start_time = time.time()
    tag = f"[{item_idx:02d}/{total_items:02d}]"
    
    # Target JSON filename is strictly derived from the PDF name (from 1_split_plan.md)
    final_filename = f"{pdf_path.stem}.json"
    log(f"{tag} [START] {pdf_path.name} -> {final_filename}")
    
    prompt = (
        PROMPT_TEMPLATE
        .replace("{pdf_name}", pdf_path.name)
        .replace("{target_json}", final_filename)
        .replace("{syllabus}", syllabus if syllabus else "No specific syllabus provided. Infer standard university curriculum units (Unit 1 to Unit 5).")
    )
    
    try:
        pdf_bytes = pdf_path.read_bytes()
    except Exception as e:
        log(f"{tag} [ERROR] Failed to read {pdf_path.name}: {e}")
        return False, pdf_path.name, f"Read error: {e}"

    pdf_part = {"mime_type": "application/pdf", "data": pdf_bytes}
    last_error = "Unknown error"

    for m_idx, raw_model_name in enumerate(models):
        model_name = raw_model_name.strip()
        gen_model_name = model_name if model_name.startswith("models/") else f"models/{model_name}"
        tier_label = f"Tier {m_idx + 1}/{len(models)}: {model_name}"

        for attempt in range(1, retries_per_model + 1):
            api_key, gen_client, masked_key = key_pool.acquire_key_and_client()
            
            model = genai.GenerativeModel(
                gen_model_name,
                generation_config={"response_mime_type": "application/json"}
            )
            model._client = gen_client

            try:
                log(f"{tag} [SENDING] ({tier_label} | Key {masked_key}) [Attempt {attempt}/{retries_per_model}]...")
                response = model.generate_content([prompt, pdf_part])
                
                data = robust_json_load(response.text)
                
                # Enforce that the output filename and internal formal_filename strictly match the split plan
                data["formal_filename"] = final_filename
                output_file = output_folder / final_filename

                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
                
                update_manifest(output_folder, pdf_path.name, final_filename)
                
                elapsed = time.time() - start_time
                q_count = len(data.get("questions", []))
                log(f"{tag} [OK] ({elapsed:.1f}s | {model_name}): {pdf_path.name} -> {final_filename} ({q_count} questions)")
                return True, pdf_path.name, final_filename

            except json.JSONDecodeError as e:
                log(f"{tag} [WARN] JSON decode error on {model_name} (attempt {attempt}): {e}")
                last_error = f"JSONDecodeError: {e}"
                if attempt == retries_per_model:
                    err_file = output_folder / f"raw_error_{pdf_path.stem}_{model_name}.txt"
                    with open(err_file, "w", encoding="utf-8") as f:
                        f.write(response.text if 'response' in locals() else "No response")
                time.sleep(2)

            except Exception as e:
                err_msg = str(e)
                last_error = err_msg
                is_rate_limit = "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower()
                is_not_found = "404" in err_msg or "NotFound" in err_msg or "not found" in err_msg.lower() or "is not supported" in err_msg.lower()

                if is_not_found:
                    log(f"{tag} [UNAVAILABLE] Model '{model_name}' not found/supported (404). Immediately falling back to next tier...")
                    break

                if is_rate_limit:
                    backoff = 10 * attempt
                    log(f"{tag} [WAIT] Key {masked_key} hit rate limit (429) on {model_name}. Backing off for {backoff}s and rotating key...")
                    key_pool.mark_rate_limit(api_key, backoff)
                    time.sleep(1)
                else:
                    log(f"{tag} [WARN] API error with {model_name} on attempt {attempt}: {e}")
                    if attempt < retries_per_model:
                        time.sleep(2 * attempt)

        if m_idx < len(models) - 1:
            next_model = models[m_idx + 1]
            log(f"{tag} [FALLBACK] Model '{model_name}' exhausted/unavailable. Falling back to: {next_model}")

    log(f"{tag} [ERROR] All fallback models failed for {pdf_path.name}. Last error: {last_error}")
    return False, pdf_path.name, last_error

def main():
    base_dir = Path(__file__).resolve().parent
    default_input_dir = base_dir / "split_pdf"
    default_output_dir = base_dir / "jsons"
    default_syllabus_file = base_dir / "syllabus.txt"
    default_keys_file = base_dir / "gemini_api_keys.txt"

    parser = argparse.ArgumentParser(description="SRM-PYQ Parallel Batch PDF Transcriber & Formatter")
    parser.add_argument("-f", "--folder", default=str(default_input_dir), help=f"Path to folder containing PDF question papers (default: {default_input_dir})")
    parser.add_argument("-o", "--output", default=str(default_output_dir), help=f"Path to output JSON folder (default: {default_output_dir})")
    parser.add_argument("-s", "--syllabus", default=str(default_syllabus_file), help=f"Path to syllabus text file (default: {default_syllabus_file})")
    parser.add_argument("--keys-file", default=str(default_keys_file), help=f"Path to file with Gemini API keys, one per line (default: {default_keys_file})")
    parser.add_argument("-k", "--api-keys", nargs="+", help="One or more Gemini API keys (space-separated or comma-separated)")
    parser.add_argument("--api-key", help="Single Gemini API Key for backwards compatibility")
    parser.add_argument(
        "-m", "--models", "--model",
        nargs="+",
        default=DEFAULT_FALLBACK_MODELS,
        help=f"List of Gemini models in order of fallback (default: {' -> '.join(DEFAULT_FALLBACK_MODELS)})"
    )
    parser.add_argument("-w", "--workers", type=int, default=None, help="Concurrent workers (default: number of API keys)")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip files that already exist in output folder")
    parser.add_argument("--force", action="store_false", dest="skip_existing", help="Re-transcribe and overwrite existing JSON files")
    args = parser.parse_args()

    # Parse fallback models
    models_list = []
    if isinstance(args.models, list):
        for item in args.models:
            models_list.extend([m.strip() for m in item.split(",") if m.strip()])
    elif isinstance(args.models, str):
        models_list = [m.strip() for m in args.models.split(",") if m.strip()]
    if not models_list:
        models_list = list(DEFAULT_FALLBACK_MODELS)

    # 1. API Key Setup
    keys = []
    if args.api_keys:
        for item in args.api_keys:
            keys.extend([k.strip() for k in item.split(",") if k.strip()])
    if args.api_key:
        keys.extend([k.strip() for k in args.api_key.split(",") if k.strip()])

    if args.keys_file:
        k_path = Path(args.keys_file).resolve()
        if k_path.exists():
            for line in k_path.read_text(encoding="utf-8", errors="ignore").splitlines():
                k_val = line.strip()
                if k_val and not k_val.startswith("#"):
                    keys.append(k_val)

    if not keys and os.environ.get("GEMINI_API_KEYS"):
        keys.extend([k.strip() for k in os.environ.get("GEMINI_API_KEYS").split(",") if k.strip()])
    if not keys and os.environ.get("GEMINI_API_KEY"):
        keys.extend([k.strip() for k in os.environ.get("GEMINI_API_KEY").split(",") if k.strip()])

    unique_keys = list(dict.fromkeys(keys))
    if not unique_keys:
        single = input("Enter your Gemini API Key: ").strip()
        if single:
            unique_keys = [single]
        else:
            print("Error: At least one Gemini API key is required. Paste your keys into public/scripts/gemini_api_keys.txt or pass via -k.", flush=True)
            sys.exit(1)

    key_pool = ApiKeyPool(unique_keys)
    workers = args.workers if args.workers is not None else max(len(unique_keys), 1)

    # 2. Input & Output Setup
    input_folder = Path(args.folder).resolve()
    if not input_folder.exists() or not input_folder.is_dir():
        print(f"Error: Folder '{input_folder}' does not exist.", flush=True)
        sys.exit(1)

    output_folder = Path(args.output).resolve()
    output_folder.mkdir(parents=True, exist_ok=True)

    # 3. Syllabus Setup
    syllabus_text = ""
    syllabus_status = "None (auto-infer Unit 1 - Unit 5)"
    if args.syllabus:
        s_path = Path(args.syllabus).resolve()
        if s_path.exists():
            content = s_path.read_text(encoding="utf-8", errors="ignore").strip()
            meaningful_lines = [l for l in content.splitlines() if l.strip() and not l.strip().startswith("#")]
            if meaningful_lines:
                syllabus_text = content
                syllabus_status = f"{s_path.name} ({len(meaningful_lines)} lines)"

    # 4. Collect PDF files
    pdf_files = sorted(list(input_folder.glob("*.pdf")))
    if not pdf_files:
        print(f"No PDF files found in '{input_folder}'.", flush=True)
        sys.exit(0)

    total_count = len(pdf_files)
    print("=" * 75, flush=True)
    print(f" SRM-PYQ PARALLEL MULTI-KEY TRANSCRIPTION ENGINE", flush=True)
    print(f" • Input Folder:       {input_folder}", flush=True)
    print(f" • Output Folder:      {output_folder}", flush=True)
    print(f" • Syllabus:           {syllabus_status}", flush=True)
    print(f" • Fallback Models:    {' -> '.join(models_list)}", flush=True)
    print(f" • API Keys in Pool:   {len(unique_keys)} keys ({len(unique_keys) * 15} theoretical RPM)", flush=True)
    print(f" • Concurrency:        {workers} worker threads", flush=True)
    print(f" • Total PDFs:         {total_count} files", flush=True)
    print(f" • Naming Mode:        Direct from split plan (<pdf_stem>.json, no renaming)", flush=True)
    print("=" * 75, flush=True)

    overall_start = time.time()
    success_count = 0
    fail_count = 0
    skipped_count = 0

    # Build index of existing JSON files and manifest
    manifest_path = output_folder / ".completed_manifest.json"
    manifest_data = {}
    if manifest_path.exists():
        try:
            manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            manifest_data = {}

    def is_already_done(pdf_path: Path) -> bool:
        expected_json = output_folder / f"{pdf_path.stem}.json"
        if expected_json.exists() and expected_json.stat().st_size > 50:
            return True
        if pdf_path.name in manifest_data:
            dest = output_folder / manifest_data[pdf_path.name]
            if dest.exists() and dest.stat().st_size > 50:
                return True
        return False

    tasks_to_run = []
    
    for idx, pdf_file in enumerate(pdf_files, start=1):
        if args.skip_existing and is_already_done(pdf_file):
            log(f"[{idx:02d}/{total_count:02d}] [SKIP] (already transcribed): {pdf_file.name}")
            skipped_count += 1
        else:
            tasks_to_run.append((pdf_file, idx))

    log(f"[*] Starting {len(tasks_to_run)} remaining task(s) across {workers} worker threads...\n")

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                process_single_pdf,
                pdf_path,
                output_folder,
                models_list,
                syllabus_text,
                key_pool,
                idx,
                total_count
            ): pdf_path
            for pdf_path, idx in tasks_to_run
        }

        for future in as_completed(futures):
            pdf_path = futures[future]
            try:
                success, original_name, result = future.result()
                if success:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                log(f"[ERROR] Thread execution error on {pdf_path.name}: {e}")
                fail_count += 1

    total_time = time.time() - overall_start
    print("\n" + "=" * 75, flush=True)
    print(f"TRANSCRIPTION BATCH COMPLETE in {total_time:.1f}s (~{total_time/60:.1f} min)", flush=True)
    print(f" - Successfully Transcribed: {success_count}", flush=True)
    print(f" - Skipped (Pre-existing):    {skipped_count}", flush=True)
    print(f" - Failed / Errored:         {fail_count}", flush=True)
    print(f" - Output Directory:         {output_folder}", flush=True)
    print("=" * 75, flush=True)

if __name__ == "__main__":
    main()
