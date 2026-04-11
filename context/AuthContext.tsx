'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useSWR, { mutate } from 'swr';
import api from '@/services/api';
import { fetcher } from '@/services/swr';
import { getAdminDeviceInfo } from '@/utils/device';
import toast from 'react-hot-toast';

interface RefreshToken {
  tokenHash: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  lastSeen?: string | Date;
  isOnline?: boolean;
  issuedAt?: string | Date;
  expiresAt?: string | Date;
  revokedAt?: string | Date;
  loginMethod?: 'local' | 'google';
  sessions?: Array<{
    loggedInAt: string | Date;
    loggedOutAt?: string | Date;
    duration?: number;
    loginMethod?: 'local' | 'google';
  }>;
}

interface AuthMeResponse {
  success: boolean;
  user?: RestaurantAdmin | null;
  loginMethod?: 'local' | 'google';
}

export interface RestaurantAdmin {
  id: string;
  _id?: string; // MongoDB _id field
  email: string;
  googleId?: string;
  isPasswordSet?: boolean;
  restaurantName?: string;
  ownerName?: string;
  address?: string;
  phone?: string;
  motto?: string;
  logo?: string | null;
  subscription: {
    type: 'free' | 'paid' | 'trial';
    status: 'active' | 'inactive' | 'expired';
    startDate: string | Date;
    expiryDate: string | Date | null;
    daysLeft?: number;
  };
  requestCount?: number;
  shortId?: string;
  refreshTokens?: RefreshToken[];
  reports?: any[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastActivity?: string | Date;
  loginMethod?: 'local' | 'google' | 'password';
}

interface AuthContextType {
  user: RestaurantAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ notVerified?: boolean }>;
  googleSignIn: (idToken: string, deviceId: string, deviceName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Skip SWR for superadmin routes to avoid noise
  const isSuperadminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin');

  // Use SWR for user data fetching
  const { data, error, isLoading, mutate: mutateUser } = useSWR<AuthMeResponse>(
    isSuperadminRoute ? null : '/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      onError: (err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem('user');
        }
      }
    }
  );

  const user = data?.success && data.user ? { ...data.user, loginMethod: data.loginMethod } : null;

  const login = async (email: string, password: string) => {
    try {
      const deviceInfo = getAdminDeviceInfo();
      const response = await api.post('/auth/login', {
        email,
        password,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName
      });

      if (response.data.success) {
        const userData = response.data.user;
        mutateUser({ success: true, user: userData, loginMethod: 'local' }, false);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Login successful!');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const resp = error.response?.data;
      if (resp?.notVerified) {
        toast.error(resp.message);
        return { notVerified: true };
      }
      const message = resp?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };


  const googleSignIn = async (idToken: string, deviceId: string, deviceName: string) => {
    try {
      const response = await api.post('/auth/google-signin', {
        idToken,
        deviceId: deviceId,
        deviceName: deviceName
      });

      if (response.data.success) {
        const userData = response.data.user;
        mutateUser({ success: true, user: userData, loginMethod: 'google' }, false);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Welcome! Login successful');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Google Sign-In failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout request failed:', error);
    } finally {
      mutateUser({ success: false, user: null }, false);
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    await mutateUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        googleSignIn,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
