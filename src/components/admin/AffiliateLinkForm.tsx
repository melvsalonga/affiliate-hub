'use client';

import { useState, useEffect } from 'react';
import { AffiliateLink, LinkGenerationRequest } from '@/types/affiliate';

interface AffiliateLinkFormProps {
  link?: AffiliateLink | null;
  onSubmit: (link: AffiliateLink) => void;
  onCancel: () => void;
}

export function AffiliateLinkForm({ link, onSubmit, onCancel }: AffiliateLinkFormProps) {
  const [formData, setFormData] = useState<LinkGenerationRequest>({
    originalUrl: '',
    platform: 'lazada',
    trackingId: '',
    customParameters: {},
    tags: [],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const platforms = [
    { value: 'lazada', label: 'Lazada', commission: '5%' },
    { value: 'shopee', label: 'Shopee', commission: '4%' },
    { value: 'tiktok', label: 'TikTok Shop', commission: '8%' },
    { value: 'amazon', label: 'Amazon', commission: '6%' },
    { value: 'aliexpress', label: 'AliExpress', commission: '5%' }
  ];

  // Pre-fill form when editing
  useEffect(() => {
    if (link) {
      setFormData({
        originalUrl: link.originalUrl,
        platform: link.platform,
        trackingId: link.trackingId,
        customParameters: {},
        tags: link.tags || [],
        notes: link.notes || ''
      });
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = link ? '/api/affiliate/links' : '/api/affiliate/links';
      const method = link ? 'PUT' : 'POST';
      const body = link ? { id: link.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        onSubmit(data.data);
        // Reset form
        setFormData({
          originalUrl: '',
          platform: 'lazada',
          trackingId: '',
          customParameters: {},
          tags: [],
          notes: ''
        });
        setTagInput('');
      } else {
        setError(data.error || 'Failed to save affiliate link');
      }
    } catch (error) {
      setError('Failed to save affiliate link');
      console.error('Error saving affiliate link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {link ? 'Edit Affiliate Link' : 'Add New Affiliate Link'}
        </h2>
        <p className="text-gray-600 mt-1">
          {link ? 'Update your affiliate link details' : 'Create a new affiliate link with tracking'}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Original URL */}
        <div>
          <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Original Product URL *
          </label>
          <input
            type="url"
            id="originalUrl"
            required
            value={formData.originalUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, originalUrl: e.target.value }))}
            placeholder="https://www.lazada.com.ph/products/example-product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter the original product URL from the supported platform
          </p>
        </div>

        {/* Platform */}
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
            Platform *
          </label>
          <select
            id="platform"
            required
            value={formData.platform}
            onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label} (Commission: {platform.commission})
              </option>
            ))}
          </select>
        </div>

        {/* Custom Tracking ID */}
        <div>
          <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-2">
            Custom Tracking ID
          </label>
          <input
            type="text"
            id="trackingId"
            value={formData.trackingId}
            onChange={(e) => setFormData(prev => ({ ...prev, trackingId: e.target.value }))}
            placeholder="Leave empty to auto-generate"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Optional: Provide a custom tracking ID for this link
          </p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this affiliate link..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (link ? 'Update Link' : 'Create Link')}
          </button>
        </div>
      </form>
    </div>
  );
}
