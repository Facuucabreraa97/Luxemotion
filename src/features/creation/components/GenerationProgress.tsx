import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface GenerationProgressProps {
  status: 'idle' | 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  elapsedTime?: number;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  status,
  elapsedTime = 0,
}) => {
  const [progress, setProgress] = useState(0);

  // Asymptotic progress simulation (Target ~150s for full generation)
  useEffect(() => {
    if (status === 'succeeded') {
      setProgress(100);
      return;
    }

    if (status === 'failed' || status === 'canceled' || status === 'idle') {
      return;
    }

    // Interval to increment progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Fast start
        if (prev < 20) return prev + 2;
        // Steady middle
        if (prev < 80) return prev + 0.5;
        // Slow crawl at the end
        if (prev < 95) return prev + 0.1;
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  if (status === 'succeeded') {
    return (
      <div className="w-full bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
        <CheckCircle2 className="text-green-500" size={24} />
        <div>
          <p className="text-white font-bold text-sm">Generation Complete</p>
          <p className="text-green-400 text-xs">Your video has been added to the gallery.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="w-full bg-red-500/20 border border-red-500/50 rounded-xl p-4 animate-fade-in text-center">
        <p className="text-red-400 font-bold text-sm">Generation Failed</p>
        <p className="text-white/50 text-xs">Credits have been refunded.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4 animate-pulse-glow">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin text-indigo-400" size={18} />
          <span className="text-sm font-medium text-white tracking-wide">
            {status === 'starting' ? 'Initializing GPU...' : 'Rendering Video frames...'}
          </span>
        </div>
        <span className="text-xs font-mono text-indigo-300">{Math.round(progress)}%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden relative">
        {/* Animated Bar */}
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-white/30 skew-x-12 translate-x-[-100%] animate-shimmer"></div>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-mono">
        Estimated time: {150 - elapsedTime > 0 ? `${150 - elapsedTime}s` : 'Wrapping up...'}
      </p>
    </div>
  );
};
