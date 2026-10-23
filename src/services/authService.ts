import { useState, useEffect, useMemo, useCallback } from 'react';

// Types
export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// AuthService class to handle authentication API calls
class AuthService {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Check authentication status by calling /auth/me.php
   */
  async me(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me.php`, {
        method: 'GET',
        credentials: 'include', // Important for sending cookies
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data as User;
      }
      return null;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return null;
    }
  }

  /**
   * Login user by calling /auth/login.php
   */
  async login(email: string, password: string, role: 'user' | 'admin'): Promise<User> {
    const csrfToken = await this.getCsrfToken();
    const response = await fetch(`${this.baseUrl}/auth/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken,
      },
      body: new URLSearchParams({
        email,
        password,
        role,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    return data.data as User;
  }

  /**
   * Logout user by calling /auth/logout.php
   */
  async logout(): Promise<void> {
    const csrfToken = await this.getCsrfToken();
    const response = await fetch(`${this.baseUrl}/auth/logout.php`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Logout failed');
    }

    // We don't need to return anything
    return;
  }

  /**
   * Get CSRF token by calling /auth/csrf-token.php
   */
  async getCsrfToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/csrf-token.php`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get CSRF token');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get CSRF token');
    }

    return data.data.csrf_token;
  }

  /**
   * Make a state-changing request (POST/PUT/DELETE) with CSRF token
   */
  async csrfProtectedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: BodyInit | null = null,
    extraHeaders: HeadersInit = {}
  ): Promise<Response> {
    const csrfToken = await this.getCsrfToken();
    const headers = new Headers({
      ...(method !== 'GET' && { 'X-CSRF-Token': csrfToken }),
      ...extraHeaders,
    });

    return fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body,
      credentials: 'include',
    });
  }

  /**
   * Make a read request (GET) with CSRF token for defense in depth
   */
  async csrfCheckedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: BodyInit | null = null,
    extraHeaders: HeadersInit = {}
  ): Promise<Response> {
    // For GET requests, we still check CSRF if provided for defense in depth
    // But we don't require it for typical GET operations
    const csrfToken = await this.getCsrfToken();
    const headers = new Headers({
      ...(method !== 'GET' && { 'X-CSRF-Token': csrfToken }),
      ...extraHeaders,
    });

    return fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body,
      credentials: 'include',
    });
  }
}

// Hook to use authentication state
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const authService = useMemo(() => new AuthService(import.meta.env.BASE_URL), []);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthStatus() {
      try {
        const user = await authService.me();
        if (!cancelled) {
          setAuthState({
            user,
            loading: false,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error initializing auth state:', error);
          setAuthState({
            user: null,
            loading: false,
          });
        }
      }
    }

    checkAuthStatus();

    return () => {
      cancelled = true;
    };
  }, [authService]);

  const login = useCallback(async (email: string, password: string, role: 'user' | 'admin') => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const user = await authService.login(email, password, role);
      setAuthState({ user, loading: false });
      return user;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false, user: null }));
      throw error;
    }
  }, [authService]);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      await authService.logout();
      setAuthState({ user: null, loading: false });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, [authService]);

  const getCsrfToken = useCallback(async () => {
    return authService.getCsrfToken();
  }, [authService]);

  const csrfProtectedRequest = useCallback(async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: BodyInit | null = null,
    extraHeaders: HeadersInit = {}
  ) => {
    return authService.csrfProtectedRequest(endpoint, method, body, extraHeaders);
  }, [authService]);

  const csrfCheckedRequest = useCallback(async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: BodyInit | null = null,
    extraHeaders: HeadersInit = {}
  ) => {
    return authService.csrfCheckedRequest(endpoint, method, body, extraHeaders);
  }, [authService]);

  return {
    ...authState,
    login,
    logout,
    getCsrfToken,
    csrfProtectedRequest,
    csrfCheckedRequest,
  };
}

export default AuthService;