import { Metadata } from 'next'
import { SocialMediaDashboard } from '@/components/admin/social-media/SocialMediaDashboard'

export const metadata: Metadata = {
  title: 'Social Media - LinkVault Pro Admin',
  description: 'Manage social media sharing, automation, and engagement analytics',
}

export default function SocialMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Social Media Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your social media presence, schedule posts, and track engagement across all platforms.
        </p>
      </div>

      <SocialMediaDashboard />
    </div>
  )
}