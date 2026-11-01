"use client";

import React, { memo, useId, useMemo, useState } from "react";
import { markdownToHtml } from "@/lib/pyq/render";
import { OPTION_LETTERS, type Question } from "@/lib/pyq/loader";
import { useFlag } from "./hooks";

const RICH =
  "break-words [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1";

export function questionDomId(id: string) {
  return `q-${encodeURIComponent(id)}`;
}

export function questionShareUrl(subjectCode: string, id: string) {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#pyq/${encodeURIComponent(subjectCode)}/${encodeURIComponent(id)}`;
}

interface Props {
  question: Question;
  number: number;
  subjectCode: string;
  starred: boolean;
  showAllAnswers: boolean;
  highlighted: boolean;
  onToggleStar: (bookmarkKey: string) => void;
}

function QuestionCardImpl({
  question: q,
  number,
  subjectCode,
  starred,
  showAllAnswers,
  highlighted,
  onToggleStar,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, flashCopied] = useFlag();
  const [copyFailed, flashFailed] = useFlag();
  const answerId = useId();

  const answerVisible = showAllAnswers || open;
  const options = q.options;
  const correct = q.correct ?? [];
  const questionHtml = useMemo(() => markdownToHtml(q.question_text), [q.question_text]);
  // Option texts are only rendered (KaTeX/Prism) once, whatever the selection state.
  const optionsHtml = useMemo(() => (options ? options.map((o) => markdownToHtml(o)) : []), [options]);
  // Only render (KaTeX/Prism) answers that are actually on screen.
  const answerHtml = useMemo(
    () => (answerVisible ? markdownToHtml(q.answer) : ""),
    [answerVisible, q.answer]
  );

  function pickOption(i: number) {
    setSelected(i);
    setOpen(true);
  }

  function toggleAnswer() {
    if (open) setSelected(null);
    setOpen((v) => !v);
  }

  const marks = q.marks;
  const marksLabel = marks === undefined ? null : `${marks} mark${marks === 1 ? "" : "s"}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(questionShareUrl(subjectCode, q.id));
      flashCopied();
    } catch {
      flashFailed();
    }
  }

  const iconBtn =
    "p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors";

  return (
    <article
      id={questionDomId(q.id)}
      aria-label={`Question ${number}`}
      className={`mb-8 scroll-mt-24 rounded-lg transition-shadow duration-500 ${
        highlighted ? "ring-2 ring-amber-500 ring-offset-8 ring-offset-white dark:ring-offset-neutral-800" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Q{number}
          {options && (
            <span className="ml-2 align-middle rounded-full border border-blue-300 dark:border-blue-500/60 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-200">
              MCQ
            </span>
          )}
          {marksLabel && (
            <span className="font-normal text-base text-gray-700 dark:text-gray-300"> ({marksLabel})</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 -mt-1 flex-shrink-0">
          <button
            type="button"
            className={iconBtn}
            onClick={copyLink}
            aria-label={`Copy link to question ${number}`}
            title="Copy link to this question"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            type="button"
            className={`${iconBtn} ${starred ? "!text-amber-500 dark:!text-amber-400" : ""}`}
            onClick={() => onToggleStar(`${subjectCode}|${q.id}`)}
            aria-pressed={starred}
            aria-label={`${starred ? "Remove bookmark from" : "Bookmark"} question ${number}`}
            title={starred ? "Remove bookmark" : "Bookmark this question"}
          >
            <svg aria-hidden="true" className="w-5 h-5" fill={starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {copied ? "Link copied" : copyFailed ? "Could not copy link" : ""}
      </span>
      {(copied || copyFailed) && (
        <div aria-hidden="true" className="text-xs text-right text-gray-600 dark:text-gray-300 -mt-1">
          {copied ? "Link copied!" : "Copy failed"}
        </div>
      )}

      <div className={`mt-1 text-gray-800 dark:text-gray-200 ${RICH}`} dangerouslySetInnerHTML={{ __html: questionHtml }} />

      {options && (
        <ol aria-label="Answer options" className="mt-3 space-y-2 list-none p-0">
          {options.map((_, i) => {
            const isCorrect = correct.includes(i);
            const isPicked = selected === i;
            const reveal = answerVisible && correct.length > 0;
            const tone =
              reveal && isCorrect
                ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-950 dark:text-green-100"
                : reveal && isPicked
                  ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-950 dark:text-red-100"
                  : isPicked
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100"
                    : "border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700";
            const badge =
              reveal && isCorrect
                ? "bg-green-600 text-white border-green-600"
                : reveal && isPicked
                  ? "bg-red-600 text-white border-red-600"
                  : isPicked
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-neutral-500";
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={isPicked}
                  onClick={() => pickOption(i)}
                  className={`w-full flex items-start gap-3 text-left rounded-lg border px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tone}`}
                >
                  <span aria-hidden="true" className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full border text-sm font-bold flex items-center justify-center ${badge}`}>
                    {reveal && isCorrect ? "✓" : reveal && isPicked ? "✗" : OPTION_LETTERS[i]}
                  </span>
                  <span className="sr-only">Option {OPTION_LETTERS[i]}: </span>
                  <span
                    className={`min-w-0 flex-1 [&_p]:m-0 [&_p]:inline ${RICH}`}
                    dangerouslySetInnerHTML={{ __html: optionsHtml[i] }}
                  />
                  {reveal && isCorrect && <span className="sr-only"> (correct answer)</span>}
                  {reveal && isPicked && !isCorrect && <span className="sr-only"> (your choice, incorrect)</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {!showAllAnswers && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          className="mt-3 mb-1 px-3 py-1 rounded border border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          onClick={toggleAnswer}
        >
          {open ? "Hide Answer" : "Show Answer"}
        </button>
      )}
      <div id={answerId}>
        {answerVisible && (
          <div className="answer mt-2 bg-green-50 dark:bg-green-900/30 p-4 rounded text-gray-900 dark:text-green-100">
            <strong>Answer:</strong>{" "}
            {options && correct.length > 0 && (
              <span className="font-semibold">
                {correct.map((i) => `${OPTION_LETTERS[i]}`).join(", ")}
                {correct.length === 1 ? (
                  <>
                    {". "}
                    <span className={`font-semibold [&_p]:m-0 [&_p]:inline ${RICH}`} dangerouslySetInnerHTML={{ __html: optionsHtml[correct[0]] }} />
                  </>
                ) : null}
              </span>
            )}
            {answerHtml ? (
              <div className={`${options && correct.length > 0 ? "mt-2" : "inline"} ${RICH}`} dangerouslySetInnerHTML={{ __html: answerHtml }} />
            ) : !(options && correct.length > 0) ? (
              <em className="text-gray-600 dark:text-gray-300">No answer available.</em>
            ) : null}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Source: {q.source || q.answer_source || ""}</div>
    </article>
  );
}

export const QuestionCard = memo(QuestionCardImpl);
