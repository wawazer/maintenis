/**
 * MAINTENIS - Authentication & Multi-User RBAC Context
 * Supports Google SSO JWT (Google Identity Services) & Quick Role Switcher for Demo Mode
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole } from '../types';
import { maintenanceApi } from '../services/maintenanceApi';

export type AppPermission = 
  | 'SUBMIT_REPORT'
  | 'VIEW_OWN_TICKETS'
  | 'VIEW_ALL_TICKETS'
  | 'CLAIM_TICKET'
  | 'UPDATE_TICKET_PROGRESS'
  | 'RESOLVE_TICKET'
  | 'CLOSE_TICKET'
  | 'ASSIGN_TECHNICIAN'
  | 'ACCESS_AI_ANALYST'
  | 'MANAGE_USERS'
  | 'MANAGE_ASSETS';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
  can: (permission: AppPermission) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

// Preset Demo Persona Profiles for Quick Switcher
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  PELAPOR: {
    user_id: 'USR-DEMO-001',
    email: 'budi.santoso@perusahaan.com',
    nama_lengkap: 'Budi Santoso (Operator)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Divisi Operasional & Lapangan',
    role: 'PELAPOR',
    spesialisasi: 'Operator Crane & Lapangan',
    shift: 'Shift 1 (Pagi)',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  TEKNISI: {
    user_id: 'USR-DEMO-002',
    email: 'hendra.gunawan@perusahaan.com',
    nama_lengkap: 'Hendra Gunawan (Teknisi)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Maintenance & Engineering',
    role: 'TEKNISI',
    spesialisasi: 'Listrik, PLC & Motor Listrik',
    shift: 'Shift 1 (Pagi)',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  SUPERVISOR: {
    user_id: 'USR-DEMO-003',
    email: 'irfan.prasetyo@perusahaan.com',
    nama_lengkap: 'Irfan Prasetyo, S.T. (SPV)',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'Maintenance & Engineering',
    role: 'SUPERVISOR',
    spesialisasi: 'Lead Reliability Engineer',
    shift: 'Normal Day',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  },
  ADMIN: {
    user_id: 'USR-DEMO-004',
    email: 'admin.eng@perusahaan.com',
    nama_lengkap: 'System Administrator (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    unit_kerja: 'IT & CMMS Systems',
    role: 'ADMIN',
    spesialisasi: 'CMMS Admin & Security',
    shift: 'Normal Day',
    status_aktif: 'Aktif',
    last_login: new Date().toISOString()
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'maintenis_auth_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check persisted session or default to SUPERVISOR demo for instant testing
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEMO_PROFILES.SUPERVISOR;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('maintenis_jwt_token') || null;
  });

  const isDemoMode = !token;

  // Sync auth state to MaintenanceApiService
  useEffect(() => {
    maintenanceApi.setAuthSession(token, user);
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, token]);

  const loginWithGoogleCredential = async (credential: string) => {
    try {
      // Decode JWT payload (standard base64 decode of middle part)
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const googleUser: UserProfile = {
          user_id: `USR-GGL-${payload.sub.slice(-6)}`,
          email: payload.email,
          nama_lengkap: payload.name || payload.email.split('@')[0],
          avatar_url: payload.picture,
          unit_kerja: 'Operasional',
          role: 'PELAPOR', // Default role
          status_aktif: 'Aktif',
          last_login: new Date().toISOString()
        };

        setToken(credential);
        localStorage.setItem('maintenis_jwt_token', credential);
        setUser(googleUser);
      }
    } catch (err) {
      console.error('Failed to parse Google JWT credential:', err);
      throw new Error('Gagal memverifikasi akun Google.');
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    setToken(null);
    localStorage.removeItem('maintenis_jwt_token');
    setUser(profile);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('maintenis_jwt_token');
    maintenanceApi.setAuthSession(null, null);
  };

  // RBAC Permission Resolution
  const can = (permission: AppPermission): boolean => {
    if (!user) return false;
    const role = user.role;

    switch (permission) {
      case 'SUBMIT_REPORT':
        return true; // All authenticated roles can submit reports
      case 'VIEW_OWN_TICKETS':
        return true;
      case 'VIEW_ALL_TICKETS':
        return true;
      case 'CLAIM_TICKET':
        return role === 'TEKNISI' || role === 'SUPERVISOR' || role === 'ADMIN';
      case 'UPDATE_TICKET_PROGRESS':
        return role === 'TEKNISI' || role === 'SUPERVISOR' || role === 'ADMIN';
      case 'RESOLVE_TICKET':
        return role === 'TEKNISI' || role === 'SUPERVISOR' || role === 'ADMIN';
      case 'CLOSE_TICKET':
        return role === 'SUPERVISOR' || role === 'ADMIN';
      case 'ASSIGN_TECHNICIAN':
        return role === 'SUPERVISOR' || role === 'ADMIN';
      case 'ACCESS_AI_ANALYST':
        return role === 'TEKNISI' || role === 'SUPERVISOR' || role === 'ADMIN';
      case 'MANAGE_USERS':
        return role === 'SUPERVISOR' || role === 'ADMIN';
      case 'MANAGE_ASSETS':
        return role === 'SUPERVISOR' || role === 'ADMIN';
      default:
        return false;
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isDemoMode,
      loginWithGoogleCredential,
      switchDemoRole,
      logout,
      can,
      hasRole
    }),
    [user, token, isDemoMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
