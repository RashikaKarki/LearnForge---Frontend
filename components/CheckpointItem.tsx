import React, { useRef, useEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTextCard, setShowTextCard] = useState(true);

  useEffect(() => {
    const checkSpace = () => {
      if (!containerRef.current) return;
      
      // Find the journey map container (parent with relative positioning)
      let container = containerRef.current.parentElement;
      while (container && !container.classList.contains('relative')) {
        container = container.parentElement;
      }
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const centerX = containerWidth / 2;
      const minGap = 70; // Minimum gap from center line in pixels (reduced for tighter layouts)
      const cardMaxWidth = 130; // Max width threshold - text cards stay visible even longer
      const flagWidth = 80; // Flag width (w-20 = 80px)
      const flagMargin = 40; // Margin from flag
      
      // Calculate available space on each side
      // For even (right side): space from center to right edge
      // For odd (left side): space from left edge to center
      const availableSpace = isEven 
        ? containerWidth - centerX - minGap - flagWidth - flagMargin
        : centerX - minGap - flagWidth - flagMargin;
      
      // Hide card if there's not enough space for the minimum card width
      setShowTextCard(availableSpace >= cardMaxWidth);
    };

    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(checkSpace);
    if (containerRef.current) {
      const container = containerRef.current.closest('.relative');
      if (container) {
        resizeObserver.observe(container);
      }
    }
    
    checkSpace();
    window.addEventListener('resize', checkSpace);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkSpace);
    };
  }, [isEven]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[120px] lg:min-h-[140px]"
    >
      {/* Path Connection Point - Centered on the central line */}
      <div className={`hidden lg:block absolute left-1/2 w-12 h-12 bg-white border-[3px] rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 z-30 flex items-center justify-center shadow-lg group ${
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
        
        {/* Tooltip - shown when text card is hidden */}
        {!showTextCard && (
          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
            <div className="absolute bottom-full left-0 translate-x-[20%] mb-8 bg-white border-2 border-sky-blue rounded-xl shadow-2xl px-4 py-3 min-w-[200px] max-w-[280px]">
              <div className="flex items-start space-x-2">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                  status === 'completed' ? 'bg-sky-blue/20' : status === 'locked' ? 'bg-gray-200' : 'bg-sky-blue/10'
                }`}>
                  <RocketIcon className={`h-4 w-4 ${
                    status === 'completed' ? 'text-sky-blue' : status === 'locked' ? 'text-gray-400' : 'text-sky-blue'
                  }`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold mb-1 ${
                    status === 'locked' ? 'text-gray-400' : 'text-deep-navy'
                  }`}>
                    Checkpoint {index + 1}
                  </p>
                  <p className={`text-xs font-normal leading-snug break-words ${
                    status === 'locked' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {checkpoint}
                  </p>
                </div>
              </div>
              {/* Arrow pointing down to the circle */}
              <div className={`absolute top-full -mt-[2px] w-4 h-4 rotate-45 bg-white border-2 ${
                status === 'completed' ? 'border-sky-blue' : status === 'locked' ? 'border-soft-gray' : 'border-sky-blue'
              } border-t-0 border-l-0`}></div>
            </div>
          </div>
        )}
      </div>

      {/* Checkpoint Flag - Positioned on left for even, right for odd - Only shown when text card is visible */}
      {showTextCard && (
        <div className={`hidden lg:block absolute z-10 top-1/2 transform -translate-y-1/2 ${isEven ? 'left-1/2 -translate-x-[calc(100%+40px)]' : 'right-1/2 translate-x-[calc(100%+40px)]'}`}>
        <div className="relative">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
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
      )}

      {/* Mobile Flag */}
      <div className="lg:hidden mb-4">
        <div className="relative">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
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
          {status === 'available' && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-coral rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        <div className="mt-3 text-center">
          <p className={`text-sm font-semibold ${status === 'locked' ? 'text-gray-400' : 'text-deep-navy'}`}>
            Checkpoint {index + 1}
          </p>
        </div>
      </div>

      {/* Checkpoint Content Card - Positioned on right for even, left for odd */}
      {showTextCard && (
        <div className={`hidden lg:block absolute top-1/2 transform -translate-y-1/2 ${isEven ? 'left-1/2 translate-x-[calc(70px+40px)]' : 'right-1/2 -translate-x-[calc(30px+40px)]'} w-[240px]`}>
          <div
            className={`p-3 rounded-2xl shadow-xl backdrop-blur-sm ${
              status === 'completed'
                ? 'bg-gradient-to-br from-sky-blue/15 to-sky-blue/5 border-2 border-sky-blue'
                : status === 'locked'
                ? 'bg-soft-gray/30 border-2 border-soft-gray opacity-60'
                : 'bg-white/80 border-2 border-soft-gray hover:border-sky-blue hover:shadow-2xl hover:bg-white'
            } transition-all duration-300`}
          >
            <div className={`flex items-start space-x-2 ${isEven ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                status === 'completed' ? 'bg-sky-blue/20' : status === 'locked' ? 'bg-gray-200' : 'bg-sky-blue/10'
              }`}>
                <RocketIcon className={`h-4 w-4 ${
                  status === 'completed' ? 'text-sky-blue' : status === 'locked' ? 'text-gray-400' : 'text-sky-blue'
                }`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className={`text-xs font-normal leading-snug break-words break-all ${
                  status === 'locked' ? 'text-gray-400' : 'text-deep-navy'
                }`}>
                  {checkpoint}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Content Card */}
      {showTextCard && (
        <div className="lg:hidden w-full">
          <div
            className={`inline-block w-full max-w-[240px] p-3 rounded-2xl shadow-xl backdrop-blur-sm ${
              status === 'completed'
                ? 'bg-gradient-to-br from-sky-blue/15 to-sky-blue/5 border-2 border-sky-blue'
                : status === 'locked'
                ? 'bg-soft-gray/30 border-2 border-soft-gray opacity-60'
                : 'bg-white/80 border-2 border-soft-gray hover:border-sky-blue hover:shadow-2xl hover:bg-white'
            } transition-all duration-300`}
          >
            <div className="flex items-start space-x-2">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                status === 'completed' ? 'bg-sky-blue/20' : status === 'locked' ? 'bg-gray-200' : 'bg-sky-blue/10'
              }`}>
                <RocketIcon className={`h-4 w-4 ${
                  status === 'completed' ? 'text-sky-blue' : status === 'locked' ? 'text-gray-400' : 'text-sky-blue'
                }`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className={`text-xs font-normal leading-snug break-words break-all ${
                  status === 'locked' ? 'text-gray-400' : 'text-deep-navy'
                }`}>
                  {checkpoint}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

