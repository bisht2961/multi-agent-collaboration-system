"use client";

import { useCallback, useState } from 'react';
import { Header } from '@/components/Header';
import { TaskForm } from '@/components/TaskForm';
import { AgentCrew } from '@/components/AgentCrew';
import { CompleteResultsScreen } from '@/components/CompleteResultsScreen';
import { useWebSocket } from '@/hooks/useWebSocket';

type AgentStatus = 'idle' | 'running' | 'complete';

type Agent = {
  id: string;
  icon: string;
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
  color: 'cyan' | 'purple' | 'green' | 'orange';
  borderColor: 'cyan' | 'purple' | 'green' | 'orange';
  progressBarColor: string;
};

const INITIAL_AGENTS: Agent[] = [
  {
    id: 'research',
    icon: '🔍',
    name: 'Research Agent',
    description: 'Gathering sources',
    status: 'idle' as const,
    progress: 0,
    color: 'cyan' as const,
    borderColor: 'cyan' as const,
    progressBarColor: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  },
  {
    id: 'analyst',
    icon: '📊',
    name: 'Analyst Agent',
    description: 'Synthesizing data',
    status: 'idle' as const,
    progress: 0,
    color: 'purple' as const,
    borderColor: 'purple' as const,
    progressBarColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    id: 'writer',
    icon: '✍️',
    name: 'Writer Agent',
    description: 'Drafting content',
    status: 'idle' as const,
    progress: 0,
    color: 'green' as const,
    borderColor: 'green' as const,
    progressBarColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
  },
  {
    id: 'validator',
    icon: '✅',
    name: 'Validator Agent',
    description: 'Checking quality',
    status: 'idle' as const,
    progress: 0,
    color: 'orange' as const,
    borderColor: 'orange' as const,
    progressBarColor: 'bg-gradient-to-r from-orange-500 to-yellow-500',
  },
];

export default function Home() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [taskOutput, setTaskOutput] = useState('');
  const [executionTime, setExecutionTime] = useState(0);
  const [outputLength, setOutputLength] = useState(0);

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
                ? { ...agent, status: 'running' as const, progress: 50 }
                : agent
            )
          );
          break;

        case 'agent_complete':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'complete' as const, progress: 100 }
                : agent
            )
          );
          break;

        case 'task_complete':
          const output = message.results.write || '';
          setTaskOutput(output);
          setOutputLength(output.length);
          setExecutionTime(message.execution_time);
          setTaskComplete(true);
          setIsRunning(false);
          break;
      }
    },
    onOpen: () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    },
    onClose: () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    },
  });

  const handleSubmit = useCallback(
    (task: string) => {
      if (!wsConnected) {
        alert('Not connected to backend');
        return;
      }

      setAgents(INITIAL_AGENTS);
      setIsRunning(true);
      setTaskComplete(false);
      setTaskOutput('');

      send({
        task_id: `task_${Date.now()}`,
        description: task,
        workflow: ['research', 'analyze', 'write', 'validate'],
      });
    },
    [wsConnected, send]
  );

  const handleNewTask = () => {
    setTaskComplete(false);
    setTaskOutput('');
    setAgents(INITIAL_AGENTS);
  };

  const metrics = [
    {
      icon: '⏱️',
      label: 'Execution Time',
      value: `${executionTime.toFixed(1)}s`,
      color: 'cyan' as const,
    },
    {
      icon: '🤖',
      label: 'Agents Used',
      value: '4',
      color: 'purple' as const,
    },
    {
      icon: '📊',
      label: 'Output Size',
      value: `${outputLength} chars`,
      color: 'green' as const,
    },
    {
      icon: '⚡',
      label: 'Cache Status',
      value: 'MISS',
      color: 'orange' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header isConnected={isConnected} />

      {taskComplete ? (
        <CompleteResultsScreen
          agents={agents}
          output={taskOutput}
          executionTime={executionTime}
          metrics={metrics}
          onNewTask={handleNewTask}
        />
      ) : (
        <>
          <TaskForm onSubmit={handleSubmit} isLoading={isRunning} />
          {isRunning && <AgentCrew agents={agents} isRunning={isRunning} />}
        </>
      )}
    </div>
  );
}