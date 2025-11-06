import React from 'react';
import { RocketIcon } from './icons/RocketIcon';

type CheckpointStatus = 'completed' | 'locked' | 'available';

interface CheckpointItemProps {
  checkpoint: string;
  index: number;
  status: CheckpointStatus;
  isEven: boolean;
}

export const CheckpointItem: React.FC<CheckpointItemProps> = ({
  checkpoint,
  index,
  status,
  isEven,
}) => {
  return (
    <div
      className={`relative flex flex-col lg:flex-row items-center min-h-[120px] lg:min-h-0 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
    >
      {/* Checkpoint Flag */}
      <div className={`relative z-10 order-2 lg:order-1 mb-4 lg:mb-0 ${isEven ? 'lg:mr-6' : 'lg:ml-6'}`}>
        <div className="relative">
          <div
            className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
              status === 'completed'
                ? 'bg-gradient-to-br from-sky-blue to-sky-blue/80 text-white transform scale-110 ring-4 ring-sky-blue/20'
                : status === 'locked'
                ? 'bg-soft-gray text-gray-400 ring-2 ring-gray-200'
                : 'bg-white border-[3px] border-sky-blue text-sky-blue hover:scale-105 hover:shadow-xl hover:border-sky-blue/80'
            }`}
          >
            {status === 'completed' ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-2xl font-bold">{index + 1}</span>
            )}
          </div>
          {/* Status badge */}
          {status === 'available' && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-coral rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        {/* Flag Label */}
        <div className="mt-3 text-center">
          <p className={`text-sm font-semibold ${status === 'locked' ? 'text-gray-400' : 'text-deep-navy'}`}>
            Checkpoint {index + 1}
          </p>
        </div>
      </div>

      {/* Path Connection Point - Only visible on desktop */}
      <div className={`hidden lg:block absolute left-1/2 w-12 h-12 bg-white border-[3px] rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-30 flex items-center justify-center shadow-lg ${
        status === 'completed' ? 'border-sky-blue ring-2 ring-sky-blue/20' : 'border-soft-gray'
      }`}>
        <div className="flex items-center justify-center w-full h-full">
          {status === 'completed' && (
            <div className="w-5 h-5 bg-sky-blue rounded-full shadow-md"></div>
          )}
          {status === 'available' && (
            <div className="w-3 h-3 bg-sky-blue/30 rounded-full"></div>
          )}
          {status === 'locked' && (
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Checkpoint Content Card */}
      <div className={`flex-1 order-1 lg:order-2 w-full lg:w-auto ${isEven ? 'lg:text-right' : 'lg:text-left'} text-center lg:text-left`}>
        <div
          className={`inline-block w-full lg:w-auto lg:max-w-[300px] p-4 rounded-2xl shadow-xl backdrop-blur-sm ${
            status === 'completed'
              ? 'bg-gradient-to-br from-sky-blue/15 to-sky-blue/5 border-2 border-sky-blue'
              : status === 'locked'
              ? 'bg-soft-gray/30 border-2 border-soft-gray opacity-60'
              : 'bg-white/80 border-2 border-soft-gray hover:border-sky-blue hover:shadow-2xl hover:bg-white'
          } transition-all duration-300`}
        >
          <div className={`flex items-start space-x-3 ${isEven ? 'lg:flex-row-reverse lg:space-x-reverse' : ''}`}>
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              status === 'completed' ? 'bg-sky-blue/20' : status === 'locked' ? 'bg-gray-200' : 'bg-sky-blue/10'
            }`}>
              <RocketIcon className={`h-5 w-5 ${
                status === 'completed' ? 'text-sky-blue' : status === 'locked' ? 'text-gray-400' : 'text-sky-blue'
              }`} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-normal leading-relaxed ${
                status === 'locked' ? 'text-gray-400' : 'text-deep-navy'
              }`}>
                {checkpoint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

