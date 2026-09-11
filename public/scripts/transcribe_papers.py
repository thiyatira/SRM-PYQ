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
PROMPT_TEMPLATE = """
You are an expert academic assistant and document transcription engine.
Your task is to analyze a university examination question paper (or answer key) PDF and produce a structured JSON object.

### Instructions:
1. Read the provided PDF thoroughly.
2. Deduce the formal standardized filename for this paper based on the file naming specification below.
3. Transcribe ALL questions and sub-questions in exact sequential order.
4. If the paper contains an answer key or solutions, transcribe them and set `answer_source` to "provided".
   If no answer key is present, generate high-quality, accurate, university-level solutions and set `answer_source` to "generated".
5. Map each question to its corresponding unit in the syllabus (must include "Unit 1", "Unit 2", "Unit 3", "Unit 4", or "Unit 5").
6. Output MUST be a single, valid JSON object and nothing else. Ensure all LaTeX math backslashes are properly escaped (e.g. \\\\int, \\\\alpha, \\\\theta).
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

Examples of `formal_filename`:
- "2023-12_ET_SetA_QP.json"
- "2024-04-01_CT2_SetB_QP.json"
- "2023-11-03_CT2_SetD_B2_QP-Key.json"
- "2024-01_ET_QP.json"

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

def sanitize_filename(name: str, fallback_name: str) -> str:
    """Ensures the filename is valid and ends with .json."""
    if not name or not isinstance(name, str):
        name = fallback_name
    name = Path(name).name
    name = re.sub(r'[<>:"/\\|?*]', '_', name).strip()
    if not name.lower().endswith(".json"):
        name = f"{name}.json"
    return name

def process_single_pdf(pdf_path: Path, output_folder: Path, model_name: str, syllabus: str, key_pool: ApiKeyPool, item_idx: int, total_items: int, use_original_names: bool = True, max_retries: int = 6):
    """Processes a single PDF with inline data, rate-throttling via ApiKeyPool, error handling, and logging."""
    start_time = time.time()
    tag = f"[{item_idx:02d}/{total_items:02d}]"
    
    log(f"{tag} [START] {pdf_path.name}")
    
    prompt = PROMPT_TEMPLATE.replace("{syllabus}", syllabus if syllabus else "No specific syllabus provided. Infer standard university curriculum units (Unit 1 to Unit 5).")
    
    try:
        pdf_bytes = pdf_path.read_bytes()
    except Exception as e:
        log(f"{tag} [ERROR] Failed to read {pdf_path.name}: {e}")
        return False, pdf_path.name, f"Read error: {e}"

    pdf_part = {"mime_type": "application/pdf", "data": pdf_bytes}

    for attempt in range(1, max_retries + 1):
        api_key, gen_client, masked_key = key_pool.acquire_key_and_client()
        
        model = genai.GenerativeModel(
            model_name,
            generation_config={"response_mime_type": "application/json"}
        )
        model._client = gen_client

        try:
            log(f"{tag} [SENDING] ({model_name} | Key {masked_key}) [Attempt {attempt}/{max_retries}]...")
            response = model.generate_content([prompt, pdf_part])
            
            data = robust_json_load(response.text)
            
            if use_original_names:
                final_filename = f"{pdf_path.stem}.json"
                data["formal_filename"] = final_filename
            else:
                formal_name = data.get("formal_filename")
                fallback_name = f"{pdf_path.stem}.json"
                final_filename = sanitize_filename(formal_name, fallback_name)
                
            output_file = output_folder / final_filename

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            
            update_manifest(output_folder, pdf_path.name, final_filename)
            
            elapsed = time.time() - start_time
            q_count = len(data.get("questions", []))
            log(f"{tag} [OK] ({elapsed:.1f}s): {pdf_path.name} -> {final_filename} ({q_count} questions)")
            return True, pdf_path.name, final_filename

        except json.JSONDecodeError as e:
            log(f"{tag} [WARN] JSON decode error on attempt {attempt}: {e}")
            if attempt == max_retries:
                err_file = output_folder / f"raw_error_{pdf_path.stem}.txt"
                with open(err_file, "w", encoding="utf-8") as f:
                    f.write(response.text if 'response' in locals() else "No response")
                log(f"{tag} [ERROR] Failed to parse valid JSON. Raw output saved to: {err_file.name}")
                return False, pdf_path.name, f"JSONDecodeError (raw saved to {err_file.name})"
            time.sleep(3)

        except Exception as e:
            err_msg = str(e)
            is_rate_limit = "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower()
            
            if is_rate_limit:
                backoff = 12 * attempt
                log(f"{tag} [WAIT] Key {masked_key} hit rate limit (429). Backing off for {backoff}s and rotating key...")
                key_pool.mark_rate_limit(api_key, backoff)
                time.sleep(1)
            else:
                log(f"{tag} [WARN] API error with key {masked_key} on attempt {attempt}: {e}")
                if attempt < max_retries:
                    time.sleep(2 * attempt)
                else:
                    log(f"{tag} [ERROR] Giving up after {max_retries} attempts on {pdf_path.name}")
                    return False, pdf_path.name, str(e)

    return False, pdf_path.name, "Max retries exceeded"

def main():
    parser = argparse.ArgumentParser(description="SRM-PYQ Parallel Batch PDF Transcriber & Formatter")
    parser.add_argument("-f", "--folder", default="public/pdf/DSA", help="Path to folder containing PDF question papers")
    parser.add_argument("-o", "--output", default="public/data/DSA", help="Path to output JSON folder")
    parser.add_argument("-s", "--syllabus", default="public/scripts/dsa_syllabus.txt", help="Path to syllabus text file")
    parser.add_argument("-k", "--api-keys", nargs="+", help="One or more Gemini API keys (space-separated or comma-separated)")
    parser.add_argument("--api-key", help="Single Gemini API Key for backwards compatibility")
    parser.add_argument("-m", "--model", default="models/gemini-3.5-flash", help="Gemini model (default: models/gemini-3.5-flash)")
    parser.add_argument("-w", "--workers", type=int, default=None, help="Concurrent workers (default: number of API keys)")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip files that already exist in output folder")
    parser.add_argument("--use-original-names", action="store_true", default=True, help="Use original PDF filename for output JSON (default: True)")
    parser.add_argument("--use-deduced-names", action="store_false", dest="use_original_names", help="Use AI deduced formal filename")
    args = parser.parse_args()

    # 1. API Key Setup
    keys = []
    if args.api_keys:
        for item in args.api_keys:
            keys.extend([k.strip() for k in item.split(",") if k.strip()])
    if args.api_key:
        keys.extend([k.strip() for k in args.api_key.split(",") if k.strip()])
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
            print("Error: At least one Gemini API key is required.", flush=True)
            sys.exit(1)

    key_pool = ApiKeyPool(unique_keys)
    workers = args.workers if args.workers is not None else max(len(unique_keys), 1)

    # 2. Input & Output Setup
    input_folder = Path(args.folder).resolve()
    output_folder = Path(args.output).resolve()
    output_folder.mkdir(parents=True, exist_ok=True)

    if not input_folder.exists() or not input_folder.is_dir():
        print(f"Error: Folder '{input_folder}' does not exist.", flush=True)
        sys.exit(1)

    # 3. Syllabus Setup
    syllabus_text = ""
    if args.syllabus:
        s_path = Path(args.syllabus).resolve()
        if s_path.exists():
            syllabus_text = s_path.read_text(encoding="utf-8", errors="ignore")

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
    print(f" • Model:              {args.model}", flush=True)
    print(f" • API Keys in Pool:   {len(unique_keys)} keys ({len(unique_keys) * 15} theoretical RPM)", flush=True)
    print(f" • Concurrency:        {workers} worker threads", flush=True)
    print(f" • Total PDFs:         {total_count} files", flush=True)
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

    existing_json_files = list(output_folder.glob("*.json"))
    existing_stems = [f.stem.lower().replace("-", "_") for f in existing_json_files if not f.name.startswith(".")]

    def is_already_done(pdf_name: str) -> bool:
        if pdf_name in manifest_data:
            dest = output_folder / manifest_data[pdf_name]
            if dest.exists() and dest.stat().st_size > 50:
                return True
        norm_pdf = pdf_name.lower().replace("-", "_")
        stem_pdf = Path(pdf_name).stem.lower().replace("-", "_")
        for ex in existing_stems:
            if ex == stem_pdf:
                return True
        ym_match = re.search(r'(\d{4}_\d{2})', norm_pdf)
        if ym_match:
            ym = ym_match.group(1)
            set_match = re.search(r'set_?([a-z0-9]+)', norm_pdf)
            for ex in existing_stems:
                if ym in ex:
                    if set_match:
                        s = set_match.group(1)
                        if f"set{s}" in ex or f"set_{s}" in ex:
                            return True
                    else:
                        ex_set = re.search(r'set_?([a-z0-9]+)', ex)
                        if not ex_set:
                            return True
        for ex in existing_stems:
            if ex in norm_pdf or norm_pdf.replace(".pdf", "") in ex:
                return True
        return False

    tasks_to_run = []
    
    for idx, pdf_file in enumerate(pdf_files, start=1):
        if args.skip_existing and is_already_done(pdf_file.name):
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
                args.model,
                syllabus_text,
                key_pool,
                idx,
                total_count,
                args.use_original_names
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
