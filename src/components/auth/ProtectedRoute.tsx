'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { UserRole } from '@prisma/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole | UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  redirectTo = '/admin/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // User not authenticated
  if (!user) {
    return fallback || null
  }

  // Check role-based access
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this resource.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Specific role-based components
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles="ADMIN" {...props}>
      {children}
    </ProtectedRoute>
  )
}

export function EditorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']} {...props}>
      {children}
    </ProtectedRoute>
  )
}

export function ViewerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR', 'VIEWER']} {...props}>
      {children}
    </ProtectedRoute>
  )
}