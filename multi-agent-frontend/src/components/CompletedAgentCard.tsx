'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface CompletedAgentCardProps {
  icon: string;
  name: string;
  description: string;
  borderColor: 'cyan' | 'purple' | 'green' | 'orange';
  progressBarColor: string;
  index: number;
}

export function CompletedAgentCard({
  icon,
  name,
  description,
  borderColor,
  progressBarColor,
  index,
}: CompletedAgentCardProps) {
  const borderColorMap = {
    cyan: 'border-cyan-500/40',
    purple: 'border-purple-500/40',
    green: 'border-green-500/40',
    orange: 'border-orange-500/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        rounded-2xl border p-6 backdrop-blur-sm
        bg-slate-800/30
        ${borderColorMap[borderColor]}
      `}
    >
      {/* Header with Icon and Name */}
      <div className="flex items-start gap-4 mb-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          {icon}
        </motion.div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      {/* Status Badge and Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-300">
              Complete
            </span>
          </motion.div>
          <span className="text-sm font-semibold text-slate-300">100%</span>
        </div>

        {/* Progress Bar */}
        <motion.div
          className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`h-full ${progressBarColor}`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}