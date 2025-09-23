// Authentication service for handling API calls and token management

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://f097c998265d.ngrok-free.app'}/api`;

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  kyc_status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  // Helper method to handle API errors
  private handleApiError(response: Response, result: any): never {
    let errorMessage = 'An unexpected error occurred';
    
    if (result.error) {
      errorMessage = result.error;
    } else if (result.message) {
      errorMessage = result.message;
    } else if (result.detail) {
      errorMessage = result.detail;
    } else if (response.status === 400) {
      errorMessage = 'Invalid request. Please check your input.';
    } else if (response.status === 401) {
      errorMessage = 'Invalid credentials. Please check your email and password.';
    } else if (response.status === 403) {
      errorMessage = 'Access denied. Your account may be disabled.';
    } else if (response.status === 404) {
      errorMessage = 'User not found. Please check your email or sign up.';
    } else if (response.status === 409) {
      errorMessage = 'Email already exists. Please use a different email.';
    } else if (response.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    throw new Error(errorMessage);
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        this.handleApiError(response, result);
      }

      // Store tokens in localStorage
      this.storeTokens(result.tokens);
      
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        this.handleApiError(response, result);
      }

      // Store tokens in localStorage
      this.storeTokens(result.tokens);
      
      return result;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/auth/profile/`);
    
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get user profile');
    }

    return result.user;
  }

  // Store tokens in localStorage
  storeTokens(tokens: { access: string; refresh: string }): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  // Get access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Refresh access token
  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    // Store new access token
    localStorage.setItem('access_token', result.access);
    
    return result.access;
  }

  // Make authenticated API request
  async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token found');
    }

    // Add authorization header (only set Content-Type if not FormData)
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Only set Content-Type if we're not sending FormData
    if (!(options.body instanceof FormData)) {
      (headers as any)['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      try {
        token = await this.refreshToken();
        // Retry request with new token  
        const retryHeaders: HeadersInit = {
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        };
        
        // Only set Content-Type if we're not sending FormData
        if (!(options.body instanceof FormData)) {
          (retryHeaders as any)['Content-Type'] = 'application/json';
        }
        
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      } catch (error) {
        // Refresh failed, but don't logout - let user stay logged in
        console.warn('Token refresh failed, but keeping user logged in:', error);
        // Just return the original 401 response instead of logging out
      }
    }

    return response;
  }

  // Change user password
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to change password');
    }

    return result;
  }

  // Submit KYC document for verification
  async submitKYCDocument(formData: FormData): Promise<{ message: string }> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/kyc/submit/`, {
      method: 'POST',
      body: formData, // Don't set Content-Type header for FormData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit document');
    }

    return result;
  }

  // Get KYC verification status
  async getKYCStatus(): Promise<{ status: string; documents: any[] }> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/kyc/status/`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get KYC status');
    }

    return result;
  }

  // Admin: Get all KYC submissions
  async getAdminKYCList(): Promise<{ submissions: any[] }> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/admin/kyc/`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get KYC submissions');
    }

    return result;
  }

  // Admin: Review KYC submission
  async reviewKYCSubmission(kycId: number, action: 'approve' | 'reject', notes: string): Promise<{ message: string }> {
    const response = await this.authenticatedRequest(`${API_BASE_URL}/admin/kyc/${kycId}/review/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        notes,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to review KYC submission');
    }

    return result;
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;