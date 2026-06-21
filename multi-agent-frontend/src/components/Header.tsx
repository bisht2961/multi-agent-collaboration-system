'use client';

import { motion } from 'framer-motion';

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  return (
    <header className="border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 px-8 py-6">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          {/* Circular Logo with Gradient */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Multi-Agent AI</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Orchestration Platform
            </p>
          </div>
        </motion.div>

        {/* Connected Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`
            px-4 py-2 rounded-full border flex items-center gap-2
            ${
              isConnected
                ? 'border-cyan-500/50 bg-cyan-500/10'
                : 'border-red-500/50 bg-red-500/10'
            }
          `}
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-cyan-400' : 'bg-red-400'
            }`}
          />
          <span className={isConnected ? 'text-cyan-300' : 'text-red-300'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.div>
      </div>
    </header>
  );
}