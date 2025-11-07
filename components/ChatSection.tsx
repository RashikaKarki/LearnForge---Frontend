import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages, ChatMessage } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatSectionProps {
  messages: ChatMessage[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isTyping: boolean;
  width?: number; // Percentage width
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  isTyping,
  width = 60,
}) => {
  return (
    <div 
      className="chat-section-container flex-1 lg:flex-none w-full bg-white lg:border-l border-soft-gray flex flex-col relative min-h-0"
      style={{ 
        flexShrink: 0,
      }}
    >
      {/* Apply width only on large screens using a wrapper with media query */}
      <style>{`
        @media (min-width: 1024px) {
          .chat-section-container {
            width: ${width}% !important;
            flex: none !important;
          }
        }
      `}</style>
      <ChatHeader />
      <ChatMessages messages={messages} isTyping={isTyping} />
      <ChatInput
        value={inputMessage}
        onChange={onInputChange}
        onSubmit={onSendMessage}
        disabled={isTyping}
      />
    </div>
  );
};

