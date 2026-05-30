import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard", err);
    }
  };

  // Human-friendly language formatter
  const formatLanguage = (lang: string) => {
    if (!lang) return 'Code';
    const mapping: Record<string, string> = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      tsx: 'TypeScript JSX',
      jsx: 'JavaScript JSX',
      py: 'Python',
      python: 'Python',
      sh: 'Shell',
      bash: 'Bash',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      rust: 'Rust',
      rs: 'Rust',
      go: 'Go',
      golang: 'Go',
      cpp: 'C++',
      c: 'C',
      java: 'Java',
      kotlin: 'Kotlin',
      swift: 'Swift',
      sql: 'SQL',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
    };
    return mapping[lang.toLowerCase()] || lang.toUpperCase();
  };

  // Split lines to implement custom line numbers for coding workspace
  const lines = value.split('\n');

  return (
    <div className="my-4 rounded-lg border border-[#1F1F1F] bg-[#050505] overflow-hidden font-mono text-xs select-text shadow-sm" id={`code-block-${language}`}>
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090909] border-b border-[#1F1F1F] select-none" id="code-header">
        <div className="flex items-center gap-2" id="code-lang-indicator">
          <span className="text-gray-500 text-[10px] uppercase font-mono tracking-tight">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          id="copy-code-btn"
          className="text-[10px] text-gray-400 hover:text-white transition-all cursor-pointer font-sans bg-transparent hover:underline focus:outline-none"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>

      {/* Code Body with Line Numbering and Premium Colors */}
      <div className="flex overflow-x-auto p-4 leading-relaxed scrollbar-thin" id="code-body-wrapper">
        {/* Line numbers spacing column */}
        <div className="text-neutral-600 select-none text-right pr-4 border-r border-[#1F1F1F]/60 space-y-1" id="code-ln-numbers">
          {lines.map((_, idx) => (
            <div key={idx} className="h-5" id={`ln-${idx + 1}`}>{idx + 1}</div>
          ))}
        </div>
        {/* Code Content Column */}
        <pre className="pl-4 flex-1 text-blue-300 whitespace-pre overflow-x-visible space-y-1 font-mono hover:text-blue-200 transition-colors" id="pre-code-content">
          {lines.map((line, idx) => (
            <div key={idx} className="h-5 inline-block min-w-full hover:bg-[#111111]/45 px-1 rounded transition-colors" id={`line-content-${idx}`}>
              <code>{line || ' '}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
