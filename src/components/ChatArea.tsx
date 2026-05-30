import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Trash2, ArrowRightLeft, ChevronDown, Check, Shield, Search, Zap, Rocket, PanelLeft, Share2 } from 'lucide-react';
import { Conversation, Message, Theme } from '../types';
import MessageItem from './MessageItem';
import EmptyState from './EmptyState';

interface ChatAreaProps {
  conversation: Conversation | null;
  isGenerating: boolean;
  onSelectPrompt: (promptText: string) => void;
  onClearHistory: () => void;
  theme: Theme;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onEditMessage?: (id: string, newContent: string) => void;
}

const MODELS = [
  { 
    id: 'gpt-4o', 
    name: 'AI Assistant 4o', 
    desc: 'Great for everyday tasks, image synthesis and complex analytical queries.', 
    icon: <Sparkles className="w-4 h-4 text-[#10a37f]" />,
    badge: 'DEFAULT'
  },
  { 
    id: 'o1-pro', 
    name: 'o1 Pro Mode', 
    desc: 'Advanced reasoning and step-by-step logic. Ideal for coding and complex math.', 
    icon: <Zap className="w-4 h-4 text-purple-400" />,
    badge: 'REASONING'
  },
  { 
    id: 'gpt-4', 
    name: 'GPT-4 Legacy', 
    desc: 'High-capability legacy model. Slower but robust conversational partner.', 
    icon: <Rocket className="w-4 h-4 text-[#10a37f]/70" />
  },
  { 
    id: 'gpt-3.5', 
    name: 'GPT-3.5 Turbo', 
    desc: 'Legacy speed model, responding instantly to standard trivia and requests.', 
    icon: <Shield className="w-4 h-4 text-neutral-500" />
  }
];

export default function ChatArea({
  conversation,
  isGenerating,
  onSelectPrompt,
  onClearHistory,
  theme,
  onToggleSidebar,
  sidebarOpen,
  onEditMessage
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Auto scroll to bottom during conversation generation or when new messages appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isGenerating]);

  const messages = conversation?.messages || [];
  const latestMessage = messages[messages.length - 1];
  const isCurrentlyStreamingText = latestMessage?.role === 'assistant' && latestMessage?.isStreaming;

  return (
    <div 
      className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#212121]' : 'bg-white'
      }`} 
      id="chat-workspace-area"
    >
      {/* Dynamic Header Bar resembling ChatGPT's styled layout */}
      <header 
        className={`flex items-center justify-between px-4 py-3 border-b select-none h-[60px] ${
          theme === 'dark' 
            ? 'border-neutral-800/10 bg-[#212121]' 
            : 'border-neutral-200/60 bg-white'
        } z-30`} 
        id="chat-area-header"
      >
        <div className="flex items-center gap-2" id="header-left">
          {/* Sidebar expand toggle button - visible when sidebar is collapsed */}
          {!sidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg transition-all cursor-pointer focus:outline-none ${
                theme === 'dark' ? 'hover:bg-[#2f2f2f] text-neutral-400 hover:text-neutral-200' : 'hover:bg-neutral-100/90 text-neutral-600 hover:text-neutral-900'
              }`}
              title="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* Model selection Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 cursor-pointer focus:outline-none border border-transparent ${
                theme === 'dark' 
                  ? 'text-neutral-250 hover:bg-[#2f2f2f]' 
                  : 'text-neutral-800 hover:bg-neutral-100'
              }`}
              id="model-dropdown-trigger"
            >
              <span className="font-sans text-[15px] font-medium tracking-tight">
                {activeModel.name}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>

            {/* AI Model Popover Selector Dropdown */}
            {showModelDropdown && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowModelDropdown(false)} />
                <div className={`absolute left-0 mt-2 w-[340px] rounded-2xl border p-2 shadow-2xl z-50 animate-fade-in ${
                  theme === 'dark' 
                    ? 'bg-[#2f2f2f] border-neutral-700/60 text-[#ececec]' 
                    : 'bg-white border-neutral-200 text-neutral-800'
                }`} id="model-popover">
                  <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-neutral-500 font-sans border-b border-neutral-800/20 mb-2 select-none uppercase">
                    Model Workspace Selector
                  </div>
                  <div className="space-y-1">
                    {MODELS.map((model) => {
                      const isActive = model.id === activeModel.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            setActiveModel(model);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl text-left cursor-pointer transition-all ${
                            isActive 
                              ? theme === 'dark' ? 'bg-[#212121]' : 'bg-neutral-100' 
                              : theme === 'dark' ? 'hover:bg-[#212121]/55' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg flex-shrink-0 bg-neutral-800/10 dark:bg-neutral-900/30">
                            {model.icon}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold font-sans">{model.name}</span>
                              {model.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 uppercase tracking-widest scale-90">
                                  {model.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] leading-relaxed text-neutral-400 font-sans">
                              {model.desc}
                            </p>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Header Options on general right */}
        <div className="flex items-center gap-2" id="header-right-action">
          {conversation && messages.length > 0 && (
            <button
              onClick={onClearHistory}
              id="clear-chat-history-btn"
              className={`text-xs ml-1 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all focus:outline-none ${
                theme === 'dark' 
                  ? 'text-neutral-400 hover:bg-[#2f2f2f] hover:text-red-400' 
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-red-500'
              }`}
              title="Wipe conversation logs"
            >
              Reset Chat
            </button>
          )}
        </div>
      </header> 

      {/* Main Workspace Scroll View */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-thin pb-32"
        id="messages-scroll-viewport"
      >
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSelectPrompt} theme={theme} />
        ) : (
          <div className="max-w-[700px] mx-auto w-full flex flex-col gap-8" id="message-bubbles-list">
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} theme={theme} onEditMessage={onEditMessage} />
            ))}

            {/* Premium AI Assistant Thinking Loader */}
            {isGenerating && !isCurrentlyStreamingText && (
              <div
                id="thinking-loader"
                className={`flex gap-4 p-5 md:p-6 rounded-2xl mr-auto max-w-[85%] self-start border border-transparent`}
              >
                <div className="flex-1 space-y-1 pt-1 ml-0.5">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-sans tracking-tight">
                    <span className={`font-semibold ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-800'}`}>AI Assistant</span>
                    <span>•</span>
                    <span>Verifying and reasoning</span>
                  </div>
                  {/* Glowing typing dots loading visualizer inline */}
                  <div className="flex items-center gap-1.5 pt-2" id="typing-loader-bubbles">
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-dots-1" />
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-dots-2" />
                    <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-dots-3" />
                  </div>
                </div>
              </div>
            )}

            {/* Scroll bottom helper point */}
            <div ref={bottomRef} id="scroll-bottom-anchor" />
          </div>
        )}
      </div>
    </div>
  );
}
