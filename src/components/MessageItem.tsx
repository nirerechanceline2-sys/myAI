import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { Copy, Check, Sparkles, User, AlertCircle, FileText, Volume2, VolumeX, ThumbsUp, ThumbsDown, Pencil } from 'lucide-react';
import { Message, Theme } from '../types';
import CodeBlock from './CodeBlock';
import DataVisualizer from './DataVisualizer';
import MathSolverPanel from './MathSolverPanel';
import ImageGeneratorResult from './ImageGeneratorResult';

interface MessageItemProps {
  message: Message;
  theme: Theme;
  onEditMessage?: (id: string, newContent: string) => void;
}

export default function MessageItem({ message, theme, onEditMessage }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);
  const isAssistant = message.role === 'assistant';

  // Keep editedText synced if message content updates externally
  useEffect(() => {
    setEditedText(message.content);
  }, [message.content]);

  // Cleanup speech synthesis on unmount to prevent lingering speech
  useEffect(() => {
    return () => {
      if (isAssistant) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isAssistant]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message", err);
    }
  };

  const handleToggleSpeak = () => {
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    } else {
      window.speechSynthesis.cancel();
      
      // Filter clean text to speak (skip code blocks and major formatting)
      const cleanText = message.content
        .replace(/```[\s\S]*?```/g, '') // remove code blocks
        .replace(/`([^`]+)`/g, '$1') // inline styling
        .replace(/[*#_\-\[\]()]+/g, '') // markdown symbols
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlayingVoice(true);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (!disliked) setLiked(false);
  };

  const handleSaveEdit = () => {
    if (editedText.trim() && editedText !== message.content) {
      if (onEditMessage) {
        onEditMessage(message.id, editedText);
      } else {
        message.content = editedText;
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(message.content);
    setIsEditing(false);
  };

  // Convert size into standard human-readable text
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      id={`message-container-${message.id}`}
      className={`flex gap-4 p-4 md:p-5 transition-all duration-200 ${
        isAssistant
          ? 'bg-transparent border-transparent'
          : theme === 'dark'
            ? 'bg-[#2f2f2f] text-[#ececec] rounded-3xl p-4 px-5 max-w-[85%] sm:max-w-[75%] ml-auto flex-row-reverse shadow-sm'
            : 'bg-[#f4f4f4] text-neutral-900 rounded-[22px] p-4 px-5 max-w-[85%] sm:max-w-[75%] ml-auto flex-row-reverse shadow-xs'
      } mb-4`}
    >
      {/* Content column */}
      <div className="flex-1 min-w-0" id={`content-col-${message.id}`}>
        {/* Header Metadata (Removed entirely for user prompt per user request) */}
        {isAssistant && (
          <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500 font-sans tracking-tight select-none" id={`meta-row-${message.id}`}>
            <span className={`font-semibold capitalize ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-850'}`} id={`role-label-${message.id}`}>
              AI Assistant
            </span>
            <span className="text-neutral-600">•</span>
            <span id={`time-${message.id}`}>{message.timestamp}</span>
          </div>
        )}

        {/* Text Area / Editing State */}
        <div className={`text-[15px] sm:text-[16px] leading-[1.625] ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-850'}`} id={`body-content-${message.id}`}>
          {isAssistant ? (
            <div className="markdown-body select-text text-left font-sans" id={`markdown-${message.id}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Inject custom code highlights component for blocks and styles for inline code
                  code(props: any) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = match || String(children).includes('\n');
                    if (isBlock) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : 'code'}
                          value={String(children).replace(/\n$/, '')}
                        />
                      );
                    }
                    return (
                      <code className={`px-1.5 py-0.5 rounded font-mono text-xs border ${
                        theme === 'dark'
                          ? 'bg-[#050505] text-neutral-200 border-[#1F1F1F]'
                          : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`} {...rest}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            /* User prompt layout supporting inline editing */
            isEditing ? (
              <div className="w-full flex flex-col gap-2.5 mt-1" id={`editor-container-${message.id}`}>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full text-[15px] sm:text-[16px] leading-relaxed p-2.5 border border-neutral-250 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#10a37f] resize-y min-h-[60px] font-sans"
                  rows={2}
                />
                <div className="flex justify-end gap-1.5 text-xs select-none">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300 font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded-full bg-[#10a37f] text-white hover:bg-[#0d8a6a] font-semibold cursor-pointer transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col" id={`user-prompt-wrap-${message.id}`}>
                <div className="select-text whitespace-pre-wrap text-left py-0.5 text-[15px] sm:text-[16px] leading-[1.625] font-medium font-sans text-neutral-900" id={`text-${message.id}`}>
                  {message.content}
                </div>
                
                {/* Action controls inside the user bubble: edit and copy icons */}
                <div className="mt-2.5 pt-1.5 border-t border-neutral-200/40 flex items-center justify-end gap-2.5 text-neutral-500 hover:text-neutral-800 select-none transition-colors">
                  {/* Copy user prompt */}
                  <button
                    onClick={handleCopyText}
                    className="p-1 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer focus:outline-none"
                    title="Copy user query"
                    id={`copy-user-btn-${message.id}`}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" id={`icon-copied-${message.id}`} />
                    ) : (
                      <Copy className="w-3.5 h-3.5 stroke-[2]" id={`icon-copy-${message.id}`} />
                    )}
                  </button>
                  
                  {/* Edit user prompt */}
                  <button
                    onClick={() => {
                      setEditedText(message.content);
                      setIsEditing(true);
                    }}
                    className="p-1 rounded hover:bg-neutral-200 hover:text-neutral-900 transition-colors cursor-pointer focus:outline-none"
                    title="Edit user query"
                    id={`edit-user-btn-${message.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2]" id={`icon-edit-${message.id}`} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Custom Visual Panels based on Message customType metadata */}
        {isAssistant && message.customType === 'chart' && message.chartData && (
          <DataVisualizer 
            data={message.chartData} 
            config={message.chartConfig || { type: 'bar', xKey: 'label', yKeys: ['value'] }} 
            theme={theme} 
          />
        )}

        {isAssistant && message.customType === 'math' && message.mathExpression && (
          <MathSolverPanel
            expression={message.mathExpression}
            result={message.mathResult || ''}
            steps={message.mathSteps || []}
            plotPoints={message.mathPlotPoints}
            theme={theme}
          />
        )}

        {isAssistant && message.customType === 'image' && (
          <ImageGeneratorResult
            prompt={message.content.replace(/^\/image\s+/i, '').trim() || 'Synthetic Art'}
            imageUrl={message.imageResultUrl}
            isError={message.isError}
            theme={theme}
          />
        )}

        {/* Render simulated file attachments if they were submitted alongside the prompt */}
        {message.attachedFiles && message.attachedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-start" id={`attachments-${message.id}`}>
            {message.attachedFiles.map((file, fileIdx) => (
              <div
                key={fileIdx}
                id={`file-badge-${message.id}-${fileIdx}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs shadow-sm border ${
                  theme === 'dark'
                    ? 'bg-[#141414] border-[#1F1F1F] text-neutral-300'
                    : 'bg-neutral-100 border-neutral-250 text-neutral-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <div className="flex flex-col text-left font-sans select-none">
                  <span className={`font-medium max-w-[140px] truncate ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>{file.name}</span>
                  <span className="text-[10px] text-neutral-500">{formatSize(file.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer controls for assistant responses */}
        {isAssistant && !message.isStreaming && (
          <div className="mt-4 flex items-center gap-2 select-none" id={`actions-${message.id}`}>
            <button
              onClick={handleCopyText}
              id={`copy-bubble-btn-${message.id}`}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-sans text-xs focus:outline-none ${
                theme === 'dark'
                  ? 'border-transparent hover:border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200'
                  : 'border-neutral-200 hover:border-neutral-300 bg-neutral-55 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
              title="Copy message response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" id={`icon-copied-${message.id}`} />
                  <span className="text-emerald-400 font-medium font-sans">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" id={`icon-copy-${message.id}`} />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Like button */}
            <button
              onClick={handleLike}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-sans text-xs focus:outline-none ${
                liked
                  ? 'border-emerald-250 bg-emerald-50 text-emerald-600'
                  : theme === 'dark'
                    ? 'border-transparent hover:border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200'
                    : 'border-neutral-200 hover:border-neutral-300 bg-neutral-55 hover:bg-neutral-100 text-neutral-550 hover:text-neutral-800'
              }`}
              title="Like response"
              id={`like-btn-${message.id}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${liked ? 'fill-emerald-500 text-emerald-650' : ''}`} id={`icon-like-${message.id}`} />
              <span>{liked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Dislike button */}
            <button
              onClick={handleDislike}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-sans text-xs focus:outline-none ${
                disliked
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : theme === 'dark'
                    ? 'border-transparent hover:border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200'
                    : 'border-neutral-200 hover:border-neutral-300 bg-neutral-55 hover:bg-neutral-100 text-neutral-550 hover:text-neutral-800'
              }`}
              title="Dislike response"
              id={`dislike-btn-${message.id}`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${disliked ? 'fill-red-500 text-red-650' : ''}`} id={`icon-dislike-${message.id}`} />
              <span>{disliked ? 'Disliked' : 'Dislike'}</span>
            </button>

            <button
              onClick={handleToggleSpeak}
              id={`speak-bubble-btn-${message.id}`}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-sans text-xs focus:outline-none ${
                theme === 'dark'
                  ? 'border-transparent hover:border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200'
                  : 'border-neutral-200 hover:border-neutral-300 bg-neutral-55 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
              title={isPlayingVoice ? "Stop speaking aloud" : "Read aloud"}
            >
              {isPlayingVoice ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-blue-400 animate-pulse" id={`icon-mute-${message.id}`} />
                  <span className="text-blue-400 font-medium font-sans">Stop Speak</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" id={`icon-speak-${message.id}`} />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            {message.isError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/20 border border-red-900/60 rounded-lg px-2 py-1" id={`error-indicator-${message.id}`}>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>API Error / Incomplete</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
