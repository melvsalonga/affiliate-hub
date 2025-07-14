'use client';

import { useState, useEffect } from 'react';
import { AffiliateLink, LinkAnalytics } from '@/types/affiliate';

interface AnalyticsDashboardProps {
  links: AffiliateLink[];
}

export function AnalyticsDashboard({ links }: AnalyticsDashboardProps) {
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate overall statistics
  const overallStats = {
    totalLinks: links.length,
    activeLinks: links.filter(link => link.isActive).length,
    totalClicks: links.reduce((sum, link) => sum + link.clicks, 0),
    totalConversions: links.reduce((sum, link) => sum + link.conversions, 0),
    totalRevenue: links.reduce((sum, link) => sum + link.revenue, 0),
    conversionRate: 0
  };

  overallStats.conversionRate = overallStats.totalClicks > 0 
    ? (overallStats.totalConversions / overallStats.totalClicks) * 100 
    : 0;

  // Platform breakdown
  const platformStats = links.reduce((acc, link) => {
    if (!acc[link.platform]) {
      acc[link.platform] = {
        links: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0
      };
    }
    acc[link.platform].links += 1;
    acc[link.platform].clicks += link.clicks;
    acc[link.platform].conversions += link.conversions;
    acc[link.platform].revenue += link.revenue;
    return acc;
  }, {} as Record<string, { links: number; clicks: number; conversions: number; revenue: number }>);

  // Top performing links
  const topLinks = [...links]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const fetchAnalytics = async (linkId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/affiliate/analytics?linkId=${linkId}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        console.error('Failed to fetch analytics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSelect = (link: AffiliateLink) => {
    setSelectedLink(link);
    fetchAnalytics(link.id);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Track your affiliate link performance</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Links</h3>
          <p className="text-3xl font-bold text-blue-600">{overallStats.totalLinks}</p>
          <p className="text-sm text-gray-500">{overallStats.activeLinks} active</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Clicks</h3>
          <p className="text-3xl font-bold text-green-600">{overallStats.totalClicks}</p>
          <p className="text-sm text-gray-500">All time</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversions</h3>
          <p className="text-3xl font-bold text-purple-600">{overallStats.totalConversions}</p>
          <p className="text-sm text-gray-500">{overallStats.conversionRate.toFixed(2)}% rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-orange-600">₱{overallStats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Total earned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
          <div className="space-y-4">
            {Object.entries(platformStats).map(([platform, stats]) => (
              <div key={platform} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{platform}</p>
                  <p className="text-sm text-gray-500">{stats.links} links</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{stats.clicks} clicks</p>
                  <p className="text-sm text-gray-500">₱{stats.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Links</h3>
          <div className="space-y-4">
            {topLinks.map((link) => (
              <div 
                key={link.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => handleLinkSelect(link)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {link.originalUrl}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{link.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₱{link.revenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{link.clicks} clicks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {selectedLink && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Detailed Analytics: {selectedLink.platform}
            </h3>
            <button
              onClick={() => setSelectedLink(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading analytics...</p>
            </div>
          ) : analytics ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.totalClicks}</p>
                  <p className="text-sm text-gray-500">Total Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.uniqueClicks}</p>
                  <p className="text-sm text-gray-500">Unique Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{analytics.conversions}</p>
                  <p className="text-sm text-gray-500">Conversions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{analytics.conversionRate.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Referrers */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Top Referrers</h4>
                  <div className="space-y-2">
                    {analytics.topReferrers.slice(0, 5).map((referrer) => (
                      <div key={referrer.source} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{referrer.source}</span>
                        <span className="text-sm text-gray-500">{referrer.clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Device Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.deviceBreakdown).map(([device, count]) => (
                      <div key={device} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{device}</span>
                        <span className="text-sm text-gray-500">{count} clicks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No analytics data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
