"use client";

import React, { useEffect, useState } from "react";
import katex from "katex";

const SUBJECTS = [
  { code: "PPS", name: "Programming for Problem Solving", title: "21CSS101J: Programming for Problem Solving" },
  { code: "POE", name: "Philosophy of Engineering", title: "21GNH101J: Philosophy of Engineering" },
  { code: "COMMENG", name: "Communicative English", title: "21LEH101T: Communicative English" },
  { code: "FRENCH", name: "French", title: "21LEH103T: French" },
  { code: "ICB", name: "Introduction to Computational Biology", title: "21BTB102T: Introduction to Computational Biology" },
  { code: "CHEMISTRY", name: "Chemistry", title: "18CYB101J: Chemistry" },
  { code: "EEE", name: "Electrical And Electronics Engineering", title: "21EES101T: Electrical And Electronics Engineering" },
  { code: "SPCM", name: "Semiconductor Physics and Computational Methods", title: "21PYB102J: Semiconductor Physics and Computational Methods" },
  { code: "OOPS", name: "Object Oriented Programming", title: "21CSC101T: Object Oriented Design and Programming" },
  { code: "OODP", name: "Object Oriented Design and Programming", title: "21CSC101T: Object Oriented Design and Programming" },
  { code: "ADVANCEDCALC", name: "Advanced Calculus and Complex Analysis", title: "21MAB102T: Advanced Calculus and Complex Analysis" },
  { code: "APP", name: "Advanced Programming Practice", title: "21CSC203P: Advanced Programming Practice" },
];

const SUBJECT_FILES: Record<string, string[]> = {
  POE: [
    "2021-11-01_CT1_QP.json",
    "2022-10-20_CT1_QP.json",
    "2022-11-23_CT2_QP.json",
    "2022-12-23_CT3_QP.json",
    "2023-01_ET_QP.json",
    "2023-02-20_CT1_SetC_B2_QP-Key.json",
    "2023-04-17_CT1_SetD_B2_QP.json",
    "2023-05_ET_QP.json",
    "2023-09-25_CT1_SetA_QP.json",
    "2023-10-13_CT1_QP.json",
    "2023-11-03_CT2_SetD_B2_QP-Key.json",
    "2023-11-25_CT3_QP-Key.json",
    "2023-12_ET_SetA_QP.json",
    "2023-12_ET_SetB_QP.json",
    "2024-01_ET_QP.json",
    "2024-03-28_CT2_SetA_QP-Key.json",
    "2024-03-28_CT2_SetA_QP.json",
    "2024-09-24_CT1_SetA_QP.json",
    "2024-09-27_CT1_SetC_QP.json",
    "2024-11-22_CT2_SetC_B2_QP.json",
    "2024-11-22_CT2_SetD_B2_QP.json",
    "2024-12-11_CT3_SetD_B2_QP.json",
    "2025-01-31_CT1_SetA_QP-Key.json",
    "2025-03-10_CT2_SetB_QP-Key.json",
    "2025-04-23_CT3_SetB_QP-Key.json",
    "2025-05_ET_QP.json",
  ],
  COMMENG: [
    "all_questions.json",
  ],
  PPS: [
    "2019-01_ET_QP.json",
    "2021-01-12_CT2_Key.json",
    "2021-01-12_CT2_QP.json",
    "2021-05-18_CT1_SetB_QP.json",
    "2021-22_CT1_MCQ-Key.json",
    "2021-22_CT3_SetA_QP-Key.json",
    "2021-22_CT3_SetB_QP-Key.json",
    "2021-22_CT3_SetC_QP-Key.json",
    "2022-05_ET_QP.json",
    "2022-10-12_CT1_SetD_QP.json",
    "2022-12_ET_QP.json",
    "2022-23_CT1_QP.json",
    "2022-23_CT1_QP2.json",
    "2022-23_CT1_Set3_QP-Key.json",
    "2022-23_CT1_Set4_QP.json",
    "2022-23_CT1_SetD_QP-Key.json",
    "2022-23_CT2_QP.json",
    "2022-23_CT2_Sample-QP.json",
    "2023-05-09_CT2_SetA_QP.json",
    "2023-07_ET_Sample-QP.json",
    "2023-10_CT1_Set5-6_Key.json",
    "2023-10-05_CT1_Set1_QP.json",
    "2023-11-03_CT2_Set3_Key.json",
    "2023-11-28_CT2_QP-Key.json",
    "2023-24_CT1_Set2_QP.json",
    "2024-04-01_CT2_SetA_B1_QP.json",
    "2024-04-01_CT2_SetC_QP.json",
    "2024-09-30_CT1_Set1_QP.json",
    "2024-12-10_CT2_Set3_QP.json",
    "2025-02-24_CT1_SetB_QP.json",
  ],
  FRENCH: [
    "2022-23_CT1_SetA_QP.json",
    "2022-23_CT2_SetA_QP.json",
    "2022-23_CT3_SetB_QP.json",
    "2023-05_ET_QP.json",
    "2023-09-12_CT1_Set1_QP.json",
    "2023-09-12_CT1_Set2_QP.json",
    "2023-10-16_CT1_Set1_QP.json",
    "2023-12_ET_QP.json",
    "2023-XX-XX_CT2_Set2_QP.json",
    "2024-05_ET_QP.json",
    "2024-07_ET_QP.json",
    "2025-05_ET_QP.json",
  ],
  ICB: [
    "2022-10-21_CT1_SetR_QP.json",
    "2023-01_ET_QP.json",
    "2023-05_ET_QP.json",
    "2023-06_ET_QP.json",
    "2023-07_ET_QP_2.json",
    "2023-07_ET_QP.json",
    "2023-11-29_CT3_SetA_QP.json",
    "2023-12_ET_QP.json",
    "2024-01_ET_QP.json",
    "2024-05_ET_QP.json",
    "2024-07_ET_QP.json",
    "2024-10-01_CT1_SetB_QP.json",
    "2024-10-04_CT1_SetB_QP.json",
    "2024-10-18_CT1_SetB_QP.json",
    "2024-11_ET_QP.json",
    "2024-12_ET_QP.json",
    "2024-12-04_CT2_SetA_QP.json",
    "2024-12-04_CT2_SetB_QP.json",
    "2024-25_CT1_QP.json",
  ],
  CHEMISTRY: [
    "2019_Nov_ET.json",
    "2022_July_ET.json",
    "2023_Dec_ET.json",
    "2023_Jan_ET.json",
    "2023_May_ET.json",
    "2024_Dec_ET.json",
    "2024_Jan_ET.json",
    "2025_May_ET.json",
  ],
  EEE: [
    "all_questions.json",
  ],
  OOPS: [
    "2019_Nov.json",
    "2022_May.json",
    "2023_December.json",
    "2023_July.json",
    "2023_May.json",
    "2024_May.json",
    "2025_July.json",
  ],
  OODP: [
    "all_questions.json",
  ],
  ADVANCEDCALC: [
    "all_questions.json",
  ],
  SPCM: [
    "all_questions.json",
  ],
  APP: [
    "2022 CLAT 1 Set A.json",
    "2023 CLAT 2 Set A.json",
    "2023 CLAT 2 Set C.json",
    "2024 Quiz 2 Set B.json",
    "2024 Quiz 2-3 Set C.json",
    "2024 Quiz 2-3 Set D.json",
    "2025 Assessment 2 Set E.json",
    "2025 Assessment 2 Set F.json",
    "CLAT 1 Set D.json",
  ],
};

const SUBJECT_DIRS: Record<string, string> = {
  POE: "POE",
  PPS: "PPS",
  COMMENG: "CommunicativeEnglish",
  FRENCH: "French",
  ICB: "ICB",
  CHEMISTRY: "Chemistry",
  EEE: "ElectricalAndElectronicsEngineering",
  OOPS: "OOPS",
  OODP: "OODP",
  ADVANCEDCALC: "AdvancedCalculus",
  SPCM: "SemiconductorPhysicsAndComputationalMethods",
  APP: "APP",
};

interface Question {
  question_text: string;
  answer: string;
  chapter?: string;
  marks?: number;
  source?: string;
  answer_source?: string;
}

interface PaperData {
  questions: Question[];
  source?: string;
  paper_title?: string;
  single?: boolean;
  paper_source_key?: string;
}

function extractUnit(chapter?: string) {
  if (!chapter) return "Other";
  const match = chapter.match(/Unit\s*([1-5])/i);
  if (match) return `Unit ${parseInt(match[1])}`;
  return "Other";
}

function renderLatex(text: string): string {
  // Render display math $$...$$ first, then inline $...$
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return `<span>$$${tex}$$</span>`;
      }
    })
    .replace(/\$([^$\n]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span>$${tex}$</span>`;
      }
    });
}

function markdownToHtml(md?: string) {
  if (!md) return "";
  const html = md
    .replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n/g, "<br>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return renderLatex(html);
}

const PyqSection: React.FC = () => {
  const [subject, setSubject] = useState("APP");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [papers, setPapers] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [filterPapers, setFilterPapers] = useState<Set<string>>(new Set());
  const [filterUnits, setFilterUnits] = useState<Set<string>>(new Set());
  const [paperDropdownOpen, setPaperDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [filterMinMarks, setFilterMinMarks] = useState(0);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    const subjectInfo = SUBJECTS.find((s) => s.code === subject);
    const katexCssUrl = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

    // Build sorted units from filteredQuestions
    const pUnitMap: Record<string, Question[]> = {};
    for (const q of filteredQuestions) {
      const unitKey = extractUnit(q.chapter);
      if (!pUnitMap[unitKey]) pUnitMap[unitKey] = [];
      pUnitMap[unitKey].push(q);
    }
    const pSortedUnits = Object.keys(pUnitMap).sort((a, b) => {
      const an = parseInt(a.replace(/\D/g, "")) || 99;
      const bn = parseInt(b.replace(/\D/g, "")) || 99;
      return an - bn;
    });

    let qNum = 1;
    let body = "";
    for (const unit of pSortedUnits) {
      body += `<h2 class="unit-heading">${unit}</h2>`;
      for (const q of pUnitMap[unit]) {
        body += `
          <div class="question">
            <div class="q-header">Q${qNum++} <span class="marks">(${q.marks || ""} mark${q.marks === 1 ? "" : "s"})</span></div>
            <div class="q-text">${markdownToHtml(q.question_text)}</div>
            <div class="answer"><strong>Answer:</strong> ${markdownToHtml(q.answer)}</div>
            <div class="source">Source: ${q.source || ""}</div>
          </div>`;
      }
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subjectInfo?.title ?? "PYQs"}</title>
  <link rel="stylesheet" href="${katexCssUrl}">
  <style>
    body { font-family: Georgia, serif; margin: 20mm; color: #000; font-size: 11pt; }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 4px; }
    h2.subtitle { text-align: center; font-size: 12pt; font-weight: normal; margin-bottom: 20px; }
    h2.unit-heading { font-size: 14pt; border-bottom: 1px solid #333; margin-top: 24px; padding-bottom: 4px; }
    .question { margin-bottom: 20px; page-break-inside: avoid; }
    .q-header { font-weight: bold; font-size: 12pt; }
    .marks { font-weight: normal; font-size: 10pt; }
    .q-text { margin: 4px 0 6px 0; }
    .answer { background: #f0f7f0; border-left: 3px solid #4a8; padding: 6px 10px; margin-top: 6px; font-size: 10pt; }
    .source { font-size: 9pt; color: #555; margin-top: 4px; }
    @media print { body { margin: 15mm; } }
  </style>
</head>
<body>
  <h1>${subjectInfo?.name ?? "Questions"}</h1>
  <h2 class="subtitle">${subjectInfo?.title ?? ""}</h2>
  ${body}
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const fileList = SUBJECT_FILES[subject] || [];
      let allQuestions: Question[] = [];
      const allPapersSet = new Set<string>();
      const allUnitsSet = new Set<string>();
      const dir = SUBJECT_DIRS[subject] || subject;
      for (const file of fileList) {
        try {
          const res = await fetch(`/data/${dir}/${file}`);
          if (!res.ok) continue;
          const data: PaperData | Question[] = await res.json();
          let qs: Question[] = [];
          if (Array.isArray(data)) {
            qs = data;
          } else if (data.questions) {
            qs = data.questions;
          }

          // Handle single=true case where all papers are in one file
          if (!Array.isArray(data) && data.single === true) {
            const sourceKey = data.paper_source_key || "paper_title";
            for (const q of qs) {
              const source = (q as unknown as Record<string, unknown>)[sourceKey] as string || file;
              q.source = source;
              allPapersSet.add(source);
              const unit = extractUnit(q.chapter);
              if (unit) allUnitsSet.add(unit);
            }
          } else {
            // Original behavior: use file name or data.source
            for (const q of qs) {
              const source = Array.isArray(data) ? file : data.source || data.paper_title || file;
              q.source = source;
              allPapersSet.add(source);
              const unit = extractUnit(q.chapter);
              if (unit) allUnitsSet.add(unit);
            }
          }
          allQuestions = allQuestions.concat(qs);
        } catch {
          /* skip bad file */
        }
      }
      const allowedUnits = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Other"];
      const allUnits = allowedUnits.filter((u) => allUnitsSet.has(u));
      setQuestions(allQuestions);
      setPapers(Array.from(allPapersSet).sort());
      setUnits(allUnits);
      setLoading(false);
    }
    load();
  }, [subject]);

  const filteredQuestions = questions.filter((q) => {
    const paperMatch = filterPapers.size === 0 || filterPapers.has(q.source || "");
    const unitMatch = filterUnits.size === 0 || filterUnits.has(extractUnit(q.chapter));
    const marksMatch = (q.marks || 0) >= filterMinMarks;
    return paperMatch && unitMatch && marksMatch;
  });

  const unitMap: Record<string, Question[]> = {};
  for (const q of filteredQuestions) {
    const unitKey = extractUnit(q.chapter);
    if (!unitMap[unitKey]) unitMap[unitKey] = [];
    unitMap[unitKey].push(q);
  }

  Object.keys(unitMap).forEach((unit) => {
    unitMap[unit].sort((a, b) => (a.marks || 0) - (b.marks || 0));
  });

  const sortedUnits = Object.keys(unitMap).sort((a, b) => {
    const anum = parseInt((a || "").replace(/\D/g, "")) || 99;
    const bnum = parseInt((b || "").replace(/\D/g, "")) || 99;
    return anum - bnum;
  });

  let globalNum = 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">SRM PYQs</h1>
      <h2 className="text-center text-lg font-normal mb-8 text-gray-700 dark:text-gray-300">
        {SUBJECTS.find((s) => s.code === subject)?.title}
      </h2>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="subjectSelect" className="font-semibold text-gray-800 dark:text-gray-200">
            Subject:
          </label>
          <select
            id="subjectSelect"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setFilterPapers(new Set());
              setFilterUnits(new Set());
              setFilterMinMarks(0);
              setPaperDropdownOpen(false);
              setUnitDropdownOpen(false);
            }}
            className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUBJECTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(paperDropdownOpen || unitDropdownOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setPaperDropdownOpen(false); setUnitDropdownOpen(false); }}
        />
      )}
      <div className="flex flex-wrap gap-4 items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-800 dark:text-gray-200">Q Paper:</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setPaperDropdownOpen((v) => !v); setUnitDropdownOpen(false); }}
              className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {filterPapers.size === 0 ? "All" : `${filterPapers.size} selected`} ▾
            </button>
            {paperDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded shadow-lg max-h-60 overflow-y-auto min-w-[200px]">
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600 border-b border-gray-200 dark:border-neutral-500">
                  <input
                    type="checkbox"
                    checked={filterPapers.size === 0}
                    onChange={() => setFilterPapers(new Set())}
                  />
                  <span className="font-medium text-sm">All</span>
                </label>
                {papers.map((p) => (
                  <label key={p} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600">
                    <input
                      type="checkbox"
                      checked={filterPapers.has(p)}
                      onChange={() => {
                        setFilterPapers((prev) => {
                          const next = new Set(prev);
                          if (next.has(p)) next.delete(p); else next.add(p);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold text-gray-800 dark:text-gray-200">Unit:</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => { setUnitDropdownOpen((v) => !v); setPaperDropdownOpen(false); }}
              className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {filterUnits.size === 0 ? "All" : `${filterUnits.size} selected`} ▾
            </button>
            {unitDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded shadow-lg max-h-60 overflow-y-auto min-w-[160px]">
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600 border-b border-gray-200 dark:border-neutral-500">
                  <input
                    type="checkbox"
                    checked={filterUnits.size === 0}
                    onChange={() => setFilterUnits(new Set())}
                  />
                  <span className="font-medium text-sm">All</span>
                </label>
                {units.map((u) => (
                  <label key={u} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600">
                    <input
                      type="checkbox"
                      checked={filterUnits.has(u)}
                      onChange={() => {
                        setFilterUnits((prev) => {
                          const next = new Set(prev);
                          if (next.has(u)) next.delete(u); else next.add(u);
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm">{u}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          className={`rounded px-4 py-2 font-medium border transition-colors duration-200 ${showAllAnswers
            ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-black dark:border-gray-100"
            : "bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            }`}
          onClick={() => setShowAllAnswers((v) => !v)}
        >
          {showAllAnswers ? "Hide All Answers" : "Show All Answers"}
        </button>
        <button
          type="button"
          className="rounded px-4 py-2 font-medium border border-blue-400 bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors duration-200"
          onClick={handlePrint}
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      <div className="flex flex-col items-center mb-6">
        <label htmlFor="markFilter" className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Minimum Marks: {filterMinMarks}
        </label>
        <div className="flex items-center gap-4 w-full max-w-md">
          <span className="text-sm text-gray-600 dark:text-gray-400">0</span>
          <input
            id="markFilter"
            type="range"
            min={0}
            max={20}
            value={filterMinMarks}
            onChange={(e) => setFilterMinMarks(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">20</span>
        </div>
      </div>

      <div id="content">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">No questions found for selected filters.</div>
        ) : (
          sortedUnits.map((unit) => {
            const qs = unitMap[unit];
            return (
              <div key={unit} className="mb-10 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 border-b border-gray-200 dark:border-neutral-700 pb-2 mb-6">
                  {unit}
                </h2>
                {qs.map((q) => {
                  const answerId = `answer-${Math.random().toString(36).slice(2, 11)}`;
                  return (
                    <div key={globalNum} className="mb-8">
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        Q{globalNum++}{" "}
                        <span className="font-normal text-base">
                          ({q.marks || ""} mark{q.marks === 1 ? "" : "s"})
                        </span>
                      </div>
                      <div
                        className="mt-1 text-gray-800 dark:text-gray-200"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(q.question_text) }}
                      />
                      {!showAllAnswers && (
                        <button
                          type="button"
                          className="mt-3 mb-1 px-3 py-1 rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                          onClick={() => {
                            const el = document.getElementById(answerId);
                            if (el) el.classList.toggle("hidden");
                          }}
                        >
                          Show Answer
                        </button>
                      )}
                      <div
                        className={`${showAllAnswers ? "" : "hidden"} answer mt-2 bg-green-50 dark:bg-green-900/30 p-4 rounded text-gray-900 dark:text-green-100`}
                        id={answerId}
                      >
                        <strong>Answer:</strong>{" "}
                        <span dangerouslySetInnerHTML={{ __html: markdownToHtml(q.answer) }} />
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Source: {q.source || q.answer_source || ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PyqSection;
