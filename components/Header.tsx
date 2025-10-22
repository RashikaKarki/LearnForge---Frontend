import React from 'react';
import { LogoutIcon } from './icons/LogoutIcon';
import { LogoIcon } from './icons/LogoIcon';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-9 w-9 text-deep-navy" />
            <span className="text-2xl font-bold text-deep-navy">Learnforge</span>
          </div>
          <div className="flex items-center space-x-4">
            <img 
              className="h-10 w-10 rounded-full object-cover" 
              src="https://picsum.photos/100" 
              alt="User Avatar"
            />
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
    </header>
  );
};

export default Header;