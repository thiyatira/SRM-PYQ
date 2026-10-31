#!/usr/bin/env node
/**
 * Validates the question bank under public/data/<courseCode>/*.json against the
 * shape that src/components/PyqSection.tsx relies on.
 *
 * Usage:  node scripts/validate-data.mjs [dataDir] [--quiet]
 *         (dataDir defaults to <repo>/public/data)
 *
 * Exit code 1 if any error is found; warnings never fail the run.
 * Plain Node (>= 18), no dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const dataDir = path.resolve(args.find((a) => !a.startsWith("--")) ?? path.join(repoRoot, "public", "data"));

// Files that live next to the papers but are generator bookkeeping, not papers.
const NON_PAPER = new Set(["manifest.json", ".completed_manifest.json", "all_questions.json"]);

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push({ file, msg });
const warn = (file, msg) => warnings.push({ file, msg });

/* ── helpers ──────────────────────────────────────────────────────────── */

const MOJIBAKE_RE = /â€|Ã[\u0080-¿]|Â[ -¿]|â‚|�/;

/** Strip fenced code blocks and inline code so delimiter checks only see prose. */
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");
}

function countFences(text) {
  return (text.match(/```/g) || []).length;
}

/**
 * Mirrors PyqSection.renderLatex: $$..$$ (multi-line) first, then $..$ within a single line.
 * Returns { errors, warnings } for the prose part of `text` (code is ignored).
 * A line with an unpaired `$` is an error when that line also looks like LaTeX
 * (backslash command, ^ or _ or braces), otherwise it is most likely a literal
 * currency / shell / C identifier `$` and only a warning.
 */
function checkMath(text) {
  const out = { errors: [], warnings: [] };
  const prose = stripCode(text);
  const afterDisplay = prose.replace(/\$\$[\s\S]+?\$\$/g, " ");
  if (afterDisplay.includes("$$")) out.errors.push("unbalanced $$ delimiter");
  for (const line of afterDisplay.split("\n")) {
    const rest = line.replace(/\$[^$\n]+?\$/g, " ");
    if (rest.includes("$")) {
      const mathy = /\\[A-Za-z]+|[\^_]\{?|[{}]/.test(line);
      const msg = `unpaired $ on line ${JSON.stringify(line.trim().slice(0, 60))}`;
      (mathy ? out.errors : out.warnings).push(mathy ? msg : `${msg} (probably a literal dollar sign)`);
    }
  }
  const bare = afterDisplay.replace(/\$[^$\n]+?\$/g, " ").match(/\\(?:frac|overline|sqrt|int|sum|alpha|beta|theta|pi|lambda|mu|sigma|omega|Omega|infty|cdot|times|leq|geq|rightarrow|vec|hat|bar|text|begin|end)\b/);
  if (bare) out.warnings.push(`TeX command \\${bare[1] ?? bare[0].slice(1)} outside $...$ delimiters (renders as raw text)`);
  const open = (prose.match(/\\\(/g) || []).length;
  const close = (prose.match(/\\\)/g) || []).length;
  if (open !== close) out.errors.push(`unbalanced \\( \\) (${open} open, ${close} close)`);
  const bOpen = (prose.match(/\\\[/g) || []).length;
  const bClose = (prose.match(/\\\]/g) || []).length;
  if (bOpen !== bClose) out.errors.push(`unbalanced \\[ \\] (${bOpen} open, ${bClose} close)`);
  return out;
}

function mcqOptions(questionText) {
  // Options appear as "(A) x", "A) x", "A. x", "a)(6,)" - on their own lines or inline.
  const text = stripCode(questionText);
  const letters = [];
  const re = /(?:^|[\s-])\(?([A-Da-d])[).](?=\s*[^\s])|(?:^|[\s-])\(([A-Da-d])\)/g;
  let m;
  while ((m = re.exec(text))) letters.push((m[1] || m[2]).toUpperCase());
  // Only count a run that follows the A,B,C,D order, so prose like "(a) and (c)" is ignored.
  const run = [];
  for (const l of letters) {
    if (l === "ABCD"[run.length]) run.push(l);
    else if (l === "A" && run.length < 2) run.splice(0, run.length, "A");
  }
  return { all: letters, run };
}

function answerLetter(answer) {
  const m =
    answer.match(/^\s*\*{0,2}\(?([A-Da-d])(?:\)|\.|:|\b)/) ||
    answer.match(/correct (?:option|answer)(?: is)?\s*:?\s*\*{0,2}\(?([A-Da-d])\b/i) ||
    answer.match(/\banswer is\s*:?\s*['"(*]*([A-Da-d])\b/i) ||
    answer.match(/^\s*\*{0,2}(?:option|answer)\*{0,2}:?\s*\(?([A-Da-d])\b/i);
  return m ? m[1].toUpperCase() : null;
}

/* ── per-file validation ──────────────────────────────────────────────── */

function readJson(rel, abs) {
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) {
    err(rel, "file is empty (0 bytes); client fetch will fail JSON parse and skip it");
    return null;
  }
  if ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff)) {
    err(rel, "file is UTF-16 encoded, not UTF-8");
    return null;
  }
  let text = buf.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    warn(rel, "file starts with a UTF-8 BOM");
    text = text.slice(1);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    err(rel, `invalid JSON: ${e.message}`);
    return null;
  }
}

function validateQuestion(rel, q, idx, seen, stats) {
  const where = `Q[${idx}]${q && q.question_number != null ? ` (#${q.question_number})` : ""}`;
  if (q === null || typeof q !== "object" || Array.isArray(q)) {
    err(rel, `${where}: question is not an object`);
    return;
  }
  stats.questions++;

  // question_number / duplicate ids
  if (q.question_number == null || String(q.question_number).trim() === "") {
    warn(rel, `${where}: missing question_number`);
  } else {
    const id = String(q.question_number);
    const key = q.paper_title != null ? `${q.paper_title}\u0000${id}` : id;
    if (seen.ids.has(key)) {
      if (id === seen.firstId) {
        // Numbering starts over at the first id: two papers merged in one file. Ambiguous, so warn once per restart.
        warn(rel, `${where}: numbering restarts at "${id}" (merged papers? ids repeat from here)`);
        seen.ids = new Set([key]);
      } else {
        err(rel, `${where}: duplicate question_number "${id}"${q.paper_title ? ` in ${q.paper_title}` : ""}`);
      }
    } else {
      if (seen.firstId === undefined) seen.firstId = id;
      seen.ids.add(key);
    }
  }

  // question_text
  if (typeof q.question_text !== "string") {
    err(rel, `${where}: question_text missing or not a string`);
  } else if (q.question_text.trim() === "") {
    err(rel, `${where}: empty question_text`);
  }

  // answer
  if (typeof q.answer !== "string") {
    err(rel, `${where}: answer missing or not a string`);
  } else if (q.answer.trim() === "") {
    warn(rel, `${where}: empty answer`);
  }

  // marks
  if (q.marks === undefined || q.marks === null) {
    warn(rel, `${where}: marks is ${q.marks === null ? "null" : "missing"} (shown as blank, sorted as 0, hidden by min-marks filter)`);
  } else if (typeof q.marks !== "number" || !Number.isFinite(q.marks) || q.marks < 0) {
    err(rel, `${where}: marks must be a non-negative number, got ${JSON.stringify(q.marks)}`);
  } else if (!Number.isInteger(q.marks) || q.marks > 20) {
    warn(rel, `${where}: unusual marks value ${q.marks} (slider range is 0-20)`);
  }

  // chapter -> unit
  if (q.chapter === undefined || q.chapter === null) {
    warn(rel, `${where}: no chapter (falls in "Other")`);
  } else if (typeof q.chapter !== "string") {
    err(rel, `${where}: chapter must be a string`);
  } else if (!/Unit\s*([1-5])/i.test(q.chapter)) {
    warn(rel, `${where}: chapter has no "Unit 1-5" (falls in "Other"): ${JSON.stringify(q.chapter.slice(0, 60))}`);
    stats.otherUnit++;
  }

  // per-string text checks
  for (const field of ["question_text", "answer", "chapter"]) {
    const v = q[field];
    if (typeof v !== "string") continue;
    if (MOJIBAKE_RE.test(v)) {
      const m = v.match(MOJIBAKE_RE);
      err(rel, `${where}.${field}: mojibake / replacement char near ${JSON.stringify(v.slice(Math.max(0, m.index - 15), m.index + 25))}`);
    }
    if (field === "chapter") continue;
    if (countFences(v) % 2 === 1) err(rel, `${where}.${field}: unclosed \`\`\` code fence`);
    const math = checkMath(v);
    for (const p of math.errors) err(rel, `${where}.${field}: ${p}`);
    for (const p of math.warnings) warn(rel, `${where}.${field}: ${p}`);
    if (/\\\(|\\\[/.test(stripCode(v)) && !/\$/.test(v)) {
      warn(rel, `${where}.${field}: uses \\( \\) / \\[ \\] math, which PyqSection does not render (only $ and $$)`);
    }
  }

  // MCQ consistency
  if (typeof q.question_text === "string" && typeof q.answer === "string") {
    const { all, run } = mcqOptions(q.question_text);
    if (all.length > 0) {
      // Sub-parts of essay questions ("a) ... b) ...") are not MCQs, so only treat the question as an
      // MCQ with >=3 options in A,B,C,D order, or when it uses the "(A)" style that the generator emits.
      const found = new Set(all);
      const upperParen = /(?:^|\s)\([A-D]\)/.test(q.question_text);
      if (run.length >= 3 || upperParen) {
        stats.mcq++;
        if (run.length < 2 && found.size < 2) {
          err(rel, `${where}: MCQ with fewer than 2 options (found ${[...found].join(",")})`);
        } else {
          if (run.length < Math.min(found.size, 4)) {
            warn(rel, `${where}: option letters not in A,B,C,D order (found ${all.join(",")})`);
          }
          const ans = answerLetter(q.answer);
          if (ans === null) {
            warn(rel, `${where}: MCQ answer does not start with an option letter: ${JSON.stringify(q.answer.slice(0, 50))}`);
          } else if (!found.has(ans)) {
            err(rel, `${where}: answer option (${ans}) is not among the options (${[...found].join(",")})`);
          }
        }
      }
    }
  }
}

function validateFile(rel, abs, stats) {
  stats.files++;
  const data = readJson(rel, abs);
  if (data === null) return;
  let qs;
  if (Array.isArray(data)) qs = data;
  else if (data && Array.isArray(data.questions)) qs = data.questions;
  else {
    err(rel, "top level must be an array of questions or an object with a `questions` array");
    return;
  }
  if (!Array.isArray(data) && data.paper_title != null && typeof data.paper_title !== "string") {
    err(rel, "paper_title must be a string");
  }
  if (qs.length === 0) warn(rel, "contains zero questions");
  const seen = { ids: new Set(), firstId: undefined };
  qs.forEach((q, i) => validateQuestion(rel, q, i, seen, stats));
}

/* ── hard-coded file list in PyqSection (best effort, read-only) ──────── */

function checkIndexSync(codeToFiles) {
  const srcFile = path.join(repoRoot, "src", "components", "PyqSection.tsx");
  if (!fs.existsSync(srcFile)) return;
  const src = fs.readFileSync(srcFile, "utf8");
  const re = /code:\s*"([^"]+)",[\s\S]*?files:\s*\[([\s\S]*?)\]/g;
  const listed = new Map();
  let m;
  while ((m = re.exec(src))) listed.set(m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  if (listed.size === 0) return; // component no longer hard-codes a list
  for (const [code, files] of listed) {
    const onDisk = new Set(codeToFiles.get(code) ?? []);
    if (files.length > 0 && !codeToFiles.has(code)) err(`${code}/`, "listed in PyqSection but folder missing on disk");
    for (const f of files) if (!onDisk.has(f)) err(`${code}/${f}`, "listed in PyqSection but missing on disk (fetch 404)");
    for (const f of onDisk) {
      if (!files.includes(f) && f.endsWith(".json") && !NON_PAPER.has(f)) {
        warn(`${code}/${f}`, "paper exists on disk but is not listed in PyqSection (never shown)");
      }
    }
  }
  for (const code of codeToFiles.keys()) {
    if (!listed.has(code)) warn(`${code}/`, "folder on disk is not a subject in PyqSection");
  }
}

/* ── main ─────────────────────────────────────────────────────────────── */

if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
  console.error(`Data directory not found: ${dataDir}`);
  process.exit(2);
}

const stats = { folders: 0, files: 0, questions: 0, mcq: 0, otherUnit: 0 };
const codeToFiles = new Map();

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  const rel0 = entry.name;
  if (!entry.isDirectory()) {
    warn(rel0, "unexpected file at data root");
    continue;
  }
  stats.folders++;
  const dir = path.join(dataDir, entry.name);
  if (!/^[0-9A-Z]{6,12}$/.test(entry.name)) warn(`${entry.name}/`, "folder name does not look like a course code");
  const names = fs.readdirSync(dir).sort();
  codeToFiles.set(entry.name, names);
  if (names.length === 0) warn(`${entry.name}/`, "empty folder");
  for (const name of names) {
    const rel = `${entry.name}/${name}`;
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) {
      warn(rel, "unexpected subdirectory");
      continue;
    }
    if (!name.endsWith(".json")) {
      warn(rel, "non-JSON file in data folder (never fetched by the app)");
      continue;
    }
    if (/[^A-Za-z0-9._-]/.test(name)) {
      warn(rel, "filename has characters other than [A-Za-z0-9._-]; fetch URL is not encodeURIComponent'd in PyqSection");
    }
    if (NON_PAPER.has(name)) {
      warn(rel, "generator bookkeeping / aggregate file, not a paper");
      // still verify it parses where it is meant to be JSON
      const d = name === "all_questions.json" ? "paper" : "manifest";
      if (d === "manifest") {
        const buf = fs.readFileSync(abs);
        if ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff)) warn(rel, "manifest is UTF-16 encoded");
      } else {
        // Not served by the app: report its problems as warnings only.
        const before = errors.length;
        validateFile(rel, abs, { files: 0, questions: 0, mcq: 0, otherUnit: 0 });
        for (const e of errors.splice(before)) warn(e.file, `[aggregate] ${e.msg}`);
      }
      continue;
    }
    validateFile(rel, abs, stats);
  }
}

checkIndexSync(codeToFiles);

const fmt = (x) => `  ${x.file}: ${x.msg}`;
if (!quiet) {
  if (warnings.length) {
    console.log(`WARNINGS (${warnings.length})`);
    warnings.forEach((w) => console.log(fmt(w)));
    console.log();
  }
}
if (errors.length) {
  console.log(`ERRORS (${errors.length})`);
  errors.forEach((e) => console.log(fmt(e)));
  console.log();
}
console.log(
  `Scanned ${stats.folders} folders, ${stats.files} JSON files, ${stats.questions} questions (${stats.mcq} MCQ, ${stats.otherUnit} without a Unit 1-5 chapter).`
);
console.log(`Result: ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
