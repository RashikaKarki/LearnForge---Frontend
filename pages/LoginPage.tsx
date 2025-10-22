import React from 'react';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { LogoIcon } from '../components/icons/LogoIcon';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-deep-navy">
      <div className="w-full max-w-md p-8 space-y-8 text-center bg-white rounded-2xl shadow-2xl mx-4">
        <div className="flex justify-center">
          <LogoIcon className="h-12 w-12 text-deep-navy" />
        </div>
        <div className="space-y-2">
            <h1 className="text-3xl font-bold text-deep-navy">Welcome to Learnforge</h1>
            <p className="text-gray-600">Forge your knowledge, one mission at a time.</p>
        </div>
        <div className="pt-6">
          <button
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-blue transition-all duration-200"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;