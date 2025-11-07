import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-8 py-5 border-t border-soft-gray bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm z-10 flex-shrink-0">
      <form onSubmit={onSubmit} className="flex space-x-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "Lumina is thinking..." : "Type your message..."}
          disabled={disabled}
          className="flex-1 px-5 py-3.5 border-2 border-soft-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-blue focus:border-sky-blue text-base font-normal text-deep-navy transition-all duration-200 focus:shadow-lg bg-white disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-6 py-3.5 bg-gradient-to-br from-sky-blue to-sky-blue/90 text-white rounded-xl hover:from-sky-blue/90 hover:to-sky-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold hover:shadow-xl hover:scale-105 active:scale-100 disabled:hover:scale-100 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

