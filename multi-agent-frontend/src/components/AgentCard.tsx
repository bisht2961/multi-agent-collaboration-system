'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AgentCardProps {
  icon: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number;
  index: number;
  borderColor: string; // 'cyan', 'purple', 'green', 'orange'
}

export function AgentCard({
  icon,
  name,
  description,
  status,
  progress,
  index,
  borderColor,
}: AgentCardProps) {
  const borderColorMap = {
    cyan: 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent',
    purple:
      'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent',
    green: 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent',
    orange:
      'border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent',
  };

  const progressColorMap = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500',
    green: 'bg-gradient-to-r from-green-500 to-emerald-500',
    orange: 'bg-gradient-to-r from-orange-500 to-yellow-500',
  };

  const statusColorMap = {
    idle: 'text-slate-400',
    running: 'text-cyan-400 animate-pulse',
    complete: 'text-green-400',
    error: 'text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl border p-6 transition-all ${borderColorMap[borderColor as keyof typeof borderColorMap]}`}
    >
      {/* Agent Icon and Name */}
      <div className="flex items-center gap-4 mb-4">
        <motion.div
          animate={status === 'running' ? { rotate: 360 } : {}}
          transition={
            status === 'running'
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : {}
          }
          className="text-4xl"
        >
          {icon}
        </motion.div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${statusColorMap[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className="text-slate-400">{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className={progressColorMap[borderColor as keyof typeof progressColorMap]}
          />
        </div>
      </div>
    </motion.div>
  );
}