export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
  attachedFiles?: AttachedFile[];
  // Advanced features metadata
  customType?: 'standard' | 'image' | 'chart' | 'math';
  imageResultUrl?: string; // Base64 or URL if image result
  chartData?: any[]; // Recharts plot list
  chartConfig?: { type: 'bar' | 'line' | 'pie' | 'area'; xKey: string; yKeys: string[]; title?: string };
  mathExpression?: string;
  mathSteps?: string[];
  mathResult?: string;
  mathPlotPoints?: { x: number; y: number }[];
}

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  contentSnapshot?: string; // Preview or brief metadata
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  lastActiveAt: string;
}

export type Theme = 'dark' | 'light';
export type ChatMode = 'general' | 'image' | 'data' | 'math';

