import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AvaraLoadingExperience({ onComplete, duration = 1200 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 20;
    const step = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 200);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  const letters = ['A', 'V', 'A', 'R', 'A'];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      className="fixed inset-0 z-[999999] bg-obsidian text-white flex flex-col items-center justify-center select-none"
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Animated Brand Letters */}
        <div className="flex items-center gap-4 sm:gap-6">
          {letters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.6,
                ease: [0.19, 1, 0.22, 1]
              }}
              className="font-serif text-3xl sm:text-5xl font-extrabold tracking-widest text-sand-50"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Minimalist Progress Meter */}
        <div className="w-48 sm:w-64 space-y-2">
          <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-avara-500 via-gold-400 to-avara-400"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-white/40">
            <span>Operating System</span>
            <span>{Math.round(progress).toString().padStart(2, '0')}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
