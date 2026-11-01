#!/usr/bin/env node
/**
 * Converts multiple-choice questions from "options typed into question_text" to the
 * structured MCQ shape:
 *
 *   { question_text: "<stem only>", options: ["opt A", "opt B", ...], correct_option: "C" | null,
 *     answer: "<explanation only>", ... }
 *
 * Usage:  node scripts/mcqify.mjs [dataDir] [--write] [--only=<courseCode>] [--report=<file>]
 *
 * Without --write nothing is changed (dry run). Questions it cannot convert confidently are
 * left untouched and listed in the report; those need a human (or agent) look.
 * Already-converted questions (with an `options` array) are skipped, so it is safe to re-run.
 * Plain Node (>= 18), no dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const write = args.includes("--write");
const only = flag("only");
const reportPath = flag("report");
const dataDir = path.resolve(args.find((a) => !a.startsWith("--")) ?? path.join(here, "..", "public", "data"));
const NON_PAPER = new Set(["manifest.json", ".completed_manifest.json", "all_questions.json"]);

const LETTERS = "ABCDEFGH";

/* ── option parsing ───────────────────────────────────────────────────── */

const LINE_MARK = /^\s*\(?([A-Ha-h])[).:]\s*(.*)$/;

/** Options laid out one per line: "(A) x" / "a) x" / "A. x" / "A: x" (continuation lines allowed). */
function parseLineOptions(text) {
  const lines = text.split("\n");
  const marks = [];
  lines.forEach((ln, i) => {
    const m = ln.match(LINE_MARK);
    if (m) marks.push({ i, letter: m[1], rest: m[2] });
  });
  // Find the last run of marks that goes a, b, c, ... in order, same case.
  let best = null;
  for (let s = 0; s < marks.length; s++) {
    if (marks[s].letter.toLowerCase() !== "a") continue;
    const run = [marks[s]];
    for (let k = s + 1; k < marks.length; k++) {
      const expect = LETTERS[run.length].toLowerCase();
      const prev = run[run.length - 1];
      if (marks[k].letter.toLowerCase() === expect && marks[k].letter === (prev.letter === prev.letter.toUpperCase() ? expect.toUpperCase() : expect)) {
        run.push(marks[k]);
      } else if (marks[k].letter.toLowerCase() === "a") break;
    }
    if (run.length >= 2) best = run;
  }
  if (!best) return null;
  const stem = lines.slice(0, best[0].i).join("\n").trim();
  const options = best.map((m, idx) => {
    const end = idx + 1 < best.length ? best[idx + 1].i : lines.length;
    const cont = lines.slice(m.i + 1, end).join("\n");
    return (m.rest + (cont ? "\n" + cont : "")).trim();
  });
  return { stem, options, style: "lines" };
}

/**
 * Options inline, in any order: "stem (A) x (B) y (C) z (D) w", "A) x B) y", or column-major
 * "(A) x (C) z\n(B) y (D) w". Needs the first occurrence of each of a, b, c, ... in a row.
 */
function parseInlineOptions(text) {
  const re = /(?<![\w])\(([A-Ha-h])\)|(?<=^|\s)([A-Ha-h])\)/g;
  const first = new Map();
  let m;
  while ((m = re.exec(text))) {
    const letter = (m[1] ?? m[2]).toLowerCase();
    if (!first.has(letter)) first.set(letter, { at: m.index, end: re.lastIndex });
  }
  let n = 0;
  while (n < LETTERS.length && first.has(LETTERS[n].toLowerCase())) n++;
  if (n < 3) return null;
  const marks = [...first.entries()]
    .filter(([l]) => LETTERS.indexOf(l.toUpperCase()) < n)
    .map(([l, v]) => ({ l, ...v }))
    .sort((x, y) => x.at - y.at);
  const stemEnd = marks[0].at;
  const byLetter = new Map();
  marks.forEach((mk, idx) => {
    byLetter.set(mk.l, text.slice(mk.end, idx + 1 < marks.length ? marks[idx + 1].at : text.length).trim());
  });
  const options = [...Array(n).keys()].map((i) => byLetter.get(LETTERS[i].toLowerCase()));
  return { stem: text.slice(0, stemEnd).trim(), options, style: "inline" };
}

function parseOptions(text) {
  const byLine = parseLineOptions(text);
  const inline = parseInlineOptions(text);
  const ok = (r) => r && r.options.length >= 2 && r.options.every((o) => o.length > 0);
  // Layouts like "(A) x (B) y\n(C) z (D) w" parse short by line; take whichever finds more options.
  if (ok(inline) && (!ok(byLine) || inline.options.length > byLine.options.length)) return inline;
  return ok(byLine) ? byLine : null;
}

/* ── answer parsing ───────────────────────────────────────────────────── */

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/\$|\\text\{|\}|\\,|\*\*|`/g, "")
    .replace(/[^a-z0-9.+\-/^=<>]+/g, " ")
    .trim();

/** Returns { index, rest } (rest = explanation with the leading answer marker removed) or null. */
function parseAnswer(answer, options) {
  const a = (answer ?? "").trim();
  if (!a) return null;
  const stripLabel = (s) => s.replace(/^\s*(?:explanation|rationale|solution|reason)\s*:\s*/i, "").replace(/^[\s.,:;\-–—]+/, "").trim();
  const n = options.length;
  const idxOf = (ch) => {
    const i = LETTERS.indexOf(ch.toUpperCase());
    return i >= 0 && i < n ? i : -1;
  };

  // 1. Leading letter marker: "(D) Grey Code ...", "D) ...", "d. ...", "Answer: (D) ...", "(C)\nExplanation"
  const lead = a.match(
    /^\s*(?:\*\*)?(?:(?:correct\s+)?(?:answer|option|choice)\s*\d*\s*(?:is)?\s*[:\-]?\s*)?(?:\*\*)?\s*(?:\(([A-Ha-h])\)|([A-Ha-h])\)|([A-Ha-h])[.:](?=\s|$)|([A-Ha-h])(?=[ \t]*(?:\n|$)))(?:\*\*)?/i
  );
  if (lead) {
    const i = idxOf(lead[1] ?? lead[2] ?? lead[3] ?? lead[4]);
    if (i >= 0) {
      let rest = a.slice(lead[0].length).trim();
      // drop the echoed option text
      const opt = options[i];
      const firstLine = rest.split("\n")[0];
      const optN = norm(opt);
      if (optN && firstLine.slice(0, opt.length).toLowerCase() === opt.toLowerCase()) {
        rest = (firstLine.slice(opt.length) + "\n" + rest.split("\n").slice(1).join("\n")).trim();
      }
      return { index: i, rest: stripLabel(rest) };
    }
  }

  // 2. "The correct answer is (A)" anywhere
  const said = a.match(/correct\s+(?:answer|option|choice)\s*(?:is|:)?\s*[:\-]?\s*\(?([A-Ha-h])\b\)?/i);
  if (said && idxOf(said[1]) >= 0) return { index: idxOf(said[1]), rest: stripLabel(a) };

  // 2b. Letter embedded in prose, confirmed by the option text that follows it: "... is (a) Haploid cells."
  const embedded = [];
  for (const m of a.slice(0, 400).matchAll(/\(([A-Ha-h])\)\s*/g)) {
    const i = idxOf(m[1]);
    const after = norm(a.slice(m.index + m[0].length, m.index + m[0].length + options[i >= 0 ? i : 0].length + 5));
    if (i >= 0 && norm(options[i]).length > 0 && after.startsWith(norm(options[i]))) embedded.push(i);
  }
  if (embedded.length && new Set(embedded).size === 1) return { index: embedded[0], rest: stripLabel(a) };

  // 3. First line equals / starts with exactly one option's text
  const first = a.split("\n")[0].replace(/^\s*(?:\*\*)?(?:answer\s*:?\s*)?/i, "");
  const fn = norm(first);
  if (fn) {
    const exact = options.map((o, i) => (norm(o) === fn ? i : -1)).filter((i) => i >= 0);
    if (exact.length === 1) return { index: exact[0], rest: stripLabel(a.split("\n").slice(1).join("\n")) };
    const starts = options
      .map((o, i) => (norm(o).length >= 3 && (fn.startsWith(norm(o) + " ") || fn.startsWith(norm(o) + ".")) ? i : -1))
      .filter((i) => i >= 0);
    if (starts.length === 1) {
      const o = options[starts[0]];
      const rest = a.slice(a.toLowerCase().indexOf(o.toLowerCase()) + o.length);
      return { index: starts[0], rest: stripLabel(rest) };
    }
  }
  return null;
}

/* ── main ─────────────────────────────────────────────────────────────── */

const looksLikeMcq = (q, parsed) => {
  if (parsed.options.length >= 3) return true;
  return q.marks == null || q.marks <= 2; // two-option questions only when it is a 1-2 mark question
};

const stats = { files: 0, questions: 0, converted: 0, already: 0, noCorrect: 0, skipped: 0 };
const report = { noCorrect: [], skipped: [], suspicious: [] };

const courses = fs.readdirSync(dataDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
for (const code of courses) {
  if (only && code !== only) continue;
  const dir = path.join(dataDir, code);
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !NON_PAPER.has(f) && !f.startsWith(".")).sort()) {
    const p = path.join(dir, file);
    let raw;
    try {
      raw = fs.readFileSync(p, "utf8");
      if (!raw.trim()) continue;
    } catch {
      continue;
    }
    let data;
    try {
      data = JSON.parse(raw.replace(/^﻿/, ""));
    } catch {
      continue;
    }
    const list = Array.isArray(data) ? data : data?.questions;
    if (!Array.isArray(list)) continue;
    stats.files++;
    let changed = false;
    list.forEach((q, qi) => {
      if (!q || typeof q !== "object" || typeof q.question_text !== "string") return;
      stats.questions++;
      if (Array.isArray(q.options)) {
        stats.already++;
        return;
      }
      const parsed = parseOptions(q.question_text);
      const where = { course: code, file, index: qi, number: q.question_number };
      if (!parsed) return;
      if (!looksLikeMcq(q, parsed) || !parsed.stem) {
        stats.skipped++;
        report.skipped.push({ ...where, reason: !parsed.stem ? "no stem" : "2 options, marks > 2", text: q.question_text.slice(0, 120) });
        return;
      }
      const ans = parseAnswer(q.answer, parsed.options);
      const out = {};
      for (const [k, v] of Object.entries(q)) {
        if (k === "question_text") {
          out.question_text = parsed.stem;
          out.options = parsed.options;
          out.correct_option = ans ? LETTERS[ans.index] : null;
        } else if (k === "answer") {
          out.answer = ans ? ans.rest : q.answer;
        } else out[k] = v;
      }
      list[qi] = out;
      changed = true;
      stats.converted++;
      if (!ans) {
        stats.noCorrect++;
        report.noCorrect.push({ ...where, answer: String(q.answer ?? "").slice(0, 100) });
      }
    });
    if (changed && write) {
      const indent = (raw.match(/^[\[{]\s*\n( +)\S/) ?? [])[1]?.length ?? 2;
      fs.writeFileSync(p, JSON.stringify(data, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
    }
  }
}

console.log(JSON.stringify(stats));
console.log(`${write ? "WROTE" : "dry run (no files changed)"} · converted ${stats.converted}, correct option unknown ${stats.noCorrect}, skipped ${stats.skipped}`);
if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
