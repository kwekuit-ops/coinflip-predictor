import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { playScanSound } from '../utils/sounds';

const PredictorPanel = ({ history, credits, onStartPredict, onPredict }) => {
  const [status, setStatus] = useState('Idle');
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = async () => {
    if (isPredicting || credits < 1) return;

    if (onStartPredict) {
      const success = await onStartPredict();
      if (!success) return;
    }

    setIsPredicting(true);
    setPrediction(null);
    setStatus('Analyzing');

    const statuses = ['Analyzing', 'Scanning', 'Syncing', 'Locked'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < statuses.length) {
        setStatus(statuses[i]);
        playScanSound();
        i++;
      } else {
        clearInterval(interval);

        let pred = Math.random() > 0.5 ? 'HEAD' : 'TAIL';
        let conf = 70 + Math.floor(Math.random() * 25);

        if (history?.length >= 2 && history[0] === history[1]) {
          pred = history[0] === 'HEAD' ? 'TAIL' : 'HEAD';
          conf = 88;
        }

        setPrediction(pred);
        setConfidence(conf);
        setStatus('Ready');
        setIsPredicting(false);

        onPredict?.(pred);
      }
    }, 500);
  };

  const isHead = prediction === 'HEAD';

  return (
    <div className="glass-card rounded-2xl p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white tracking-tight">AI Predictor</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isPredicting ? 'bg-amber-400 animate-pulse' : prediction ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
              <span className="text-[11px] text-zinc-500 font-medium truncate">{status}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {prediction && !isPredicting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="shrink-0 text-right"
            >
              <p className="text-[10px] font-semibold text-emerald-400/90 uppercase tracking-wider whitespace-nowrap">
                {confidence}% match
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {prediction && !isPredicting ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-3 sm:mb-4 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 text-center ${
              isHead
                ? 'bg-amber-500/10 border-amber-500/25'
                : 'bg-cyan-500/10 border-cyan-500/25'
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-0.5 sm:mb-1">Next round</p>
            <p
              className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${
                isHead ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {prediction}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-3 sm:mb-4 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-4 sm:px-4 sm:py-5 text-center"
          >
            <Sparkles className="w-4 h-4 text-zinc-600 mx-auto mb-1.5 sm:mb-2" />
            <p className="text-xs text-zinc-500">Tap below to get your signal</p>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 sm:mb-2">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {history.slice(0, 8).map((side, i) => (
              <span
                key={`${side}-${i}`}
                className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                  side === 'HEAD'
                    ? 'bg-amber-500/10 text-amber-400/90 border-amber-500/20'
                    : 'bg-cyan-500/10 text-cyan-400/90 border-cyan-500/20'
                }`}
              >
                {side === 'HEAD' ? 'H' : 'T'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        {!isPredicting ? (
          <button
            type="button"
            disabled={credits < 1}
            onClick={handlePredict}
            className={`w-full min-h-[48px] font-display font-bold py-3.5 sm:py-3 rounded-xl text-[14px] sm:text-sm tracking-wide transition-all active:scale-[0.98] ${
              credits < 1
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400/30 shadow-[0_8px_24px_var(--accent-glow)]'
            }`}
          >
            {credits < 1 ? 'Need tokens (Tap +)' : 'Predict next round'}
          </button>
        ) : (
          <div className="flex justify-center items-center gap-2 min-h-[48px] py-3 rounded-xl bg-white/[0.03] border border-white/5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.1, 0.85] }}
                transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                className="w-2 h-2 bg-blue-400 rounded-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictorPanel;
