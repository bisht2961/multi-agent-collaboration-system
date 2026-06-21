// Type definitions for the multi-agent system frontend
export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  output?: string;
  error?: string;
}

export interface Task {
  id: string;
  description: string;
  workflow: string[];
  status: 'pending' | 'running' | 'complete' | 'failed';
  results: Record<string, string>;
  startTime?: number;
  endTime?: number;
  executionTime?: number;
}

export interface WebSocketMessage {
  event: string;
  [key: string]: any;
}

export interface AgentStartEvent {
  event: 'agent_start';
  agent_id: string;
  step: number;
  total_steps: number;
  timestamp: string;
}

export interface AgentCompleteEvent {
  event: 'agent_complete';
  agent_id: string;
  output_preview: string;
  output_length: number;
  timestamp: string;
}

export interface TaskCompleteEvent {
  event: 'task_complete';
  task_id: string;
  results: Record<string, string>;
  execution_time: number;
  timestamp: string;
}

export interface Metrics {
  total_tasks: number;
  avg_execution_time: number;
  min_execution_time?: number;
  max_execution_time?: number;
  cache_hits?: number;
  cache_size_mb?: number;
}

export const AGENT_NAMES: Record<string, string> = {
  research: '🔍 Research Agent',
  analyze: '📊 Analyst Agent',
  write: '✍️ Writer Agent',
  validate: '✅ Validator Agent',
};

export const AGENT_COLORS: Record<string, string> = {
  research: 'from-blue-500 to-cyan-500',
  analyze: 'from-purple-500 to-pink-500',
  write: 'from-green-500 to-emerald-500',
  validate: 'from-orange-500 to-yellow-500',
};

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  research: 'Gathers credible information and identifies sources',
  analyze: 'Synthesizes insights and creates logical structure',
  write: 'Transforms outline into engaging content',
  validate: 'Ensures accuracy, completeness, and quality',
};