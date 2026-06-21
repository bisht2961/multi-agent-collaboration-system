
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