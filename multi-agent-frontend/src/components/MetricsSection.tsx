'use client';

import { motion } from 'framer-motion';

interface MetricItem {
  icon: string;
  label: string;
  value: string | number;
  color: 'cyan' | 'purple' | 'green' | 'orange';
}

interface MetricsSectionProps {
  metrics: MetricItem[];
}

export function MetricsSection({ metrics }: MetricsSectionProps) {
  const colorMap = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
  };

  const bgColorMap = {
    cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20',
    purple: 'from-purple-500/10 to-transparent border-purple-500/20',
    green: 'from-green-500/10 to-transparent border-green-500/20',
    orange: 'from-orange-500/10 to-transparent border-orange-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mx-8 mt-8"
    >
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            className={`rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-sm ${bgColorMap[metric.color]}`}
          >
            {/* Icon and Label */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-sm text-slate-400">{metric.label}</span>
            </div>

            {/* Value */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
              className={`text-3xl font-bold ${colorMap[metric.color]}`}
            >
              {metric.value}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}