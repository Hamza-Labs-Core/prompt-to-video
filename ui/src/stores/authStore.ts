import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp when access token expires
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, tokens: Omit<AuthTokens, 'expiresAt'> & { expiresIn: number }) => void;
  updateTokens: (tokens: Omit<AuthTokens, 'expiresAt'> & { expiresIn: number }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Helpers
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
  needsRefresh: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, { accessToken, refreshToken, expiresIn }) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          user,
          tokens: { accessToken, refreshToken, expiresAt },
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateTokens: ({ accessToken, refreshToken, expiresIn }) => {
        const expiresAt = Date.now() + expiresIn * 1000;
        set({
          tokens: { accessToken, refreshToken, expiresAt },
        });
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      getAccessToken: () => {
        const { tokens } = get();
        return tokens?.accessToken || null;
      },

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens) return true;
        // Consider expired if less than 30 seconds remaining
        return Date.now() >= tokens.expiresAt - 30000;
      },

      needsRefresh: () => {
        const { tokens, isAuthenticated } = get();
        if (!isAuthenticated || !tokens) return false;
        // Refresh if less than 5 minutes remaining
        return Date.now() >= tokens.expiresAt - 5 * 60 * 1000;
      },
    }),
    {
      name: 'prompt-to-video-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize loading state after hydration
if (typeof window !== 'undefined') {
  // Give time for hydration
  setTimeout(() => {
    const state = useAuthStore.getState();
    if (state.isLoading) {
      useAuthStore.setState({ isLoading: false });
    }
  }, 100);
}
