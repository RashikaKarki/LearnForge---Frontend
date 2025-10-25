import React from 'react';
import { LogoIcon } from '../components/icons/LogoIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { useAuth } from '../contexts/AuthContext';

interface Error400PageProps {
  errorMessage?: string;
}

const Error400Page: React.FC<Error400PageProps> = ({ 
  errorMessage = "Bad Request" 
}) => {
  const { clearError, fetchUserProfile } = useAuth();
  
  const handleRetry = async () => {
    console.log('🔄 Retrying from 400 error page...');
    clearError(); // Clear the error state first
    try {
      await fetchUserProfile(); // Try to fetch user profile again
    } catch (error) {
      console.error('❌ Retry failed:', error);
      // If retry fails, reload the page
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <LogoIcon className="h-16 w-16 text-coral mx-auto mb-4" />
          <BookOpenIcon className="h-12 w-12 text-coral mx-auto opacity-50" />
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-white mb-2">400</h1>
            <h2 className="text-2xl font-semibold text-white mb-4">Bad Request</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              {errorMessage === "Bad Request" 
                ? "The request could not be understood by the server. Please check your input and try again."
                : errorMessage
              }
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full bg-coral text-white font-semibold py-3 px-6 rounded-lg hover:bg-coral/90 transition-colors duration-200 transform hover:scale-105"
            >
              Try Again
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-transparent border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-deep-navy transition-colors duration-200"
            >
              Go Home
            </button>
          </div>

          <div className="pt-4">
            <p className="text-gray-400 text-sm">
              If you continue to experience issues, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error400Page;
