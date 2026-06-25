'use client';

import { motion } from 'framer-motion';
import { CompletedAgentCrew } from './CompletedAgentCrew';
import { FinalOutputSection } from './FinalOutputSection';
import { MetricsSection } from './MetricsSection';

interface Agent {
  id: string;
  icon: string;
  name: string;
  description: string;
  borderColor: 'cyan' | 'purple' | 'green' | 'orange';
  progressBarColor: string;
}

interface MetricItem {
  icon: string;
  label: string;
  value: string | number;
  color: 'cyan' | 'purple' | 'green' | 'orange';
}

interface CompleteResultsScreenProps {
  agents: Agent[];
  output: string;
  executionTime: number;
  metrics: MetricItem[];
  onNewTask?: () => void;
}

export function CompleteResultsScreen({
  agents,
  output,
  executionTime,
  metrics,
  onNewTask,
}: CompleteResultsScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-8"
    >
      {/* Agent Crew Completion */}
      <CompletedAgentCrew agents={agents} />

      {/* Final Output */}
      <FinalOutputSection
        output={output}
        executionTime={executionTime}
        agentIcon="✍️"
      />

      {/* Metrics */}
      <MetricsSection metrics={metrics} />

      {/* New Task Button */}
      {onNewTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mx-8 mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewTask}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            🚀 Create New Task
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}