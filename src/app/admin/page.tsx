'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

function AdminDashboard() {
  const { user, signOut } = useAuthContext()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.profile?.firstName || user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Role:</span>
                <p className="font-medium">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    user?.role === 'EDITOR' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.role}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <p className="font-medium">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Products:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Categories:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Links:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <p className="text-sm text-gray-500">No recent activity</p>
          </Card>
        </div>

        {/* Role-based Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Only */}
          {user?.role === 'ADMIN' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  Manage Users
                </Button>
                <Button className="w-full" variant="outline">
                  System Settings
                </Button>
                <Button className="w-full" variant="outline">
                  View Logs
                </Button>
              </div>
            </Card>
          )}

          {/* Editor and Admin */}
          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  Manage Products
                </Button>
                <Button className="w-full" variant="outline">
                  Manage Categories
                </Button>
                <Button className="w-full" variant="outline">
                  Affiliate Links
                </Button>
              </div>
            </Card>
          )}

          {/* All Users */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                View Reports
              </Button>
              <Button className="w-full" variant="outline">
                Click Analytics
              </Button>
              <Button className="w-full" variant="outline">
                Revenue Tracking
              </Button>
            </div>
          </Card>
        </div>

        {/* Permissions Demo */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Admin Only</h4>
                {user?.role === 'ADMIN' ? (
                  <p className="text-green-600 text-sm">✓ You have access</p>
                ) : (
                  <p className="text-red-600 text-sm">✗ Access denied</p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Editor & Admin</h4>
                {(user?.role === 'ADMIN' || user?.role === 'EDITOR') ? (
                  <p className="text-green-600 text-sm">✓ You have access</p>
                ) : (
                  <p className="text-red-600 text-sm">✗ Access denied</p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">All Users</h4>
                <p className="text-green-600 text-sm">✓ You have access</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR', 'VIEWER']}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}