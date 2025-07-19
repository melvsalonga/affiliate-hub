'use client'

import { useState, useEffect } from 'react'
import { FeatureFlagManager, FeatureFlagContext } from '@/lib/feature-flags/feature-flags'
import { useAuthContext } from '@/contexts/AuthContext'

export function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const context: FeatureFlagContext = {
          userId: user?.id,
          userRole: user?.role,
          userAttributes: user?.profile ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            timezone: user.profile.timezone,
          } : {},
          timestamp: new Date(),
          randomValue: Math.random(),
        }

        const enabled = await FeatureFlagManager.isEnabled(flagKey, context)
        setIsEnabled(enabled)
      } catch (error) {
        console.error(`Error checking feature flag ${flagKey}:`, error)
        setIsEnabled(false)
      } finally {
        setLoading(false)
      }
    }

    checkFlag()
  }, [flagKey, user])

  return loading ? false : isEnabled
}

export function useFeatureFlagValue<T = any>(flagKey: string, defaultValue?: T): T | null {
  const [value, setValue] = useState<T | null>(defaultValue ?? null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    const checkFlag = async () => {
      try {
        const context: FeatureFlagContext = {
          userId: user?.id,
          userRole: user?.role,
          userAttributes: user?.profile ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            timezone: user.profile.timezone,
          } : {},
          timestamp: new Date(),
          randomValue: Math.random(),
        }

        const flagValue = await FeatureFlagManager.getValueWithDefault<T>(
          flagKey, 
          defaultValue as T, 
          context
        )
        setValue(flagValue)
      } catch (error) {
        console.error(`Error getting feature flag value ${flagKey}:`, error)
        setValue(defaultValue ?? null)
      } finally {
        setLoading(false)
      }
    }

    checkFlag()
  }, [flagKey, defaultValue, user])

  return loading ? (defaultValue ?? null) : value
}

export function useFeatureFlags(): Record<string, any> {
  const [flags, setFlags] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const context: FeatureFlagContext = {
          userId: user?.id,
          userRole: user?.role,
          userAttributes: user?.profile ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            timezone: user.profile.timezone,
          } : {},
          timestamp: new Date(),
          randomValue: Math.random(),
        }

        const userFlags = await FeatureFlagManager.getFlagsForUser(context)
        setFlags(userFlags)
      } catch (error) {
        console.error('Error loading feature flags:', error)
        setFlags({})
      } finally {
        setLoading(false)
      }
    }

    loadFlags()
  }, [user])

  return loading ? {} : flags
}