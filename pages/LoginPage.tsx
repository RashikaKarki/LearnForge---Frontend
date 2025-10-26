import React, { useState } from 'react';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { LogoIcon } from '../components/icons/LogoIcon';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { useApiClient } from '../utils/api';
import { useFlashError } from '../contexts/FlashErrorContext';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();
  const { showError, showSuccess, showWarning } = useFlashError();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get the ID token for session creation
      const idToken = await user.getIdToken();

      if (apiClient) {
        try {
          const sessionResponse = await apiClient.createSession(idToken);
          
          if (sessionResponse.data) {
            showSuccess('Successfully signed in!');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            onLogin();
          } else {
            if (sessionResponse.error?.includes('Recent sign-in required')) {
              showError('Your session has expired. Please sign in again.', 'warning');
            } else if (sessionResponse.error?.includes('Invalid ID token')) {
              showError('Authentication failed. Please try signing in again.', 'error');
            } else if (sessionResponse.error?.includes('500') || sessionResponse.error?.includes('Internal Server Error')) {
              showError('Server error occurred. Please try again in a moment.', 'error');
            } else {
              showError('Failed to create session. Please try again.', 'error');
            }
            
            setError('Failed to create session. Please try again.');
          }
        } catch (sessionError: any) {
          if (sessionError.message?.includes('Recent sign-in required')) {
            showError('Your session has expired. Please sign in again.', 'warning');
          } else if (sessionError.message?.includes('Invalid ID token')) {
            showError('Authentication failed. Please try signing in again.', 'error');
          } else if (sessionError.message?.includes('500') || sessionError.message?.includes('Internal Server Error')) {
            showError('Server error occurred. Please try again in a moment.', 'error');
          } else if (sessionError.message?.includes('Network')) {
            showError('Network error. Please check your connection and try again.', 'error');
          } else {
            showError('Failed to create session. Please try again.', 'error');
          }
          
          setError('Failed to create session. Please try again.');
        }
      } else {
        showError('System error. Please refresh the page and try again.', 'error');
        setError('API client not available. Please try again.');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        showWarning('Sign-in was cancelled. Please try again.');
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        showError('Popup was blocked by your browser. Please allow popups and try again.', 'warning');
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        showError('Network error. Please check your connection and try again.', 'error');
        setError('Network error. Please check your connection and try again.');
      } else {
        showError('Sign-in failed. Please try again.', 'error');
        setError('Log in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-5 h-5 mr-3" />
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;