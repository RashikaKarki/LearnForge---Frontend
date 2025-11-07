import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { ApiClient } from '../utils/api';
import { useFlashError } from './FlashErrorContext';
import { API_BASE_URL } from '../config';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: {
    type: '500' | '400' | null;
    message?: string;
  };
  signOut: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<{
    type: '500' | '400' | null;
    message?: string;
  }>({ type: null });
  
  const { showWarning } = useFlashError();

  // Clear error state
  const clearError = (): void => {
    setError({ type: null });
  };

  // Fetch user profile from API
  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (apiClient && user) {
      try {
        clearError();
        const response = await apiClient.getUserProfile();
        
        if (response.data) {
          setUserProfile(response.data);
          setIsInitialLoad(false);
        } else {
          if (response.error?.includes('Authentication failed') || 
              response.error?.includes('401')) {
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
        if (error.message?.includes('Authentication failed') || 
            error.message?.includes('401')) {
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
    }
  }, [apiClient, user, isInitialLoad]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsInitialLoad(true);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Initialize API client with token getter
  useEffect(() => {
    const getToken = async (): Promise<string | null> => {
      if (!user) return null;
      try {
        return await user.getIdToken(true); // Force refresh to get fresh token
      } catch (error) {
        console.error('Failed to get ID token:', error);
        return null;
      }
    };

    const handleSessionExpired = async () => {
      if (isInitialLoad) {
        await signOut();
      } else {
        showWarning('Your authentication has expired. Please sign in again.');
        setError({ type: null });
        await signOut();
      }
    };
  
    const client = new ApiClient(
      API_BASE_URL,
      user ? getToken : null,
      handleSessionExpired
    );
    setApiClient(client);
  }, [user, isInitialLoad, showWarning, signOut]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (!user) {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user profile when user is authenticated
  useEffect(() => {
    if (user && apiClient && !userProfile) {
      fetchUserProfile();
    }
  }, [user, apiClient, userProfile, fetchUserProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    signOut,
    fetchUserProfile,
    clearError,
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
