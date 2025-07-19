'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { SEODashboard } from '@/components/admin/SEODashboard'
import { Search } from 'lucide-react'

export default function SEOManagementPage() {
  return (
    <AdminLayout title="SEO Management">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          <h1 className="text-2xl font-bold">SEO Management</h1>
        </div>
        
        <SEODashboard />
      </div>
    </AdminLayout>
  )
}