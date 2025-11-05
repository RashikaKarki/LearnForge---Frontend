import React from 'react';
import { RocketIcon } from './icons/RocketIcon';
import { ProgressIndicator } from './ProgressIndicator';

interface MissionHeaderProps {
  title: string;
  shortDescription: string;
  progress: number;
  completedCheckpoints: number;
  totalCheckpoints: number;
  onClose: () => void;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({
  title,
  shortDescription,
  progress,
  completedCheckpoints,
  totalCheckpoints,
  onClose,
}) => {
  return (
    <div className="bg-gradient-to-r from-white via-sky-blue/5 to-white border-b border-soft-gray shadow-sm flex-shrink-0">
      <div className="px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-sky-blue/10 transition-all duration-200 text-deep-navy hover:scale-105 flex-shrink-0"
              aria-label="Back to dashboard"
            >
              <svg className="w-5 h-5 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2.5 bg-sky-blue/10 rounded-lg flex-shrink-0">
                <RocketIcon className="h-5 w-5 sm:h-6 sm:w-6 text-sky-blue" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-deep-navy truncate">{title}</h1>
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">{shortDescription}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <ProgressIndicator
              progress={progress}
              completed={completedCheckpoints}
              total={totalCheckpoints}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

