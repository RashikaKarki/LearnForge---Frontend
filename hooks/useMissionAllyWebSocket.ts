import { useState, useEffect, useRef, useCallback } from 'react';
import { getMissionAllyWebSocketUrl } from '../config';
import { useFlashError } from '../contexts/FlashErrorContext';
import { auth } from '../firebase';

export interface WebSocketMessage {
  type: 'connected' | 'historical_messages' | 'agent_processing_start' | 'agent_message' | 'agent_processing_end' | 'agent_handover' | 'checkpoint_update' | 'session_closed' | 'pong' | 'error';
  message?: string;
  messages?: Array<{ type: 'user_message' | 'agent_message'; message: string }>;
  agent?: string;
  completed_checkpoints?: string[];
  progress?: number;
}

export interface UseMissionAllyWebSocketReturn {
  isConnected: boolean;
  isTyping: boolean;
  sendMessage: (text: string) => void;
  reconnect: () => void;
}

export interface CheckpointUpdateCallback {
  (completedCheckpoints: string[], progress: number): void;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000; // 3 seconds
const PING_INTERVAL = 30000; // 30 seconds

export const useMissionAllyWebSocket = (
  missionId: string,
  onMessage: (message: WebSocketMessage) => void,
  onCheckpointUpdate?: CheckpointUpdateCallback
): UseMissionAllyWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const currentMissionIdRef = useRef<string | null>(null);
  const { showError } = useFlashError();
  
  // Store callbacks in refs to avoid recreating connect function
  const onMessageRef = useRef(onMessage);
  const onCheckpointUpdateRef = useRef(onCheckpointUpdate);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onCheckpointUpdateRef.current = onCheckpointUpdate;
  }, [onMessage, onCheckpointUpdate]);

  const connect = useCallback(async () => {
    // Don't reconnect if already connected or connecting for the same mission
    if (currentMissionIdRef.current === missionId) {
      if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
        return;
      }
      
      // Prevent multiple connections
      if (hasConnectedRef.current && wsRef.current?.readyState === WebSocket.CONNECTING) {
        return;
      }
    }
    
    // If missionId changed, close existing connection
    if (currentMissionIdRef.current !== null && currentMissionIdRef.current !== missionId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      hasConnectedRef.current = false;
      isConnectingRef.current = false;
    }
    
    currentMissionIdRef.current = missionId;
    isConnectingRef.current = true;

    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      showError('Please sign in to connect to Mission Ally');
      return;
    }

    try {
      // Get Firebase ID token and pass it as query parameter
      const token = await user.getIdToken();
      const wsUrl = getMissionAllyWebSocketUrl(missionId, token);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        isConnectingRef.current = false;
        hasConnectedRef.current = true;
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        
        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              // Connection established, ready to receive messages
              break;

            case 'historical_messages':
              // Pass historical messages directly to handler
              onMessageRef.current(message);
              break;

            case 'agent_processing_start':
              setIsTyping(true);
              break;

            case 'agent_message':
              // Keep typing indicator visible until agent_processing_end
              onMessageRef.current(message);
              break;

            case 'agent_processing_end':
              setIsTyping(false);
              break;

            case 'checkpoint_update':
              if (message.completed_checkpoints && message.progress !== undefined) {
                onCheckpointUpdateRef.current?.(message.completed_checkpoints, message.progress);
              }
              break;

            case 'session_closed':
              showError(message.message || 'Mission session completed', 'success');
              // Connection will be closed by server
              break;

            case 'error':
              showError(message.message || 'An error occurred');
              break;

            case 'pong':
              // Connection alive, no action needed
              break;

            case 'agent_handover':
              // Informational only
              break;

            default:
              onMessageRef.current(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          showError('Failed to parse message from server');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsTyping(false);
        isConnectingRef.current = false;
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if not a normal closure and attempts remaining
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          
          if (event.code === 1008) {
            // Authentication failed - don't retry
            showError('Authentication failed. Please refresh the page.');
            return;
          }

          // Schedule reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
              connect();
            } else {
              showError('Failed to connect after multiple attempts. Please refresh the page.');
            }
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          showError('Connection lost. Please refresh the page to reconnect.');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to get auth token or create WebSocket connection:', error);
      isConnectingRef.current = false;
      showError('Failed to authenticate. Please refresh the page.');
    }
  }, [missionId, showError]);

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_message',
        message: text,
      }));
    } else {
      showError('Not connected. Please wait...');
    }
  }, [showError]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  // Connect on mount - only once per missionId
  useEffect(() => {
    // Only connect if we haven't connected for this missionId yet
    if (currentMissionIdRef.current === missionId && hasConnectedRef.current) {
      return;
    }
    
    connect();

    return () => {
      // Only cleanup if missionId is actually changing
      if (currentMissionIdRef.current !== missionId) {
        hasConnectedRef.current = false;
        isConnectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]); // Only depend on missionId, not connect

  return {
    isConnected,
    isTyping,
    sendMessage,
    reconnect,
  };
};

