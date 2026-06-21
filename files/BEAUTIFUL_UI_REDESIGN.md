# Beautiful Modern UI Redesign

## What We're Creating

```
Current: Clean but basic
New:     Stunning, modern, professional

Features:
✨ Glassmorphism effects
✨ Smooth animations
✨ Better color schemes
✨ Professional typography
✨ Micro-interactions
✨ Modern layouts
✨ Visual hierarchy
✨ Smooth gradients
```

---

## Part 1: Updated Tailwind Config

### File: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        dark: {
          950: '#0a0e27',
          900: '#0f172a',
          850: '#1a1f3a',
          800: '#1e293b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui'],
        body: ['var(--font-body)', 'system-ui'],
      },
      backdropFilter: {
        none: 'none',
        sm: 'blur(4px)',
        md: 'blur(12px)',
        lg: 'blur(20px)',
        xl: 'blur(40px)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
}
export default config
```

---

## Part 2: Beautiful Global Styles

### File: `src/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f172a 100%);
  min-height: 100vh;
  font-family: var(--font-body);
  color: #e2e8f0;
  position: relative;
  overflow-x: hidden;
}

/* Animated background */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.4);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #0ea5e9, #06b6d4);
  border-radius: 10px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #0284c7, #0891b2);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

/* Selection */
::selection {
  background: rgba(59, 130, 246, 0.3);
  color: #e2e8f0;
}

/* Smooth text rendering */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Glass effect utility */
.glass {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.glass-sm {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Gradient border */
.gradient-border {
  background: linear-gradient(135deg, #0ea5e9, #8b5cf6) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
}

/* Hover glow effect */
.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

/* Smooth transitions */
.smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Part 3: Beautiful Layout Component

### File: `src/components/Layout.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function Layout({ children, header }: LayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [-30, 0, -30],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [30, 0, 30],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {header && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {header}
          </motion.div>
        )}

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
```

---

## Part 4: Beautiful Header Component

### File: `src/components/Header.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                Multi-Agent AI
              </h1>
              <p className="text-xs text-slate-400">
                Real-time Multi-Agent Orchestration
              </p>
            </div>
          </motion.div>

          {/* Connection status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                flex items-center gap-2
                ${
                  isConnected
                    ? 'glass-sm bg-green-500/10 border-green-500/30'
                    : 'glass-sm bg-red-500/10 border-red-500/30'
                }
              `}
            >
              <motion.span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
```

---

## Part 5: Beautiful Task Form

### File: `src/components/TaskForm.tsx` (UPDATED)

```typescript
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(false);

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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Label */}
        <div>
          <label className="block text-lg font-display font-semibold text-white mb-3">
            <Sparkles className="inline w-5 h-5 mr-2 text-blue-400" />
            What would you like the agents to do?
          </label>

          {/* Textarea */}
          <motion.div
            className={`
              relative glass group hover-glow
              ${isFocused ? 'ring-2 ring-blue-500 border-blue-500/50' : ''}
            `}
            animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter your task here... Be specific about what you'd like the agents to do."
              className={`
                w-full px-6 py-4 rounded-xl
                bg-transparent
                text-white placeholder-slate-400
                focus:outline-none
                resize-none
                font-body text-base leading-relaxed
                transition-all duration-200
              `}
              rows={5}
              disabled={isLoading}
            />

            {/* Character count */}
            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
              {description.length} / 2000
            </div>
          </motion.div>
        </div>

        {/* Examples */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Examples:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(EXAMPLE_TASKS).map(([key, label]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => loadExample(key)}
                disabled={isLoading}
                className="
                  glass-sm group hover-glow
                  px-4 py-3 rounded-lg
                  text-sm font-medium text-slate-300
                  border border-white/10
                  hover:border-blue-500/50 hover:bg-blue-500/5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {key === 'blog' && '📝 Blog Post'}
                {key === 'email' && '✉️ Professional Email'}
                {key === 'summary' && '📋 Summary'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!description.trim() || isLoading}
          whileHover={{ scale: !description.trim() || isLoading ? 1 : 1.02 }}
          whileTap={{ scale: !description.trim() || isLoading ? 1 : 0.98 }}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold
            flex items-center justify-center gap-2
            transition-all duration-300
            text-base font-display
            ${
              !description.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/50'
            }
          `}
        >
          {isLoading ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Execute Agents
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
```

---

## Part 6: Beautiful Agent Card (Updated)

### File: `src/components/AgentCard.tsx` (UPDATED)

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Agent, AGENT_NAMES, AGENT_COLORS } from '@/types';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  index: number;
}

export function AgentCard({ agent, index }: AgentCardProps) {
  const isActive = agent.status === 'working';
  const isComplete = agent.status === 'complete';
  const isError = agent.status === 'error';

  const icons = {
    research: '🔍',
    analyze: '📊',
    write: '✍️',
    validate: '✅',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      className="group"
    >
      <div
        className={`
          glass hover-glow relative overflow-hidden rounded-2xl
          p-6 transition-all duration-300
          ${isActive ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/50' : ''}
          ${isComplete ? 'ring-2 ring-green-500 shadow-lg shadow-green-500/50' : ''}
          ${isError ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/50' : ''}
        `}
      >
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${
            isActive
              ? 'from-blue-500/10 to-transparent'
              : isComplete
              ? 'from-green-500/10 to-transparent'
              : isError
              ? 'from-red-500/10 to-transparent'
              : 'from-slate-500/5 to-transparent'
          }`}
          animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
        />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icons[agent.id as keyof typeof icons]}</span>
              <div>
                <h3 className="text-base font-display font-semibold text-white">
                  {AGENT_NAMES[agent.id]}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {agent.id === 'research' && 'Information Gathering'}
                  {agent.id === 'analyze' && 'Data Analysis'}
                  {agent.id === 'write' && 'Content Creation'}
                  {agent.id === 'validate' && 'Quality Assurance'}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  key="working"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/50"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader className="w-3 h-3 text-blue-400" />
                  </motion.div>
                  <span className="text-xs font-medium text-blue-300">
                    Running
                  </span>
                </motion.div>
              )}

              {isComplete && (
                <motion.div
                  key="complete"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </motion.div>
                  <span className="text-xs font-medium text-green-300">
                    Complete
                  </span>
                </motion.div>
              )}

              {isError && (
                <motion.div
                  key="error"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50"
                >
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-xs font-medium text-red-300">Error</span>
                </motion.div>
              )}

              {agent.status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/50"
                >
                  <span className="text-xs font-medium text-slate-300">
                    Waiting
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${
                isComplete
                  ? 'from-green-500 to-emerald-500'
                  : isError
                  ? 'from-red-500 to-rose-500'
                  : 'from-blue-500 to-cyan-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: isActive || isComplete ? '100%' : '0%' }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Error message */}
          {isError && agent.error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-red-400 break-words"
            >
              {agent.error}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

---

## Part 7: Beautiful Results Component

### File: `src/components/Results.tsx` (UPDATED)

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {(output || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-display font-semibold gradient-text"
              >
                ✨ Final Output (Writer Agent)
              </motion.h3>
              {executionTime && (
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm font-medium text-slate-400"
                >
                  Completed in{' '}
                  <span className="text-blue-400 font-semibold">
                    {executionTime.toFixed(2)}s
                  </span>
                </motion.span>
              )}
            </div>

            {/* Output container */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <div className="p-6 text-slate-200 leading-relaxed space-y-4 font-body text-base">
                  {isLoading ? (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-slate-400 flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        ⏳
                      </motion.div>
                      Generating output...
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
              </div>
            </div>

            {/* Copy button */}
            {output && !isLoading && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="
                  glass-sm group hover-glow
                  px-4 py-2 rounded-lg font-medium text-sm
                  border border-white/10
                  hover:border-blue-500/50 hover:bg-blue-500/5
                  flex items-center gap-2
                  text-slate-300 transition-all duration-200
                "
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Output
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Part 8: Beautiful Metrics Component

### File: `src/components/Metrics.tsx` (UPDATED)

```typescript
'use client';

import { motion } from 'framer-motion';
import { Zap, BarChart3, Database, Clock } from 'lucide-react';

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
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Agents Used',
      value: agentCount,
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Output Size',
      value: outputLength ? `${(outputLength / 1000).toFixed(1)}KB` : '-',
      icon: Database,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Cache Status',
      value: cacheHit ? '✓ Hit' : 'Miss',
      icon: BarChart3,
      color: cacheHit ? 'from-green-500 to-emerald-500' : 'from-slate-500 to-slate-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h3 className="text-xl font-display font-semibold text-white mb-6">
        📈 Performance Metrics
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-sm hover-glow rounded-xl p-4 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} bg-opacity-20`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                {metric.label}
              </p>

              <motion.p
                key={metric.value}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}
              >
                {metric.value}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
```

---

## Part 9: Updated Main Page

### File: `src/app/page.tsx` (UPDATED)

```typescript
'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Agent } from '@/types';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { AgentCard } from '@/components/AgentCard';
import { Results } from '@/components/Results';
import { Metrics } from '@/components/Metrics';

const INITIAL_AGENTS: Agent[] = [
  { id: 'research', name: 'research', status: 'idle' },
  { id: 'analyze', name: 'analyze', status: 'idle' },
  { id: 'write', name: 'write', status: 'idle' },
  { id: 'validate', name: 'validate', status: 'idle' },
];

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [taskOutput, setTaskOutput] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const getApiUrl = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    return `${wsUrl}/ws/task`;
  }, []);

  const { isConnected: wsConnected, send } = useWebSocket(getApiUrl(), {
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
                ? { ...agent, status: 'complete' }
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
      }
    },
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  });

  const handleTaskSubmit = useCallback(
    (description: string) => {
      if (!wsConnected) {
        alert('Not connected to server. Please check your backend.');
        return;
      }

      setAgents(INITIAL_AGENTS);
      setTaskOutput(null);
      setExecutionTime(undefined);
      setIsRunning(true);

      send({
        task_id: `task_${Date.now()}`,
        description,
        workflow: ['research', 'analyze', 'write', 'validate'],
      });
    },
    [wsConnected, send]
  );

  return (
    <Layout header={<Header isConnected={isConnected} />}>
      <TaskForm onSubmit={handleTaskSubmit} isLoading={isRunning} />

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-display font-bold text-white mb-6"
          >
            🚀 Agent Execution Flow
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      <Results output={taskOutput} isLoading={isRunning} executionTime={executionTime} />

      {taskOutput && executionTime && !isRunning && (
        <Metrics
          executionTime={executionTime}
          agentCount={4}
          outputLength={taskOutput.length}
        />
      )}
    </Layout>
  );
}
```

---

## Installation Instructions

### 1. Update Tailwind Config
Replace your `tailwind.config.ts` with the new one above.

### 2. Update Global Styles
Replace your `src/app/globals.css` with the new one above.

### 3. Create/Update Components
Create the new components:
- `src/components/Layout.tsx`
- `src/components/Header.tsx`
- Update `src/components/TaskForm.tsx`
- Update `src/components/AgentCard.tsx`
- Update `src/components/Results.tsx`
- Update `src/components/Metrics.tsx`

### 4. Update Main Page
Replace `src/app/page.tsx` with the new one above.

### 5. Install Lucide Icons
```bash
npm install lucide-react
```

### 6. Test It
```bash
npm run dev
# Visit http://localhost:3000
```

---

## What You Get

✨ **Glassmorphism effects** - Beautiful frosted glass look
✨ **Smooth animations** - Framer Motion animations throughout
✨ **Beautiful gradients** - Modern color schemes
✨ **Micro-interactions** - Hover effects, loading states
✨ **Professional typography** - Space Grotesk + Inter
✨ **Better visual hierarchy** - Clear structure
✨ **Animated backgrounds** - Floating gradient blobs
✨ **Smooth transitions** - All interactions smooth
✨ **Icons** - From Lucide (professional icons)
✨ **Responsive design** - Works on all devices

---

## The Result

This transforms your UI from "nice" to "wow, professional!"

Try it out and let me know if you want any adjustments! 🎨✨
