import React from 'react';
import { RocketIcon } from './icons/RocketIcon';
import { CheckpointItem } from './CheckpointItem';

type CheckpointStatus = 'completed' | 'locked' | 'available';

interface JourneyMapProps {
  checkpoints: string[];
  completedCheckpoints: string[];
  progressPercentage: number;
  getCheckpointStatus: (checkpoint: string, index: number) => CheckpointStatus;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({
  checkpoints,
  completedCheckpoints,
  progressPercentage,
  getCheckpointStatus,
}) => {
  const isCompleted = completedCheckpoints.length === checkpoints.length;

  return (
    <div className="hidden lg:flex flex-[2] bg-gradient-to-br from-white via-gray-50/30 to-white border-r border-soft-gray overflow-y-auto min-h-0">
      <div className="w-full px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-deep-navy mb-2">Mission Journey</h2>
          <p className="text-sm text-gray-600">Navigate through your learning path</p>
        </div>
        
        {/* Journey Path Visualization */}
        <div className="relative pb-8 lg:pb-0">
          {/* Central Path Line - animated based on progress */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1.5 transform -translate-x-1/2">
            <div className="absolute top-0 left-0 w-full bg-soft-gray h-full rounded-full"></div>
            <div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-sky-blue to-sky-blue/80 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ height: `${progressPercentage}%` }}
            ></div>
            {/* Glow effect on progress */}
            <div 
              className="absolute top-0 left-0 w-full bg-sky-blue/20 blur-sm rounded-full transition-all duration-1000 ease-out"
              style={{ height: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Mobile Path Line - Vertical line for mobile */}
          <div className="lg:hidden absolute left-8 top-0 bottom-0 w-0.5">
            <div className="absolute top-0 left-0 w-full bg-soft-gray h-full"></div>
            <div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-sky-blue to-sky-blue/80 transition-all duration-1000 ease-out"
              style={{ height: `${progressPercentage}%` }}
            ></div>
          </div>
          
          {/* Checkpoints */}
          <div className="relative space-y-16">
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

          {/* Start Point */}
          <div className="absolute left-8 lg:left-1/2 -top-6 transform lg:-translate-x-1/2 z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-coral to-coral/80 rounded-full flex items-center justify-center shadow-xl ring-4 ring-coral/20">
              <RocketIcon className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-deep-navy text-center mt-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block">Start</p>
          </div>

          {/* End Point */}
          <div className="absolute left-8 lg:left-1/2 bottom-0 transform lg:-translate-x-1/2 z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
              isCompleted
                ? 'bg-gradient-to-br from-sky-blue to-sky-blue/80 ring-4 ring-sky-blue/20'
                : 'bg-soft-gray ring-2 ring-gray-200'
            }`}>
              {isCompleted ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <RocketIcon className="h-8 w-8 text-white" strokeWidth={2} />
              )}
            </div>
            <p className={`text-sm font-semibold text-center mt-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block ${
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

