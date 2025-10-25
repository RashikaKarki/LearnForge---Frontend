import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

// Base API URL - you can move this to config.ts if needed
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
  private getToken: () => Promise<string | null>;
  private onTokenExpired?: (() => void) | undefined;

  constructor(baseUrl: string, getToken: () => Promise<string | null>, onTokenExpired?: (() => void) | undefined) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
    this.onTokenExpired = onTokenExpired;
  }

  // Validate token format for basic security
  private isValidTokenFormat(token: string): boolean {
    // Firebase ID tokens are JWT format: header.payload.signature
    // Basic validation: should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Get fresh token for each request
    console.log('🔑 API Client: Requesting token...');
    const token = await this.getToken();
    
    console.log('🔑 API Client: Token received:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
    });
    
    if (!token) {
      console.error('❌ API Client: No authentication token available');
      throw new Error('No authentication token available');
    }

    // Validate token format (basic security check)
    if (!this.isValidTokenFormat(token)) {
      throw new Error('Invalid token format');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers,
    };

    try {
      // Log request for debugging (without sensitive data)
      if (import.meta.env.DEV) {
        console.log(`API Request: ${options.method || 'GET'} ${url}`);
        console.log(`Token present: ${token ? 'Yes' : 'No'}`);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin', // Include cookies for CSRF protection
      });

      // Log response status
      if (import.meta.env.DEV) {
        console.log(`API Response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        let errorMessage: string;
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please sign in again.';
          // Token expired or invalid - trigger logout
          if (this.onTokenExpired) {
            this.onTokenExpired();
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
          
          // Check for token expiration in error response
          if (errorData.code === 'auth/id-token-expired' || 
              errorData.message?.includes('expired') ||
              errorData.message?.includes('invalid token') ||
              errorData.error_code === 'TOKEN_EXPIRED' ||
              errorData.detail === 'Token expired') {
            
            console.log('🚨 Token expired detected:', {
              errorCode: errorData.error_code,
              detail: errorData.detail,
              message: errorData.message
            });
            
            if (this.onTokenExpired) {
              this.onTokenExpired();
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
      
      // Check if error is related to token expiration
      if (error instanceof Error && 
          (error.message.includes('Authentication failed') ||
           error.message.includes('expired') ||
           error.message.includes('invalid token') ||
           error.message.includes('TOKEN_EXPIRED') ||
           error.message.includes('Token expired'))) {
        
        console.log('🚨 Token expired detected in catch block:', {
          errorMessage: error.message
        });
        
        if (this.onTokenExpired) {
          this.onTokenExpired();
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
}

// Hook to get an authenticated API client
export const useApiClient = () => {
  const { token, refreshToken, signOut } = useAuth();
  
  // Create async function that gets fresh token
  const getFreshToken = async (): Promise<string | null> => {
    if (!token) {
      return null;
    }
    
    // Try to refresh token to ensure it's fresh
    try {
      const freshToken = await refreshToken();
      return freshToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return token; // Fallback to current token
    }
  };
  
  // Handle token expiration by signing out
  const handleTokenExpired = async () => {
    console.log('Token expired, signing out...');
    await signOut();
  };
  
  return new ApiClient(API_BASE_URL, getFreshToken, handleTokenExpired);
};

