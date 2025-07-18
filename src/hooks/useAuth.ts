'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@prisma/client'

export interface AuthUser extends User {
  role?: UserRole
  isActive?: boolean
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
    theme?: string
    language?: string
  }
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (session?.user) {
          const userData = await fetchUserData(session.user.id)
          setState({
            user: { ...session.user, ...userData },
            session,
            loading: false,
            error: null
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Authentication error',
          loading: false 
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = await fetchUserData(session.user.id)
          setState({
            user: { ...session.user, ...userData },
            session,
            loading: false,
            error: null
          })
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const userData = await fetchUserData(session.user.id)
          setState(prev => ({
            ...prev,
            user: { ...session.user, ...userData },
            session
          }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          role,
          is_active,
          profile:user_profiles(
            first_name,
            last_name,
            avatar,
            theme,
            language
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        return {}
      }

      return {
        role: data.role,
        isActive: data.is_active,
        profile: data.profile ? {
          firstName: data.profile.first_name,
          lastName: data.profile.last_name,
          avatar: data.profile.avatar,
          theme: data.profile.theme,
          language: data.profile.language
        } : undefined
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      return {}
    }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string, userData?: {
    firstName?: string
    lastName?: string
    role?: UserRole
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName,
            role: userData?.role || 'VIEWER'
          }
        }
      })

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      return { success: false, error: errorMessage }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed'
      return { success: false, error: errorMessage }
    }
  }

  const hasRole = (requiredRoles: UserRole | UserRole[]) => {
    if (!state.user?.role) return false
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return roles.includes(state.user.role)
  }

  const isAdmin = () => hasRole('ADMIN')
  const isEditor = () => hasRole(['ADMIN', 'EDITOR'])
  const isViewer = () => hasRole(['ADMIN', 'EDITOR', 'VIEWER'])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    isAdmin,
    isEditor,
    isViewer,
    refresh: () => fetchUserData(state.user?.id || '')
  }
}