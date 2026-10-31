import katex from "katex";
import { escapeHtml, markdownToHtml } from "@/lib/pyq/render";
import { unitOrder, type Question } from "@/lib/pyq/loader";

/** Opens a print-friendly document in a new window. Returns false if the popup was blocked. */
export function printQuestions(title: string, name: string, questions: Question[]): boolean {
  const katexVersion = (katex as unknown as { version?: string }).version ?? "0.16.11";
  const katexCssUrl = `https://cdn.jsdelivr.net/npm/katex@${encodeURIComponent(katexVersion)}/dist/katex.min.css`;

  const byUnit = new Map<string, Question[]>();
  for (const q of questions) {
    const list = byUnit.get(q.unit);
    if (list) list.push(q);
    else byUnit.set(q.unit, [q]);
  }
  const units = Array.from(byUnit.keys()).sort((a, b) => unitOrder(a) - unitOrder(b));

  let n = 1;
  let body = "";
  for (const unit of units) {
    body += `<h2 class="unit-heading">${escapeHtml(unit)}</h2>`;
    const qs = [...(byUnit.get(unit) ?? [])].sort((a, b) => (a.marks ?? 0) - (b.marks ?? 0));
    for (const q of qs) {
      const marks =
        q.marks === undefined ? "" : ` (${q.marks} mark${q.marks === 1 ? "" : "s"})`;
      body += `
        <div class="question">
          <div class="q-header">Q${n++}<span class="marks">${escapeHtml(marks)}</span></div>
          <div class="q-text">${markdownToHtml(q.question_text)}</div>
          <div class="answer"><strong>Answer:</strong> ${markdownToHtml(q.answer)}</div>
          <div class="source">Source: ${escapeHtml(q.source)}</div>
        </div>`;
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${katexCssUrl}">
  <style>
    body { font-family: Georgia, serif; margin: 20mm; color: #000; font-size: 11pt; }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 4px; }
    h2.subtitle { text-align: center; font-size: 12pt; font-weight: normal; margin-bottom: 20px; }
    h2.unit-heading { font-size: 14pt; border-bottom: 1px solid #333; margin-top: 24px; padding-bottom: 4px; }
    .question { margin-bottom: 20px; page-break-inside: avoid; }
    .q-header { font-weight: bold; font-size: 12pt; }
    .marks { font-weight: normal; font-size: 10pt; margin-left: 4px; }
    .q-text { margin: 4px 0 6px 0; }
    .answer { background: #f0f7f0; border-left: 3px solid #4a8; padding: 6px 10px; margin-top: 6px; font-size: 10pt; }
    .source { font-size: 9pt; color: #555; margin-top: 4px; }
    .code-block-wrapper { margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }
    .code-block-header { background: #f0f0f0; padding: 4px 8px; font-size: 8pt; font-weight: bold; border-bottom: 1px solid #ccc; }
    .code-block-header > div { display: inline; }
    .code-block-header span { display: inline; }
    .copy-code-btn { display: none !important; }
    .code-block-wrapper pre { margin: 0; padding: 8px 10px; background: #fafafa; font-family: Consolas, monospace; font-size: 9.5pt; line-height: 1.4; white-space: pre-wrap; }
    code { font-family: Consolas, monospace; }
    .token.comment { color: #6b7280; font-style: italic; }
    .token.keyword { color: #6d28d9; font-weight: bold; }
    .token.string { color: #047857; }
    .token.number { color: #b45309; }
    ul { margin: 4px 0; padding-left: 22px; }
    @media print { body { margin: 15mm; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(name)}</h1>
  <h2 class="subtitle">${escapeHtml(title)}</h2>
  ${body}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.addEventListener("load", doPrint);
  // Fallback if the load event already fired or the stylesheet CDN is slow/offline.
  setTimeout(doPrint, 2500);
  return true;
}
