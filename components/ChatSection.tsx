import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages, ChatMessage } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatSectionProps {
  messages: ChatMessage[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
}) => {
  return (
    <div className="flex-[3] w-full lg:w-auto bg-white lg:border-l border-soft-gray flex flex-col relative min-h-0">
      <ChatHeader />
      <ChatMessages messages={messages} />
      <ChatInput
        value={inputMessage}
        onChange={onInputChange}
        onSubmit={onSendMessage}
      />
    </div>
  );
};

