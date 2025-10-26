import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, Mission } from '../types';
import { useApiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useFlashError } from '../contexts/FlashErrorContext';
import { MarkdownMessage } from './MarkdownMessage';
import { 
  validateMessage, 
  validateWebSocketMessage, 
  sanitizeInput,
  rateLimiter,
  RATE_LIMITS,
  VALIDATION_LIMITS
} from '../utils/validation';
import { getPolarisWebSocketUrl } from '../config';

interface PolarisChatProps {
  onMissionCreated: (mission: Mission) => void;
  onClose: () => void;
}

export const PolarisChat: React.FC<PolarisChatProps> = ({
  onMissionCreated,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef<boolean>(false);
  const apiClient = useApiClient();
  const { user } = useAuth();
  const { showError } = useFlashError();

  // Stable callback references to prevent unnecessary re-renders
  const handleMissionCreated = useCallback((mission: Mission) => {
    onMissionCreated(mission);
  }, [onMissionCreated]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize WebSocket connection function
  const initializeConnection = useCallback(async () => {
    if (isInitializingRef.current || isInitialized) {
      return;
    }

    try {
      isInitializingRef.current = true;
      setError(null);
      setIsLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const firebaseToken = await user.getIdToken();
      const sessionResponse = await apiClient.createWebSocketSession(firebaseToken);
      
      if (sessionResponse.error || !sessionResponse.data) {
        throw new Error(sessionResponse.error || 'Failed to create session');
      }

      const { session_id } = sessionResponse.data;
      
      // Set token cookie for WebSocket authentication  
      document.cookie = `token=${firebaseToken}; path=/; secure; samesite=none`;
      
      // Pass token in URL as well for WebSocket authentication
      const wsUrl = getPolarisWebSocketUrl(session_id, firebaseToken);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsInitialized(true);
        setIsLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setIsLoading(false);

          const validation = validateWebSocketMessage(data);
          if (!validation.isValid) {
            setError('Received invalid message from server');
            return;
          }

          switch (data.type) {
            case 'connected':
              setMessages(prev => [...prev, { 
                from: 'system', 
                text: sanitizeInput(data.message),
                timestamp: new Date()
              }]);
              setMessages(prev => [...prev, { 
                from: 'system', 
                text: "Polaris is connecting and will be with you in just a moment. Feel free to start sharing what you'd like to learn!",
                timestamp: new Date()
              }]);
              break;
            case 'agent_message':
              setMessages(prev => [...prev, { 
                from: 'agent', 
                text: sanitizeInput(data.message),
                timestamp: new Date()
              }]);
              setIsLoading(false);
              break;
            case 'agent_handover':
              setIsGeneratingMission(true);
              setMessages(prev => [...prev, { 
                from: 'system', 
                text: sanitizeInput(data.message || 'Polaris is crafting your personalized learning journey...'),
                timestamp: new Date()
              }]);
              break;
            case 'mission_created':
              setIsGeneratingMission(false);
              setMessages(prev => [...prev, { 
                from: 'system', 
                text: sanitizeInput(data.message),
                timestamp: new Date()
              }]);
              handleMissionCreated(data.mission);
              break;
            case 'error':
              const errorMessage = sanitizeInput(data.message);
              setError(errorMessage);
              setMessages(prev => [...prev, { 
                from: 'system', 
                text: `Error: ${errorMessage}`,
                timestamp: new Date()
              }]);
              setIsLoading(false);
              setIsGeneratingMission(false);
              break;
            default:
              break;
          }
        } catch (parseError) {
          setError('Failed to parse server message');
        }
      };

      ws.onerror = () => {
        setError('Connection error occurred');
        setIsConnected(false);
        setIsLoading(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsLoading(false);
        // Clean up token cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      showError(`Failed to connect to Polaris: ${errorMessage}`);
      onClose();
      setError(errorMessage);
      setIsLoading(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, [user, apiClient, handleMissionCreated, isInitialized, showError, onClose]);

  // Initialize WebSocket connection - only once when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeConnection();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clean up token cookie on unmount
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    };
  }, []);

  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMITS.MESSAGE_COOLDOWN_MS) {
      setError(`Please wait ${Math.ceil((RATE_LIMITS.MESSAGE_COOLDOWN_MS - (now - lastMessageTime)) / 1000)} seconds before sending another message.`);
      return;
    }

    // Check rate limiting per minute
    const userKey = `user_${user?.uid || 'anonymous'}`;
    if (!rateLimiter.isAllowed(userKey, RATE_LIMITS.MAX_MESSAGES_PER_MINUTE, 60000)) {
      const remainingTime = rateLimiter.getRemainingTime(userKey, RATE_LIMITS.MAX_MESSAGES_PER_MINUTE, 60000);
      setError(`Too many messages. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      return;
    }

    // Validate and sanitize input
    const validation = validateMessage(input);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid message');
      return;
    }

    const message = sanitizeInput(input.trim());
    
    // Send message
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      message: message
    }));

    setMessages(prev => [...prev, { 
      from: 'user', 
      text: message,
      timestamp: new Date()
    }]);
    setInput('');
    setIsLoading(true);
    setLastMessageTime(now);
    setError(null);
  }, [input, lastMessageTime, user?.uid]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryConnection = useCallback(() => {
    // Check retry count limit
    if (retryCount >= 3) {
      showError('Maximum retry attempts reached. Please try again later.');
      onClose();
      return;
    }

    // Check connection attempt rate limiting
    const connectionKey = `connection_${user?.uid || 'anonymous'}`;
    if (!rateLimiter.isAllowed(connectionKey, RATE_LIMITS.MAX_CONNECTION_ATTEMPTS, 60000)) {
      const remainingTime = rateLimiter.getRemainingTime(connectionKey, RATE_LIMITS.MAX_CONNECTION_ATTEMPTS, 60000);
      setError(`Too many connection attempts. Please wait ${Math.ceil(remainingTime / 1000)} seconds.`);
      return;
    }

    setError(null);
    setMessages([]);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    isInitializingRef.current = false;
    setIsInitialized(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    initializeConnection();
  }, [user?.uid, initializeConnection, retryCount, showError, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-soft-gray">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-sky-blue rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-bold text-deep-navy">Polaris — The Pathfinder</h2>
            <span className="text-sm text-gray-500 font-regular">
              {isConnected ? 'Connected - Ready to explore!' : 'Connecting to Polaris...'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.from === 'user'
                    ? 'bg-coral text-white'
                    : msg.from === 'agent'
                    ? 'bg-sky-blue/10 text-deep-navy'
                    : 'bg-soft-gray text-deep-navy'
                }`}
              >
                <div className="text-base font-regular">
                  <MarkdownMessage 
                    content={msg.text} 
                    className={msg.from === 'user' ? 'text-white' : 'text-deep-navy'}
                  />
                </div>
                {msg.timestamp && (
                  <div className="text-sm opacity-70 mt-1 font-regular">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {(isLoading || isGeneratingMission) && (
            <div className="flex justify-start">
              <div className="bg-soft-gray text-deep-navy px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-sky-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sky-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-sky-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-base font-regular">
                    {isGeneratingMission ? 'Creating your learning path...' : 'Polaris is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-6 bg-red-50 border-t border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-red-700 text-base font-regular">{error}</span>
                  {retryCount > 0 && (
                    <span className="text-red-600 text-sm font-regular">
                      Retry attempt {retryCount}/3
                    </span>
                  )}
                </div>
              </div>
              {retryCount < 3 && (
                <button
                  onClick={retryConnection}
                  className="text-red-600 hover:text-red-800 text-base font-semibold"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-soft-gray">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= VALIDATION_LIMITS.MESSAGE_MAX_LENGTH) {
                  setInput(value);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                isGeneratingMission 
                  ? `Creating your learning path... (${input.length}/${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH})`
                  : isConnected 
                    ? `Share your learning goals with Polaris... (${input.length}/${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH})` 
                    : `Connecting to Polaris... (${input.length}/${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH})`
              }
              disabled={!isConnected || isGeneratingMission}
              maxLength={VALIDATION_LIMITS.MESSAGE_MAX_LENGTH}
              className="flex-1 px-4 py-3 border border-soft-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent disabled:bg-soft-gray disabled:cursor-not-allowed text-base font-regular"
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || !input.trim() || isGeneratingMission}
              className="px-6 py-3 bg-coral text-white font-semibold rounded-lg hover:bg-coral/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-base"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
