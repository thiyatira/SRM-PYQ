"use client";
import React, { useEffect, useState } from "react";

const SUBJECTS = [
  { code: "PPS", name: "PPS (Programming for Problem Solving)", title: "21CSS101J: Programming for Problem Solving" },
  { code: "POE", name: "POE (Philosophy of Engineering)", title: "21GNH101J: Philosophy of Engineering" },
];

const SUBJECT_FILES: Record<string, string[]> = {
  "POE": [
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
    "2025-05_ET_QP.json"
  ],
  "PPS": [
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
    // "2022-23_CT2_Set3_QP-Key.json",
    // "2022-23_CT2_Set7_QP-Key.json",
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
    "2025-02-24_CT1_SetB_QP.json"
  ]
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
}

function extractUnit(chapter?: string) {
  if (!chapter) return "Other";
  const match = chapter.match(/Unit\s*([1-5])/i);
  if (match) return `Unit ${parseInt(match[1])}`;
  return "Other";
}

function markdownToHtml(md?: string) {
  if (!md) return "";
  const html = md
    .replace(/```([\s\S]*?)```/g, (m, code) => `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n/g, '<br>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return html;
}

const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "1" || (!localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return true;
  });
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "1");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "0");
    }
  }, [dark]);
  return [dark, setDark] as const;
};

const Home: React.FC = () => {
  const [subject, setSubject] = useState("PPS");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [papers, setPapers] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [filterPaper, setFilterPaper] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterMinMarks, setFilterMinMarks] = useState(0);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useDarkMode();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const fileList = SUBJECT_FILES[subject] || [];
      let allQuestions: Question[] = [];
      const allPapersSet = new Set<string>();
      const allUnitsSet = new Set<string>();
      for (const file of fileList) {
        try {
          const res = await fetch(`/data/${subject}/${file}`);
          if (!res.ok) continue;
          const data: PaperData | Question[] = await res.json();
          let qs: Question[] = [];
          if (Array.isArray(data)) {
            qs = data;
          } else if (data.questions) {
            qs = data.questions;
          }
          for (const q of qs) {
            const source = Array.isArray(data) ? file : (data.source || data.paper_title || file);
            q.source = source;
            allPapersSet.add(source);
            const unit = extractUnit(q.chapter);
            if (unit) allUnitsSet.add(unit);
          }
          allQuestions = allQuestions.concat(qs);
        } catch { }
      }
      const allowedUnits = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Other"];
      const allUnits = allowedUnits.filter(u => allUnitsSet.has(u));
      setQuestions(allQuestions);
      setPapers(Array.from(allPapersSet).sort());
      setUnits(allUnits);
      setLoading(false);
    }
    load();
  }, [subject]);

  const filteredQuestions = questions.filter(q => {
    const paperMatch = !filterPaper || filterPaper === 'all' || (q.source && q.source === filterPaper);
    const unitMatch = !filterUnit || filterUnit === 'all' || (extractUnit(q.chapter) === filterUnit);
    const marksMatch = (q.marks || 0) >= filterMinMarks;
    return paperMatch && unitMatch && marksMatch;
  });

  const unitMap: Record<string, Question[]> = {};
  for (const q of filteredQuestions) {
    const unitKey = extractUnit(q.chapter);
    if (!unitMap[unitKey]) unitMap[unitKey] = [];
    unitMap[unitKey].push(q);
  }

  // Sort questions within each unit by marks
  Object.keys(unitMap).forEach(unit => {
    unitMap[unit].sort((a, b) => {
      const marksA = a.marks || 0;
      const marksB = b.marks || 0;
      return marksA - marksB;
    });
  });

  const sortedUnits = Object.keys(unitMap).sort((a, b) => {
    const anum = parseInt((a || "").replace(/\D/g, '')) || 99;
    const bnum = parseInt((b || "").replace(/\D/g, '')) || 99;
    return anum - bnum;
  });

  let globalNum = 1;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">SRM PYQs</h1>
        <h2 className="text-center text-lg font-normal mb-8 text-gray-700 dark:text-gray-300">{SUBJECTS.find(s => s.code === subject)?.title}</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label htmlFor="subjectSelect" className="font-semibold text-gray-800 dark:text-gray-200">Subject:</label>
            <select id="subjectSelect" value={subject} onChange={e => { setSubject(e.target.value); setFilterPaper('all'); setFilterUnit('all'); setFilterMinMarks(0); }} className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SUBJECTS.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            className={`rounded px-4 py-2 font-medium border transition-colors duration-200 ${dark ? 'bg-blue-400 text-black border-blue-400 hover:bg-blue-300' : 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200'}`}
            onClick={() => setDark(d => !d)}
          >
            {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <label htmlFor="paperFilter" className="font-semibold text-gray-800 dark:text-gray-200">Q Paper:</label>
            <select id="paperFilter" value={filterPaper} onChange={e => { setFilterPaper(e.target.value); setFilterUnit('all'); }} className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All</option>
              {papers.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="chapterFilter" className="font-semibold text-gray-800 dark:text-gray-200">Unit:</label>
            <select id="chapterFilter" value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-white px-3 py-1 border border-gray-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button
            className={`rounded px-4 py-2 font-medium border transition-colors duration-200 ${showAllAnswers ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-black dark:border-gray-100' : 'bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700'}`}
            onClick={() => setShowAllAnswers(v => !v)}
          >
            {showAllAnswers ? "Hide All Answers" : "Show All Answers"}
          </button>
        </div>

        {/* Mark Filter Slider */}
        <div className="flex flex-col items-center mb-6">
          <label htmlFor="markFilter" className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Minimum Marks: {filterMinMarks}
          </label>
          <div className="flex items-center gap-4 w-full max-w-md">
            <span className="text-sm text-gray-600 dark:text-gray-400">0</span>
            <input
              id="markFilter"
              type="range"
              min="0"
              max="20"
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
            sortedUnits.map(unit => {
              const questions = unitMap[unit];
              return (
                <div key={unit} className="mb-10 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 border-b border-gray-200 dark:border-neutral-700 pb-2 mb-6">{unit}</h2>
                  {questions.map(q => {
                    const answerId = `answer-${Math.random().toString(36).substr(2, 9)}`;
                    return (
                      <div key={globalNum} className="mb-8">
                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">Q{globalNum++} <span className="font-normal text-base">({q.marks || ''} mark{q.marks == 1 ? '' : 's'})</span></div>
                        <div className="mt-1 text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: markdownToHtml(q.question_text) }} />
                        {!showAllAnswers && (
                          <button
                            className="mt-3 mb-1 px-3 py-1 rounded border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                            onClick={() => {
                              const el = document.getElementById(answerId);
                              if (el) el.classList.toggle('hidden');
                            }}
                          >Show Answer</button>
                        )}
                        <div className={`${showAllAnswers ? '' : 'hidden'} answer mt-2 bg-green-50 dark:bg-green-900/30 p-4 rounded text-gray-900 dark:text-green-100`} id={answerId}>
                          <strong>Answer:</strong> <span dangerouslySetInnerHTML={{ __html: markdownToHtml(q.answer) }} />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Source: {q.source || q.answer_source || ''}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
