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
      const response = await apiClient.checkSessionStatus();
      return !!response.data;
    } catch (error) {
      return false;
    }
  }, [apiClient]);

  // Refresh session with proper error handling
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!apiClient) return false;
    
    try {
      const response = await apiClient.refreshSession();
      
      if (response.data) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
      try {
        clearError();
        const response = await apiClient.getUserProfile();
        
        if (response.data) {
          setUserProfile(response.data);
          setIsInitialLoad(false);
        } else {
          
          if (response.error?.includes('No session cookie found') ||
              response.error?.includes('Session has expired') ||
              response.error?.includes('Session has been revoked') ||
              response.error?.includes('Invalid session cookie') ||
              response.error?.includes('Invalid or expired session') ||
              response.error?.includes('session') ||
              response.error?.includes('expired') ||
              response.error?.includes('Authentication failed')) {
            
            if (isInitialLoad) {
              await signOut();
              return;
            } else {
              return;
            }
          }
          
          if (response.error?.includes('500') || response.error?.includes('Internal Server Error')) {
            setError({ type: '500', message: response.error });
          } else {
            setError({ type: '400', message: response.error || 'Failed to fetch user profile' });
          }
        }
      } catch (error: any) {
        if (error.message?.includes('No session cookie found') ||
            error.message?.includes('Session has expired') ||
            error.message?.includes('Session has been revoked') ||
            error.message?.includes('Invalid session cookie') ||
            error.message?.includes('Invalid or expired session') ||
            error.message?.includes('session') ||
            error.message?.includes('expired') ||
            error.message?.includes('Authentication failed')) {
          
          if (isInitialLoad) {
            await signOut();
            return;
          } else {
            return;
          }
        }
        
        if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          setError({ type: '500', message: error.message });
        } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          setError({ type: '400', message: error.message });
        } else {
          setError({ type: '500', message: 'An unexpected error occurred' });
        }
      }
    } else {
      // No API client available
    }
  }, [apiClient, user, isInitialLoad]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (apiClient) {
        try {
          await apiClient.logout();
        } catch (error) {
          // Failed to clear session on server
        }
      }
      
      await firebaseSignOut(auth);
      
      setUser(null);
      setUserProfile(null);
      setSessionExpired(false);
      setIsInitialLoad(true);
    } catch (error) {
      // Error signing out
    }
  }, [apiClient]);

  // Initialize API client (always available for session-based auth)
  useEffect(() => {
    const handleSessionExpired = async () => {
      if (isInitialLoad) {
        await signOut();
      } else {
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
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // User authenticated with Firebase
      } else {
        setUserProfile(null);
        setSessionExpired(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check session status and fetch user profile when user is authenticated
  useEffect(() => {
    if (user && apiClient && !userProfile) {
      if (isInitialLoad) {
        const timer = setTimeout(async () => {
          fetchUserProfile();
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        fetchUserProfile();
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [user, apiClient, userProfile, fetchUserProfile, checkSessionStatus, signOut, isInitialLoad]);

  useEffect(() => {
    if (user && apiClient) {
      const interval = setInterval(async () => {
        const success = await refreshSession();
        if (!success) {
          showWarning('Session refresh failed. You may need to sign in again soon.');
        }
      }, 1.5 * 24 * 60 * 60 * 1000);

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
