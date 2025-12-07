import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export function useAuth() {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    setAuth,
    updateTokens,
    logout: storeLogout,
    getAccessToken,
    isTokenExpired,
    needsRefresh,
    setLoading,
  } = useAuthStore();

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        setAuth(data.data.user, {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        });
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [setAuth, setLoading]);

  const signup = useCallback(async (credentials: SignupCredentials): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.data) {
        setAuth(data.data.user, {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        });
        return { success: true };
      }

      return { success: false, error: data.error || 'Signup failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, [setAuth, setLoading]);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        updateTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        });
        return true;
      }

      // Refresh failed, logout
      storeLogout();
      return false;
    } catch {
      return false;
    }
  }, [tokens?.refreshToken, updateTokens, storeLogout]);

  const logout = useCallback(async () => {
    if (tokens?.refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    storeLogout();
  }, [tokens?.refreshToken, storeLogout]);

  // Get a valid access token, refreshing if needed
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) return null;

    if (isTokenExpired()) {
      const refreshed = await refreshTokens();
      if (!refreshed) return null;
    }

    return getAccessToken();
  }, [isAuthenticated, isTokenExpired, refreshTokens, getAccessToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshTokens,
    getValidToken,
    needsRefresh,
  };
}
