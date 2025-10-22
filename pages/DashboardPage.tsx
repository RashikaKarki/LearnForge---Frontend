import React from 'react';
import { ONGOING_MISSIONS, AVAILABLE_MISSIONS } from '../constants';
import { Mission } from '../types';
import Header from '../components/Header';
import MissionCard from '../components/MissionCard';
import { PlusIcon } from '../components/icons/PlusIcon';

interface DashboardPageProps {
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header onLogout={onLogout} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold text-deep-navy">Your Dashboard</h1>
            <button className="mt-4 md:mt-0 flex items-center justify-center px-6 py-3 bg-coral text-white font-semibold rounded-lg shadow-md hover:bg-coral/90 transition-colors duration-300 transform hover:scale-105">
                <PlusIcon className="h-5 w-5 mr-2"/>
                Create Personalized Mission
            </button>
        </div>

        {/* Ongoing Missions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-deep-navy mb-6">Ongoing Missions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ONGOING_MISSIONS.map((mission: Mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </section>

        {/* Browse Missions Section */}
        <section>
          <h2 className="text-2xl font-semibold text-deep-navy mb-6">Browse Available Missions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {AVAILABLE_MISSIONS.map((mission: Mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;