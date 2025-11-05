import React, { useState } from 'react';
import { Mission } from '../types';
import Header from '../components/Header';
import { MissionHeader } from '../components/MissionHeader';
import { JourneyMap } from '../components/JourneyMap';
import { ChatSection } from '../components/ChatSection';
import { ChatMessage } from '../components/ChatMessages';

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      setChatMessages([...chatMessages, { from: 'user', text: inputMessage, timestamp: new Date() }]);
      setInputMessage('');
      // TODO: Send message via WebSocket when integrated
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
          />
        </div>
      </div>
    </div>
  );
};

