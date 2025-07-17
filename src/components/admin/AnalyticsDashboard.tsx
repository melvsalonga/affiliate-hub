'use client';

import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsDashboardProps {
  // No props needed since we get data from analytics service
}

export function AnalyticsDashboard({}: AnalyticsDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Get analytics data from our analytics service
  const rawOverallStats = analyticsService.getOverallStats();
  const productAnalytics = analyticsService.getProductAnalytics();
  const platformAnalytics = analyticsService.getPlatformAnalytics();
  const searchAnalytics = analyticsService.getSearchAnalytics();
  const sessionAnalytics = analyticsService.getSessionAnalytics();

  // Create compatible overallStats object with proper fallbacks
  const overallStats = {
    totalLinks: rawOverallStats.totalProducts || 0,
    activeLinks: rawOverallStats.totalProducts || 0,
    totalClicks: rawOverallStats.totalClicks || 0,
    totalConversions: Math.floor((rawOverallStats.totalClicks || 0) * 0.1), // Assume 10% conversion rate
    conversionRate: rawOverallStats.overallClickThroughRate || 0,
    totalRevenue: Math.floor((rawOverallStats.totalClicks || 0) * 50 * 0.1) // Assume $50 per conversion
  };

  // Process platform stats for the component
  const platformStats = platformAnalytics.reduce((acc, platform) => {
    acc[platform.platform] = {
      links: platform.totalProducts || 0,
      clicks: platform.totalClicks || 0,
      revenue: (platform.totalProducts || 0) * (platform.averagePrice || 0) * 0.05 // Assuming 5% commission
    };
    return acc;
  }, {} as Record<string, { links: number; clicks: number; revenue: number }>);

  // Process top performing links
  const topLinks = productAnalytics.slice(0, 5).map(product => ({
    id: product.productId,
    originalUrl: product.productName,
    platform: product.platform,
    clicks: product.totalAffiliateClicks || 0,
    revenue: (product.totalAffiliateClicks || 0) * 50 // Assuming average revenue per click
  }));

  // Handle link selection
  const handleLinkSelect = (link: any) => {
    setSelectedLink(link);
    setLoading(true);
    
    // Simulate loading detailed analytics
    setTimeout(() => {
      setAnalytics({
        totalClicks: link.clicks || 0,
        uniqueClicks: Math.floor((link.clicks || 0) * 0.8),
        conversions: Math.floor((link.clicks || 0) * 0.1),
        conversionRate: 10,
        topReferrers: [
          { source: 'Direct', clicks: Math.floor((link.clicks || 0) * 0.4) },
          { source: 'Facebook', clicks: Math.floor((link.clicks || 0) * 0.3) },
          { source: 'Google', clicks: Math.floor((link.clicks || 0) * 0.2) },
          { source: 'Twitter', clicks: Math.floor((link.clicks || 0) * 0.1) }
        ],
        deviceBreakdown: {
          mobile: Math.floor((link.clicks || 0) * 0.6),
          desktop: Math.floor((link.clicks || 0) * 0.3),
          tablet: Math.floor((link.clicks || 0) * 0.1)
        }
      });
      setLoading(false);
    }, 1000);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Prepare chart data
  const platformChartData = platformAnalytics.map(platform => ({
    name: platform.platform,
    views: platform.totalViews,
    clicks: platform.totalClicks,
    products: platform.totalProducts,
    ctr: parseFloat(platform.clickThroughRate.toFixed(2))
  }));

  const topProductsData = productAnalytics.slice(0, 8).map(product => ({
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName,
    views: product.totalViews,
    clicks: product.totalAffiliateClicks,
    ctr: parseFloat(product.clickThroughRate.toFixed(2))
  }));

  const searchTermsData = searchAnalytics.slice(0, 10).map(search => ({
    term: search.searchTerm,
    count: search.count,
    ctr: parseFloat(search.clickThroughRate.toFixed(2))
  }));

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExport = (format: 'json' | 'csv') => {
    const data = analyticsService.exportAnalytics(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      analyticsService.clearAnalytics();
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Track your affiliate link performance</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select 
            className="border-gray-300 rounded-md shadow-sm px-3 py-2"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export JSON
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
          
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear Data
          </button>
        </div>
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
          <p className="text-sm text-gray-500">{overallStats.conversionRate ? overallStats.conversionRate.toFixed(2) : '0.00'}% rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-orange-600">₱{overallStats.totalRevenue ? overallStats.totalRevenue.toFixed(2) : '0.00'}</p>
          <p className="text-sm text-gray-500">Total earned</p>
        </div>
      </div>
        
      {/* Charts */}
      <div className="flex flex-wrap justify-around mb-8">
        {/* Bar Chart for Platforms */}
        <ResponsiveContainer width="48%" height={400}>
          <BarChart data={platformChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" stackId="a" fill="#8884d8" />
            <Bar dataKey="clicks" stackId="a" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>

        {/* Line Chart for Top Products */}
        <ResponsiveContainer width="48%" height={400}>
          <LineChart data={topProductsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
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
                  <p className="text-sm text-gray-500">₱{stats.revenue ? stats.revenue.toFixed(2) : '0.00'}</p>
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
                  <p className="text-sm font-medium text-gray-900">₱{link.revenue ? link.revenue.toFixed(2) : '0.00'}</p>
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
                  <p className="text-2xl font-bold text-orange-600">{analytics.conversionRate ? analytics.conversionRate.toFixed(2) : '0.00'}%</p>
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
