import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Code, Eye, Play, RotateCcw, Sparkles } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [code, setCode] = useState(value);
  const [copied, setCopied] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'code' | 'playground'>('code');
  const [isEditing, setIsEditing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync state if message is streaming or changes externally
  useEffect(() => {
    if (!isEditing) {
      setCode(value);
    }
  }, [value, isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code to clipboard", err);
    }
  };

  const handleReset = () => {
    setCode(value);
    setPreviewKey(prev => prev + 1);
    setConsoleLogs([]);
  };

  const handleRun = () => {
    setPreviewKey(prev => prev + 1);
    setConsoleLogs([]);
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
      html: 'HTML Playground',
      css: 'CSS Stylesheet',
      json: 'JSON Data',
      rust: 'Rust',
      rs: 'Rust',
      go: 'Go',
      golang: 'Go',
      cpp: 'C++',
      c: 'C',
      java: 'Java',
      kotlin: 'Kotlin',
      swift: 'Swift',
      sql: 'SQL Query',
      yaml: 'YAML config',
      yml: 'YAML config',
      md: 'Markdown Docs',
    };
    return mapping[lang.toLowerCase()] || lang.toUpperCase();
  };

  // Custom VS Code Style Syntax Highlighter Tokenizer
  const highlightLine = (line: string, lang: string): React.ReactNode => {
    const l = lang.toLowerCase();
    
    // Empty line fallback
    if (!line) return <span>&nbsp;</span>;
    
    // Comments
    if (
      line.trim().startsWith('//') || 
      line.trim().startsWith('/*') || 
      (l === 'html' && line.trim().startsWith('<!--'))
    ) {
      return <span className="text-[#6a9955] italic font-mono">{line}</span>;
    }

    // HTML/XML/SVG
    if (l === 'html' || l === 'xml' || l === 'svg') {
      const tokens: React.ReactNode[] = [];
      const regex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9:-]+)|(\s+[a-zA-Z0-9:-]+=)|("[^"]*")|([^<>\s"]+|.)/g;
      let match;
      let index = 0;
      while ((match = regex.exec(line)) !== null) {
        const [all, comment, tag, attr, str, rest] = match;
        if (comment) {
          tokens.push(<span key={index++} className="text-[#6a9955] italic">{comment}</span>);
        } else if (tag) {
          tokens.push(<span key={index++} className="text-[#569cd6] font-semibold">{tag}</span>);
        } else if (attr) {
          tokens.push(<span key={index++} className="text-[#9cdcfe]">{attr}</span>);
        } else if (str) {
          tokens.push(<span key={index++} className="text-[#ce9178]">{str}</span>);
        } else {
          tokens.push(<span key={index++} className="text-[#d4d4d4]">{all}</span>);
        }
      }
      return <>{tokens}</>;
    }

    // JS/TS/JSX/TSX
    if (l === 'js' || l === 'ts' || l === 'jsx' || l === 'tsx' || l === 'javascript' || l === 'typescript') {
      const keywords = /^(const|let|var|function|return|import|from|export|default|class|extends|if|else|for|while|do|switch|case|break|continue|new|try|catch|finally|throw|async|await|type|interface|enum|public|private|protected|readonly|typeof|instanceof|void|any|string|number|boolean|null|undefined|true|false)$/;
      const tokens: React.ReactNode[] = [];
      const regex = /(\/\/.*)|(".*?"|'.*?'|`.*?`)|(\b\d+\b)|(\b[a-zA-Z_]\w*\b)|([{}()\[\].,:;=+\-*\/&|!<>?~%^]+)|(\s+)/g;
      let match;
      let index = 0;
      while ((match = regex.exec(line)) !== null) {
        const [all, inlineComment, str, num, word, op, space] = match;
        if (inlineComment) {
          tokens.push(<span key={index++} className="text-[#6a9955] italic">{inlineComment}</span>);
        } else if (str) {
          tokens.push(<span key={index++} className="text-[#ce9178]">{str}</span>);
        } else if (num) {
          tokens.push(<span key={index++} className="text-[#b5cea8]">{num}</span>);
        } else if (word) {
          if (keywords.test(word)) {
            tokens.push(<span key={index++} className="text-[#c586c0] font-semibold">{word}</span>);
          } else if (word[0] === word[0].toUpperCase() && isNaN(Number(word[0]))) {
            tokens.push(<span key={index++} className="text-[#4ec9b0]">{word}</span>);
          } else {
            tokens.push(<span key={index++} className="text-[#9cdcfe]">{word}</span>);
          }
        } else if (op) {
          tokens.push(<span key={index++} className="text-[#d8d8d8] opacity-80">{op}</span>);
        } else {
          tokens.push(<span key={index++}>{all}</span>);
        }
      }
      return <>{tokens}</>;
    }

    // CSS
    if (l === 'css') {
      const tokens: React.ReactNode[] = [];
      const regex = /(\/\*[\s\S]*?\*\/)|([^{:\s]+)(?=\s*\{)|([a-zA-Z-]+\s*:)|([^}\s:]+)|(\s+)/g;
      let match;
      let index = 0;
      while ((match = regex.exec(line)) !== null) {
        const [all, comment, selector, prop, val, space] = match;
        if (comment) {
          tokens.push(<span key={index++} className="text-[#6a9955] italic">{comment}</span>);
        } else if (selector) {
          tokens.push(<span key={index++} className="text-[#d7ba7d] font-semibold">{selector}</span>);
        } else if (prop) {
          tokens.push(<span key={index++} className="text-[#9cdcfe]">{prop}</span>);
        } else if (val) {
          tokens.push(<span key={index++} className="text-[#ce9178]">{val}</span>);
        } else {
          tokens.push(<span key={index++} className="text-[#d4d4d4]">{all}</span>);
        }
      }
      return <>{tokens}</>;
    }

    // Fallback Highlight (C, C++, Rust, Python, Go etc.)
    const tokens: React.ReactNode[] = [];
    const keywords = /^(def|class|return|if|else|elif|for|while|import|from|as|try|except|with|print|select|insert|update|delete|where|from|join|on|fn|let|mut|pub|struct|impl|use|match)$/;
    const regex = /(\/\/.*|#.*)|(".*?"|'.*?'|`.*?`)|(\b\d+\b)|(\b\w+\b)|([{}()\[\].,:;=+\-*\/&|!<>?~%^]+)|(\s+)/g;
    let match;
    let index = 0;
    while ((match = regex.exec(line)) !== null) {
      const [all, comment, str, num, word, op, space] = match;
      if (comment) {
        tokens.push(<span key={index++} className="text-[#6a9955] italic">{comment}</span>);
      } else if (str) {
        tokens.push(<span key={index++} className="text-[#ce9178]">{str}</span>);
      } else if (num) {
        tokens.push(<span key={index++} className="text-[#b5cea8]">{num}</span>);
      } else if (word) {
        if (keywords.test(word)) {
          tokens.push(<span key={index++} className="text-[#c586c0] font-semibold">{word}</span>);
        } else {
          tokens.push(<span key={index++} className="text-[#9cdcfe]">{word}</span>);
        }
      } else if (op) {
        tokens.push(<span key={index++} className="text-[#d4d4d4] opacity-80">{op}</span>);
      } else {
        tokens.push(<span key={index++}>{all}</span>);
      }
    }
    return <>{tokens}</>;
  };

  // Determine if code is executable in the preview playground (W3Schools style)
  const isRunnable = ['html', 'js', 'css', 'javascript', 'typescript', 'tsx', 'jsx', 'svg'].includes(language.toLowerCase());

  // Aggregate standard srcdoc markup to feed preview iframe
  const getIframeSource = () => {
    const l = language.toLowerCase();
    if (l === 'html' || l === 'svg') {
      return code;
    }
    if (l === 'css') {
      return `<style>${code}</style><div className="styled-container"><h3>CSS Sandbox</h3><p>Your styles have been loaded inside this sandboxed container.</p></div>`;
    }
    // JS/TS code execution wrap
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 18px; 
            margin: 0; 
            background: #ffffff; 
            color: #171717; 
            font-size: 14px;
            line-height: 1.5;
          }
          pre { background: #f4f4f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; }
        </style>
        <script>
          // Intercept user console logs to show in console box
          const _log = console.log;
          console.log = function(...args) {
            _log(...args);
            window.parent.postMessage({
              type: 'CONSOLE_LOG',
              text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')
            }, '*');
          };
          window.onerror = function(message, source, lineno, colno, error) {
            window.parent.postMessage({
              type: 'CONSOLE_ERROR',
              text: 'Error in line ' + lineno + ': ' + message
            }, '*');
            return false;
          };
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          try {
            ${code}
          } catch(err) {
            console.log("Runtime Execution Error: " + err.message);
          }
        </script>
      </body>
      </html>
    `;
  };

  // Watch for messages from safe iframe logs
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, `[Log] ${e.data.text}`]);
      } else if (e.data && e.data.type === 'CONSOLE_ERROR') {
        setConsoleLogs(prev => [...prev, `[System Error] ${e.data.text}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const lines = code.split('\n');

  return (
    <div 
      className="my-5 rounded-2xl border border-neutral-200 bg-white overflow-hidden font-mono text-xs select-text shadow-sm" 
      id={`code-block-container-${language}`}
    >
      {/* Dynamic Header Tab switching */}
      <div 
        className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 select-none" 
        id="code-header"
      >
        <div className="flex items-center gap-1.5" id="code-left-controls">
          {/* Active Mode Tabs */}
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'code'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-150'
            }`}
            id="tab-view-code"
          >
            <Code className="w-3.5 h-3.5" />
            <span>VS Code Viewer</span>
          </button>

          {isRunnable && (
            <button
              onClick={() => {
                setActiveTab('playground');
                setIsEditing(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'playground'
                  ? 'bg-[#10a37f] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-emerald-600 hover:bg-neutral-150'
              }`}
              id="tab-playground"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>W3Schools Playground</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3" id="code-right-controls">
          {/* Edit status indicator */}
          {activeTab === 'playground' && (
            <span className="text-[10px] text-[#10a37f] font-sans font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-ping" />
              LIVE WRITING MODE
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-150 text-[11px] font-sans font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer focus:outline-none transition-colors"
              title="Copy current code"
              id="btn-copy-code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-150 text-[11px] font-sans font-medium text-neutral-500 hover:text-neutral-900 cursor-pointer focus:outline-none transition-colors"
              title="Revert to AI original code"
              id="btn-reset-code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'code' ? (
        /* Read-only Beautiful Screen mimicking VS Code Editor styling */
        <div className="bg-[#1E1E1E] text-[#D4D4D4] p-0 font-mono text-[13px] relative selection:bg-[#264F78]">
          {/* File Tab representation */}
          <div className="flex items-center gap-1 bg-[#181818] border-b border-[#2d2d2d]/30 px-4 py-1.5 select-none" id="vs-file-tab">
            <span className="w-2 h-2 rounded-full bg-[#e81123]/80" />
            <span className="w-2 h-2 rounded-full bg-[#ffd700]/80" />
            <span className="w-2 h-2 rounded-full bg-[#00b22d]/80" />
            <span className="text-neutral-450 text-[11px] ml-2 font-mono tracking-wide">
              sandbox.{language.toLowerCase()} — VS Code Editor
            </span>
          </div>

          <div className="flex overflow-x-auto p-4 leading-[20px] scrollbar-thin" id="code-body-wrapper">
            {/* Line numbers column */}
            <div className="text-[#5a5a5a] select-none text-right pr-4 border-r border-[#2d2d2d] space-y-0.5" id="code-ln-numbers">
              {lines.map((_, idx) => (
                <div key={idx} className="h-[20px]" id={`ln-${idx + 1}`}>{idx + 1}</div>
              ))}
            </div>
            {/* Syntax colored content column */}
            <pre className="pl-4 flex-1 whitespace-pre overflow-x-visible space-y-0.5 font-mono" id="pre-code-content">
              {lines.map((line, idx) => (
                <div key={idx} className="h-[20px] inline-block min-w-full hover:bg-neutral-800/40 px-1 rounded transition-colors" id={`line-content-${idx}`}>
                  <code>{highlightLine(line, language)}</code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      ) : (
        /* W3Schools Try-it Live Writing Playground Arena */
        <div className="flex flex-col md:flex-row min-h-[460px] bg-neutral-100 p-3.5 gap-3.5" id="w3schools-playground">
          
          {/* WRITING WORKSPACE PANE (Left / Top) */}
          <div className="flex-1 flex flex-col bg-[#1E1E1E] border border-neutral-800 rounded-xl overflow-hidden shadow-xs" id="editor-left-workspace">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-neutral-800 select-none">
              <span className="text-[11px] font-sans font-bold text-neutral-300 tracking-wide flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-[#10a37f]" />
                Write Code Below
              </span>
              
              <button
                onClick={handleRun}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded bg-[#04AA6D] hover:bg-[#059862] text-white font-sans font-bold text-xs transition duration-150 cursor-pointer rounded-md shadow-xs active:scale-95 text-center focus:outline-none"
                title="Run to load Preview"
                id="run-playground-btn"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Run Output ▷</span>
              </button>
            </div>

            {/* Editable Textarea with live backing */}
            <div className="flex-1 flex relative font-mono text-[13px]" id="editor-textarea-wrapper">
              {/* Fake coding line metrics decoration */}
              <div className="w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 text-right pr-2 text-neutral-600 select-none space-y-1">
                {lines.map((_, i) => <div key={i} className="leading-6 h-6">{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-[#1E1E1E] text-[#D4D4D4] py-3 px-3 border-none outline-none focus:outline-none focus:ring-0 resize-none font-mono text-[13px] leading-6 min-h-[220px]"
                placeholder="// Type or replace code here..."
                id={`playground-textarea-${language}`}
              />
            </div>
          </div>

          {/* EXPERIMENTAL RENDER PREVIEW CUBE (Right / Bottom) */}
          <div className="flex-1 flex flex-col bg-white border border-neutral-200.5 rounded-xl overflow-hidden shadow-xs" id="preview-right-workspace">
            {/* Live frame header bar */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-50 border-b border-neutral-150 select-none">
              <span className="text-[11px] font-sans font-bold text-neutral-550 tracking-wide flex items-center gap-1.5 uppercase">
                <Eye className="w-3.5 h-3.5 text-neutral-450" />
                W3Schools Result Output:
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded bg-neutral-200 text-neutral-650 font-sans tracking-wide">
                SANDBOXED IFRAME
              </span>
            </div>

            {/* Sandbox Browser Viewport */}
            <div className="flex-1 bg-white min-h-[200px] relative flex flex-col" id="preview-viewport-box">
              <iframe
                ref={iframeRef}
                key={previewKey}
                title="W3Schools Code Arena Result Preview"
                srcDoc={getIframeSource()}
                referrerPolicy="no-referrer"
                sandbox="allow-scripts"
                className="w-full flex-1 border-none min-h-[250px]"
                id="w3schools-sandbox-iframe"
              />
              
              {/* Integrated Console Panel Logger */}
              {consoleLogs.length > 0 && (
                <div className="border-t border-neutral-200 bg-neutral-900 p-2.5 max-h-[140px] overflow-y-auto" id="sandbox-term">
                  <div className="text-[10px] font-bold text-neutral-400 font-sans mb-1 uppercase tracking-wide">Console Outputs:</div>
                  <div className="space-y-0.5 font-mono text-[11px]">
                    {consoleLogs.map((log, idx) => (
                      <div key={idx} className={log.startsWith('[System Error]') ? 'text-red-400' : 'text-neutral-200'}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
