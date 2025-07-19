import { Metadata } from 'next'
import { WebhookList } from '@/components/admin/webhooks/WebhookList'

export const metadata: Metadata = {
  title: 'Webhooks - LinkVault Pro Admin',
  description: 'Manage webhook integrations and external service notifications',
}

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
        <p className="text-gray-600 mt-2">
          Configure webhooks to receive real-time notifications about events in your LinkVault Pro system.
        </p>
      </div>

      <WebhookList />
    </div>
  )
}