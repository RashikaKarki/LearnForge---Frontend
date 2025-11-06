import React from 'react';
import { Mission } from '../types';
import { RocketIcon } from './icons/RocketIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onClick }) => {
  const isOngoing = mission.progress !== undefined;

  const handleStartMission = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement actual mission start logic
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer border border-soft-gray/50"
      onClick={handleCardClick}
    >
      <div className="p-6 flex-grow">
        <div className="flex items-start mb-4">
          <div className={`p-2.5 rounded-lg mr-3 flex-shrink-0 ${isOngoing ? 'bg-sky-blue/10' : 'bg-soft-gray'}`}>
            {isOngoing ? 
              <RocketIcon className="h-5 w-5 text-sky-blue" strokeWidth={2} /> : 
              <BookOpenIcon className="h-5 w-5 text-deep-navy/60" strokeWidth={2} />
            }
          </div>
          <h3 className="text-[22px] font-semibold text-deep-navy leading-tight">{mission.title}</h3>
        </div>
        <p className="text-gray-600 text-base font-normal mb-4 min-h-[4rem] line-clamp-3">{mission.description}</p>
        {mission.tags && mission.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mission.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-3 py-1 text-sm font-normal bg-soft-gray text-deep-navy rounded-md">
                {tag}
              </span>
            ))}
            {mission.tags.length > 3 && (
              <span className="px-3 py-1 text-sm font-normal text-gray-500">+{mission.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {isOngoing && (
        <div className="px-6 pb-6 pt-2 border-t border-soft-gray/50">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm font-normal text-gray-600">Progress</span>
            <span className="text-base font-semibold text-sky-blue">{Math.round(mission.progress || 0)}%</span>
          </div>
          <div className="w-full bg-soft-gray rounded-full h-2 overflow-hidden">
            <div 
              className="bg-sky-blue h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${mission.progress}%` }}>
            </div>
          </div>
        </div>
      )}

      {!isOngoing && (
         <div className="px-6 py-4 mt-auto bg-soft-gray/50 border-t border-soft-gray/50">
            <button 
              onClick={handleStartMission}
              className="w-full text-center font-semibold text-sky-blue hover:text-deep-navy transition-colors duration-200 text-base py-1"
            >
              Start Mission
            </button>
         </div>
      )}
    </div>
  );
};

export default MissionCard;