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
  const [authReady, setAuthReady] = useState(false);
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
          console.log('[Auth] Profile loaded successfully');
          setUserProfile(response.data);
          setIsInitialLoad(false);
        } else {
          console.error('[Auth] Failed to load profile:', response.error);
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
        console.error('[Auth] Error fetching profile:', error);
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
        // Use cached token to avoid forcing refresh on every request
        // This prevents issues on page refresh when token is being restored
        const token = await user.getIdToken(false);
        return token;
      } catch (error) {
        console.error('Failed to get ID token:', error);
        // If getting cached token fails, try to force refresh once
        try {
          return await user.getIdToken(true);
        } catch (retryError) {
          console.error('Failed to force refresh token:', retryError);
          return null;
        }
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
      console.log('[Auth] onAuthStateChanged fired, user:', user ? 'present' : 'null');
      setUser(user);
      
      if (!user) {
        setUserProfile(null);
        setAuthReady(false);
        setLoading(false);
      } else {
        console.log('[Auth] User detected, waiting for auth to be fully ready...');
        
        setTimeout(async () => {
          try {
            const token = await user.getIdToken(false);
            if (token) {
              console.log('[Auth] Token verified, marking auth as ready');
              setAuthReady(true);
            } else {
              console.warn('[Auth] Token not available yet, will retry...');
              setTimeout(async () => {
                const retryToken = await user.getIdToken(false);
                if (retryToken) {
                  console.log('[Auth] Token verified on retry, marking auth as ready');
                  setAuthReady(true);
                } else {
                  console.error('[Auth] Token still not available after retry');
                  setAuthReady(true);
                }
                setLoading(false);
              }, 1000);
              return;
            }
          } catch (error) {
            console.error('[Auth] Error verifying token:', error);
            setAuthReady(true);
          }
          setLoading(false);
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user profile when user is authenticated AND auth is ready
  useEffect(() => {
    const fetchProfileWithRetry = async () => {
      if (!user || !apiClient || userProfile || !authReady) {
        console.log('[Auth] Skipping profile fetch:', {
          user: !!user,
          apiClient: !!apiClient,
          userProfile: !!userProfile,
          authReady
        });
        return;
      }
      
      console.log('[Auth] Conditions met, fetching profile...');
      
      // Auth is ready and token has been verified, just fetch the profile
      await fetchUserProfile();
    };
    
    fetchProfileWithRetry();
  }, [user, apiClient, userProfile, authReady, fetchUserProfile]);

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
