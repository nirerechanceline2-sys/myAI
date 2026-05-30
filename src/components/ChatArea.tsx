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
  onRegenerate?: (messageId: string) => void;
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
  onEditMessage,
  onRegenerate
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
      {/* Floating absolute controls replacing the static navbar with 'AI Assistant' model info */}
      {!sidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className={`absolute top-4 left-4 z-40 p-2.5 rounded-xl transition-all border shadow-sm cursor-pointer focus:outline-none ${
            theme === 'dark' 
              ? 'bg-[#2a2a2a] border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-800' 
              : 'bg-white border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50 shadow-xs'
          }`}
          title="Open sidebar"
          id="reveal-sidebar-btn"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {conversation && messages.length > 0 && (
        <button
          onClick={onClearHistory}
          id="clear-chat-history-btn"
          className={`absolute top-4 right-4 z-40 text-xs px-3.5 py-2 rounded-xl font-medium tracking-tight border shadow-xs cursor-pointer transition-all focus:outline-none ${
            theme === 'dark' 
              ? 'bg-[#2a2a2a] border-neutral-700/60 text-neutral-300 hover:text-red-400 hover:bg-neutral-800' 
              : 'bg-white border-neutral-200 text-neutral-600 hover:text-red-500 hover:bg-neutral-50 shadow-xs'
          }`}
          title="Wipe conversation logs"
        >
          Reset Chat
        </button>
      )}

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
              <MessageItem key={message.id} message={message} theme={theme} onEditMessage={onEditMessage} onRegenerate={onRegenerate} />
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
