'use client';

import { useState } from 'react';
import { AffiliateLink } from '@/types/affiliate';

interface AffiliateLinkListProps {
  links: AffiliateLink[];
  onEdit: (link: AffiliateLink) => void;
  onDelete: (linkId: string) => void;
  onRefresh: () => void;
}

export function AffiliateLinkList({ links, onEdit, onDelete, onRefresh }: AffiliateLinkListProps) {
  const [filter, setFilter] = useState({
    platform: '',
    isActive: '',
    search: ''
  });

  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks' | 'conversions' | 'revenue'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort links
  const filteredAndSortedLinks = links
    .filter(link => {
      const matchesPlatform = !filter.platform || link.platform === filter.platform;
      const matchesActive = !filter.isActive || link.isActive.toString() === filter.isActive;
      const matchesSearch = !filter.search || 
        link.originalUrl.toLowerCase().includes(filter.search.toLowerCase()) ||
        link.trackingId.toLowerCase().includes(filter.search.toLowerCase()) ||
        link.notes?.toLowerCase().includes(filter.search.toLowerCase()) ||
        link.tags?.some(tag => tag.toLowerCase().includes(filter.search.toLowerCase()));
      
      return matchesPlatform && matchesActive && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'clicks':
          aValue = a.clicks;
          bValue = b.clicks;
          break;
        case 'conversions':
          aValue = a.conversions;
          bValue = b.conversions;
          break;
        case 'revenue':
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleDelete = async (linkId: string) => {
    if (window.confirm('Are you sure you want to delete this affiliate link?')) {
      try {
        const response = await fetch(`/api/affiliate/links?id=${linkId}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          onDelete(linkId);
        } else {
          alert('Failed to delete affiliate link: ' + data.error);
        }
      } catch (error) {
        alert('Failed to delete affiliate link');
        console.error('Error deleting affiliate link:', error);
      }
    }
  };

  const handleToggleActive = async (link: AffiliateLink) => {
    try {
      const response = await fetch('/api/affiliate/links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: link.id,
          isActive: !link.isActive
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onRefresh();
      } else {
        alert('Failed to update affiliate link: ' + data.error);
      }
    } catch (error) {
      alert('Failed to update affiliate link');
      console.error('Error updating affiliate link:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert('Link copied to clipboard!');
  };

  const platforms = [
    { value: '', label: 'All Platforms' },
    { value: 'lazada', label: 'Lazada' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'tiktok', label: 'TikTok Shop' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'aliexpress', label: 'AliExpress' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Affiliate Links</h2>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={filter.platform}
              onChange={(e) => setFilter(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map(platform => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.isActive}
              onChange={(e) => setFilter(prev => ({ ...prev, isActive: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Date Created</option>
              <option value="clicks">Clicks</option>
              <option value="conversions">Conversions</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search links..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedLinks.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {link.originalUrl}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {link.trackingId}
                    </div>
                    {link.tags && link.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {link.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">{link.platform}</div>
                  <div className="text-sm text-gray-500">{(link.commission * 100).toFixed(1)}% commission</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {link.clicks} clicks • {link.conversions} conversions
                  </div>
                  <div className="text-sm text-gray-500">
                    ₱{link.revenue.toFixed(2)} revenue
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      link.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {link.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(link.affiliateUrl)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Copy affiliate link"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => onEdit(link)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit link"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete link"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedLinks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No affiliate links found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
