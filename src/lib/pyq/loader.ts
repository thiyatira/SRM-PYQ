import type { SubjectInfo } from "./data";

/* Loading + normalising question-paper JSON (several shapes exist in /public/data). */

export interface Question {
  /** Stable id: `<paper>~<index in file>`. Used for bookmarks and share links. */
  id: string;
  question_text: string;
  answer: string;
  chapter?: string;
  /** Normalised unit label, e.g. "Unit 3" or "Other". */
  unit: string;
  marks?: number;
  /** Paper name (file name without .json). */
  source: string;
  answer_source?: string;
  /** Multiple-choice questions: the option texts in A, B, C… order (question_text is then just the stem). */
  options?: string[];
  /** Indexes into `options` of the correct option(s); empty when the key is unknown. Only set with `options`. */
  correct?: number[];
}

export const OPTION_LETTERS = "ABCDEFGH";

export interface SubjectData {
  questions: Question[];
  papers: string[];
  units: string[];
  maxMarks: number;
  /** Files that could not be fetched or parsed. */
  failed: string[];
  totalFiles: number;
}

/** "Unit 3", "Unit-3 - Stack…", "unit_3" -> "Unit 3"; anything else -> "Other". */
export function extractUnit(chapter?: string): string {
  if (!chapter) return "Other";
  const match = chapter.match(/Unit[\s\-_:.]*([1-9])\b/i);
  return match ? `Unit ${match[1]}` : "Other";
}

export function unitOrder(unit: string): number {
  const n = parseInt(unit.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 99;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asMarks(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** `options` must be 2-8 non-empty strings; anything else means "not a structured MCQ". */
function parseOptions(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const opts = v.map((o) => asString(o).trim());
  return opts.length >= 2 && opts.length <= 8 && opts.every(Boolean) ? opts : undefined;
}

/** "C" -> [2]; "A,C" -> [0, 2]; unknown / out of range -> []. */
function parseCorrect(v: unknown, count: number): number[] {
  if (typeof v !== "string") return [];
  const idx = v
    .split(",")
    .map((s) => OPTION_LETTERS.indexOf(s.trim().toUpperCase()))
    .filter((i) => i >= 0 && i < count);
  return Array.from(new Set(idx));
}

/** Accepts `Question[]`, `{ questions: Question[] }` (or anything else -> empty). */
function extractRawQuestions(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const qs = (data as { questions?: unknown }).questions;
    if (Array.isArray(qs)) return qs;
  }
  return [];
}

function normalise(raw: unknown[], source: string): Question[] {
  const out: Question[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const r = item as Record<string, unknown>;
    const question_text = asString(r.question_text);
    const answer = asString(r.answer);
    if (!question_text.trim() && !answer.trim()) return;
    const chapter = asString(r.chapter) || undefined;
    const options = parseOptions(r.options);
    out.push({
      id: `${source}~${index}`,
      question_text,
      answer,
      chapter,
      unit: extractUnit(chapter),
      marks: asMarks(r.marks),
      source,
      answer_source: asString(r.answer_source) || undefined,
      ...(options ? { options, correct: parseCorrect(r.correct_option, options.length) } : {}),
    });
  });
  return out;
}

async function fetchPaper(code: string, file: string, signal: AbortSignal): Promise<Question[]> {
  const res = await fetch(`/data/${encodeURIComponent(code)}/${encodeURIComponent(file)}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: unknown = await res.json();
  return normalise(extractRawQuestions(data), file.replace(/\.json$/i, ""));
}

const cache = new Map<string, SubjectData>();

/**
 * Fetch every paper for a subject in parallel. Rejects with an AbortError if
 * `signal` fires. Individual bad files are reported in `failed` instead of
 * failing the whole subject.
 */
export async function loadSubject(
  subject: SubjectInfo,
  signal: AbortSignal,
  force = false
): Promise<SubjectData> {
  if (!force) {
    const hit = cache.get(subject.code);
    if (hit) return hit;
  }

  const results = await Promise.allSettled(
    subject.files.map((file) => fetchPaper(subject.code, file, signal))
  );
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  const questions: Question[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") questions.push(...r.value);
    else failed.push(subject.files[i]);
  });

  const unitSet = new Set(questions.map((q) => q.unit));
  const data: SubjectData = {
    questions,
    papers: Array.from(new Set(questions.map((q) => q.source))).sort(),
    units: Array.from(unitSet).sort((a, b) => unitOrder(a) - unitOrder(b)),
    maxMarks: Math.max(0, ...questions.map((q) => q.marks ?? 0)),
    failed,
    totalFiles: subject.files.length,
  };
  // Only remember fully successful loads so a transient failure heals on revisit.
  if (failed.length === 0) cache.set(subject.code, data);
  return data;
}
