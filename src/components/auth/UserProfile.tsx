'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function UserProfile() {
  const { user, refresh } = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    timezone: user?.profile?.timezone || 'UTC',
    theme: user?.profile?.theme || 'SYSTEM',
    language: user?.profile?.language || 'en',
    emailNotifications: {
      newConversions: true,
      weeklyReports: true,
      systemUpdates: true
    },
    pushNotifications: {
      realTimeAlerts: false,
      dailySummary: true
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      await refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      timezone: user?.profile?.timezone || 'UTC',
      theme: user?.profile?.theme || 'SYSTEM',
      language: user?.profile?.language || 'en',
      emailNotifications: {
        newConversions: true,
        weeklyReports: true,
        systemUpdates: true
      },
      pushNotifications: {
        realTimeAlerts: false,
        dailySummary: true
      }
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <Input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Manila">Asia/Manila</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="SYSTEM">System</option>
                  <option value="LIGHT">Light</option>
                  <option value="DARK">Dark</option>
                </select>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="en">English</option>
                  <option value="fil">Filipino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          {isEditing && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Email Notifications</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications.newConversions"
                        checked={formData.emailNotifications.newConversions}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">New conversions</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications.weeklyReports"
                        checked={formData.emailNotifications.weeklyReports}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Weekly reports</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications.systemUpdates"
                        checked={formData.emailNotifications.systemUpdates}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">System updates</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Push Notifications</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="pushNotifications.realTimeAlerts"
                        checked={formData.pushNotifications.realTimeAlerts}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Real-time alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="pushNotifications.dailySummary"
                        checked={formData.pushNotifications.dailySummary}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Daily summary</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Card>
  )
}