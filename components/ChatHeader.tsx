import React from 'react';
import { RocketIcon } from './icons/RocketIcon';

export const ChatHeader: React.FC = () => {
  return (
    <div className="px-6 lg:px-8 py-5 border-b border-soft-gray bg-gradient-to-r from-white via-sky-blue/5 to-white flex-shrink-0">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-blue/20 to-sky-blue/10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <RocketIcon className="h-6 w-6 text-sky-blue" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-deep-navy truncate">Mission Assistant</h3>
          <p className="text-sm text-gray-600 mt-1">Get help and guidance</p>
        </div>
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
      </div>
    </div>
  );
};

