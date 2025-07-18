'use client'

import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function UnauthorizedPage() {
  const { user, signOut } = useAuthContext()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource. 
            {user && (
              <>
                <br />
                <span className="text-sm">
                  Current role: <strong>{user.role}</strong>
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            {user ? (
              <>
                <Link href="/admin">
                  <Button className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/admin/login">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}