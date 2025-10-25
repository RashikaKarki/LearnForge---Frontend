import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { ApiClient } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  userProfile: UserProfile | null;
  loading: boolean;
  tokenExpired: boolean;
  error: {
    type: '500' | '400' | null;
    message?: string;
  };
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  fetchUserProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<{
    type: '500' | '400' | null;
    message?: string;
  }>({ type: null });

  // Get fresh token from Firebase
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (user) {
      try {
        const freshToken = await user.getIdToken(true);
        setToken(freshToken);
        // Store token in localStorage for persistence
        localStorage.setItem('authToken', freshToken);
        return freshToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
      }
    }
    return null;
  }, [user]);

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
        hasToken: !!token,
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
          
          // Check if it's a token expiration error - handle silently on initial load
          if (response.error?.includes('TOKEN_EXPIRED') || 
              response.error?.includes('Token expired') ||
              response.error?.includes('Authentication failed')) {
            console.log('🚨 Token expiration error detected');
            
            if (isInitialLoad) {
              console.log('🚨 Token expired on initial load - signing out silently');
              // On initial load, just sign out silently without showing error
              await signOut();
              return;
            } else {
              console.log('🚨 Token expired during app usage - will be handled by onTokenExpired');
              // During app usage, let the API client handle it
              return;
            }
          }
          
          // Only show error pages for non-token-expiration errors
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
        
        // Check if it's a token expiration error - handle silently on initial load
        if (error.message?.includes('TOKEN_EXPIRED') || 
            error.message?.includes('Token expired') ||
            error.message?.includes('Authentication failed')) {
          console.log('🚨 Token expiration error detected in catch');
          
          if (isInitialLoad) {
            console.log('🚨 Token expired on initial load - signing out silently');
            // On initial load, just sign out silently without showing error
            await signOut();
            return;
          } else {
            console.log('🚨 Token expired during app usage - will be handled by onTokenExpired');
            // During app usage, let the API client handle it
            return;
          }
        }
        
        // Only show error pages for non-token-expiration errors
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
  }, [apiClient, user, token, isInitialLoad]);

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      setUserProfile(null);
      setTokenExpired(false);
      setIsInitialLoad(true); // Reset initial load flag
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Initialize API client when token changes
  useEffect(() => {
    if (token) {
      console.log('🔧 Creating API client with token:', { hasToken: !!token, tokenLength: token?.length });
      
      // Create async function that gets fresh token
      const getFreshToken = async (): Promise<string | null> => {
        console.log('🔑 Getting fresh token...', { currentToken: !!token });
        
        // For now, just return the current token to test
        // TODO: Add token refresh logic back later
        return token;
      };
      
      // Handle token expiration by signing out
      const handleTokenExpired = async () => {
        console.log('🚨 Token expired detected, signing out user...', { isInitialLoad });
        
        if (isInitialLoad) {
          console.log('🚨 Token expired on initial load - signing out silently');
          // On initial load, just sign out silently without showing session expired page
          await signOut();
        } else {
          console.log('🚨 Token expired during app usage - showing session expired page');
          // During app usage, show session expired page
          setError({ type: null });
          setTokenExpired(true);
          await signOut();
        }
      };
      
      const client = new ApiClient(
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
        getFreshToken,
        handleTokenExpired
      );
      setApiClient(client);
      console.log('✅ API client created successfully');
    } else {
      console.log('❌ No token available, clearing API client');
      setApiClient(null);
    }
  }, [token]); // Only depend on token, not the functions

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get fresh token when user signs in
        const freshToken = await user.getIdToken();
        setToken(freshToken);
        localStorage.setItem('authToken', freshToken);
      } else {
        setToken(null);
        setUserProfile(null);
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    // Check for existing token on app load
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }

    return () => unsubscribe();
  }, []); // Remove user dependency to prevent infinite loop

  // Fetch user profile when user is authenticated and API client is ready
  useEffect(() => {
    console.log('🔄 Profile fetch effect triggered:', {
      hasUser: !!user,
      hasApiClient: !!apiClient,
      hasUserProfile: !!userProfile,
      hasToken: !!token,
      isInitialLoad: isInitialLoad
    });
    
    if (user && apiClient && !userProfile) {
      console.log('✅ All conditions met, calling fetchUserProfile...');
      
      // Add a small delay on initial load to let Firebase auth settle
      if (isInitialLoad) {
        console.log('⏳ Initial load - adding delay before API call');
        const timer = setTimeout(() => {
          fetchUserProfile();
        }, 1000); // 1 second delay
        
        return () => clearTimeout(timer);
      } else {
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
  }, [user, apiClient, userProfile, fetchUserProfile, isInitialLoad]);

  // Auto-refresh token every 50 minutes (tokens expire after 1 hour)
  useEffect(() => {
    if (user && token) {
      const interval = setInterval(async () => {
        await refreshToken();
      }, 50 * 60 * 1000); // 50 minutes

      return () => clearInterval(interval);
    }
    return undefined;
  }, [user, token, refreshToken]);

  const value: AuthContextType = {
    user,
    token,
    userProfile,
    loading,
    tokenExpired,
    error,
    signOut,
    refreshToken,
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
