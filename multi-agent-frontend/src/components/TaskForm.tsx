'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const EXAMPLES = {
  blog: 'Write a blog post about AI agents',
  email: 'Compose a professional email',
  summary: 'Create an executive summary',
};

interface TaskFormProps {
  onSubmit: (task: string) => void;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      onSubmit(task);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-8 mt-8 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur p-8"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header with Examples */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Task Brief</h2>
          <div className="flex gap-3">
            {Object.entries(EXAMPLES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTask(label)}
                className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                📋 {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe the task for your agent crew — e.g. Write a 600-word blog post on the future of multi-agent AI systems..."
          className="w-full h-48 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 p-4 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
          disabled={isLoading}
        />

        {/* Execute Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!task.trim() || isLoading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          🚀 Execute Agents
        </motion.button>
      </form>
    </motion.div>
  );
}