import { Metadata } from 'next'
import { PluginDashboard } from '@/components/admin/plugins/PluginDashboard'

export const metadata: Metadata = {
  title: 'Plugins - LinkVault Pro Admin',
  description: 'Manage plugins and extend platform functionality',
}

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plugin Management</h1>
        <p className="text-gray-600 mt-2">
          Install, configure, and manage plugins to extend your platform's capabilities.
        </p>
      </div>

      <PluginDashboard />
    </div>
  )
}