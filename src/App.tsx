import React, { useState, useEffect } from 'react';
import { Conversation, Message, AttachedFile, Theme, ChatMode } from './types';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputComposer from './components/InputComposer';

const STORAGE_CHATS_KEY = 'manus_ai_conversations';
const STORAGE_THEME_KEY = 'manus_ai_view_theme';
const STORAGE_SIDEBAR_KEY = 'manus_ai_sidebar_open';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [activeMode, setActiveMode] = useState<ChatMode>('general');

  // Load state from localStorage on build load
  useEffect(() => {
    try {
      const storedConversations = localStorage.getItem(STORAGE_CHATS_KEY);
      if (storedConversations) {
        const parsed = JSON.parse(storedConversations);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Local storage sync read fail:", e);
    }

    try {
      const storedSidebar = localStorage.getItem(STORAGE_SIDEBAR_KEY);
      if (storedSidebar !== null) {
        setSidebarOpen(storedSidebar === 'true');
      }
    } catch (e) {
      console.error("Sidebar preference sync fail:", e);
    }
  }, []);

  // Sync state modifications back to local storage automatically
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(conversations));
    } else {
      localStorage.removeItem(STORAGE_CHATS_KEY);
    }
  }, [conversations]);

  const handleToggleTheme = () => {
    // Locked to light theme
  };

  const handleToggleSidebar = () => {
    const nextState = !sidebarOpen;
    setSidebarOpen(nextState);
    localStorage.setItem(STORAGE_SIDEBAR_KEY, String(nextState));
  };

  // Create a new conversation container empty
  const handleNewConversation = () => {
    // If we have an empty conversation already active, don't create duplicate
    const activeChat = conversations.find((c) => c.id === activeConversationId);
    if (activeChat && activeChat.messages.length === 0) {
      setSidebarOpen(true); // make sure sidebar is expanded
      return;
    }

    const newId = `chat_${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveConversationId(newId);
    setSidebarOpen(true);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // On mobile screens, automatically fold the sidebar overlay when switching.
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    
    if (activeConversationId === id) {
      if (filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else {
        setActiveConversationId(null);
      }
    }
  };

  const handleClearActiveHistory = () => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: [],
            lastActiveAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                return { ...m, content: newContent };
              }
              return m;
            })
          };
        }
        return c;
      })
    );
  };

  // Submit trigger
  const handleSendMessage = async (text: string, files: AttachedFile[], requestedMode: ChatMode = activeMode) => {
    if ((!text.trim() && files.length === 0) || isGenerating) return;

    // Detect slash commands and automatically adjust operational mode
    let finalMode = requestedMode;
    let cleanText = text.trim();

    if (cleanText.startsWith('/image ') || cleanText === '/image' || cleanText.startsWith('/generate ')) {
      finalMode = 'image';
      cleanText = cleanText.replace(/^\/(image|generate)\s*/i, '').trim();
    } else if (cleanText.startsWith('/visualize ') || cleanText === '/visualize' || cleanText.startsWith('/chart ')) {
      finalMode = 'data';
      cleanText = cleanText.replace(/^\/(visualize|chart)\s*/i, '').trim();
    } else if (cleanText.startsWith('/calculate ') || cleanText === '/calculate' || cleanText.startsWith('/math ') || cleanText.startsWith('/solve ')) {
      finalMode = 'math';
      cleanText = cleanText.replace(/^\/(calculate|math|solve)\s*/i, '').trim();
    }

    if (!cleanText && files.length === 0) return;

    // 1. Resolve active conversation state setup
    let currentId = activeConversationId;
    let targetConversation = conversations.find((c) => c.id === currentId);

    const promptMessageContent = text.trim() || `Uploaded files: ${files.map(f => f.name).join(', ')}`;

    // Create the standard user message payload
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: promptMessageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles: files.length > 0 ? files : undefined
    };

    // If no existing active chat room, create one lazily
    if (!currentId || !targetConversation) {
      currentId = `chat_${Date.now()}`;
      targetConversation = {
        id: currentId,
        title: text.trim().slice(0, 24) || 'New Chat',
        messages: [userMessage],
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      setConversations((prev) => [targetConversation!, ...prev]);
      setActiveConversationId(currentId);
    } else {
      // Append user message to active chat
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: [...c.messages, userMessage],
              lastActiveAt: new Date().toISOString()
            };
          }
          return c;
        })
      );
    }

    // 2. Setup streaming placeholder responses
    const assistantMessageId = `msg_${Date.now() + 1}_assistant`;
    const emptyAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: finalMode === 'image' ? `Synthesizing conceptual image render for: "${cleanText}"` : '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      customType: finalMode === 'image' ? 'image' : 'standard'
    };

    // Update state to render standard thinking loader UI element
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, emptyAssistantMessage]
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    const updatedHistory = [
      ...targetConversation.messages,
      userMessage
    ];

    // Trigger title auto-summarizer in parallel on first user submission
    const shouldGenerateTitle = targetConversation.messages.length === 0;
    if (shouldGenerateTitle) {
      triggerTitleGeneration(currentId, userMessage.content);
    }

    // 3. Initiate full-stack requests based on finalMode
    if (finalMode === 'image') {
      try {
        const imgResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanText, aspectRatio: '1:1' })
        });

        if (!imgResponse.ok) {
          throw new Error(`HTTP Error Status ${imgResponse.status}`);
        }

        const imgData = await imgResponse.json();
        
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      isStreaming: false,
                      isError: !imgData.success,
                      imageResultUrl: imgData.success ? imgData.imageUrl : undefined,
                      content: imgData.success 
                        ? `Magnificent custom digital render succeeded for: "${cleanText}"`
                        : `Digital image construction failed due to standard tier credentials or quota. Procedural design canvas fallback generated below.`
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        );

      } catch (err: any) {
        console.error("Direct image trigger exception:", err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      isStreaming: false,
                      content: `Procedural design canvas fallback generated below. (Standard Gemini image models are available on active bills).`
                    };
                  }
                  return m;
                })
              };
            }
            return c;
          })
        );
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // If text chatbot stream (General, Data Analyst, or Math Solver)
    try {
      let activeSystemInstruction = "You are AI Assistant, a clean, minimal chatbot designed to strictly answer only the user's question directly, clearly, and concisely without extra greeting or chit-chat. Deliver elegant, factual responses.";

      if (finalMode === 'data') {
        activeSystemInstruction = `You are AI Assistant Data Analyst, an expert data scientist and visualizer.
When the user supplies tabular data, comma-separated values, lists of stats, or asks for a chart:
1. Provide a direct, short analytical answer to the user's question.
2. ALWAYS output at the very end of your response a clean markdown JSON block describing the dataset so we can plot it.
Structure the JSON block strictly as follows (do NOT put extra notes inside this block):
\`\`\`json
{
  "type": "chart",
  "chartType": "bar", // can be line, area, bar, or pie
  "title": "Clear descriptive title",
  "xKey": "label", // key in data representing x-axis labels (e.g. Month, Fruit, Name)
  "yKeys": ["value"], // string keys representing numerical values
  "data": [
    { "label": "Q1", "value": 150 },
    { "label": "Q2", "value": 240 }
  ]
}
\`\`\`
Ensure keys in 'data' are standard, lower-cased properties. Wrap numeric values in valid integers or floats.`;
      } else if (finalMode === 'math') {
        activeSystemInstruction = `You are AI Assistant Math Solver, an advanced algebraic calculator and tutor.
When the user inputs a formula, expression, equation, or asks to simplify or graph:
1. Provide a beautiful, easy-to-read, step-by-step direct mathematical answer.
2. ALWAYS output at the very end of your response a clean markdown JSON block describing the simplified result and coordinates to render a 2D line graph.
Structure the JSON block strictly as follows:
\`\`\`json
{
  "type": "math",
  "expression": "y = x^2 - 4x + 3", // original or equation solved
  "result": "Roots: x=1, x=3", // brief summary answer
  "steps": [
    "Step 1: Write down quadratic coefficients a=1, b=-4, c=3",
    "Step 2: Factorize into (x-1)(x-3) = 0",
    "Step 3: Solve roots x = 1 and x = 3"
  ],
  "plotPoints": [
    { "x": -1, "y": 8 },
    { "x": 0, "y": 3 },
    { "x": 1, "y": 0 },
    { "x": 2, "y": -1 },
    { "x": 3, "y": 0 },
    { "x": 4, "y": 3 }
  ]
}
\`\`\`
Provide at least 5 to 10 coordinates in 'plotPoints' to draw a smooth, continuous line curve mapping the math equation.`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedHistory,
          systemInstruction: activeSystemInstruction
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({}));
        throw new Error(errorDetails.error || `HTTP fail status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        throw new Error("Unable to establish standard connection reader.");
      }

      let done = false;
      let accumulatedResponseText = '';
      let streamBuffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          streamBuffer += decoder.decode(value, { stream: !done });
          const parts = streamBuffer.split('\n\n');
          
          streamBuffer = parts.pop() || '';

          for (const ssePart of parts) {
            const line = ssePart.trim();
            if (!line) continue;
            
            if (line.startsWith('data: ')) {
              const dataPayload = line.slice(6).trim();
              if (dataPayload === '[DONE]') {
                done = true;
                break;
              }

              try {
                const parsedObject = JSON.parse(dataPayload);
                if (parsedObject.error) {
                  throw new Error(parsedObject.error);
                }
                if (parsedObject.text) {
                  accumulatedResponseText += parsedObject.text;

                  // Real-time parsing of markdown json blocks to enable visualizers as the AI is streaming!
                  const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
                  let match;
                  let parsedType: 'standard' | 'chart' | 'math' = 'standard';
                  let parsedChartData: any[] | undefined;
                  let parsedChartConfig: any | undefined;
                  let parsedMathExp: string | undefined;
                  let parsedMathRes: string | undefined;
                  let parsedMathSteps: string[] | undefined;
                  let parsedMathPlotPoints: any[] | undefined;

                  while ((match = jsonRegex.exec(accumulatedResponseText)) !== null) {
                    try {
                      const parsed = JSON.parse(match[1]);
                      if (parsed.type === 'chart') {
                        parsedType = 'chart';
                        parsedChartData = parsed.data;
                        parsedChartConfig = {
                          type: parsed.chartType || 'bar',
                          xKey: parsed.xKey,
                          yKeys: parsed.yKeys,
                          title: parsed.title
                        };
                      } else if (parsed.type === 'math') {
                        parsedType = 'math';
                        parsedMathExp = parsed.expression;
                        parsedMathRes = parsed.result;
                        parsedMathSteps = parsed.steps;
                        parsedMathPlotPoints = parsed.plotPoints;
                      }
                    } catch (e) {
                      // block is incomplete while streaming, skip and try next tick
                    }
                  }

                  // Real-time character cascade update
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id === currentId) {
                        return {
                          ...c,
                          messages: c.messages.map((m) => {
                            if (m.id === assistantMessageId) {
                              return {
                                ...m,
                                content: accumulatedResponseText,
                                customType: parsedType,
                                chartData: parsedChartData,
                                chartConfig: parsedChartConfig,
                                mathExpression: parsedMathExp,
                                mathResult: parsedMathRes,
                                mathSteps: parsedMathSteps,
                                mathPlotPoints: parsedMathPlotPoints
                              };
                            }
                            return m;
                          })
                        };
                      }
                      return c;
                    })
                  );
                }
              } catch (e) {
                console.error("Single parsing trunk failure:", e);
              }
            }
          }
        }
      }

      // Finish streaming state
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    isStreaming: false
                  };
                }
                return m;
              })
            };
          }
          return c;
        })
      );

    } catch (err: any) {
      console.error("Submission stream process fail:", err);
      const errorMessage = err.message || "Unable to retrieve response. Check connections.";

      // Display the failure cascade inside conversational layout
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    content: `**Connection Error / Execution Halted**\n\n${errorMessage}\n\n*If this is a missing key error, please open the Settings menu on the top right of your workspace and insert your environment secrets. Or verify your server logs.*`,
                    isStreaming: false,
                    isError: true
                  };
                }
                return m;
              })
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Async helper to generate short conversation summarized titles
  const triggerTitleGeneration = async (chatId: string, text: string) => {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstMessage: text })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.title) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === chatId) {
                return {
                  ...c,
                  title: result.title
                };
              }
              return c;
            })
          );
        }
      }
    } catch (e) {
      console.error("Title fetch fail:", e);
    }
  };

  // Current active chat object selection resolver
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${
      theme === 'light' 
        ? 'bg-white text-neutral-800' 
        : 'bg-[#212121] text-[#E5E7EB]'
    }`} id="application-container">
      {/* collapsible Left Sidebar Component */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isOpen={sidebarOpen}
        onToggleOpen={handleToggleSidebar}
      />

      {/* Main Responsive Chat Content Workspace Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative" id="chat-workspace-pane">
        {/* Chat Messages Scrolling Core Component */}
        <ChatArea
          conversation={activeConversation}
          isGenerating={isGenerating}
          onSelectPrompt={(text) => handleSendMessage(text, [])}
          onClearHistory={handleClearActiveHistory}
          theme={theme}
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          onEditMessage={handleEditMessage}
        />

        {/* Elegant Bottom Input Composer Bar (Always anchored) */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t z-15 ${
          theme === 'dark'
            ? 'from-[#212121] via-[#212121]/95 to-transparent'
            : 'from-white via-white/95 to-transparent'
        }`} id="input-composer-wrapper">
          <div className="max-w-3xl mx-auto w-full" id="composer-aligned-box">
            <InputComposer
              onSend={handleSendMessage}
              disabled={isGenerating}
              theme={theme}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
