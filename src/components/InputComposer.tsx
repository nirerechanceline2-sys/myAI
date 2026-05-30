import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, X, Paperclip, FileText, Square, Sparkles, Globe, Brain, Image as ImageIcon } from 'lucide-react';
import { AttachedFile, Theme, ChatMode } from '../types';

interface InputComposerProps {
  onSend: (text: string, files: AttachedFile[], mode: ChatMode) => void;
  disabled: boolean;
  theme: Theme;
  activeMode: ChatMode;
  setActiveMode: (mode: ChatMode) => void;
}

export default function InputComposer({ onSend, disabled, theme, activeMode, setActiveMode }: InputComposerProps) {
  const [text, setText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea to fit multiline prompts elegantly
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [text]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Initialize browser Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setText((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
          }
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition framework error:", e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      } catch (err) {
        console.warn("Speech API failed initialization:", err);
      }
    }
  }, []);

  const handleSend = () => {
    const trimmedText = text.trim();
    if ((!trimmedText && attachedFiles.length === 0) || disabled) return;
    onSend(trimmedText, attachedFiles, activeMode);
    setText('');
    setAttachedFiles([]);
    // Reset textarea height back to single line size
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Standard Enter sends, Shift+Enter inputs a standard newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newAttachments: AttachedFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      newAttachments.push({
        name: f.name,
        size: f.size,
        type: f.type,
        contentSnapshot: `Attached document metadata: ${f.name} (${f.type})`
      });
    }

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Recording voice transcription flow (STT)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsRecording(false);
    } else {
      if (recognition) {
        try {
          setIsRecording(true);
          recognition.start();
        } catch (e) {
          console.warn("Microphone focus blocked, running fallback simulation:", e);
          triggerRecordingFallback();
        }
      } else {
        triggerRecordingFallback();
      }
    }
  };

  const triggerRecordingFallback = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      // Select simulated text depending on active mode context
      const simulatedTranscripts: Record<ChatMode, string[]> = {
        general: [
          "Explain quantum computing fundamentals in three intuitive paragraphs.",
          "Write Python code to analyze the user log files uploaded above and summarize main actions.",
          "Compare the memory performance between dynamic linked libs vs static Rust compilations"
        ],
        image: [
          "A stunning futuristic cyberpunk clock tower in rain, oil painting style",
          "Golden sunset over Maldives beach, warm lens flare photography 8k content",
          "Procedural digital network map, glowing neon abstract particles"
        ],
        data: [
          "Fruit,Sales \n Apples,120 \n Bananas,240 \n Cherry,95 \n Dates,180 \n Grapes,290",
          "Year,Users \n 2023,1500 \n 2024,3400 \n 2025,6200 \n 2026,9800",
          "Performance metrics: CPU is 20, memory is 45, storage is 80, network is 12"
        ],
        math: [
          "y = x^2 - 4x + 3 find roots and plot",
          "Simplify formulas with algebraic evaluation: 3a + 5b - 2a + 2b",
          "Graph trigonometric wave equation y = sin(x) for grid limits -3 to 3"
        ]
      };
      
      const pool = simulatedTranscripts[activeMode] || simulatedTranscripts.general;
      const randomPrompt = pool[Math.floor(Math.random() * pool.length)];
      setText(randomPrompt);
    }, 2000);
  };

  const formatTimer = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const getPlaceholderText = () => {
    switch (activeMode) {
      case 'image':
        return 'Describe the image you want to synthesize (e.g. A gorgeous space turtle surfing neon waves...)';
      case 'data':
        return 'Paste CSV numbers or tabular summary log to visualize (e.g. Month,Sales \\n Jan,140 \\n Feb,200)...';
      case 'math':
        return 'Enter algebraic formula or math equation to solve & graph (e.g. y = x^2 - 4x + 3)...';
      default:
        return 'Ask anything... (Slash commands: /image, /visualize, /calculate)';
    }
  };

  const isSendDisabled = disabled || (text.trim().length === 0 && attachedFiles.length === 0);

  return (
    <div className="w-full relative" id="composer-outer">
      {/* File Attachment list badge panel rendered smoothly above the composer input */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 px-1 transition-all" id="composer-attachment-panel">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              id={`composer-attach-badge-${idx}`}
              className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-xs border ${
                theme === 'dark'
                  ? 'bg-[#141414] border-[#1F1F1F] text-neutral-350'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-medium max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-0.5 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-neutral-350 cursor-pointer focus:outline-none ml-1"
                id={`detach-btn-${idx}`}
              >
                <X className="w-3.5 h-3.5" id={`detach-icon-${idx}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden genuine HTML file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        id="composer-file-input"
        accept=".pdf,.docx,.doc,.txt,.csv,.json,.png,.jpg,.jpeg,.zip"
      />

      {/* Primary Input Panel */}
      <div
        className={`w-full rounded-[26px] p-2 px-3 transition-all duration-300 flex flex-col ${
          isRecording
            ? 'bg-emerald-950/10 border border-emerald-900/40'
            : theme === 'dark'
              ? 'bg-[#2f2f2f] border border-[#2f2f2f] focus-within:border-neutral-600/60 shadow-lg'
              : 'bg-[#f4f4f4] border border-transparent focus-within:border-neutral-350/50 shadow-sm'
        }`}
        id="composer-inner-box"
      >
        {isRecording ? (
          /* Mic Recording State View */
          <div className="flex items-center justify-between w-full h-[52px] px-2" id="voice-recording-ui">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className={`text-[13px] font-semibold font-sans tracking-tight ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Listening...
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {formatTimer(recordDuration)}
              </span>
            </div>

            {/* Audio visualization waves simulated */}
            <div className="flex items-center gap-1.5 mx-auto" id="voice-waveforms">
              <span className="w-0.5 h-3.5 bg-emerald-500 animate-pulse rounded" />
              <span className="w-0.5 h-5 bg-emerald-500 animate-bounce rounded" />
              <span className="w-0.5 h-2.5 bg-emerald-500 animate-pulse rounded" />
              <span className="w-0.5 h-6 bg-emerald-400 animate-bounce rounded" />
              <span className="w-0.5 h-4 bg-emerald-500 animate-pulse rounded" />
            </div>

            <button
              onClick={toggleRecording}
              className={`flex items-center gap-1 text-xs rounded-full px-3 py-1.5 cursor-pointer focus:outline-none border ${
                theme === 'dark'
                  ? 'text-neutral-400 hover:text-neutral-200 bg-[#212121] border-neutral-700 hover:border-neutral-600'
                  : 'text-neutral-600 hover:text-neutral-800 bg-neutral-200 border-neutral-300 hover:border-neutral-400'
              }`}
              id="stop-rec-btn"
            >
              <Square className="w-3 h-3 text-red-500 fill-red-500" />
              <span className="font-sans text-[11px] font-semibold">Transcribe</span>
            </button>
          </div>
        ) : (
          /* ChatGPT-style Container Layout: Text input at top, Action Bar at bottom */
          <div className="flex flex-col w-full" id="composer-inner-layout">
            
            {/* Top Row: Main input textarea box */}
            <div className="w-full flex" id="textarea-relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={getPlaceholderText()}
                className={`flex-1 w-full max-h-[180px] bg-transparent border-0 ring-0 focus:ring-0 outline-none text-[15px] sm:text-[16px] leading-relaxed py-2 px-1.5 resize-none scrollbar-thin overflow-y-auto focus:outline-none font-sans ${
                  theme === 'dark' ? 'text-[#ececec] placeholder-neutral-500' : 'text-neutral-900 placeholder-neutral-400 font-medium'
                }`}
                id="composer-textarea"
              />
            </div>

            {/* Bottom Row: Actions Bar resembling ChatGPT exactly */}
            <div className="flex items-center justify-between w-full pt-2 pb-0.5 px-0.5" id="composer-actions-row">
              
              {/* Left action tools (Attachment Plus, Search Toggle, Reasoning Toggle, Dall-E Image Toggle) */}
              <div className="flex items-center gap-1 sm:gap-1.5" id="left-actions-group">
                {/* Paperclip/Attach trigger button */}
                <button
                  onClick={triggerFileInput}
                  disabled={disabled}
                  className={`p-1.5 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus:outline-none ${
                    theme === 'dark'
                      ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      : 'hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Attach file"
                  id="clip-attachment-btn"
                >
                  <Paperclip className="w-[18px] h-[18px] stroke-[2]" />
                </button>

                {/* Web Search mode inline indicator */}
                <button
                  onClick={() => setActiveMode(activeMode === 'data' ? 'general' : 'data')}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer focus:outline-none border ${
                    activeMode === 'data'
                      ? 'bg-sky-500/10 border-sky-500/35 text-sky-400 font-semibold'
                      : theme === 'dark'
                        ? 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                        : 'border-transparent text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800'
                  }`}
                  title="Web Search"
                  id="web-search-toggle"
                >
                  <Globe className="w-[17px] h-[17px] stroke-[2]" />
                  <span className="text-[11px] font-semibold font-sans tracking-tight">Search</span>
                </button>

                {/* Deep Think / Reasoning Toggle */}
                <button
                  onClick={() => setActiveMode(activeMode === 'math' ? 'general' : 'math')}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-155 cursor-pointer focus:outline-none border ${
                    activeMode === 'math'
                      ? 'bg-purple-500/10 border-purple-500/35 text-purple-400 font-semibold'
                      : theme === 'dark'
                        ? 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                        : 'border-transparent text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800'
                  }`}
                  title="Reason"
                  id="reasoning-toggle"
                >
                  <Brain className="w-[17px] h-[17px] stroke-[2]" />
                  <span className="text-[11px] font-semibold font-sans tracking-tight">Reason</span>
                </button>

                {/* DALL-E Image Creator Toggle */}
                <button
                  onClick={() => setActiveMode(activeMode === 'image' ? 'general' : 'image')}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-155 cursor-pointer focus:outline-none border ${
                    activeMode === 'image'
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-450 font-semibold'
                      : theme === 'dark'
                        ? 'border-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                        : 'border-transparent text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800'
                  }`}
                  title="DALL-E Image Creator"
                  id="dalle-toggle"
                >
                  <ImageIcon className="w-[17px] h-[17px] stroke-[2]" />
                  <span className="text-[11px] font-semibold font-sans tracking-tight">DALL-E</span>
                </button>
              </div>

              {/* Right action tools (Mic, Send circular button) */}
              <div className="flex items-center gap-2" id="right-actions-group">
                {/* Voice Input Mic */}
                <button
                  onClick={toggleRecording}
                  disabled={disabled}
                  className={`p-1.5 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus:outline-none ${
                    theme === 'dark'
                      ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      : 'hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Record Voice Prompt"
                  id="mic-voice-btn"
                >
                  <Mic className="w-[17px] h-[17px] stroke-[2]" />
                </button>

                {/* Send circular icon button - fits ChatGPT exactly */}
                <button
                  onClick={handleSend}
                  disabled={isSendDisabled}
                  className={`p-1.5 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none cursor-pointer ${
                    isSendDisabled
                      ? theme === 'dark'
                        ? 'bg-[#191919]/50 text-neutral-600 opacity-30 cursor-not-allowed scale-95'
                        : 'bg-neutral-200 text-[#a0a0a0] opacity-35 cursor-not-allowed scale-95'
                      : theme === 'dark'
                        ? 'bg-white text-neutral-900 hover:opacity-90 transform scale-100 active:scale-95'
                        : 'bg-black text-white hover:opacity-90 transform scale-100 active:scale-95'
                  }`}
                  id="send-arrow-btn"
                >
                  <ArrowUp className="w-[17px] h-[17px] stroke-[3.2] text-current" />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
      <div className={`text-[10px] text-center mt-2.5 font-sans select-none tracking-tight ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-450'}`}>
        ChatGPT can make mistakes. Verify important info.
      </div>
    </div>
  );
}
