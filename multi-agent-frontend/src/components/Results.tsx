
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ResultsProps {
  output: string | null;
  isLoading: boolean;
  executionTime?: number;
}

export function Results({
  output,
  isLoading,
  executionTime,
}: ResultsProps) {
  return (
    <AnimatePresence>
      {(output || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mt-8 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📝 Final Output (Writer Agent)
            </h3>
            {executionTime && (
              <span className="text-sm font-medium text-gray-600">
                Completed in {executionTime.toFixed(2)}s
              </span>
            )}
          </div>

          {/* Output container */}
          <div
            className={`
              p-6 rounded-lg border-2 border-gray-200
              bg-gray-50 max-h-96 overflow-y-auto
              font-mono text-sm text-gray-800
              whitespace-pre-wrap break-words
            `}
          >
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gray-500"
              >
                ⏳ Generating output...
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {output}
              </motion.div>
            )}
          </div>

          {/* Copy button */}
          {output && !isLoading && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigator.clipboard.writeText(output);
                alert('Copied to clipboard!');
              }}
              className="
                px-4 py-2 rounded-lg font-medium
                bg-white border-2 border-gray-300
                hover:border-gray-400 hover:bg-gray-50
                transition-colors text-sm text-gray-700
              "
            >
              📋 Copy Output
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}