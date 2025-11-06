import React, { useState } from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { LogoIcon } from './icons/LogoIcon';
import { GearIcon } from './icons/GearIcon';
import { SettingsModal } from './SettingsModal';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { userProfile, loading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  // Get user initials for avatar
  const getUserInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0]?.toUpperCase() || 'U';
    }
    return 'U';
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-9 w-9 text-deep-navy" />
            <span className="text-2xl font-bold text-deep-navy">Learnforge</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {loading ? (
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
                </div>
              ) : userProfile?.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name || 'User'}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-sky-blue flex items-center justify-center text-white font-semibold">
                  {getUserInitials(userProfile?.name || null, userProfile?.email || null)}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-deep-navy">
                  {loading ? (
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    userProfile?.name || 'User'
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? (
                    <div className="h-3 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    userProfile?.email
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full text-gray-500 hover:bg-soft-gray hover:text-deep-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-blue transition-colors"
              aria-label="Settings"
            >
              <GearIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-gray-500 hover:bg-soft-gray hover:text-deep-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-blue transition-colors"
              aria-label="Logout"
            >
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
};

export default Header;