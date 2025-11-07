import { UserProfile, SessionResponse, Mission, UserEnrolledMission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from './validation';
import { API_BASE_URL } from '../config';

// Security check: Ensure HTTPS in production
if (import.meta.env.PROD && API_BASE_URL.startsWith('http://')) {
  console.warn('Warning: Using HTTP in production. Consider using HTTPS for security.');
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null;
  private onSessionExpired?: (() => void) | undefined;

  constructor(
    baseUrl: string,
    getToken: (() => Promise<string | null>) | null = null,
    onSessionExpired?: (() => void) | undefined
  ) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
    this.onSessionExpired = onSessionExpired;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get Firebase ID token
    let token: string | null = null;
    if (this.getToken) {
      try {
        token = await this.getToken();
      } catch (error) {
        console.error('Failed to get Firebase ID token:', error);
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
        return { error: 'Authentication failed. Please sign in again.' };
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      cache: 'no-cache',
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorMessage: string;
        
        if (response.status === 401) {
          // Token expired or invalid - retry once with fresh token
          if (retryCount < 1 && this.getToken) {
            try {
              const freshToken = await this.getToken();
              if (freshToken && freshToken !== token) {
                // Token was refreshed, retry the request
                return this.makeRequest<T>(endpoint, options, retryCount + 1);
              }
            } catch (error) {
              // Failed to get fresh token
            }
          }
          
          errorMessage = 'Authentication failed. Please sign in again.';
          if (this.onSessionExpired) {
            this.onSessionExpired();
          }
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Insufficient permissions.';
        } else if (response.status >= 500) {
          errorMessage = `500: Internal Server Error - ${response.status}`;
        } else if (response.status >= 400) {
          errorMessage = `400: Bad Request - ${response.status}`;
        } else {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        try {
          const errorData = await response.json();
          
          if (errorData.message || errorData.error) {
            const sanitizedError = sanitizeInput(errorData.message || errorData.error);
            errorMessage += ` - ${sanitizedError}`;
          }
          
          if (response.status === 401 && this.onSessionExpired) {
            this.onSessionExpired();
          }
        } catch (jsonError) {
          // JSON parsing failed, continue with basic error message
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('Authentication failed') ||
           error.message.includes('401'))) {
        
        if (this.onSessionExpired) {
          this.onSessionExpired();
        }
      }
      
      return {
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>('/user/profile');
  }

  // Update user profile (name and/or learning_style)
  async updateUser(data: { name?: string; learning_style?: string[] }): Promise<ApiResponse<UserProfile>> {
    return this.put<UserProfile>('/user/update', data);
  }

  // Create a new session for WebSocket connection
  async createWebSocketSession(): Promise<ApiResponse<SessionResponse>> {
    return this.makeRequest<SessionResponse>('/sessions/', {
      method: 'POST',
    });
  }

  // Get mission by ID
  async getMission(missionId: string): Promise<ApiResponse<Mission>> {
    return this.get<Mission>(`/missions/${missionId}`);
  }

  // Get enrolled missions for current user
  async getUserEnrolledMissions(limit: number = 100): Promise<ApiResponse<UserEnrolledMission[]>> {
    return this.get<UserEnrolledMission[]>(`/user/enrolled-missions?limit=${limit}`);
  }
}

// Hook to get an authenticated API client
export const useApiClient = () => {
  const { user, signOut } = useAuth();
  
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
    await signOut();
  };
  
  return new ApiClient(API_BASE_URL, getToken, handleSessionExpired);
};

