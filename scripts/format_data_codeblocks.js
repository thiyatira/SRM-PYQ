const fs = require('fs');
const path = require('path');

const MCQ_OPTION_RE = /^\s*(?:[-*]\s*)?(?:[A-Da-d]\.|\([A-Da-d]\)|[A-Da-d]\)|[A-Da-d]:)\s+/;

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

function isMcqOption(line) {
  return MCQ_OPTION_RE.test(line.trim());
}

function isProseQuestionEnd(line) {
  const s = line.trim();
  if (!s || s.endsWith(';') || s.endsWith('{') || s.endsWith('}')) return false;
  const lower = s.toLowerCase();
  if (lower.endsWith('?')) return true;
  return /^(?:why|what|how|which|explain|predict|find|determine|calculate|debug|state)\b/i.test(lower) &&
    (s.includes(':') || s.includes('?') || s.includes('.'));
}

function isCodeLine(line) {
  const s = line.trim();
  if (!s || isMcqOption(line) || isProseQuestionEnd(line)) return false;
  return CODE_LINE_SIGNALS.some(pat => pat.test(line));
}

function detectCodeLanguage(code) {
  if (/System\.out\.|public\s+class\b|String\[\]\s+args|extends\s+\w+|implements\s+\w+|JFrame|JButton|Frame\b/.test(code)) {
    return 'java';
  }
  if (/cout\s*<<|cin\s*>>|std::|#include\s*<iostream>/.test(code)) {
    return 'cpp';
  }
  if (/#include\b|printf\s*\(|scanf\s*\(|malloc\s*\(|strlen\s*\(|strcpy\s*\(/.test(code)) {
    return 'c';
  }
  if (/(?:def\s+\w+\s*\(|import\s+(?:numpy|pandas|math|sys|os)|print\s*\()/.test(code) && !code.includes(';')) {
    return 'python';
  }
  if (/\b(?:SELECT|CREATE\s+TABLE|INSERT\s+INTO|DROP\s+TABLE)\b/i.test(code)) {
    return 'sql';
  }
  if (code.includes(';') && (code.includes('{') || /int\s+|double\s+/.test(code))) {
    if (code.includes('boolean') || code.includes('String')) {
      return 'java';
    }
    return 'c';
  }
  return 'text';
}

function fixIndentation(lines) {
  if (!lines || lines.length === 0) return lines;
  const normalized = lines.map(l => l.replace(/\t/g, '    '));
  const nonBlank = normalized.filter(l => l.trim().length > 0);
  if (nonBlank.length === 0) return normalized;
  const minIndent = Math.min(...nonBlank.map(l => l.search(/\S|$/)));
  if (minIndent > 0) {
    return normalized.map(l => (l.trim().length > 0 ? l.slice(minIndent) : ''));
  }
  return normalized;
}

function autoFenceText(text) {
  if (!text || typeof text !== 'string') return text;

  // If already has code fences, ensure language tag and indentation
  if (text.includes('```')) {
    return text.replace(/```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```/g, (_, rawLang, body) => {
      const bodyLines = body.replace(/\r\n/g, '\n').trim().split('\n');
      const formattedLines = fixIndentation(bodyLines);
      const formattedBody = formattedLines.join('\n');
      let lang = (rawLang || '').trim().toLowerCase();
      if (!lang) {
        lang = detectCodeLanguage(formattedBody);
      }
      return `\`\`\`${lang}\n${formattedBody}\n\`\`\``;
    });
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const n = lines.length;
  const resultLines = [];
  let i = 0;

  while (i < n) {
    const line = lines[i];
    const isStart =
      STRONG_CODE_STARTERS.some(pat => pat.test(line)) ||
      (isCodeLine(line) && i + 1 < n && isCodeLine(lines[i + 1]));

    if (isStart) {
      const block = [];
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

      const codeStr = block.join('\n').trim();
      const hasStrong = STRONG_CODE_STARTERS.some(pat => pat.test(codeStr));
      const hasSyntax = /[;{}():#]/.test(codeStr);

      if ((block.length >= 2 || hasStrong) && hasSyntax) {
        const lang = detectCodeLanguage(codeStr);
        const formattedBlock = fixIndentation(block);
        const normalized = formattedBlock.join('\n').trim();

        if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim()) {
          resultLines.push('');
        }
        resultLines.push(`\`\`\`${lang}`);
        resultLines.push(normalized);
        resultLines.push('```');
        if (i < n && lines[i].trim()) {
          resultLines.push('');
        }
      } else {
        resultLines.push(...block);
      }
    } else {
      resultLines.push(line);
      i++;
    }
  }

  return resultLines.join('\n');
}

function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const dataDir = path.resolve(__dirname, '../public/data');
const jsonFiles = getAllJsonFiles(dataDir);
console.log(`Processing ${jsonFiles.length} JSON files...`);

let modifiedFiles = 0;
let modifiedQuestions = 0;

for (const filePath of jsonFiles) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const questions = Array.isArray(data) ? data : (data.questions || []);
    if (!Array.isArray(questions)) continue;

    let changed = false;
    for (const q of questions) {
      if (!q || typeof q !== 'object') continue;

      if (q.question_text) {
        const updated = autoFenceText(q.question_text);
        if (updated !== q.question_text) {
          q.question_text = updated;
          changed = true;
          modifiedQuestions++;
        }
      }

      if (q.answer) {
        const updated = autoFenceText(q.answer);
        if (updated !== q.answer) {
          q.answer = updated;
          changed = true;
          modifiedQuestions++;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
      modifiedFiles++;
      console.log(`Updated: ${path.relative(dataDir, filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

console.log(`\nSuccessfully updated ${modifiedFiles} files (${modifiedQuestions} questions/answers formatted)!`);
