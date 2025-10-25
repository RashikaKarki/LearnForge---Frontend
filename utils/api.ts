import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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
    console.log('🍪 API Client: Making request with session cookie...');
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers,
    };

    try {
      // Log request for debugging (without sensitive data)
      if (import.meta.env.DEV) {
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
        console.log(`Using session cookies: Yes`);
        console.log(`Credentials: include`);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include session cookies
      });

      // Log response status
      if (import.meta.env.DEV) {
        console.log(`API Response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        let errorMessage: string;
        
        if (response.status === 401) {
          errorMessage = 'Session expired. Please sign in again.';
          // Session expired or invalid - trigger logout
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
        
        // Try to get error details from response body
        try {
          const errorData = await response.json();
          
          // Log detailed error response
          if (import.meta.env.DEV) {
            console.log('❌ API Error Response:', {
              url,
              method: options.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              errorData: errorData
            });
          }
          
          if (errorData.message || errorData.error) {
            errorMessage += ` - ${errorData.message || errorData.error}`;
          }
          
          // Check for session expiration in error response
          if (errorData.detail === 'No session cookie found' ||
              errorData.detail === 'Session has expired' ||
              errorData.detail === 'Session has been revoked' ||
              errorData.detail === 'Invalid session cookie' ||
              errorData.detail === 'Invalid or expired session' ||
              errorData.message?.includes('session') ||
              errorData.message?.includes('expired') ||
              errorData.message?.includes('invalid')) {
            
            console.log('🚨 Session expired detected:', {
              detail: errorData.detail,
              message: errorData.message
            });
            
            if (this.onSessionExpired) {
              this.onSessionExpired();
            }
          }
        } catch (jsonError) {
          // Log JSON parsing error
          if (import.meta.env.DEV) {
            console.log('❌ API Error - Could not parse JSON:', {
              url,
              method: options.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              jsonError: jsonError
            });
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Log successful API response
      if (import.meta.env.DEV) {
        console.log('✅ API Success Response:', {
          url,
          method: options.method || 'GET',
          status: response.status,
          data: data
        });
      }
      
      return { data };
    } catch (error) {
      console.error('API request failed:', {
        url,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Check if error is related to session expiration
      if (error instanceof Error && 
          (error.message.includes('Session expired') ||
           error.message.includes('No session cookie found') ||
           error.message.includes('Session has been revoked') ||
           error.message.includes('Invalid session cookie') ||
           error.message.includes('Invalid or expired session') ||
           error.message.includes('expired') ||
           error.message.includes('session') ||
           error.message.includes('Authentication failed'))) {
        
        console.log('🚨 Session expired detected in catch block:', {
          errorMessage: error.message
        });
        
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
}

// Hook to get an authenticated API client
export const useApiClient = () => {
  const { signOut } = useAuth();
  
  // Handle session expiration by signing out
  const handleSessionExpired = async () => {
    console.log('Session expired, signing out...');
    await signOut();
  };
  
  return new ApiClient(API_BASE_URL, handleSessionExpired);
};

