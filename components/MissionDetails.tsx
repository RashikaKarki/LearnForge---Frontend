import React from 'react';
import { Mission } from '../types';
import { RocketIcon } from './icons/RocketIcon';

interface MissionDetailsProps {
  mission: Mission;
  onStartMission: () => void;
  onClose: () => void;
}

export const MissionDetails: React.FC<MissionDetailsProps> = ({
  mission,
  onStartMission,
  onClose,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-soft-gray p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sky-blue/10 rounded-lg">
                <RocketIcon className="h-6 w-6 text-sky-blue" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-deep-navy">{mission.title}</h2>
                <p className="text-gray-600 mt-2 text-base font-regular">{mission.short_description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mission Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-deep-navy mb-4">Mission Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-base font-semibold text-gray-500">Level</span>
                  <div className="mt-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getLevelColor(mission.level)}`}>
                      {mission.level}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-500">Learning Goal</span>
                  <p className="mt-2 text-base font-regular text-deep-navy">{mission.learning_goal}</p>
                </div>
                <div>
                  <span className="text-base font-semibold text-gray-500">Created</span>
                  <p className="mt-2 text-base font-regular text-deep-navy">{formatDate(mission.created_at)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-deep-navy mb-4">Skills You'll Learn</h3>
              <div className="flex flex-wrap gap-3">
                {mission.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex px-4 py-2 bg-sky-blue/10 text-sky-blue text-base font-semibold rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-2xl font-semibold text-deep-navy mb-4">Description</h3>
            <p className="text-deep-navy leading-relaxed text-base font-regular">{mission.description}</p>
          </div>

          {/* Topics to Cover */}
          <div>
            <h3 className="text-2xl font-semibold text-deep-navy mb-4">Topics to Cover</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mission.topics_to_cover.map((topic, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-sky-blue rounded-full"></div>
                  <span className="text-base font-regular text-deep-navy">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Checkpoints */}
          <div>
            <h3 className="text-2xl font-semibold text-deep-navy mb-4">Learning Checkpoints</h3>
            <div className="space-y-4">
              {mission.byte_size_checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-soft-gray rounded-lg">
                  <div className="flex-shrink-0 w-7 h-7 bg-sky-blue text-white rounded-full flex items-center justify-center text-base font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-regular text-deep-navy">{checkpoint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-soft-gray">
            <button
              onClick={onStartMission}
              className="flex-1 flex items-center justify-center px-6 py-4 bg-coral text-white font-semibold rounded-lg shadow-md hover:bg-coral/90 transition-colors duration-300 transform hover:scale-105 text-base"
            >
              <RocketIcon className="h-5 w-5 mr-2" strokeWidth={2} />
              Start Mission
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-soft-gray text-deep-navy font-semibold rounded-lg hover:bg-soft-gray transition-colors duration-300 text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
