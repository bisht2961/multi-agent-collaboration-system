'use client';

import { motion } from 'framer-motion';
import { AgentCard } from './AgentCard';

interface Agent {
  id: string;
  icon: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number;
  color: 'cyan' | 'purple' | 'green' | 'orange';
}

interface AgentCrewProps {
  agents: Agent[];
  isRunning: boolean;
}

export function AgentCrew({ agents, isRunning }: AgentCrewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isRunning ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="mx-8 mt-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Agent Crew <span className="text-sm text-slate-400">• ready</span>
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.id}
            icon={agent.icon}
            name={agent.name}
            description={agent.description}
            status={agent.status}
            progress={agent.progress}
            index={index}
            borderColor={agent.color}
          />
        ))}
      </div>
    </motion.div>
  );
}