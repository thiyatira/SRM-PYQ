const fs = require('fs');
const path = require('path');

const dsaDir = path.resolve(__dirname, '../public/data/DSA');
const files = fs.readdirSync(dsaDir).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} DSA JSON files.`);

const MCQ_OPTS_RE = /^\s*(?:[-*]\s*)?(?:[A-Da-d]\.|\([A-Da-d]\)|[A-Da-d]\)|[A-Da-d]:)\s+/;

function formatQuestionText(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. If it already has ```, check if options are inside or if spacing is missing
  if (text.includes('```')) {
    text = text.replace(/```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```/g, (_, rawLang, body) => {
      const lines = body.replace(/\r\n/g, '\n').split('\n');
      const codeLines = [];
      const optLines = [];
      let inOpts = false;

      for (const line of lines) {
        if (MCQ_OPTS_RE.test(line.trim())) {
          inOpts = true;
        }
        if (inOpts) {
          optLines.push(line);
        } else {
          codeLines.push(line);
        }
      }

      const trimmedCode = codeLines.join('\n').trim();
      const lang = rawLang.trim();
      let res = `\`\`\`${lang}\n${trimmedCode}\n\`\`\``;
      if (optLines.length) {
        res += `\n\n${optLines.join('\n').trim()}`;
      }
      return res;
    });

    // Ensure clean spacing: double newline before opening fence and after closing fence
    text = text.replace(/([^\n])\n*```([a-zA-Z0-9_+#.-]*)\n/g, '$1\n\n```$2\n');
    text = text.replace(/```\n*([A-Da-d]\.|\([A-Da-d]\)|[A-Da-d]\)|[A-Da-d]:)/g, '```\n\n$1');
    return text;
  }

  // 2. Format specific stack operations patterns (e.g. Push(10); Push(20); ...)
  if (text.includes('Push(') || text.includes('PUSH(')) {
    const opsMatch = text.match(/(?:(?:Push|Pop|PUSH|POP)\s*\([^)]*\)\s*[,;]?\s*\n?)+/);
    if (opsMatch && opsMatch[0].trim().split('\n').length >= 3) {
      const opsBlock = opsMatch[0].trim().split('\n').map(l => l.trim()).join('\n');
      const before = text.substring(0, opsMatch.index).trim();
      const after = text.substring(opsMatch.index + opsMatch[0].length).trim();
      return `${before}\n\n\`\`\`\n${opsBlock}\n\`\`\`\n\n${after}`;
    }
  }

  // 3. Format loops or pseudocode with while/for/←/<-
  if ((text.includes('while ') || text.includes('for ')) && (text.includes('←') || text.includes('<-') || text.includes('print(') || text.includes('do'))) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const intro = [];
    const code = [];
    const opts = [];
    let state = 'intro'; // 'intro' -> 'code' -> 'opts'

    for (const line of lines) {
      const s = line.trim();
      if (MCQ_OPTS_RE.test(s)) {
        state = 'opts';
      } else if (state === 'intro') {
        if (/^(?:i|j|k|ptr|\w+)\s*(?:←|<-|=)|^(?:while|for)\b/.test(s)) {
          state = 'code';
        }
      }

      if (state === 'intro') {
        intro.push(line);
      } else if (state === 'code') {
        if (s) code.push(line);
      } else {
        opts.push(line);
      }
    }

    if (code.length >= 2) {
      const introStr = intro.join('\n').trim();
      const codeStr = code.join('\n').trim();
      const optsStr = opts.join('\n').trim();
      return `${introStr}\n\n\`\`\`\n${codeStr}\n\`\`\`\n\n${optsStr}`;
    }
  }

  return text;
}

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dsaDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const questions = Array.isArray(data) ? data : (data.questions || []);

  let changed = false;
  for (const q of questions) {
    if (!q) continue;
    if (q.question_text) {
      const formatted = formatQuestionText(q.question_text);
      if (formatted !== q.question_text) {
        q.question_text = formatted;
        changed = true;
      }
    }
    if (q.answer) {
      const formatted = formatQuestionText(q.answer);
      if (formatted !== q.answer) {
        q.answer = formatted;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    modifiedCount++;
    console.log(`Updated DSA file: ${file}`);
  }
}

console.log(`\nSuccessfully formatted ${modifiedCount} DSA files!`);
