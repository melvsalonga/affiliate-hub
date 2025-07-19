import { Metadata } from 'next'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Offline - LinkVault Pro',
  description: 'You are currently offline. Please check your internet connection.',
}

export default function OfflinePage() {
  return (
    <Container className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l.09 2.122m-.09 15.516l.09 2.122M2.18 12l2.122-.09M19.516 12l2.122.09" 
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            You're Offline
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            It looks like you've lost your internet connection. Don't worry, you can still browse 
            some content that's been cached on your device.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            What you can do offline:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Browse previously viewed products</li>
            <li>• View cached analytics data</li>
            <li>• Access your saved content</li>
            <li>• Use basic navigation features</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Your actions will be synced when you're back online.
          </p>
        </div>
      </div>
    </Container>
  )
}