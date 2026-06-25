'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FinalOutputSectionProps {
  output: string;
  executionTime: number;
  agentIcon: string;
}

export function FinalOutputSection({
  output,
  executionTime,
  agentIcon,
}: FinalOutputSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mx-8 mt-8"
    >
      {/* Header with Icon and Info */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xl">
            {agentIcon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Final Output</h3>
            <p className="text-sm text-slate-400">
              Writer Agent • completed in {executionTime.toFixed(1)}s
            </p>
          </div>
        </motion.div>

        {/* Copy Button */}
        <AnimatePresence mode="wait">
          <motion.button
            key={copied ? 'copied' : 'copy'}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`
              px-4 py-2 rounded-lg font-medium
              flex items-center gap-2 transition-all
              border
              ${
                copied
                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                  : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Output Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-8 overflow-hidden"
      >
        {/* Output Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-h-96 overflow-y-auto rounded-lg bg-slate-900/50 p-6 text-slate-200 leading-relaxed text-base"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-slate-700">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold text-white mt-5 mb-2 pb-1 border-b border-slate-700/50">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-semibold text-slate-300 mt-3 mb-1">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300 pl-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300 pl-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
                const isBlock = !!className;
                return isBlock ? (
                  <code className="block bg-slate-950/70 text-emerald-200 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-3 border border-slate-700/40">{children}</code>
                ) : (
                  <code className="bg-slate-700/60 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="mb-3 overflow-x-auto">{children}</pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-emerald-500/60 pl-4 py-1 my-3 text-slate-400 italic">{children}</blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-slate-300">{children}</em>
              ),
              hr: () => <hr className="border-slate-700 my-4" />,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300 transition-colors">{children}</a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-sm border-collapse border border-slate-700">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-800/60">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-slate-700 px-3 py-2 text-left font-semibold text-slate-200">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-slate-700 px-3 py-2 text-slate-300">{children}</td>
              ),
            }}
          >
            {output}
          </ReactMarkdown>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}