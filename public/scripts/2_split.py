#!/usr/bin/env python3
import os
import sys
import copy
import json
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import RectangleObject
except ImportError:
    print("Error: 'pypdf' is not installed.")
    print("Install it with: pip install pypdf")
    sys.exit(1)


def get_half_page(page, side: str):
    """Crops a landscape booklet spread into a single page half ('left' or 'right')."""
    p = copy.deepcopy(page)
    box = p.cropbox or p.mediabox
    x0 = float(box.lower_left[0])
    y0 = float(box.lower_left[1])
    x1 = float(box.upper_right[0])
    y1 = float(box.upper_right[1])
    mid_x = (x0 + x1) / 2.0

    if side.lower() == "left":
        p.mediabox = RectangleObject([x0, y0, mid_x, y1])
        p.cropbox = RectangleObject([x0, y0, mid_x, y1])
    elif side.lower() == "right":
        p.mediabox = RectangleObject([mid_x, y0, x1, y1])
        p.cropbox = RectangleObject([mid_x, y0, x1, y1])
    return p


def find_file_containing_code(raw_dir: Path, target_code: str):
    """Dynamically finds which PDF in raw_pdfs/ contains a specific course code string."""
    for pdf_file in raw_dir.glob("*.pdf"):
        try:
            reader = PdfReader(str(pdf_file))
            for page in reader.pages[:3]:
                text = page.extract_text() or ""
                if target_code in text:
                    return pdf_file.name
        except Exception:
            continue
    return None


def main():
    base_dir = Path(__file__).resolve().parent
    raw_dir = base_dir / "raw_pdfs"
    out_dir = base_dir / "split_pdf"
    manifest_path = base_dir / "manifest.json"

    if not manifest_path.exists():
        print(f"[ERROR] Manifest file not found at: {manifest_path}")
        sys.exit(1)

    if not raw_dir.exists():
        print(f"[ERROR] Raw directory not found at: {raw_dir}")
        sys.exit(1)

    out_dir.mkdir(parents=True, exist_ok=True)

    with open(manifest_path, "r", encoding="utf-8") as f:
        tasks = json.load(f)

    # Dynamic detection for the 15CS302J bundle
    legacy_file = find_file_containing_code(raw_dir, "15CS302J")
    if legacy_file:
        print(f"[AUTO-DETECT] Verified '15CS302J' exam bundle in: '{legacy_file}'")

    print(f"\n=== Processing {len(tasks)} target question papers ===")
    readers = {}

    def get_reader(filename):
        if filename not in readers:
            file_path = raw_dir / filename
            if not file_path.exists():
                return None
            readers[filename] = PdfReader(str(file_path))
        return readers[filename]

    success_count = 0
    fail_count = 0

    for i, task in enumerate(tasks, 1):
        out_name = task["output_filename"]
        action = task.get("action", "SPLIT")
        pages_meta = task.get("pages", [])

        # Auto-route 15CS302J tasks to the detected legacy file if available
        if "15CS302J" in out_name and legacy_file:
            for p in pages_meta:
                p["source"] = legacy_file

        print(f"[{i:02d}/{len(tasks)}] Generating: {out_name} ({action})")
        writer = PdfWriter()
        task_failed = False

        for page_spec in pages_meta:
            src_file = page_spec["source"]
            page_num = page_spec["page"]
            crop = page_spec.get("crop")
            rotate = page_spec.get("rotate", 0)

            reader = get_reader(src_file)
            if reader is None:
                print(f"  [ERROR] Source file missing: '{src_file}'")
                task_failed = True
                break

            total_pages = len(reader.pages)
            if page_num < 1 or page_num > total_pages:
                print(f"  [ERROR] Page {page_num} out of bounds (1..{total_pages}) in '{src_file}'")
                task_failed = True
                break

            orig_page = reader.pages[page_num - 1]

            if crop:
                processed_page = get_half_page(orig_page, crop)
            else:
                processed_page = copy.deepcopy(orig_page)

            if rotate:
                processed_page.rotate(rotate)

            writer.add_page(processed_page)

        if task_failed:
            print(f"  -> SKIPPED '{out_name}' due to errors.")
            fail_count += 1
            continue

        target_file = out_dir / out_name
        with open(target_file, "wb") as f_out:
            writer.write(f_out)

        print(f"  -> [SUCCESS] Saved ({len(writer.pages)} page(s))")
        success_count += 1

    print("\n" + "=" * 55)
    print(f"Completed: {success_count} succeeded, {fail_count} failed.")
    print(f"Files saved in: {out_dir}")
    print("=" * 55)


if __name__ == "__main__":
    main()