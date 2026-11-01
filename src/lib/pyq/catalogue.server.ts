/* Server-only: lists paper files from public/data/<code>/ when the page is rendered at build time. */
import fs from "node:fs";
import path from "node:path";
import { SUBJECT_CODES, type PaperFiles } from "./data";

const DATA_DIR = path.join(process.cwd(), "public", "data");

// Files that live next to the papers but are generator bookkeeping, not papers
// (keep in sync with scripts/validate-data.mjs).
const NON_PAPER = new Set(["manifest.json", ".completed_manifest.json", "all_questions.json"]);

const byName = new Intl.Collator("en", { numeric: true }).compare;

function listPapers(code: string): string[] {
  const dir = path.join(DATA_DIR, code);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json") && !e.name.startsWith(".") && !NON_PAPER.has(e.name))
    // Empty placeholder files would only fail to parse in the browser.
    .filter((e) => fs.statSync(path.join(dir, e.name)).size > 0)
    .map((e) => e.name)
    .sort(byName);
}

export function scanPaperFiles(): PaperFiles {
  return Object.fromEntries(SUBJECT_CODES.map((code) => [code, listPapers(code)]));
}
