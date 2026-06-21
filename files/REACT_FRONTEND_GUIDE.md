# Professional React Frontend for Multi-Agent System

## What We're Building

Instead of HTML/CSS dashboard → **Production React application**

```
Current: Static HTML + vanilla JS
New:     React + TypeScript + Tailwind + animations
         Modern tooling, better state management, professional code
```

---

## Why React Instead of Static HTML?

```
Current Dashboard:
✅ Works
❌ Hard to scale
❌ No state management
❌ No component reusability
❌ Limited animations
❌ Not impressive for junior->senior interviews

React App:
✅ Scalable architecture
✅ Component-based
✅ Better UX with animations
✅ Professional code patterns
✅ TypeScript for safety
✅ Impresses in interviews
```

---

## Tech Stack (Production-Grade)

```
Framework:      Next.js 14 (React + routing + API)
Language:       TypeScript (type safety)
Styling:        Tailwind CSS (utility-first, professional)
UI Components:  Shadcn/ui (accessible, beautiful)
Animations:     Framer Motion (smooth, professional)
Real-time:      WebSocket (existing backend)
Deployment:     Vercel (Next.js native)
State:          React Context + Hooks (simple enough for this)
```

---

## Project Setup (30 minutes)

### Step 1: Create Next.js Project

```bash
# Create Next.js project
npx create-next-app@latest multi-agent-frontend \
  --typescript \
  --tailwind \
  --app \
  --no-eslint

cd multi-agent-frontend
```

### Step 2: Install Dependencies

```bash
npm install framer-motion clsx axios
npm install -D @types/node @types/react

# Optional but nice
npm install lucide-react  # Icons
```

### Step 3: Project Structure

```
multi-agent-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── globals.css      # Global styles
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── AgentCard.tsx    # Individual agent
│   │   ├── TaskForm.tsx     # Task input
│   │   ├── Results.tsx      # Results display
│   │   └── Metrics.tsx      # Metrics display
│   ├── hooks/
│   │   └── useWebSocket.ts  # WebSocket hook
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── lib/
│       └── utils.ts         # Utilities
├── public/
├── package.json
└── tsconfig.json
```

---

## Part 1: Core Types (TypeScript)

### File: `src/types/index.ts`

```typescript
/**
 * Type definitions for the multi-agent system frontend
 */

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'complete' | 'error';
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
```

---

## Part 2: WebSocket Hook

### File: `src/hooks/useWebSocket.ts`

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '@/types';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = url.startsWith('http')
      ? url.replace(/^http/, protocol === 'wss:' ? 'wss' : 'ws')
      : `${protocol}//${window.location.host}${url}`;

    const connect = () => {
      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          options.onOpen?.();
        };

        ws.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            options.onMessage?.(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          const err = new Error('WebSocket error');
          options.onError?.(err);
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          options.onClose?.();
        };
      } catch (error) {
        options.onError?.(new Error('Failed to connect'));
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, options]);

  const send = useCallback((message: any) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
    }
  }, [isConnected]);

  return { isConnected, send, ws: ws.current };
}
```

---

## Part 3: Agent Card Component

### File: `src/components/AgentCard.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { Agent, AGENT_NAMES, AGENT_COLORS, AGENT_DESCRIPTIONS } from '@/types';

interface AgentCardProps {
  agent: Agent;
  index: number;
}

export function AgentCard({ agent, index }: AgentCardProps) {
  const colorClass = AGENT_COLORS[agent.id] || 'from-gray-500 to-gray-600';
  const isActive = agent.status === 'working';
  const isComplete = agent.status === 'complete';
  const isError = agent.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        relative rounded-lg p-6 overflow-hidden
        transition-all duration-300
        ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg' : ''}
        ${isComplete ? 'ring-2 ring-offset-2 ring-green-500 shadow-lg' : ''}
        ${isError ? 'ring-2 ring-offset-2 ring-red-500 shadow-lg' : ''}
      `}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-10`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {AGENT_NAMES[agent.id]}
          </h3>
          <StatusIndicator status={agent.status} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          {AGENT_DESCRIPTIONS[agent.id]}
        </p>

        {/* Status text */}
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <motion.div
                className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-gray-700">
                Running...
              </span>
            </>
          )}
          {isComplete && (
            <>
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              />
              <span className="text-sm font-medium text-gray-700">
                Complete ✓
              </span>
            </>
          )}
          {isError && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-gray-700">
                Error
              </span>
            </>
          )}
          {agent.status === 'idle' && (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Waiting
              </span>
            </>
          )}
        </div>

        {/* Error message if applicable */}
        {isError && agent.error && (
          <p className="text-sm text-red-600 mt-2 break-words">
            {agent.error}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function StatusIndicator({
  status,
}: {
  status: 'idle' | 'working' | 'complete' | 'error';
}) {
  const statusConfig = {
    idle: { bg: 'bg-gray-200', text: 'gray', label: 'Waiting' },
    working: { bg: 'bg-blue-200', text: 'blue', label: 'Running' },
    complete: { bg: 'bg-green-200', text: 'green', label: 'Done' },
    error: { bg: 'bg-red-200', text: 'red', label: 'Error' },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} text-${config.text}-700`}
    >
      {config.label}
    </span>
  );
}
```

---

## Part 4: Task Form Component

### File: `src/components/TaskForm.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const EXAMPLE_TASKS = {
  blog: 'Write a comprehensive blog post about AI agents and their real-world applications. Include definitions, use cases, benefits, and challenges.',
  email: 'Compose a professional email proposing an AI strategy initiative to a VP of Engineering.',
  summary: 'Create an executive summary of recent developments in large language models.',
};

interface TaskFormProps {
  onSubmit: (description: string) => void;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [description, setDescription] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (description.trim()) {
        onSubmit(description);
        setDescription('');
      }
    },
    [description, onSubmit]
  );

  const loadExample = useCallback((example: string) => {
    setDescription(
      EXAMPLE_TASKS[example as keyof typeof EXAMPLE_TASKS] || ''
    );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main input */}
        <div>
          <label
            htmlFor="task-input"
            className="block text-sm font-semibold text-gray-900 mb-2"
          >
            What would you like the agents to do?
          </label>
          <textarea
            id="task-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a task for the agents to complete..."
            className={`
              w-full px-4 py-3 rounded-lg border-2
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              transition-colors duration-200
              resize-none
              ${
                isLoading
                  ? 'bg-gray-100 border-gray-300'
                  : 'bg-white border-gray-200'
              }
            `}
            rows={4}
            disabled={isLoading}
          />
        </div>

        {/* Example buttons */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
            Quick Examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EXAMPLE_TASKS).map(([key, label]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loadExample(key)}
                disabled={isLoading}
                className="
                  px-3 py-1.5 rounded-md text-xs font-medium
                  bg-gray-100 hover:bg-gray-200
                  text-gray-700 transition-colors
                  disabled:opacity-50
                "
              >
                {key === 'blog' && '📝 Blog Post'}
                {key === 'email' && '✉️ Email'}
                {key === 'summary' && '📋 Summary'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!description.trim() || isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold
            transition-all duration-200
            flex items-center justify-center gap-2
            ${
              !description.trim() || isLoading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executing Agents...
            </>
          ) : (
            <>
              🚀 Execute Agents
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
```

---

## Part 5: Results Component

### File: `src/components/Results.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ResultsProps {
  output: string | null;
  isLoading: boolean;
  executionTime?: number;
}

export function Results({
  output,
  isLoading,
  executionTime,
}: ResultsProps) {
  return (
    <AnimatePresence>
      {(output || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-8 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📝 Final Output (Writer Agent)
            </h3>
            {executionTime && (
              <span className="text-sm font-medium text-gray-600">
                Completed in {executionTime.toFixed(2)}s
              </span>
            )}
          </div>

          {/* Output container */}
          <div
            className={`
              p-6 rounded-lg border-2 border-gray-200
              bg-gray-50 max-h-96 overflow-y-auto
              font-mono text-sm text-gray-800
              whitespace-pre-wrap break-words
            `}
          >
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gray-500"
              >
                ⏳ Generating output...
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {output}
              </motion.div>
            )}
          </div>

          {/* Copy button */}
          {output && !isLoading && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigator.clipboard.writeText(output);
                alert('Copied to clipboard!');
              }}
              className="
                px-4 py-2 rounded-lg font-medium
                bg-white border-2 border-gray-300
                hover:border-gray-400 hover:bg-gray-50
                transition-colors text-sm text-gray-700
              "
            >
              📋 Copy Output
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Part 6: Metrics Component

### File: `src/components/Metrics.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';

interface MetricsProps {
  executionTime?: number;
  agentCount?: number;
  outputLength?: number;
  cacheHit?: boolean;
}

export function Metrics({
  executionTime,
  agentCount = 4,
  outputLength,
  cacheHit,
}: MetricsProps) {
  const metrics = [
    {
      label: 'Execution Time',
      value: executionTime ? `${executionTime.toFixed(2)}s` : '-',
      icon: '⏱️',
    },
    {
      label: 'Agents Used',
      value: agentCount,
      icon: '🤖',
    },
    {
      label: 'Output Size',
      value: outputLength ? `${outputLength.toLocaleString()} chars` : '-',
      icon: '📊',
    },
    {
      label: 'Cache',
      value: cacheHit ? '✓ Hit' : 'Miss',
      icon: '⚡',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="
            p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50
            border-2 border-blue-200
          "
        >
          <div className="text-2xl mb-2">{metric.icon}</div>
          <div className="text-sm font-medium text-gray-600">
            {metric.label}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {metric.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
```

---

## Part 7: Main Dashboard Component

### File: `src/components/Dashboard.tsx`

```typescript
'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Agent, Task, AGENT_NAMES } from '@/types';
import { AgentCard } from './AgentCard';
import { TaskForm } from './TaskForm';
import { Results } from './Results';
import { Metrics } from './Metrics';

const INITIAL_AGENTS: Agent[] = [
  { id: 'research', name: 'research', status: 'idle' },
  { id: 'analyze', name: 'analyze', status: 'idle' },
  { id: 'write', name: 'write', status: 'idle' },
  { id: 'validate', name: 'validate', status: 'idle' },
];

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [taskOutput, setTaskOutput] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  // Determine API URL
  const getApiUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Check if we're on production (Vercel) or localhost
      const host = window.location.host;
      if (host.includes('railway.app') || host.includes('localhost')) {
        return 'ws://localhost:8000/ws/task'; // Local backend
      }
      // For Vercel deployment, point to your Railway backend
      return 'wss://your-api.railway.app/ws/task';
    }
    return '/ws/task';
  }, []);

  const { isConnected, send } = useWebSocket(getApiUrl(), {
    onMessage: (message) => {
      switch (message.event) {
        case 'agent_start':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'working' }
                : agent
            )
          );
          break;

        case 'agent_complete':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'complete', output: message.output_preview }
                : agent
            )
          );
          break;

        case 'agent_error':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'error', error: message.error }
                : agent
            )
          );
          break;

        case 'task_complete':
          setTaskOutput(message.results.write || 'No output generated');
          setExecutionTime(message.execution_time);
          setIsRunning(false);
          break;

        case 'error':
          console.error('API Error:', message.message);
          setIsRunning(false);
          break;
      }
    },
    onOpen: () => {
      setConnectionStatus('Connected');
    },
    onClose: () => {
      setConnectionStatus('Disconnected');
    },
    onError: () => {
      setConnectionStatus('Connection Failed');
    },
  });

  const handleTaskSubmit = useCallback(
    (description: string) => {
      if (!isConnected) {
        alert('Not connected to server. Please try again.');
        return;
      }

      // Reset state
      setAgents(INITIAL_AGENTS);
      setTaskOutput(null);
      setExecutionTime(undefined);
      setIsRunning(true);

      // Send task
      send({
        task_id: `task_${Date.now()}`,
        description,
        workflow: ['research', 'analyze', 'write', 'validate'],
      });
    },
    [isConnected, send]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              🤖 Multi-Agent System
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }
            `}
          >
            {connectionStatus}
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Task form */}
        <TaskForm onSubmit={handleTaskSubmit} isLoading={isRunning} />

        {/* Agents grid */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Agent Execution Flow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agents.map((agent, index) => (
                <AgentCard key={agent.id} agent={agent} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        <Results
          output={taskOutput}
          isLoading={isRunning}
          executionTime={executionTime}
        />

        {/* Metrics */}
        {taskOutput && executionTime && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Performance Metrics
            </h2>
            <Metrics
              executionTime={executionTime}
              agentCount={4}
              outputLength={taskOutput.length}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
```

---

## Part 8: Root Layout

### File: `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Multi-Agent AI System',
  description: 'Watch AI agents collaborate in real-time',
  openGraph: {
    title: 'Multi-Agent AI System',
    description: 'Production AI system with real-time agent visualization',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---

## Part 9: Home Page

### File: `src/app/page.tsx`

```typescript
'use client';

import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return <Dashboard />;
}
```

---

## Part 10: Global Styles

### File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: linear-gradient(to bottom right, #0f172a, #1e1b4b, #0f172a);
  min-height: 100vh;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(100, 116, 139, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

/* Custom animations */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse-soft {
  animation: pulse-soft 2s ease-in-out infinite;
}
```

---

## Setup & Development

### Run Locally

```bash
# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev

# Open browser
# http://localhost:3000
```

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
# For production (Vercel):
# NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

---

## Features

✅ Real-time WebSocket communication
✅ Beautiful Tailwind CSS styling
✅ Smooth Framer Motion animations
✅ TypeScript for type safety
✅ Responsive design (mobile, tablet, desktop)
✅ Connection status indicator
✅ Example prompts
✅ Output copy button
✅ Performance metrics display
✅ Agent status cards with animations
✅ Loading states
✅ Error handling
✅ Professional UI/UX

---

## Deployment to Vercel

### Step 1: Update API URL

In `src/components/Dashboard.tsx`, update the production API URL:

```typescript
// Change this:
return 'wss://your-api.railway.app/ws/task';
// To your actual Railway URL
```

### Step 2: Deploy

```bash
# Push to GitHub
git add -A
git commit -m "feat: Add professional React frontend"
git push origin main

# Go to vercel.com
# Import this repository
# Deploy automatically
```

### Step 3: Configure Environment

In Vercel dashboard:
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-api.railway.app`

---

## Testing

### Local Testing

```bash
# Terminal 1: Start FastAPI backend
cd ../multi-agent-system
python app/main.py

# Terminal 2: Start Next.js frontend
npm run dev

# Visit http://localhost:3000
# Submit a task
# Watch agents execute
```

### Troubleshooting

**WebSocket connection fails:**
- Ensure backend is running on localhost:8000
- Check browser console for errors (F12)
- Verify firewall isn't blocking

**API URL not working:**
- Update `.env.local` with correct backend URL
- Test with `curl http://localhost:8000/api/health`

**Styles not loading:**
- Run `npm install`
- Clear `.next` folder: `rm -rf .next`
- Run `npm run dev` again

---

## Next Steps

1. **Set up project** (30 min)
2. **Copy components** (1 hour)
3. **Test locally** (30 min)
4. **Deploy to Vercel** (15 min)
5. **Update resume** with "React frontend" accomplishment

---

## Interview Value

This React frontend shows:

✅ Modern React patterns (Hooks, Context)
✅ TypeScript proficiency
✅ Beautiful UI/UX design
✅ Animation & polish
✅ Real-time communication
✅ Professional code structure
✅ Component composition
✅ State management

That's impressive for a portfolio.

---

**Ready to build?** Start with setup, then copy-paste the components. You'll have a professional frontend in 2-3 hours. 🚀
