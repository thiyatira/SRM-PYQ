#!/usr/bin/env python3
"""
format_data_codeblocks.py
Scans all JSON files in public/data and ensures all code snippets in questions and answers
are cleanly formatted, properly indented, and wrapped in standard markdown code fences (```<lang> ... ```).
"""

import os
import sys
import json
import glob
import re
from typing import List, Tuple, Optional

MCQ_OPTION_PATTERN = re.compile(
    r'^\s*(?:[-*]\s*)?(?:[A-Da-d]\.|\([A-Da-d]\)|[A-Da-d]\)|[A-Da-d]:)\s+'
)

STRONG_CODE_STARTERS = [
    r'^\s*#(?:include|define)\b',
    r'^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+|abstract\s+)?(?:class|interface|enum)\s+\w+',
    r'^\s*import\s+[\w.*]+;',
    r'^\s*(?:import\s+(?:numpy|pandas|math|sys|os|re|random)\b|from\s+\w+\s+import\b)',
    r'^\s*def\s+\w+\s*\(',
    r'^\s*(?:public\s+)?(?:static\s+)?(?:void|int)\s+main\s*\(',
    r'^\s*System\.out\.',
    r'^\s*(?:printf|scanf)\s*\(',
    r'^\s*(?:cout\s*<<|cin\s*>>)',
    r'^\s*SELECT\s+.*FROM\b',
    r'^\s*CREATE\s+TABLE\b',
]

CODE_LINE_SIGNALS = [
    r'[{};]\s*$',
    r'^\s*//',
    r'^\s*/\*',
    r'^\s*\*/',
    r'^\s*System\.out\.',
    r'^\s*(?:printf|scanf)\(',
    r'^\s*cout\s*<<',
    r'^\s*cin\s*>>',
    r'^\s*(?:return|break|continue)\b.*[;:]$',
    r'^\s*(?:public|private|protected)\b',
    r'^\s*(?:int|float|double|char|boolean|String|long|short|void)\b.*[;=()]$',
    r'^\s*(?:if|else\s+if|else|for|while|do|switch)\b.*[:{;]?$',
    r'^\s*case\s+[^:]+:|^\s*default\s*:',
    r'^\s*def\s+\w+',
    r'^\s*class\s+\w+',
    r'^\s*#include\b',
    r'^\s*throw\s+new\b',
    r'^\s*[a-zA-Z_]\w*\s*=\s*.+;',
    r'^\s*[a-zA-Z_]\w*\.[a-zA-Z_]\w*\(.*;$',
    r'^\s*[{}]$',
]

def is_mcq_option(line: str) -> bool:
    return bool(MCQ_OPTION_PATTERN.match(line.strip()))

def is_prose_question_end(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if s.endswith(';') or s.endswith('{') or s.endswith('}'):
        return False
    lower = s.lower()
    if lower.endswith('?'):
        return True
    if any(lower.startswith(w) for w in [
        'why ', 'what ', 'how ', 'which ', 'explain ', 'predict ', 'find ',
        'determine ', 'calculate ', 'debug ', 'state ', 'write a program'
    ]) and (':' in s or '?' in s or '.' in s):
        return True
    return False

def is_code_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if is_mcq_option(line):
        return False
    if is_prose_question_end(line):
        return False
    return any(re.search(pat, line) for pat in CODE_LINE_SIGNALS)

def detect_language(code_str: str) -> str:
    if any(k in code_str for k in ['System.out', 'public class', 'String[] args', 'extends ', 'implements ', 'JFrame', 'JButton', 'Frame']):
        return 'java'
    if any(k in code_str for k in ['cout <<', 'cin >>', 'std::', '#include <iostream>']):
        return 'cpp'
    if any(k in code_str for k in ['#include', 'printf(', 'scanf(', 'malloc(', 'strlen(', 'strcpy(']):
        return 'c'
    if any(k in code_str for k in ['def ', 'import numpy', 'import pandas', 'print(', 'elif ']) and ';' not in code_str:
        return 'python'
    if any(k in code_str.upper() for k in ['SELECT ', 'CREATE TABLE', 'INSERT INTO', 'DROP TABLE']):
        return 'sql'
    if ';' in code_str and ('{' in code_str or 'int ' in code_str or 'double ' in code_str):
        if 'boolean' in code_str or 'String' in code_str:
            return 'java'
        return 'c'
    return 'text'

def fix_code_indentation(lines: List[str]) -> List[str]:
    """Ensures consistent indentation inside a code block."""
    if not lines:
        return lines
    
    # Check if lines have tabs, convert to 4 spaces
    cleaned = [line.replace('\t', '    ') for line in lines]
    
    # Strip any common excessive leading indent if all lines are indented
    non_empty = [line for line in cleaned if line.strip()]
    if non_empty:
        min_indent = min(len(line) - len(line.lstrip(' ')) for line in non_empty)
        if min_indent > 0:
            cleaned = [line[min_indent:] if line.strip() else '' for line in cleaned]
            
    return cleaned

def auto_fence_and_format(text: str) -> str:
    if not text or not isinstance(text, str):
        return text

    # If already has code fences, format existing fences
    if '```' in text:
        def replace_fence(m):
            raw_lang = m.group(1) or ""
            body = m.group(2)
            body_lines = body.strip('\r\n').split('\n')
            formatted_body = '\n'.join(fix_code_indentation(body_lines))
            lang = raw_lang.strip()
            if not lang:
                lang = detect_language(formatted_body)
            return f"```{lang}\n{formatted_body}\n```"
        return re.sub(r'```([a-zA-Z0-9_+#.-]*)\s*\n?([\s\S]*?)```', replace_fence, text)

    # If no code fences present, scan for unfenced code blocks
    lines = text.split('\n')
    n = len(lines)
    result_lines = []
    i = 0

    while i < n:
        line = lines[i]
        
        # Check if this line or a pair of lines marks the beginning of a code block
        is_start = False
        if any(re.search(pat, line) for pat in STRONG_CODE_STARTERS):
            is_start = True
        elif is_code_line(line) and i + 1 < n and is_code_line(lines[i + 1]):
            is_start = True
        
        if is_start:
            code_lines = []
            while i < n:
                curr = lines[i]
                if not curr.strip():
                    # Empty line: peek ahead to see if code continues
                    if i + 1 < n and is_code_line(lines[i + 1]):
                        code_lines.append(curr)
                        i += 1
                        continue
                    else:
                        break
                if is_mcq_option(curr) or is_prose_question_end(curr):
                    break
                if is_code_line(curr):
                    code_lines.append(curr)
                    i += 1
                else:
                    break
            
            code_text = '\n'.join(code_lines).strip()
            # Verify code quality: must contain at least 2 lines or strong code tokens
            has_strong = any(re.search(pat, code_text) for pat in STRONG_CODE_STARTERS)
            has_syntax = any(c in code_text for c in [';', '{', '}', '(', ':', '#'])
            
            if (len(code_lines) >= 2 or has_strong) and has_syntax:
                lang = detect_language(code_text)
                formatted_lines = fix_code_indentation(code_lines)
                formatted_code = '\n'.join(formatted_lines).strip()
                
                # Add spacing before fence if needed
                if result_lines and result_lines[-1].strip():
                    result_lines.append('')
                result_lines.append(f'```{lang}')
                result_lines.extend(formatted_code.split('\n'))
                result_lines.append('```')
                # Add spacing after fence if not at end
                if i < n and lines[i].strip():
                    result_lines.append('')
            else:
                result_lines.extend(code_lines)
        else:
            result_lines.append(line)
            i += 1

    return '\n'.join(result_lines)

def process_all_files(base_dir: str):
    json_files = glob.glob(os.path.join(base_dir, '**', '*.json'), recursive=True)
    print(f"Found {len(json_files)} JSON files in {base_dir}")
    
    modified_count = 0
    total_questions_modified = 0

    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Skipping {file_path}: {e}")
            continue

        questions = data if isinstance(data, list) else data.get('questions', [])
        if not isinstance(questions, list):
            continue

        file_changed = False
        for q in questions:
            if not isinstance(q, dict):
                continue
            
            # Process question_text
            orig_qt = q.get('question_text', '')
            if orig_qt:
                new_qt = auto_fence_and_format(orig_qt)
                if new_qt != orig_qt:
                    q['question_text'] = new_qt
                    file_changed = True
                    total_questions_modified += 1
            
            # Process answer
            orig_ans = q.get('answer', '')
            if orig_ans:
                new_ans = auto_fence_and_format(orig_ans)
                if new_ans != orig_ans:
                    q['answer'] = new_ans
                    file_changed = True
                    total_questions_modified += 1

        if file_changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            modified_count += 1
            print(f"Updated: {os.path.relpath(file_path, base_dir)}")

    print(f"\nDone! Modified {modified_count} files ({total_questions_modified} questions/answers formatted).")

if __name__ == '__main__':
    data_dir = os.path.abspath('public/data')
    process_all_files(data_dir)
