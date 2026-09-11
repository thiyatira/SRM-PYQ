"use client";

import React, { useEffect, useState } from "react";
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

const SUBJECTS = [
  { code: "DSA", name: "Data Structures and Algorithms", title: "21CSC201J: Data Structures and Algorithms" },
  { code: "PPS", name: "Programming for Problem Solving", title: "21CSS101J: Programming for Problem Solving" },
  { code: "POE", name: "Philosophy of Engineering", title: "21GNH101J: Philosophy of Engineering" },
  { code: "COMMENG", name: "Communicative English", title: "21LEH101T: Communicative English" },
  { code: "FRENCH", name: "French", title: "21LEH103T: French" },
  { code: "ICB", name: "Introduction to Computational Biology", title: "21BTB102T: Introduction to Computational Biology" },
  { code: "CHEMISTRY", name: "Chemistry", title: "18CYB101J: Chemistry" },
  { code: "EEE", name: "Electrical And Electronics Engineering", title: "21EES101T: Electrical And Electronics Engineering" },
  { code: "SPCM", name: "Semiconductor Physics and Computational Methods", title: "21PYB102J: Semiconductor Physics and Computational Methods" },
  { code: "OOPS", name: "Object Oriented Programming", title: "21CSC101T: Object Oriented Design and Programming" },
  { code: "ADVANCEDCALC", name: "Advanced Calculus and Complex Analysis", title: "21MAB102T: Advanced Calculus and Complex Analysis" },
  { code: "APP", name: "Advanced Programming Practice", title: "21CSC203P: Advanced Programming Practice" },
  { code: "COA", name: "Computer Organization and Architecture", title: "21CSS201T: Computer Organization and Architecture" },
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
  OOPS: [
    "2019_Nov.json",
    "2022_May.json",
    "2023_December.json",
    "2023_July.json",
    "2023_May.json",
    "2024_May.json",
    "2025_July.json",
  ],
  ADVANCEDCALC: [
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
  SPCM: [
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
  DSA: [
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
  COA: [
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
  ADVANCEDCALC: "AdvancedCalculus",
  SPCM: "SemiconductorPhysicsAndComputationalMethods",
  APP: "APP",
  DSA: "DSA",
  COA: "COA",
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

const MCQ_OPTION_RE = /^\s*(?:[-*]\s*)?(?:[A-Da-d]\.|\([A-Da-d]\)|[A-Da-d]\)|[A-Da-d]:)\s+/;

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

const PyqSection: React.FC = () => {
  const [subject, setSubject] = useState("COA");
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
