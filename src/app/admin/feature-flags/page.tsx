import { Metadata } from 'next'
import { FeatureFlagDashboard } from '@/components/admin/feature-flags/FeatureFlagDashboard'

export const metadata: Metadata = {
  title: 'Feature Flags - LinkVault Pro Admin',
  description: 'Manage feature flags for controlled rollouts and A/B testing',
}

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-gray-600 mt-2">
          Control feature rollouts, conduct A/B tests, and manage feature toggles across your platform.
        </p>
      </div>

      <FeatureFlagDashboard />
    </div>
  )
}