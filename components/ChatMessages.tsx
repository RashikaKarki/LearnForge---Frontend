import React, { useRef, useEffect } from 'react';
import { RocketIcon } from './icons/RocketIcon';

export interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-8 py-6 space-y-4 bg-gradient-to-b from-white via-gray-50/20 to-white pb-24">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8 sm:mt-16 px-4 animate-fade-in">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-sky-blue/20 to-sky-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse-slow shadow-lg">
            <RocketIcon className="h-10 w-10 sm:h-12 sm:w-12 text-sky-blue" strokeWidth={2} />
          </div>
          <p className="text-base sm:text-lg font-semibold text-deep-navy mb-2 sm:mb-3 animate-slide-up">Welcome to your Mission Assistant!</p>
          <p className="text-xs sm:text-sm font-normal text-gray-600 leading-relaxed max-w-sm mx-auto animate-slide-up-delay">I'm here to help you through your learning journey. Ask me anything about your mission!</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-lg transition-all duration-300 ${
                message.from === 'user'
                  ? 'bg-gradient-to-br from-sky-blue to-sky-blue/90 text-white'
                  : 'bg-white border-2 border-soft-gray text-deep-navy'
              }`}
            >
              <p className="text-xs sm:text-sm font-normal leading-relaxed">{message.text}</p>
              <p className={`text-[10px] sm:text-xs mt-2 sm:mt-2.5 ${
                message.from === 'user' ? 'text-white/70' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

