import React from 'react';
import { Terminal, Image, BarChart2, Lightbulb } from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
  theme?: string;
}

export default function EmptyState({ onSelectPrompt, theme }: EmptyStateProps) {
  const starters = [
    {
      id: 'brainstorm',
      icon: <Lightbulb className="w-5 h-5 text-amber-500" id="icon-brainstorm" />,
      title: "Ask or brainstorm",
      description: "Ask a math equation, coding question, or fact.",
      prompt: "Can you explain the main differences between SQL and NoSQL databases in simple terms?"
    },
    {
      id: 'code',
      icon: <Terminal className="w-5 h-5 text-sky-500" id="icon-code" />,
      title: "Solve custom code query",
      description: "Write or explain a code snippet cleanly.",
      prompt: "Compose a beautiful helper function in TypeScript to parse formatted CSV files."
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-6 py-12 select-none" id="empty-state-container">
      {/* Signature Logo Emblem */}
      <div className="relative mb-6 group" id="chatgpt-emblem">
        <div className="absolute inset-0 bg-[#10a37f]/10 rounded-full blur-xl opacity-20" />
        
        {/* Rounded green background that mimics the official logo shape */}
        <div className="relative w-14 h-14 rounded-full bg-[#10a37f] flex items-center justify-center shadow-md cursor-pointer" id="emblem-inner">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            stroke="currentColor" 
            strokeWidth="1.6" 
            className="w-8 h-8 text-white"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.963 11.963 0 0012 5.006c-2.9 0-5.516 1.025-7.534 2.741m15.377 0c.563 1.144.873 2.428.873 3.78 0 4.97-4.03 9-9 9s-9-4.03-9-9c0-1.353.31-2.636.872-3.78m15.377 0l-3.376 3.376m-12.001 0l3.376-3.376" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mb-2 text-center font-sans" id="empty-state-title">
        AI Assistant
      </h1>
      <p className="text-sm text-neutral-500 mb-8 text-center max-w-sm font-sans" id="empty-state-subtitle">
        Ask a question to get a direct, direct-answering response.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-2" id="starters-grid">
        {starters.map((starter) => (
          <button
            key={starter.id}
            id={`starter-btn-${starter.id}`}
            onClick={() => onSelectPrompt(starter.prompt)}
            className="flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 group cursor-pointer focus:outline-none font-sans bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-xs"
          >
            <div className="flex items-center gap-2.5 mb-1.5" id={`starter-hdr-${starter.id}`}>
              <div className="p-1 rounded-md transition-colors" id={`starter-ico-box-${starter.id}`}>
                {starter.icon}
              </div>
              <span className="text-xs font-semibold text-neutral-800 group-hover:text-black transition-colors" id={`starter-title-${starter.id}`}>
                {starter.title}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 group-hover:text-neutral-700 leading-relaxed transition-colors" id={`starter-desc-${starter.id}`}>
              {starter.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
