// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Auth0Client } from '@auth0/auth0-spa-js';
import { api } from '@/lib/axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

let auth0Client: Auth0Client | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const initializeAuth0 = useCallback(async () => {
    try {
      if (!auth0Client) {
        auth0Client = new Auth0Client({
          domain: import.meta.env.VITE_AUTH0_DOMAIN,
          clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
          authorizationParams: {
            redirect_uri: window.location.origin,
            audience: import.meta.env.VITE_AUTH0_AUDIENCE
          },
          cacheLocation: 'localstorage',
          useRefreshTokens: true
        });
      }

      // Handle redirect callback
      if (window.location.search.includes('code=') &&
        window.location.search.includes('state=')) {
        try {
          await auth0Client.handleRedirectCallback();
          // You can handle the result here if needed
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error('Redirect callback error:', e);
        }
      }

      // Check authentication state
      const isAuth = await auth0Client.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        const userData = await auth0Client.getUser();
        setUser(userData ? userData : null);

        // Add this: Create/update user profile when authenticated
        if (userData) {
          try {
            await api.patch('/api/user/profile', {
              name: userData.name,
              email: userData.email
            });
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth0();
  }, [initializeAuth0]);

  const login = async () => {
    try {
      if (!auth0Client) {
        throw new Error('Auth0 client not initialized');
      }
      await auth0Client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
    }
  };

  const logout = async () => {
    try {
      if (!auth0Client) {
        throw new Error('Auth0 client not initialized');
      }
      await auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin,
        }
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err as Error);
    }
  };

  const getToken = async (): Promise<string> => {
    if (!auth0Client) {
      throw new Error('Auth0 client not initialized');
    }

    try {
      const token = await auth0Client.getTokenSilently();
      return token;
    } catch (err) {
      console.error('Error getting token:', err);
      if ((err as Error).message.includes('Login required')) {
        await login();
      }
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getToken,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
