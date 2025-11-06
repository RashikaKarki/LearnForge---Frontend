import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mission, UserEnrolledMission } from '../types';
import Header from '../components/Header';
import MissionCard from '../components/MissionCard';
import { PlusIcon } from '../components/icons/PlusIcon';
import { useAuth } from '../contexts/AuthContext';
import { PolarisChat } from '../components/PathfinderChat';
import { MissionDetails } from '../components/MissionDetails';
import { MissionViewPage } from './MissionViewPage';
import { useApiClient } from '../utils/api';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  const { userProfile, loading } = useAuth();
  const apiClient = useApiClient();
  const [showChat, setShowChat] = useState(false);
  const [showMissionDetails, setShowMissionDetails] = useState(false);
  const [showMissionView, setShowMissionView] = useState(false);
  const [createdMission, setCreatedMission] = useState<Mission | null>(null);
  const [enrolledMissions, setEnrolledMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsError, setMissionsError] = useState<string | null>(null);
  const hasFetchedMissionsRef = useRef(false);

  const handleCreateMission = useCallback(() => {
    setShowChat(true);
  }, []);

  const handleMissionCreated = useCallback((mission: Mission) => {
    setCreatedMission(mission);
    setShowChat(false);
    setShowMissionDetails(true);
  }, []);

  const handleStartMission = useCallback(() => {
    if (createdMission) {
      setShowMissionDetails(false);
      setShowMissionView(true);
    }
  }, [createdMission]);

  const handleCloseMissionView = useCallback(() => {
    setShowMissionView(false);
    setCreatedMission(null);
  }, []);

  const handleCloseChat = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleCloseMissionDetails = useCallback(() => {
    setShowMissionDetails(false);
    setCreatedMission(null);
  }, []);

  // Reset fetch flag when user logs out
  useEffect(() => {
    if (!userProfile) {
      hasFetchedMissionsRef.current = false;
      setEnrolledMissions([]);
      setMissionsError(null);
    }
  }, [userProfile]);

  // Fetch enrolled missions - only once when userProfile is available
  useEffect(() => {
    const fetchEnrolledMissions = async () => {
      // Don't fetch if no user profile or already fetched
      if (!userProfile || hasFetchedMissionsRef.current) {
        if (!userProfile) {
          setMissionsLoading(false);
        }
        return;
      }

      hasFetchedMissionsRef.current = true;
      setMissionsLoading(true);
      setMissionsError(null);

      try {
        const response = await apiClient.getUserEnrolledMissions();
        if (response.data) {
          // Transform UserEnrolledMission to Mission for display
          const transformedMissions = response.data.map((enrolled: UserEnrolledMission): Mission => {
            const mission: Mission = {
              id: enrolled.mission_id,
              title: enrolled.mission_title,
              short_description: enrolled.mission_short_description,
              description: enrolled.mission_short_description, // Use short_description for card display
              level: '', // Will be filled when fetching full mission details
              topics_to_cover: [], // Will be filled when fetching full mission details
              learning_goal: '', // Will be filled when fetching full mission details
              byte_size_checkpoints: enrolled.byte_size_checkpoints,
              skills: enrolled.mission_skills,
              creator_id: '', // Will be filled when fetching full mission details
              is_public: true, // Will be filled when fetching full mission details
              created_at: enrolled.enrolled_at,
              updated_at: enrolled.updated_at,
              tags: enrolled.mission_skills, // Use skills as tags for display
            };
            // Round progress to whole number if it exists
            if (enrolled.progress !== undefined) {
              mission.progress = Math.round(enrolled.progress);
            }
            return mission;
          });
          setEnrolledMissions(transformedMissions);
        } else if (response.error) {
          setMissionsError(response.error);
          setEnrolledMissions([]);
        } else {
          // No data and no error - empty result (gracefully handle empty state)
          setEnrolledMissions([]);
        }
      } catch (error) {
        setMissionsError(error instanceof Error ? error.message : 'Failed to fetch missions');
        setEnrolledMissions([]);
      } finally {
        setMissionsLoading(false);
      }
    };

    fetchEnrolledMissions();
    // Only depend on userProfile - will only fetch once when userProfile becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  // Handle mission card click - fetch full mission details
  const handleMissionClick = useCallback(async (missionId: string) => {
    try {
      const response = await apiClient.getMission(missionId);
      if (response.data) {
        setCreatedMission(response.data);
        setShowMissionDetails(true);
      } else if (response.error) {
        setMissionsError(response.error);
      }
    } catch (error) {
      setMissionsError(error instanceof Error ? error.message : 'Failed to fetch mission details');
    }
  }, [apiClient]);

  // Show Mission View Page if mission is started
  if (showMissionView && createdMission) {
    return (
      <MissionViewPage
        mission={createdMission}
        onClose={handleCloseMissionView}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header onLogout={onLogout} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-deep-navy">
                {loading ? (
                  <div className="h-9 w-48 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  `Welcome back, ${userProfile?.name?.split(' ')[0] || 'User'}!`
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? (
                  <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  "Ready to continue your learning journey?"
                )}
              </p>
            </div>
            <button 
              onClick={handleCreateMission}
              className="mt-4 md:mt-0 flex items-center justify-center px-6 py-3 bg-coral text-white font-semibold rounded-lg shadow-md hover:bg-coral/90 transition-colors duration-300 transform hover:scale-105"
            >
                <PlusIcon className="h-5 w-5 mr-2"/>
                Create Personalized Mission
            </button>
        </div>

        {/* Enrolled Missions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-deep-navy mb-6">My Missions</h2>
          {missionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden h-64 animate-pulse">
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : missionsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error loading missions: {missionsError}</p>
            </div>
          ) : enrolledMissions.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-lg">No enrolled missions yet. Create your first mission to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {enrolledMissions.map((mission: Mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission}
                  onClick={() => handleMissionClick(mission.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Polaris Chat Modal */}
      {showChat && (
        <PolarisChat
          onMissionCreated={handleMissionCreated}
          onClose={handleCloseChat}
        />
      )}

      {/* Mission Details Modal */}
      {showMissionDetails && createdMission && (
        <MissionDetails
          mission={createdMission}
          onStartMission={handleStartMission}
          onClose={handleCloseMissionDetails}
        />
      )}
    </div>
  );
};

export default DashboardPage;