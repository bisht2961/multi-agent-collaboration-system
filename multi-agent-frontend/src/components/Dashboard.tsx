
'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { Agent, Task, AGENT_NAMES, AGENT_DESCRIPTIONS } from '../types';
import { AgentCard } from './AgentCard';
import { TaskForm } from './TaskForm';
import { Results } from './Results';
import { Metrics } from './Metrics';

const AGENT_COLOR_MAP: Record<string, 'cyan' | 'purple' | 'green' | 'orange'> = {
  research: 'cyan',
  analyze: 'purple',
  write: 'green',
  validate: 'orange',
};

const INITIAL_AGENTS: Agent[] = [
  { id: 'research', name: 'research', status: 'idle' },
  { id: 'analyze', name: 'analyze', status: 'idle' },
  { id: 'write', name: 'write', status: 'idle' },
  { id: 'validate', name: 'validate', status: 'idle' },
];

function getAgentIcon(agentId: string) {
  const rawName = AGENT_NAMES[agentId] || agentId;
  return rawName.split(' ')[0];
}

function getAgentLabel(agentId: string) {
  const rawName = AGENT_NAMES[agentId] || agentId;
  return rawName.split(' ').slice(1).join(' ') || rawName;
}

function getAgentDescription(agentId: string) {
  return AGENT_DESCRIPTIONS[agentId] || 'Agent is processing tasks';
}

function getAgentProgress(status: 'idle' | 'running' | 'complete' | 'error') {
  switch (status) {
    case 'running':
      return 50;
    case 'complete':
      return 100;
    case 'error':
      return 100;
    default:
      return 0;
  }
}

export function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [taskOutput, setTaskOutput] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  // Determine API URL
  const getApiUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Check if we're on production (Vercel) or localhost
      const host = window.location.host;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      return `${wsUrl}/ws/task`;
    }
    return '/ws/task';
  }, []);

  const { isConnected, send, connect, disconnect } = useWebSocket(getApiUrl(), {
    onMessage: (message) => {
      switch (message.event) {
        case 'agent_start':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'running' }
                : agent
            )
          );
          break;

        case 'agent_complete':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'complete', output: message.output_preview }
                : agent
            )
          );
          break;

        case 'agent_error':
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === message.agent_id
                ? { ...agent, status: 'error', error: message.error }
                : agent
            )
          );
          break;

        case 'task_complete':
          setTaskOutput(message.results.write || 'No output generated');
          setExecutionTime(message.execution_time);
          setIsRunning(false);
          break;

        case 'error':
          console.error('API Error:', message.message);
          setIsRunning(false);
          break;
      }
    },
    onOpen: () => {
      setConnectionStatus('Connected');
    },
    onClose: () => {
      setConnectionStatus('Disconnected');
    },
    onError: () => {
      setConnectionStatus('Connection Failed');
    },
  });

  // Ensure WebSocket is connected while this component is mounted
  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  const handleTaskSubmit = useCallback(
    (description: string) => {
      // If WebSocket isn't connected, fall back to HTTP POST to the API
      if (!isConnected) {
        setAgents(INITIAL_AGENTS);
        setTaskOutput(null);
        setExecutionTime(undefined);
        setIsRunning(true);

        (async () => {
          try {
            const apiBase =
              (process.env.NEXT_PUBLIC_API_URL as string) ||
              `${window.location.protocol}//${window.location.host}`;
            const resp = await fetch(`${apiBase.replace(/\/$/, '')}/api/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task_id: `task_${Date.now()}`,
                description,
                workflow: ['research', 'analyze', 'write', 'validate'],
              }),
            });

            const data = await resp.json();

            // The API returns either a results map or an object with `results` and `execution_time`.
            const resultsMap = data.results || data;
            setTaskOutput(resultsMap.write || 'No output generated');
            setExecutionTime(data.execution_time || undefined);

            // mark agents complete if results are present
            setAgents((prev) =>
              prev.map((agent) => ({
                ...agent,
                status: resultsMap[agent.id] ? 'complete' : 'idle',
                output: resultsMap[agent.id],
              }))
            );
          } catch (err) {
            console.error('HTTP fallback failed', err);
            alert('Failed to execute task via HTTP fallback. Please check the server.');
          } finally {
            setIsRunning(false);
          }
        })();

        return;
      }

      // Reset state
      setAgents(INITIAL_AGENTS);
      setTaskOutput(null);
      setExecutionTime(undefined);
      setIsRunning(true);

      // Send task via WebSocket
      send({
        task_id: `task_${Date.now()}`,
        description,
        workflow: ['research', 'analyze', 'write', 'validate'],
      });
    },
    [isConnected, send]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              🤖 Multi-Agent System
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${
                isConnected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }
            `}
          >
            {connectionStatus}
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Task form */}
        <TaskForm onSubmit={handleTaskSubmit} isLoading={isRunning} />

        {/* Agents grid */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Agent Execution Flow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  icon={getAgentIcon(agent.id)}
                  name={getAgentLabel(agent.id)}
                  description={getAgentDescription(agent.id)}
                  status={agent.status}
                  progress={getAgentProgress(agent.status)}
                  index={index}
                  borderColor={AGENT_COLOR_MAP[agent.id] ?? 'cyan'}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        <Results
          output={taskOutput}
          isLoading={isRunning}
          executionTime={executionTime}
        />

        {/* Metrics */}
        {taskOutput && executionTime && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Performance Metrics
            </h2>
            <Metrics
              executionTime={executionTime}
              agentCount={4}
              outputLength={taskOutput.length}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
