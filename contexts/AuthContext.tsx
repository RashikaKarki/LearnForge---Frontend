import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { ApiClient } from '../utils/api';
import { useFlashError } from './FlashErrorContext';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sessionExpired: boolean;
  error: {
    type: '500' | '400' | null;
    message?: string;
  };
  signOut: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
  checkSessionStatus: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<{
    type: '500' | '400' | null;
    message?: string;
  }>({ type: null });
  
  const { showWarning } = useFlashError();

  // Check session status with the server
  const checkSessionStatus = useCallback(async (): Promise<boolean> => {
    if (!apiClient) return false;
    
    try {
      console.log('🔍 Checking session status...');
      const response = await apiClient.checkSessionStatus();
      console.log('📊 Session status response:', {
        hasData: !!response.data,
        hasError: !!response.error,
        data: response.data,
        error: response.error
      });
      return !!response.data;
    } catch (error) {
      console.error('❌ Session check failed:', error);
      return false;
    }
  }, [apiClient]);

  // Refresh session with proper error handling
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!apiClient) return false;
    
    try {
      console.log('🔄 Refreshing session...');
      const response = await apiClient.refreshSession();
      
      if (response.data) {
        console.log('✅ Session refreshed successfully');
        return true;
      } else {
        console.error('❌ Session refresh failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
    }
  }, [apiClient]);

  // Clear error state
  const clearError = (): void => {
    setError({ type: null });
  };

  // Fetch user profile from API
  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (apiClient) {
      console.log('🔄 Fetching user profile...', {
        hasApiClient: !!apiClient,
        hasUser: !!user,
        isInitialLoad: isInitialLoad
      });
      
      try {
        clearError(); // Clear any existing errors
        const response = await apiClient.getUserProfile();
        
        console.log('📊 User profile response:', {
          hasData: !!response.data,
          hasError: !!response.error,
          data: response.data,
          error: response.error
        });
        
        if (response.data) {
          console.log('✅ User profile fetched successfully:', response.data);
          setUserProfile(response.data);
          setIsInitialLoad(false); // Mark initial load as complete
        } else {
          console.error('❌ Failed to fetch user profile:', response.error);
          
          // Check if it's a session expiration error - handle silently on initial load
          if (response.error?.includes('No session cookie found') ||
              response.error?.includes('Session has expired') ||
              response.error?.includes('Session has been revoked') ||
              response.error?.includes('Invalid session cookie') ||
              response.error?.includes('Invalid or expired session') ||
              response.error?.includes('session') ||
              response.error?.includes('expired') ||
              response.error?.includes('Authentication failed')) {
            console.log('🚨 Session expiration error detected');
            
            if (isInitialLoad) {
              console.log('🚨 Session expired on initial load - signing out silently');
              // On initial load, just sign out silently without showing error
              await signOut();
              return;
            } else {
              console.log('🚨 Session expired during app usage - will be handled by onSessionExpired');
              // During app usage, let the API client handle it
              return;
            }
          }
          
          // Only show error pages for non-session-expiration errors
          if (response.error?.includes('500') || response.error?.includes('Internal Server Error')) {
            console.log('🚨 Setting 500 error:', response.error);
            setError({ type: '500', message: response.error });
          } else {
            console.log('🚨 Setting 400 error:', response.error);
            setError({ type: '400', message: response.error || 'Failed to fetch user profile' });
          }
        }
      } catch (error: any) {
        console.error('💥 Error fetching user profile:', error);
        
        // Check if it's a session expiration error - handle silently on initial load
        if (error.message?.includes('No session cookie found') ||
            error.message?.includes('Session has expired') ||
            error.message?.includes('Session has been revoked') ||
            error.message?.includes('Invalid session cookie') ||
            error.message?.includes('Invalid or expired session') ||
            error.message?.includes('session') ||
            error.message?.includes('expired') ||
            error.message?.includes('Authentication failed')) {
          console.log('🚨 Session expiration error detected in catch');
          
          if (isInitialLoad) {
            console.log('🚨 Session expired on initial load - signing out silently');
            // On initial load, just sign out silently without showing error
            await signOut();
            return;
          } else {
            console.log('🚨 Session expired during app usage - will be handled by onSessionExpired');
            // During app usage, let the API client handle it
            return;
          }
        }
        
        // Only show error pages for non-session-expiration errors
        if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          console.log('🚨 Setting 500 error from catch:', error.message);
          setError({ type: '500', message: error.message });
        } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          console.log('🚨 Setting 400 error from catch:', error.message);
          setError({ type: '400', message: error.message });
        } else {
          console.log('🚨 Setting 500 error from catch (default):', error.message);
          setError({ type: '500', message: 'An unexpected error occurred' });
        }
      }
    } else {
      console.log('❌ No API client available for fetching user profile');
    }
  }, [apiClient, user, isInitialLoad]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Clear session cookie on server
      if (apiClient) {
        try {
          await apiClient.logout();
          console.log('✅ Session cleared on server');
        } catch (error) {
          console.error('Failed to clear session on server:', error);
        }
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      setSessionExpired(false);
      setIsInitialLoad(true); // Reset initial load flag
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [apiClient]);

  // Initialize API client (always available for session-based auth)
  useEffect(() => {
    console.log('🔧 Creating API client for session-based authentication');
    
      // Handle session expiration by signing out
      const handleSessionExpired = async () => {
        console.log('🚨 Session expired detected, signing out user...', { isInitialLoad });
        
        if (isInitialLoad) {
          console.log('🚨 Session expired on initial load - signing out silently');
          // On initial load, just sign out silently without showing session expired page
          await signOut();
        } else {
          console.log('🚨 Session expired during app usage - showing session expired page');
          // During app usage, show session expired page and flash error
          showWarning('Your session has expired. Please sign in again.');
          setError({ type: null });
          setSessionExpired(true);
          await signOut();
        }
      };
    
    const client = new ApiClient(
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      handleSessionExpired
    );
    setApiClient(client);
    console.log('✅ API client created successfully');
  }, []); // Only run once on mount

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 Firebase auth state changed:', { hasUser: !!user });
      setUser(user);
      
      if (user) {
        console.log('✅ User authenticated with Firebase');
        // For session-based auth, we don't need to store tokens
        // The session cookie is handled by the server
      } else {
        console.log('❌ User not authenticated with Firebase');
        setUserProfile(null);
        setSessionExpired(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Remove user dependency to prevent infinite loop

  // Check session status and fetch user profile when user is authenticated
  useEffect(() => {
    console.log('🔄 Profile fetch effect triggered:', {
      hasUser: !!user,
      hasApiClient: !!apiClient,
      hasUserProfile: !!userProfile,
      isInitialLoad: isInitialLoad
    });
    
    if (user && apiClient && !userProfile) {
      console.log('✅ All conditions met, checking session and fetching profile...');
      
      // Add a small delay on initial load to let Firebase auth settle
      if (isInitialLoad) {
        console.log('⏳ Initial load - adding delay before API call');
        const timer = setTimeout(async () => {
          // Skip session status check on initial load if user just logged in
          // The session cookie might not be available immediately
          // Instead, try to fetch user profile directly - it will handle session validation
          console.log('🔄 Attempting to fetch user profile...');
          fetchUserProfile();
        }, 1000); // 1 second delay
        
        return () => clearTimeout(timer);
      } else {
        // For subsequent calls, just fetch the profile
        // Session validation will happen in the API call
        fetchUserProfile();
        return undefined;
      }
    } else {
      console.log('❌ Conditions not met for fetchUserProfile:', {
        user: !!user,
        apiClient: !!apiClient,
        userProfile: !!userProfile
      });
      return undefined;
    }
  }, [user, apiClient, userProfile, fetchUserProfile, checkSessionStatus, signOut, isInitialLoad]);

  // Auto-refresh session every 1.5 days (sessions expire after 2 days)
  useEffect(() => {
    if (user && apiClient) {
      const interval = setInterval(async () => {
        const success = await refreshSession();
        if (!success) {
          console.log('🚨 Session refresh failed, user will need to login again');
          showWarning('Session refresh failed. You may need to sign in again soon.');
          // The session is expired, user will be redirected to login
        }
      }, 1.5 * 24 * 60 * 60 * 1000); // 1.5 days (36 hours)

      return () => clearInterval(interval);
    }
    return undefined;
  }, [user, apiClient, refreshSession, showWarning]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    sessionExpired,
    error,
    signOut,
    fetchUserProfile,
    clearError,
    checkSessionStatus,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
