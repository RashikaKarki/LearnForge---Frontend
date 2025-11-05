import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  completed: number;
  total: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  completed,
  total,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-soft-gray shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-xs font-normal text-gray-500 uppercase tracking-wide hidden sm:block">Progress</p>
          <p className="text-xl font-bold text-sky-blue sm:mt-1">{Math.round(progress)}%</p>
        </div>
        <div className="w-14 h-14 relative flex-shrink-0">
          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#EAEAEA"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#5BC0BE"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-deep-navy">
              {completed}/{total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

