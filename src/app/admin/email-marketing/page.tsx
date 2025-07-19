import { Metadata } from 'next'
import { EmailMarketingDashboard } from '@/components/admin/email-marketing/EmailMarketingDashboard'

export const metadata: Metadata = {
  title: 'Email Marketing - LinkVault Pro Admin',
  description: 'Manage email campaigns, automation, and subscriber engagement',
}

export default function EmailMarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
        <p className="text-gray-600 mt-2">
          Create and manage email campaigns to engage with your audience and drive conversions.
        </p>
      </div>

      <EmailMarketingDashboard />
    </div>
  )
}