'use client';

import { useState, useEffect } from 'react';
import { AffiliateLink } from '@/types/affiliate';
import { AffiliateLinkForm } from '@/components/admin/AffiliateLinkForm';
import { AffiliateLinkList } from '@/components/admin/AffiliateLinkList';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ProductFromLinkForm } from '@/components/admin/ProductFromLinkForm';
import { Product } from '@/types/product';

export default function AdminDashboard() {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'analytics' | 'add-link'>('links');
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [selectedLinkForProduct, setSelectedLinkForProduct] = useState<AffiliateLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch affiliate links on component mount
  useEffect(() => {
    fetchAffiliateLinks();
  }, []);

  const fetchAffiliateLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/affiliate/links');
      const data = await response.json();
      
      if (data.success) {
        setAffiliateLinks(data.data);
      } else {
        setError(data.error || 'Failed to fetch affiliate links');
      }
    } catch (error) {
      setError('Failed to fetch affiliate links');
      console.error('Error fetching affiliate links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCreated = (newLink: AffiliateLink) => {
    setAffiliateLinks(prev => [newLink, ...prev]);
    setActiveTab('links');
  };

  const handleLinkUpdated = (updatedLink: AffiliateLink) => {
    setAffiliateLinks(prev => 
      prev.map(link => link.id === updatedLink.id ? updatedLink : link)
    );
    setSelectedLink(null);
  };

  const handleLinkDeleted = (linkId: string) => {
    setAffiliateLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const handleEditLink = (link: AffiliateLink) => {
    setSelectedLink(link);
    setActiveTab('add-link');
  };

  const handleCreateProduct = (link: AffiliateLink) => {
    setSelectedLinkForProduct(link);
  };

  const handleProductCreated = (product: Product) => {
    setSelectedLinkForProduct(null);
    // Show success message or refresh products if needed
    alert(`Product "${product.name}" created successfully!`);
  };

  const handleCancelProductCreation = () => {
    setSelectedLinkForProduct(null);
  };

  const tabs = [
    { id: 'links', label: 'Affiliate Links', count: affiliateLinks.length },
    { id: 'analytics', label: 'Analytics', count: null },
    { id: 'add-link', label: selectedLink ? 'Edit Link' : 'Add Link', count: null }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your affiliate links and track performance</p>
        </div>

        {/* Error Alert */}
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
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'add-link') {
                    setSelectedLink(null);
                  }
                  setSelectedLinkForProduct(null); // Reset product creation state
                }}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'links' && (
            <AffiliateLinkList
              links={affiliateLinks}
              onEdit={handleEditLink}
              onDelete={handleLinkDeleted}
              onRefresh={fetchAffiliateLinks}
              onCreateProduct={handleCreateProduct}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard links={affiliateLinks} />
          )}

          {activeTab === 'add-link' && (
            <AffiliateLinkForm
              link={selectedLink}
              onSubmit={selectedLink ? handleLinkUpdated : handleLinkCreated}
              onCancel={() => {
                setSelectedLink(null);
                setActiveTab('links');
              }}
            />
          )}
        </div>
      </div>

      {/* Product Creation Modal */}
      {selectedLinkForProduct && (
        <ProductFromLinkForm
          affiliateLink={selectedLinkForProduct}
          onProductCreated={handleProductCreated}
          onCancel={handleCancelProductCreation}
        />
      )}
    </div>
  );
}
