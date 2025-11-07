import React from 'react';
import { RocketIcon } from './icons/RocketIcon';
import { CheckpointItem } from './CheckpointItem';

type CheckpointStatus = 'completed' | 'locked' | 'available';

interface JourneyMapProps {
  checkpoints: string[];
  completedCheckpoints: string[];
  progressPercentage: number;
  getCheckpointStatus: (checkpoint: string, index: number) => CheckpointStatus;
  width?: number; // Percentage width
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  checkpoints,
  completedCheckpoints,
  progressPercentage,
  getCheckpointStatus,
  width = 40,
}) => {
  const isCompleted = completedCheckpoints.length === checkpoints.length;

  return (
    <div 
      data-journey-map
      className="journey-map-container hidden lg:flex bg-gradient-to-br from-white via-gray-50/30 to-white border-r border-soft-gray overflow-y-auto min-h-0"
      style={{ flexShrink: 0 }}
    >
      {/* Apply width on large screens */}
      <style>{`
        .journey-map-container {
          width: ${width}%;
          flex-shrink: 0;
        }
      `}</style>
      <div className="w-full px-6 lg:px-8 py-8">
        {/* Header - Hidden on tablet, shown on desktop */}
        <div className="mb-8 hidden lg:block">
          <h2 className="text-xl font-semibold text-deep-navy mb-2">Mission Journey</h2>
          <p className="text-sm text-gray-600">Navigate through your learning path</p>
        </div>
        
        {/* Journey Path Visualization */}
        <div className="relative pt-20 pb-20">
          {/* Central Path Line - animated based on progress */}
          <div className="absolute left-1/2 top-20 bottom-20 w-1.5 transform -translate-x-1/2 z-0">
            <div className="absolute top-0 left-0 w-full bg-soft-gray h-full rounded-full"></div>
            <div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-sky-blue to-sky-blue/80 rounded-full transition-all duration-1000 ease-out shadow-lg z-10"
              style={{ height: `${progressPercentage}%` }}
            ></div>
            {/* Glow effect on progress */}
            <div 
              className="absolute top-0 left-0 w-full bg-sky-blue/20 blur-sm rounded-full transition-all duration-1000 ease-out z-10"
              style={{ height: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Start Point - Hidden on tablet, shown on desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 transform -translate-x-1/2 z-20">
            <div className="w-16 h-16 bg-gradient-to-br from-coral to-coral/80 rounded-full flex items-center justify-center shadow-xl ring-4 ring-coral/20">
              <RocketIcon className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-deep-navy text-center mt-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block">Start</p>
          </div>

          {/* Checkpoints - Hidden on tablet, shown on desktop */}
          <div className="hidden lg:block relative space-y-16 pt-4 pb-24">
            {checkpoints.map((checkpoint, index) => {
              const status = getCheckpointStatus(checkpoint, index);
              const isEven = index % 2 === 0;
              
              return (
                <CheckpointItem
                  key={index}
                  checkpoint={checkpoint}
                  index={index}
                  status={status}
                  isEven={isEven}
                />
              );
            })}
          </div>

          {/* End Point - Hidden on tablet, shown on desktop */}
          <div className="hidden lg:block absolute left-1/2 bottom-0 transform -translate-x-1/2 z-50 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-br from-sky-blue to-sky-blue/80'
                : 'bg-soft-gray'
            }`}>
              {isCompleted ? (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <RocketIcon className="h-6 w-6 text-white" strokeWidth={2} />
              )}
            </div>
            <p className={`text-sm font-semibold text-center mt-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full ${
              isCompleted ? 'text-sky-blue' : 'text-deep-navy'
            }`}>
              Complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

