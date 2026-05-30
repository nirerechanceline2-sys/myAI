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
