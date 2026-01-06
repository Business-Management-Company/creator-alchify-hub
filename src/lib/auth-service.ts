/**
 * Auth Service - Backend-agnostic authentication layer
 * 
 * This service abstracts all authentication operations and can be
 * backed by any authentication provider (JWT, sessions, etc.)
 */

export interface AuthUser {
  id: string;
  email: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
}

type AuthStateCallback = (state: AuthState) => void;

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

class AuthService {
  private listeners: Set<AuthStateCallback> = new Set();
  private currentState: AuthState = { user: null, session: null, loading: true };
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        const session: AuthSession = {
          accessToken: token,
          refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || undefined,
          user,
        };
        this.updateState({ user, session, loading: false });
      } else {
        this.updateState({ user: null, session: null, loading: false });
      }
    } catch {
      this.updateState({ user: null, session: null, loading: false });
    }
  }

  private updateState(newState: AuthState) {
    this.currentState = newState;
    this.listeners.forEach(callback => callback(newState));
  }

  private persistSession(session: AuthSession | null) {
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      if (session.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: AuthStateCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return this.currentState;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.currentState.session?.accessToken || null;
  }

  /**
   * Get current user
   */
  getUser(): AuthUser | null {
    return this.currentState.user;
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    return this.currentState.session;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Sign up failed');
      }

      const data = await response.json();
      
      if (data.session) {
        this.persistSession(data.session);
        this.updateState({ user: data.session.user, session: data.session, loading: false });
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign up failed') };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Sign in failed');
      }

      const data = await response.json();
      
      if (data.session) {
        this.persistSession(data.session);
        this.updateState({ user: data.session.user, session: data.session, loading: false });
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign in failed') };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const token = this.getAccessToken();
    
    try {
      if (token) {
        await fetch(`${this.apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Ignore logout errors - we'll clear local state anyway
    }

    this.persistSession(null);
    this.updateState({ user: null, session: null, loading: false });
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    const token = this.getAccessToken();
    if (!token) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Password update failed');
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Password update failed') };
    }
  }

  /**
   * Request password reset email
   */
  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectUrl: `${window.location.origin}/auth` }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Password reset failed');
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Password reset failed') };
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<{ error: Error | null }> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return { error: new Error('No refresh token') };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, clear session
        this.persistSession(null);
        this.updateState({ user: null, session: null, loading: false });
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.session) {
        this.persistSession(data.session);
        this.updateState({ user: data.session.user, session: data.session, loading: false });
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Token refresh failed') };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
