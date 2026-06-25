'use client';

import { motion } from 'framer-motion';
import { CompletedAgentCard } from './CompletedAgentCard';

interface Agent {
  id: string;
  icon: string;
  name: string;
  description: string;
  borderColor: 'cyan' | 'purple' | 'green' | 'orange';
  progressBarColor: string;
}

interface CompletedAgentCrewProps {
  agents: Agent[];
}

export function CompletedAgentCrew({ agents }: CompletedAgentCrewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-8 mt-8 space-y-6"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white">
          Agent Crew{' '}
          <span className="text-sm text-slate-400 font-normal">
            • pipeline complete
          </span>
        </h2>
      </motion.div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-4 gap-4">
        {agents.map((agent, index) => (
          <CompletedAgentCard
            key={agent.id}
            icon={agent.icon}
            name={agent.name}
            description={agent.description}
            borderColor={agent.borderColor}
            progressBarColor={agent.progressBarColor}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}