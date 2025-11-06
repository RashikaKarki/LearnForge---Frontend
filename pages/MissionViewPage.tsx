import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mission, UserEnrolledMission } from '../types';
import Header from '../components/Header';
import { MissionHeader } from '../components/MissionHeader';
import { JourneyMap } from '../components/JourneyMap';
import { ChatSection } from '../components/ChatSection';
import { ChatMessage } from '../components/ChatMessages';
import { useMissionAllyWebSocket, WebSocketMessage } from '../hooks/useMissionAllyWebSocket';
import { useApiClient } from '../utils/api';

interface MissionViewPageProps {
  mission: Mission;
  onClose: () => void;
  onLogout: () => void;
}

export const MissionViewPage: React.FC<MissionViewPageProps> = ({
  mission,
  onClose,
  onLogout,
}) => {
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const apiClient = useApiClient();
  const hasLoadedEnrolledDataRef = useRef(false);

  // Load enrolled mission data to get current progress and completed checkpoints
  useEffect(() => {
    // Only load once when component mounts
    if (hasLoadedEnrolledDataRef.current) {
      return;
    }

    const loadEnrolledMissionData = async () => {
      try {
        hasLoadedEnrolledDataRef.current = true;
        const response = await apiClient.getUserEnrolledMissions();
        if (response.data) {
          // Find the enrolled mission that matches the current mission
          const enrolledMission = response.data.find(
            (em: UserEnrolledMission) => em.mission_id === mission.id
          );
          
          if (enrolledMission && enrolledMission.completed_checkpoints) {
            // Initialize completed checkpoints from enrolled mission data
            setCompletedCheckpoints(enrolledMission.completed_checkpoints);
          }
        }
      } catch (error) {
        console.error('Failed to load enrolled mission data:', error);
        // Continue with empty checkpoints if fetch fails
        hasLoadedEnrolledDataRef.current = false; // Allow retry on error
      }
    };

    loadEnrolledMissionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]); // Only depend on mission.id, not apiClient

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'agent_message' && message.message) {
      setChatMessages(prev => [...prev, {
        from: 'agent',
        text: message.message || '',
        timestamp: new Date(),
      }]);
    } else if (message.type === 'historical_messages' && message.messages) {
      // Load historical messages
      const historicalMessages: ChatMessage[] = message.messages.map(msg => ({
        from: msg.type === 'user_message' ? 'user' : 'agent',
        text: msg.message,
        timestamp: new Date(), // Historical messages don't have timestamps, use current time
      }));
      setChatMessages(historicalMessages);
    }
  }, []);

  // Handle checkpoint updates
  const handleCheckpointUpdate = useCallback((completedCheckpoints: string[], _progress: number) => {
    setCompletedCheckpoints(completedCheckpoints);
    // Progress is automatically calculated from completedCheckpoints length
  }, []);

  // Initialize WebSocket connection
  const { isTyping, sendMessage: sendWebSocketMessage } = useMissionAllyWebSocket(
    mission.id,
    handleWebSocketMessage,
    handleCheckpointUpdate
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      // Add user message to UI immediately
      setChatMessages(prev => [...prev, {
        from: 'user',
        text: inputMessage,
        timestamp: new Date(),
      }]);
      
      // Send via WebSocket
      sendWebSocketMessage(inputMessage);
      setInputMessage('');
    }
  };

  const getCheckpointStatus = (checkpoint: string, index: number): 'completed' | 'locked' | 'available' => {
    if (completedCheckpoints.includes(checkpoint)) {
      return 'completed';
    }
    // Check if previous checkpoint is completed
    if (index > 0) {
      const previousCheckpoint = mission.byte_size_checkpoints[index - 1];
      if (previousCheckpoint && !completedCheckpoints.includes(previousCheckpoint)) {
        return 'locked';
      }
    }
    return 'available';
  };

  const getProgressPercentage = () => {
    if (mission.byte_size_checkpoints.length === 0) return 0;
    return (completedCheckpoints.length / mission.byte_size_checkpoints.length) * 100;
  };

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <Header onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <MissionHeader
          title={mission.title}
          shortDescription={mission.short_description}
          progress={getProgressPercentage()}
          completedCheckpoints={completedCheckpoints.length}
          totalCheckpoints={mission.byte_size_checkpoints.length}
          onClose={onClose}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          <JourneyMap
            checkpoints={mission.byte_size_checkpoints}
            completedCheckpoints={completedCheckpoints}
            progressPercentage={getProgressPercentage()}
            getCheckpointStatus={getCheckpointStatus}
          />

          <ChatSection
            messages={chatMessages}
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      </div>
    </div>
  );
};

