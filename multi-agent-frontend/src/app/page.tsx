'use client';

import { useCallback, useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { AgentCrew } from '@/components/AgentCrew';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WebSocketMessage } from '@/types';

type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

interface UIAgent {
  id: string;
  icon: string;
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
  color: 'cyan' | 'purple' | 'green' | 'orange';
}

const INITIAL_AGENTS: UIAgent[] = [
  {
    id: 'research',
    icon: '🔍',
    name: 'Research Agent',
    description: 'Gathering sources',
    status: 'idle' as const,
    progress: 0,
    color: 'cyan' as const,
  },
  {
    id: 'analyst',
    icon: '📊',
    name: 'Analyst Agent',
    description: 'Synthesizing data',
    status: 'idle' as const,
    progress: 0,
    color: 'purple' as const,
  },
  {
    id: 'writer',
    icon: '✍️',
    name: 'Writer Agent',
    description: 'Drafting content',
    status: 'idle' as const,
    progress: 0,
    color: 'green' as const,
  },
  {
    id: 'validator',
    icon: '✅',
    name: 'Validator Agent',
    description: 'Checking quality',
    status: 'idle' as const,
    progress: 0,
    color: 'orange' as const,
  },
];

export default function Home() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const getApiUrl = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    return `${wsUrl}/ws/task`;
  }, []);

  const { isConnected: wsConnected, send } = useWebSocket(getApiUrl(), {
    onMessage: (message: WebSocketMessage) => {
      switch (message.event) {
        case 'agent_start':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? {
                    ...agent,
                    status: 'running',
                    progress: 50,
                  }
                : agent
            )
          );
          break;

        case 'agent_complete':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? {
                    ...agent,
                    status: 'complete',
                    progress: 100,
                  }
                : agent
            )
          );
          break;

        case 'task_complete':
          setIsRunning(false);
          break;
      }
    },
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
  });

  const handleSubmit = useCallback(
    (task: string) => {
      if (!wsConnected) {
        alert('Not connected to backend');
        return;
      }

      setAgents(INITIAL_AGENTS);
      setIsRunning(true);

      send({
        task_id: `task_${Date.now()}`,
        description: task,
        workflow: ['research', 'analyze', 'write', 'validate'],
      });
    },
    [wsConnected, send]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header isConnected={isConnected} />
      <TaskForm onSubmit={handleSubmit} isLoading={isRunning} />
      <AgentCrew agents={agents} isRunning={isRunning} />
    </div>
  );
}