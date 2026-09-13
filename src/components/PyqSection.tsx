"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import katex from "katex";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA — Semester → Subjects → Files
   ═══════════════════════════════════════════════════════════════════════════ */

interface SubjectInfo {
  code: string;       // folder name = subject code, e.g. "21CSS101J"
  name: string;       // human-readable
  title: string;      // "code: name" display string
  files: string[];
}

interface SemesterInfo {
  id: number;
  name: string;
  subjects: SubjectInfo[];
}

const SEMESTERS: SemesterInfo[] = [
  {
    id: 1,
    name: "Semester I",
    subjects: [
      {
        code: "21CSS101J",
        name: "Programming for Problem Solving",
        title: "21CSS101J: Programming for Problem Solving",
        files: [
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
      },
      {
        code: "21GNH101J",
        name: "Philosophy of Engineering",
        title: "21GNH101J: Philosophy of Engineering",
        files: [
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
      },
      {
        code: "21LEH103T",
        name: "French",
        title: "21LEH103T: French",
        files: [
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
      },
      {
        code: "21BTB102T",
        name: "Introduction to Computational Biology",
        title: "21BTB102T: Introduction to Computational Biology",
        files: [
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
      },
      {
        code: "21CYB101J",
        name: "Chemistry",
        title: "21CYB101J: Chemistry",
        files: [
          "2019_Nov_ET.json",
          "2022_July_ET.json",
          "2023_Dec_ET.json",
          "2023_Jan_ET.json",
          "2023_May_ET.json",
          "2024_Dec_ET.json",
          "2024_Jan_ET.json",
          "2025_May_ET.json",
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Semester II",
    subjects: [
      {
        code: "21LEH101T",
        name: "Communicative English",
        title: "21LEH101T: Communicative English",
        files: [
          "2019_May_English_18LEH101J.json",
          "2019_Nov_English_18LEH101J.json",
          "2023_Dec_English_21LEH101T.json",
          "2023_Jan_English_21LEH101T.json",
          "2023_July_English_21LEH101T.json",
          "2023_May_English_21LEH101T.json",
          "2024_Dec_English_21LEH101T.json",
          "2024_Jan_English_21LEH101T.json",
          "2024_May_English_21LEH101T.json",
          "2024_Nov_English_21LEH101T.json",
          "2025_Dec_English_21LEH101T.json",
          "2025_July_English_21LEH101T.json",
          "2025_Nov_English_21LEH101T.json",
        ],
      },
      {
        code: "21MAB102T",
        name: "Advanced Calculus and Complex Analysis",
        title: "21MAB102T: Advanced Calculus and Complex Analysis",
        files: [
          "2019_May_ET.json",
          "2019_Nov_ET.json",
          "2022_May_ET.json",
          "2023_July_ET.json",
          "2023_May_ET.json",
          "2023_Nov_ET.json",
          "2024_May_ET.json",
          "2024_Nov_ET.json",
          "2025_Dec_ET.json",
          "2025_July_ET_Set1.json",
          "2025_July_ET_Set2.json",
          "2025_May_ET.json",
        ],
      },
      {
        code: "21PYB102J",
        name: "Semiconductor Physics and Computational Methods",
        title: "21PYB102J: Semiconductor Physics and Computational Methods",
        files: [
          "DECEMBER_2023_21PYB102J.json",
          "DEC_2024_21PYB102J.json",
          "DEC_2025_21PYB102J.json",
          "JANUARY_2023_21PYB102J.json",
          "JANUARY_2024_21PYB102J.json",
          "JAN_2023_21PYB102J.json",
          "JULY_2023_21PYB102J.json",
          "JULY_2024_21PYB102J.json",
          "JULY_2025_21PYB102J.json",
          "MAY_2019_18PYB103J.json",
          "MAY_2023_21PYB102J.json",
          "MAY_2024_21PYB102J.json",
          "NOV_2018_18PYB103J.json",
          "NOV_2024_21PYB102J.json",
          "NOV_2025_21PYB102J.json",
        ],
      },
      {
        code: "21EES101T",
        name: "Electrical and Electronics Engineering",
        title: "21EES101T: Electrical and Electronics Engineering",
        files: [
          "18EES101J_May_2019.json",
          "18EES101J_Nov_2019.json",
          "21EES101T_Dec_2023_V1.json",
          "21EES101T_Dec_2023_V2.json",
          "21EES101T_Dec_2024.json",
          "21EES101T_Dec_2025.json",
          "21EES101T_Jan_2023.json",
          "21EES101T_Jan_2024.json",
          "21EES101T_Jul_2023.json",
          "21EES101T_Jul_2025.json",
          "21EES101T_July_2022.json",
          "21EES101T_May_2023.json",
          "21EES101T_May_2024.json",
          "21EES101T_Nov_2024.json",
        ],
      },
      {
        code: "21CSC101T",
        name: "Object Oriented Design and Programming",
        title: "21CSC101T: Object Oriented Design and Programming",
        files: [
          "2019_Nov.json",
          "2022_May.json",
          "2023_December.json",
          "2023_July.json",
          "2023_May.json",
          "2024_May.json",
          "2025_July.json",
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Semester III",
    subjects: [
      {
        code: "21CSS201T",
        name: "Computer Organization and Architecture",
        title: "21CSS201T: Computer Organization and Architecture",
        files: [
          "CT-1_Set-A_2023-08-18.json",
          "CT-1_Set-B_2023-08-18.json",
          "CT-1_Set-B_2024-25.json",
          "CT-1_Set-C_2023-08-18.json",
          "CT-1_Set-C_2024-25.json",
          "CT-1_Set-C_2025-08-11.json",
          "CT-1_Set-D_2023-08-18.json",
          "CT-2_Set-A_2023-10-09.json",
          "CT-2_Set-B_2023-10-09.json",
          "CT-2_Set-C_2023-10-09.json",
          "CT-2_Set-D_2023-10-09.json",
          "CT-3_Set-A_2023-11-08.json",
          "CT-3_Set-B_2023-11-08.json",
          "CT-3_Set-C_2023-11-08.json",
          "CT-3_Set-D_2023-11-08.json",
          "CT-3_Set-NA_2024-25.json",
          "FT-2_Set-A_2025-09-15.json",
          "FT-2_Set-B_2025-09-15.json",
          "FT-2_Set-D_2025-09-15.json",
          "OBA_Set-A_2024-10-04.json",
        ],
      },
      {
        code: "21CSC201J",
        name: "Data Structures and Algorithms",
        title: "21CSC201J: Data Structures and Algorithms",
        files: [
          "2019-05_ET_QP.json",
          "2019-11_ET_QP.json",
          "2022-12_ET_QP.json",
          "2023-05_ET_QP.json",
          "2023-07_ET_QP.json",
          "2023-09-04_CT1_SetC_QP-Key.json",
          "2023-09-04_CT1_SetD_QP-Key.json",
          "2023-12_ET_QP.json",
          "2023-24_CT1_SetB_QP-Key.json",
          "2024-05_ET_QP.json",
          "2024-07_ET_QP.json",
          "2024-08-27_CT1_SetA_QP-Key.json",
          "2024-08-27_CT1_SetC_QP-Key.json",
          "2024-08-27_CT1_SetD_QP-Key.json",
          "2024-11_ET_QP.json",
          "2024-25_CT3_SetC-SetD_B2_QP.json",
          "2025-06_ET_QP.json",
          "2025-07_ET_QP.json",
          "2025-08-12_CT1_QP-Key.json",
          "2025-08-12_CT1_SetA_QP-Key.json",
          "2025-09-26_CT2_SetA_QP-Key.json",
          "2025-09-26_CT2_SetB_QP-Key.json",
          "2025-09-26_CT2_SetC_QP-Key.json",
          "2025-09-26_CT2_SetD_Batch2_QP-Key.json",
        ],
      },
      {
        code: "21CSC203P",
        name: "Advanced Programming Practice",
        title: "21CSC203P: Advanced Programming Practice",
        files: [
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
      },
      {
        code: "21CSC202J",
        name: "Operating Systems",
        title: "21CSC202J: Operating Systems",
        files: [],
      },
    ],
  },
  {
    id: 4,
    name: "Semester IV",
    subjects: [
      {
        code: "21MAB204T",
        name: "Probability and Queueing Theory",
        title: "21MAB204T: Probability and Queueing Theory",
        files: [],
      },
      {
        code: "21CSC204J",
        name: "Design and Analysis of Algorithms",
        title: "21CSC204J: Design and Analysis of Algorithms",
        files: [],
      },
      {
        code: "21CSC205P",
        name: "Database Management Systems",
        title: "21CSC205P: Database Management Systems",
        files: [],
      },
      {
        code: "21CSC206T",
        name: "Artificial Intelligence",
        title: "21CSC206T: Artificial Intelligence",
        files: [],
      },
    ],
  },
];

// Flat list of all subjects for search
const ALL_SUBJECTS = SEMESTERS.flatMap((sem) =>
  sem.subjects.map((sub) => ({ ...sub, semester: sem }))
);

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS — rendering, code detection, etc. (preserved from original)
   ═══════════════════════════════════════════════════════════════════════════ */

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

function detectCodeLanguage(code: string): string {
  if (
    /System\.out\.|public\s+class\b|String\[\]\s+args|extends\s+\w+|implements\s+\w+|JFrame|JButton|Frame\b/.test(
      code
    )
  ) {
    return "java";
  }
  if (/cout\s*<<|cin\s*>>|std::|#include\s*<iostream>/.test(code)) {
    return "cpp";
  }
  if (/#include\b|printf\s*\(|scanf\s*\(|malloc\s*\(|strlen\s*\(|strcpy\s*\(/.test(code)) {
    return "c";
  }
  if (
    /(?:def\s+\w+\s*\(|import\s+(?:numpy|pandas|math|sys|os)|print\s*\()/.test(code) &&
    !code.includes(";")
  ) {
    return "python";
  }
  if (/\b(?:SELECT|CREATE\s+TABLE|INSERT\s+INTO|DROP\s+TABLE)\b/i.test(code)) {
    return "sql";
  }
  if (code.includes(";") && (code.includes("{") || /int\s+|double\s+/.test(code))) {
    if (code.includes("boolean") || code.includes("String")) {
      return "java";
    }
    return "c";
  }
  return "text";
}

const STRONG_CODE_STARTERS = [
  /^\s*#(?:include|define)\b/,
  /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+|abstract\s+)?(?:class|interface|enum)\s+\w+/,
  /^\s*import\s+[\w.*]+;/,
  /^\s*(?:import\s+(?:numpy|pandas|math|sys|os|re|random)\b|from\s+\w+\s+import\b)/,
  /^\s*def\s+\w+\s*\(/,
  /^\s*(?:public\s+)?(?:static\s+)?(?:void|int)\s+main\s*\(/,
  /^\s*System\.out\./,
  /^\s*(?:printf|scanf)\s*\(/,
  /^\s*(?:cout\s*<<|cin\s*>>)/,
  /^\s*(?:SELECT\s+.*FROM|CREATE\s+TABLE)\b/i,
];

const CODE_LINE_SIGNALS = [
  /[{};]\s*$/,
  /^\s*\/\//,
  /^\s*\/\*/,
  /^\s*\*\//,
  /^\s*System\.out\./,
  /^\s*(?:printf|scanf)\(/,
  /^\s*cout\s*<</,
  /^\s*cin\s*>>/,
  /^\s*(?:return|break|continue)\b.*[;:]$/,
  /^\s*(?:public|private|protected)\b/,
  /^\s*(?:int|float|double|char|boolean|String|long|short|void)\b.*[;=()]$/,
  /^\s*(?:if|else\s+if|else|for|while|do|switch)\s*\(.*[:{;]?$/,
  /^\s*case\s+[^:]+:|^\s*default\s*:/,
  /^\s*def\s+\w+/,
  /^\s*class\s+\w+/,
  /^\s*#include\b/,
  /^\s*throw\s+new\b/,
  /^\s*[a-zA-Z_]\w*\s*=\s*.+;/,
  /^\s*[a-zA-Z_]\w*\.[a-zA-Z_]\w*\(.*;$/,
  /^\s*[{}]$/,
];

const MCQ_OPTION_RE = /^\s*(?:[-*]\s*)?(?:[A-Da-d]\.|\\([A-Da-d]\\)|[A-Da-d]\)|[A-Da-d]:)\s+/;

function isMcqOption(line: string): boolean {
  return MCQ_OPTION_RE.test(line.trim());
}

function isProseQuestionEnd(line: string): boolean {
  const s = line.trim();
  if (!s || s.endsWith(";") || s.endsWith("{") || s.endsWith("}")) return false;
  const lower = s.toLowerCase();
  if (lower.endsWith("?")) return true;
  return (
    /^(?:why|what|how|which|explain|predict|find|determine|calculate|debug|state)\b/i.test(
      lower
    ) &&
    (s.includes(":") || s.includes("?") || s.includes("."))
  );
}

function isCodeLine(line: string): boolean {
  const s = line.trim();
  if (!s || isMcqOption(line) || isProseQuestionEnd(line)) return false;
  return CODE_LINE_SIGNALS.some((pat) => pat.test(line));
}

function autoFenceCode(text: string): string {
  if (!text || text.includes("```")) return text;

  const lines = text.split("\n");
  const n = lines.length;
  const resultLines: string[] = [];
  let i = 0;

  while (i < n) {
    const line = lines[i];
    const isStart =
      STRONG_CODE_STARTERS.some((pat) => pat.test(line)) ||
      (isCodeLine(line) && i + 1 < n && isCodeLine(lines[i + 1]));

    if (isStart) {
      const block: string[] = [];
      const startIndex = i;
      while (i < n) {
        const curr = lines[i];
        if (!curr.trim()) {
          if (i + 1 < n && isCodeLine(lines[i + 1])) {
            block.push(curr);
            i++;
            continue;
          } else {
            break;
          }
        }
        if (isMcqOption(curr) || isProseQuestionEnd(curr)) break;
        if (isCodeLine(curr)) {
          block.push(curr);
          i++;
        } else {
          break;
        }
      }

      if (i === startIndex) {
        resultLines.push(lines[i]);
        i++;
        continue;
      }

      const codeStr = block.join("\n").trim();
      const hasStrong = STRONG_CODE_STARTERS.some((pat) => pat.test(codeStr));
      const hasSyntax = /[;{}():#]/.test(codeStr);

      if ((block.length >= 2 || hasStrong) && hasSyntax) {
        const lang = detectCodeLanguage(codeStr);
        const nonBlank = block.filter((l) => l.trim().length > 0);
        const minIndent =
          nonBlank.length > 0
            ? Math.min(...nonBlank.map((l) => l.search(/\S|$/)))
            : 0;
        const normalized = block
          .map((l) =>
            l.trim().length > 0 && minIndent > 0 ? l.slice(minIndent) : l
          )
          .join("\n")
          .trim();

        if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim()) {
          resultLines.push("");
        }
        resultLines.push(`\`\`\`${lang}`);
        resultLines.push(normalized);
        resultLines.push("```");
        if (i < n && lines[i].trim()) {
          resultLines.push("");
        }
      } else {
        resultLines.push(...block);
      }
    } else {
      resultLines.push(line);
      i++;
    }
  }

  return resultLines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToHtml(rawMd?: string): string {
  if (!rawMd) return "";

  const md = autoFenceCode(rawMd);
  const codeBlocks: string[] = [];

  // Extract and protect triple-backtick code fences ```lang ... ```
  let processed = md.replace(
    /```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```/g,
    (_, rawLang, codeContent) => {
      const rawCode = (codeContent || "").replace(/\r\n/g, "\n").trim();
      const detected = rawLang ? rawLang.trim().toLowerCase() : detectCodeLanguage(rawCode);
      const lang = detected || "text";

      let highlighted = "";
      if (Prism.languages[lang]) {
        try {
          highlighted = Prism.highlight(rawCode, Prism.languages[lang], lang);
        } catch {
          highlighted = escapeHtml(rawCode);
        }
      } else {
        highlighted = escapeHtml(rawCode);
      }

      const placeholder = `@@@CODEBLOCK_${codeBlocks.length}@@@`;
      const label = lang.toUpperCase();

      const blockHtml = `
<div class="code-block-wrapper my-3.5 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700/80 bg-gray-50/90 dark:bg-neutral-900 shadow-sm not-prose">
  <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 bg-gray-100 dark:bg-neutral-800/90 border-b border-gray-200 dark:border-neutral-700/80 text-xs text-gray-600 dark:text-gray-400 select-none">
    <div class="flex items-center gap-1.5">
      <span class="inline-flex gap-1">
        <span class="w-2.5 h-2.5 rounded-full bg-red-400/80 dark:bg-red-500/70"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-yellow-400/80 dark:bg-yellow-500/70"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-green-400/80 dark:bg-green-500/70"></span>
      </span>
      <span class="font-mono uppercase font-semibold text-[11px] tracking-wider text-gray-500 dark:text-gray-400 ml-1.5">${label}</span>
    </div>
    <button type="button" class="copy-code-btn inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 transition" title="Copy code">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
      <span>Copy</span>
    </button>
  </div>
  <pre class="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-gray-800 dark:text-gray-200"><code>${highlighted}</code></pre>
</div>`.trim();

      codeBlocks.push(blockHtml);
      return placeholder;
    }
  );

  // Extract and protect inline backtick code `code`
  const inlineCodes: string[] = [];
  processed = processed.replace(/`([^`\n]+)`/g, (_, inline) => {
    const placeholder = `@@@INLINECODE_${inlineCodes.length}@@@`;
    const snippet = `<code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-neutral-700/80 text-pink-600 dark:text-pink-400 font-mono text-xs sm:text-sm font-medium border border-gray-200/60 dark:border-neutral-600/60">${escapeHtml(
      inline
    )}</code>`;
    inlineCodes.push(snippet);
    return placeholder;
  });

  // Render LaTeX math on remaining text
  processed = renderLatex(processed);

  // Standard inline markdown formatting
  processed = processed
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n/g, "<br>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-blue-600 dark:text-blue-400 underline">$1</a>'
    );

  // Restore inline code
  processed = processed.replace(/@@@INLINECODE_(\d+)@@@/g, (_, idx) => {
    return inlineCodes[parseInt(idx, 10)] || "";
  });

  // Restore block code
  processed = processed.replace(/@@@CODEBLOCK_(\d+)@@@/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || "";
  });

  return processed;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEMESTER GRADIENT PALETTES
   ═══════════════════════════════════════════════════════════════════════════ */

const SEM_COLORS: Record<number, { gradient: string; ring: string; badge: string; icon: string }> = {
  1: {
    gradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-500/20 dark:via-purple-500/10 dark:to-fuchsia-500/20",
    ring: "ring-violet-300 dark:ring-violet-600",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    icon: "🧪",
  },
  2: {
    gradient: "from-sky-500/10 via-cyan-500/5 to-teal-500/10 dark:from-sky-500/20 dark:via-cyan-500/10 dark:to-teal-500/20",
    ring: "ring-sky-300 dark:ring-sky-600",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    icon: "⚡",
  },
  3: {
    gradient: "from-amber-500/10 via-orange-500/5 to-rose-500/10 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-rose-500/20",
    ring: "ring-amber-300 dark:ring-amber-600",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    icon: "🖥️",
  },
  4: {
    gradient: "from-emerald-500/10 via-green-500/5 to-lime-500/10 dark:from-emerald-500/20 dark:via-green-500/10 dark:to-lime-500/20",
    ring: "ring-emerald-300 dark:ring-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: "🤖",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   SELECTOR CARD ICONS & HELPERS (Champagne/Obsidian Card Style)
   ═══════════════════════════════════════════════════════════════════════════ */

function ForwardArrowIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.293 4.293a1 1 0 011.414 0l6.5 6.5a1 1 0 010 1.414l-6.5 6.5a1 1 0 01-1.414-1.414L17.086 13H4a1 1 0 110-2h13.086l-4.793-4.793a1 1 0 010-1.414z" />
    </svg>
  );
}

function getSemesterBadgeIcon(semId: number) {
  switch (semId) {
    case 1:
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 2:
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 3:
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 4:
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    default:
      return (
        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
  }
}

function getSubjectBadgeIcon(code: string, name: string) {
  const n = name.toLowerCase();
  const c = code.toUpperCase();
  // Programming & Software Engineering
  if (
    c.includes("CSC") ||
    c.includes("CSS") ||
    n.includes("programming") ||
    n.includes("python") ||
    n.includes("java") ||
    n.includes("c++") ||
    n.includes("software")
  ) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  // Data Structures & Algorithms / Databases
  if (n.includes("data") || n.includes("algorithm") || n.includes("structure") || n.includes("database") || n.includes("sql")) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    );
  }
  // Mathematics & Statistics
  if (c.includes("MAT") || n.includes("math") || n.includes("calculus") || n.includes("discrete") || n.includes("probability")) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  // Hardware / Digital Systems / Electronics
  if (c.includes("ECE") || c.includes("EET") || n.includes("digital") || n.includes("hardware") || n.includes("architecture") || n.includes("microprocessor")) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    );
  }
  // Physics / Chemistry / Sciences
  if (c.includes("CYB") || c.includes("PYB") || n.includes("physics") || n.includes("chemistry")) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  // AI / Machine Learning / Intelligence
  if (n.includes("ai") || n.includes("intelligence") || n.includes("machine") || n.includes("learning")) {
    return (
      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  // Default: Academic Book
  return (
    <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

type NavState =
  | { view: "semesters" }
  | { view: "subjects"; semesterId: number }
  | { view: "questions"; subjectCode: string };

const PyqSection: React.FC = () => {
  const [nav, setNav] = useState<NavState>({ view: "semesters" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Question viewer state
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

  // Currently active subject info
  const activeSubject = useMemo(() => {
    if (nav.view !== "questions") return null;
    return ALL_SUBJECTS.find((s) => s.code === nav.subjectCode) ?? null;
  }, [nav]);

  const activeSemester = useMemo(() => {
    if (nav.view === "subjects") return SEMESTERS.find((s) => s.id === nav.semesterId) ?? null;
    if (nav.view === "questions" && activeSubject) return activeSubject.semester;
    return null;
  }, [nav, activeSubject]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_SUBJECTS.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Copy code button handler
  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(".copy-code-btn") as HTMLButtonElement | null;
      if (!btn) return;
      const wrapper = btn.closest(".code-block-wrapper");
      const pre = wrapper?.querySelector("pre");
      if (!pre) return;
      const codeText = pre.innerText || pre.textContent || "";
      navigator.clipboard.writeText(codeText).then(() => {
        const span = btn.querySelector("span");
        if (span) {
          const originalText = span.textContent;
          span.textContent = "Copied!";
          btn.classList.add("text-green-600", "dark:text-green-400");
          setTimeout(() => {
            span.textContent = originalText;
            btn.classList.remove("text-green-600", "dark:text-green-400");
          }, 2000);
        }
      });
    };

    document.addEventListener("click", handleCopy);
    return () => document.removeEventListener("click", handleCopy);
  }, []);

  // Load questions when subject changes
  useEffect(() => {
    if (nav.view !== "questions") return;
    const subjectCode = nav.subjectCode;
    const subInfo = ALL_SUBJECTS.find((s) => s.code === subjectCode);
    if (!subInfo || subInfo.files.length === 0) {
      setQuestions([]);
      setPapers([]);
      setUnits([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const fileList = subInfo!.files;
      let allQuestions: Question[] = [];
      const allPapersSet = new Set<string>();
      const allUnitsSet = new Set<string>();
      for (const file of fileList) {
        try {
          const res = await fetch(`/data/${subjectCode}/${file}`);
          if (!res.ok) continue;
          const data: PaperData | Question[] = await res.json();
          let qs: Question[] = [];
          if (Array.isArray(data)) {
            qs = data;
          } else if (data.questions) {
            qs = data.questions;
          }

          const sourceName = file.replace(/\.json$/i, "");
          for (const q of qs) {
            q.source = sourceName;
            allPapersSet.add(sourceName);
            const unit = extractUnit(q.chapter);
            if (unit) allUnitsSet.add(unit);
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
  }, [nav]);

  function navigateToSubject(code: string) {
    setNav({ view: "questions", subjectCode: code });
    setFilterPapers(new Set());
    setFilterUnits(new Set());
    setFilterMinMarks(0);
    setPaperDropdownOpen(false);
    setUnitDropdownOpen(false);
    setShowAllAnswers(false);
    setSearchQuery("");
    setSearchOpen(false);
  }

  // Filtered questions
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

  // Print handler
  function handlePrint() {
    const subjectInfo = activeSubject;
    const katexCssUrl = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

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
    .code-block-wrapper { margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }
    .code-block-header { background: #f0f0f0; padding: 4px 8px; font-size: 8pt; font-weight: bold; border-bottom: 1px solid #ccc; }
    .copy-code-btn { display: none !important; }
    .code-block-wrapper pre { margin: 0; padding: 8px 10px; background: #fafafa; font-family: Consolas, monospace; font-size: 9.5pt; line-height: 1.4; white-space: pre-wrap; }
    code { font-family: Consolas, monospace; }
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

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
        SRM PYQs
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        B.Tech CSE — Previous Year Questions
      </p>

      {/* ── Global Search Bar ──────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto mb-8" ref={searchRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder='Search subjects… (e.g. "DSA", "Chemistry", "21CSC201J")'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setSearchOpen(true);
            }}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Search results dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No subjects found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((sub) => (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => navigateToSubject(sub.code)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F3EBD5] dark:hover:bg-neutral-700/70 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-neutral-700/50 last:border-b-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-neutral-900 border border-[#DFCFA5] dark:border-neutral-700 flex items-center justify-center text-[#A58338] dark:text-amber-400 flex-shrink-0">
                      {getSubjectBadgeIcon(sub.code, sub.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {sub.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="font-mono text-amber-800 dark:text-amber-300">{sub.code}</span>
                        <span className="text-gray-300 dark:text-neutral-600">·</span>
                        <span>{sub.semester.name}</span>
                        <span className="text-gray-300 dark:text-neutral-600">·</span>
                        <span>{sub.files.length} paper{sub.files.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <ForwardArrowIcon className="w-5 h-5 text-[#B28B38] dark:text-amber-400 flex-shrink-0 opacity-70" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm mb-6 flex-wrap px-1">
        <button
          type="button"
          onClick={() => setNav({ view: "semesters" })}
          className={`font-medium transition-colors ${
            nav.view === "semesters"
              ? "text-gray-900 dark:text-gray-100 font-semibold"
              : "text-[#8C6B25] dark:text-amber-400 hover:underline"
          }`}
        >
          All Semesters
        </button>
        {activeSemester && (
          <>
            <span className="text-gray-400 dark:text-neutral-600">›</span>
            <button
              type="button"
              onClick={() => setNav({ view: "subjects", semesterId: activeSemester.id })}
              className={`font-medium transition-colors ${
                nav.view === "subjects"
                  ? "text-gray-900 dark:text-gray-100 font-semibold"
                  : "text-[#8C6B25] dark:text-amber-400 hover:underline"
              }`}
            >
              {activeSemester.name}
            </button>
          </>
        )}
        {activeSubject && (
          <>
            <span className="text-gray-400 dark:text-neutral-600">›</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[280px]">
              {activeSubject.code}: {activeSubject.name}
            </span>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Semester Cards (Styled matching reference design)        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {nav.view === "semesters" && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-neutral-100">
              Select Semester
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
              Choose your semester to access subjects and question papers
            </p>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {SEMESTERS.map((sem) => {
              const paperCount = sem.subjects.reduce((sum, s) => sum + s.files.length, 0);
              return (
                <button
                  key={sem.id}
                  type="button"
                  onClick={() => setNav({ view: "subjects", semesterId: sem.id })}
                  className="group relative w-full overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left transition-all duration-300 flex items-center gap-4 sm:gap-5 bg-gradient-to-r from-[#F7F2E7] via-[#F1E7D3] to-[#E9D9B7] border-[#DFCFA7] shadow-[0_4px_18px_-2px_rgba(168,136,70,0.14)] hover:shadow-[0_8px_26px_-4px_rgba(168,136,70,0.25)] hover:-translate-y-0.5 hover:border-[#CFBC8B] dark:from-[#191921] dark:via-[#1F1E27] dark:to-[#262320] dark:border-neutral-700/70 dark:shadow-[0_4px_22px_rgba(0,0,0,0.45)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_8px_30px_rgba(245,158,11,0.18)] dark:hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
                >
                  {/* Right curved accent crescent overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 sm:-right-6 top-1/2 -translate-y-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none transition-transform duration-300 group-hover:scale-105 bg-[#E4D1A7]/75 dark:bg-amber-400/[0.08]"
                  />

                  {/* Left circular badge */}
                  <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/95 dark:bg-[#121217] border border-[#DECFA5] dark:border-neutral-700/90 shadow-sm dark:shadow-inner text-[#A58338] dark:text-amber-400 group-hover:scale-105 transition-transform duration-300">
                    {getSemesterBadgeIcon(sem.id)}
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 min-w-0 relative z-10 py-0.5">
                    <h3 className="text-base sm:text-lg font-bold text-[#2A2317] dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-950 dark:group-hover:text-white transition-colors">
                      {sem.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#70624D] dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{sem.subjects.length} Subjects</span>
                      <span className="opacity-40">·</span>
                      <span>{paperCount} Question Papers</span>
                    </p>
                  </div>

                  {/* Right forward arrow */}
                  <div className="relative z-10 flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-[#B28B38] dark:text-amber-400 group-hover:text-[#8D6B24] dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300">
                    <ForwardArrowIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Subject Cards (Styled matching reference design)         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {nav.view === "subjects" && activeSemester && (
        <div className="max-w-2xl mx-auto">
          {/* Top navigation controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setNav({ view: "semesters" })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8C6B25] dark:text-amber-400 hover:text-[#674D16] dark:hover:text-amber-300 transition-colors self-start"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Semesters</span>
            </button>

            {/* Quick semester switcher pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-200/70 dark:bg-neutral-800 border border-gray-300/60 dark:border-neutral-700/60 text-xs self-start sm:self-auto overflow-x-auto max-w-full">
              {SEMESTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setNav({ view: "subjects", semesterId: s.id })}
                  className={`px-3 py-1 font-semibold rounded-lg transition-all whitespace-nowrap ${
                    s.id === activeSemester.id
                      ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-amber-300 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {activeSemester.name} Subjects
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 mt-1">
              Select a subject to view all previous year questions and answer keys
            </p>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {activeSemester.subjects.map((sub) => {
              const hasPapers = sub.files.length > 0;
              if (hasPapers) {
                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => navigateToSubject(sub.code)}
                    className="group relative w-full overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left transition-all duration-300 flex items-center gap-4 sm:gap-5 bg-gradient-to-r from-[#F7F2E7] via-[#F1E7D3] to-[#E9D9B7] border-[#DFCFA7] shadow-[0_4px_18px_-2px_rgba(168,136,70,0.14)] hover:shadow-[0_8px_26px_-4px_rgba(168,136,70,0.25)] hover:-translate-y-0.5 hover:border-[#CFBC8B] dark:from-[#191921] dark:via-[#1F1E27] dark:to-[#262320] dark:border-neutral-700/70 dark:shadow-[0_4px_22px_rgba(0,0,0,0.45)] dark:hover:border-amber-500/50 dark:hover:shadow-[0_8px_30px_rgba(245,158,11,0.18)] dark:hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
                  >
                    {/* Right curved accent crescent overlay */}
                    <div
                      aria-hidden="true"
                      className="absolute -right-8 sm:-right-6 top-1/2 -translate-y-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none transition-transform duration-300 group-hover:scale-105 bg-[#E4D1A7]/75 dark:bg-amber-400/[0.08]"
                    />

                    {/* Left circular badge */}
                    <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/95 dark:bg-[#121217] border border-[#DECFA5] dark:border-neutral-700/90 shadow-sm dark:shadow-inner text-[#A58338] dark:text-amber-400 group-hover:scale-105 transition-transform duration-300">
                      {getSubjectBadgeIcon(sub.code, sub.name)}
                    </div>

                    {/* Center Content */}
                    <div className="flex-1 min-w-0 relative z-10 py-0.5">
                      <h3 className="text-base sm:text-lg font-bold text-[#2A2317] dark:text-neutral-100 tracking-tight leading-snug group-hover:text-amber-950 dark:group-hover:text-white transition-colors truncate sm:whitespace-normal">
                        {sub.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#70624D] dark:text-neutral-400 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-amber-900 dark:text-amber-300">
                          {sub.code}
                        </span>
                        <span className="opacity-40">·</span>
                        <span>{sub.files.length} Question Paper{sub.files.length !== 1 ? "s" : ""}</span>
                      </p>
                    </div>

                    {/* Right forward arrow */}
                    <div className="relative z-10 flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-[#B28B38] dark:text-amber-400 group-hover:text-[#8D6B24] dark:group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300">
                      <ForwardArrowIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                  </button>
                );
              }

              // Disabled card for subjects without papers
              return (
                <div
                  key={sub.code}
                  className="group relative w-full overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left flex items-center gap-4 sm:gap-5 bg-gradient-to-r from-[#F7F2E7]/60 via-[#F1E7D3]/60 to-[#E9D9B7]/60 border-[#DFCFA7]/60 dark:from-[#191921]/60 dark:via-[#1F1E27]/60 dark:to-[#262320]/60 dark:border-neutral-800/60 opacity-60 cursor-not-allowed"
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 sm:-right-6 top-1/2 -translate-y-1/2 w-36 sm:w-44 h-36 sm:h-44 rounded-full pointer-events-none bg-[#E4D1A7]/35 dark:bg-white/[0.02]"
                  />

                  <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white/70 dark:bg-neutral-800/80 border border-[#DECFA5]/60 dark:border-neutral-700/50 text-gray-400 dark:text-neutral-500">
                    {getSubjectBadgeIcon(sub.code, sub.name)}
                  </div>

                  <div className="flex-1 min-w-0 relative z-10 py-0.5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-neutral-300 tracking-tight leading-snug truncate sm:whitespace-normal">
                      {sub.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono">{sub.code}</span>
                      <span className="opacity-40">·</span>
                      <span className="italic">Papers coming soon</span>
                    </p>
                  </div>

                  <div className="relative z-10 flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-gray-400 dark:text-neutral-600">
                    <ForwardArrowIcon className="w-6 h-6 sm:w-7 sm:h-7 opacity-30" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Question Display (existing functionality)               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {nav.view === "questions" && activeSubject && (
        <>
          <h2 className="text-center text-lg font-normal mb-8 text-gray-700 dark:text-gray-300">
            {activeSubject.title}
          </h2>

          {activeSubject.files.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No papers available yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Papers for {activeSubject.name} haven&apos;t been added yet. Check back later!
              </p>
            </div>
          ) : (
            <>
              {/* ── Filter Controls ──────────────────────────────────── */}
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

              {/* ── Questions List ────────────────────────────────── */}
              <div id="content">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <div className="text-gray-500 dark:text-gray-400">Loading questions…</div>
                  </div>
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
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PyqSection;
