import React from 'react';
import { Mission } from '../types';
import { RocketIcon } from './icons/RocketIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface MissionCardProps {
  mission: Mission;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission }) => {
  const isOngoing = mission.progress !== undefined;

  const handleStartMission = () => {
    // TODO: Implement actual mission start logic
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full mr-4 ${isOngoing ? 'bg-sky-blue/20' : 'bg-gray-100'}`}>
            {isOngoing ? 
              <RocketIcon className="h-6 w-6 text-sky-blue" /> : 
              <BookOpenIcon className="h-6 w-6 text-gray-500" />
            }
          </div>
          <h3 className="text-xl font-semibold text-deep-navy">{mission.title}</h3>
        </div>
        <p className="text-gray-600 text-base font-regular mb-4 h-16">{mission.description}</p>
        <div className="flex flex-wrap gap-2">
          {mission.tags?.map(tag => (
            <span key={tag} className="px-3 py-1 text-sm font-semibold bg-soft-gray text-deep-navy rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {isOngoing && (
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-semibold text-gray-500">Progress</span>
            <span className="text-base font-bold text-sky-blue">{mission.progress}%</span>
          </div>
          <div className="w-full bg-soft-gray rounded-full h-2.5">
            <div 
              className="bg-sky-blue h-2.5 rounded-full" 
              style={{ width: `${mission.progress}%` }}>
            </div>
          </div>
        </div>
      )}

      {!isOngoing && (
         <div className="p-6 mt-auto bg-soft-gray">
            <button 
              onClick={handleStartMission}
              className="w-full text-center font-semibold text-sky-blue hover:text-deep-navy transition-colors text-base"
            >
              Start Mission
            </button>
         </div>
      )}
    </div>
  );
};

export default MissionCard;