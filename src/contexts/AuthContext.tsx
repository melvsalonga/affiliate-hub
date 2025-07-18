'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth, AuthState, AuthUser } from '@/hooks/useAuth'
import { UserRole } from '@prisma/client'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>
  signUp: (email: string, password: string, userData?: {
    firstName?: string
    lastName?: string
    role?: UserRole
  }) => Promise<{ success: boolean; error?: string; data?: any }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  hasRole: (requiredRoles: UserRole | UserRole[]) => boolean
  isAdmin: () => boolean
  isEditor: () => boolean
  isViewer: () => boolean
  refresh: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for role-based access control
interface WithRoleProps {
  children: ReactNode
  requiredRoles: UserRole | UserRole[]
  fallback?: ReactNode
  loading?: ReactNode
}

export function WithRole({ children, requiredRoles, fallback, loading }: WithRoleProps) {
  const { user, loading: authLoading, hasRole } = useAuthContext()

  if (authLoading) {
    return loading || <div className="flex items-center justify-center p-4">Loading...</div>
  }

  if (!user) {
    return fallback || <div className="text-center p-4 text-gray-500">Please sign in to access this content.</div>
  }

  if (!hasRole(requiredRoles)) {
    return fallback || <div className="text-center p-4 text-red-500">You don't have permission to access this content.</div>
  }

  return <>{children}</>
}

// Component for admin-only content
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <WithRole requiredRoles="ADMIN" fallback={fallback}>
      {children}
    </WithRole>
  )
}

// Component for editor and admin content
export function EditorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <WithRole requiredRoles={['ADMIN', 'EDITOR']} fallback={fallback}>
      {children}
    </WithRole>
  )
}

// Component for authenticated users
export function AuthenticatedOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>
  }

  if (!user) {
    return fallback || <div className="text-center p-4 text-gray-500">Please sign in to access this content.</div>
  }

  return <>{children}</>
}