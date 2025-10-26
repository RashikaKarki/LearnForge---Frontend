import { UserProfile, SessionResponse, Mission } from '../types';
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
  private onSessionExpired?: (() => void) | undefined;

  constructor(baseUrl: string, onSessionExpired?: (() => void) | undefined) {
    this.baseUrl = baseUrl;
    this.onSessionExpired = onSessionExpired;
  }

  // Session cookie validation is handled by the server
  // No client-side validation needed for httpOnly cookies

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage: string;
        
        if (response.status === 401) {
          errorMessage = 'Session expired. Please sign in again.';
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
          
          if (errorData.detail === 'No session cookie found' ||
              errorData.detail === 'Session has expired' ||
              errorData.detail === 'Session has been revoked' ||
              errorData.detail === 'Invalid session cookie' ||
              errorData.detail === 'Invalid or expired session' ||
              errorData.message?.includes('session') ||
              errorData.message?.includes('expired') ||
              errorData.message?.includes('invalid')) {
            
            if (this.onSessionExpired) {
              this.onSessionExpired();
            }
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
          (error.message.includes('Session expired') ||
           error.message.includes('No session cookie found') ||
           error.message.includes('Session has been revoked') ||
           error.message.includes('Invalid session cookie') ||
           error.message.includes('Invalid or expired session') ||
           error.message.includes('expired') ||
           error.message.includes('session') ||
           error.message.includes('Authentication failed'))) {
        
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

  // Create session from ID token
  async createSession(idToken: string): Promise<ApiResponse<{ message: string; uid: string }>> {
    return this.makeRequest<{ message: string; uid: string }>('/auth/create-session', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  }

  // Check session status
  async checkSessionStatus(): Promise<ApiResponse<{ message: string; uid: string }>> {
    return this.makeRequest<{ message: string; uid: string }>('/auth/session-status');
  }

  // Refresh session
  async refreshSession(): Promise<ApiResponse<{ message: string; uid: string }>> {
    return this.makeRequest<{ message: string; uid: string }>('/auth/refresh-session', {
      method: 'POST',
    });
  }

  // Logout and clear session
  async logout(): Promise<ApiResponse<{ message: string; uid: null }>> {
    return this.makeRequest<{ message: string; uid: null }>('/auth/logout', {
      method: 'POST',
    });
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>('/user/profile');
  }

  // Create a new session for WebSocket connection
  // This endpoint uses the session cookie from login, not Bearer token
  async createWebSocketSession(_firebaseToken: string): Promise<ApiResponse<SessionResponse>> {
    // The session cookie from login is sent automatically with credentials: 'include'
    // Add trailing slash to avoid 307 redirect
    return this.makeRequest<SessionResponse>('/sessions/', {
      method: 'POST',
      headers: {}
    });
  }

  // Get mission by ID
  async getMission(missionId: string): Promise<ApiResponse<Mission>> {
    return this.get<Mission>(`/missions/${missionId}`);
  }
}

// Hook to get an authenticated API client
export const useApiClient = () => {
  const { signOut } = useAuth();
  
  const handleSessionExpired = async () => {
    await signOut();
  };
  
  return new ApiClient(API_BASE_URL, handleSessionExpired);
};

