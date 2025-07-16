'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { productScraperService } from '@/services/productScraperService';

interface AutomaticProductAdditionProps {
  onProductAdded: (product: Product) => void;
  onCancel?: () => void;
  editingProduct?: Product | null;
}

export interface ExtractedProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  platform: string;
}

export function AutomaticProductAddition({ onProductAdded, onCancel, editingProduct }: AutomaticProductAdditionProps) {
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedProductData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Beauty & Health',
    'Toys & Games',
    'Books & Media',
    'Automotive',
    'Food & Beverages',
    'Baby & Kids',
    'Others'
  ];

  const handleExtractProduct = async () => {
    if (!affiliateUrl.trim()) {
      setExtractError('Please enter an affiliate URL');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const data = await productScraperService.extractProductData(affiliateUrl);
      setExtractedData(data);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : 'Failed to extract product data');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!extractedData) {
      setSubmitError('Please extract product data first');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create product object
      const product: Product = {
        id: editingProduct?.id || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: extractedData.name,
        description: extractedData.description,
        price: extractedData.price,
        originalPrice: extractedData.originalPrice,
        currency: 'PHP',
        imageUrl: extractedData.imageUrl,
        platform: {
          id: extractedData.platform,
          name: getPlatformDisplayName(extractedData.platform),
          displayName: getPlatformDisplayName(extractedData.platform),
          baseUrl: getPlatformBaseUrl(extractedData.platform),
          logoUrl: `/logos/${extractedData.platform}.png`,
          commission: getDefaultCommission(extractedData.platform),
          currency: 'PHP'
        },
        affiliateUrl: affiliateUrl,
        category: extractedData.category,
        brand: extractedData.brand,
        rating: extractedData.rating || 4.5,
        reviewCount: extractedData.reviewCount || 100,
        discount: extractedData.originalPrice ? 
          Math.round(((extractedData.originalPrice - extractedData.price) / extractedData.originalPrice) * 100) : 0,
        isAvailable: true,
        location: 'Philippines',
        shippingInfo: {
          cost: 0,
          estimatedDays: 3,
          freeShippingMinimum: 500
        },
        createdAt: editingProduct?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Save to localStorage for persistence
      const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
      let updatedProducts;
      
      if (editingProduct) {
        // Update existing product
        updatedProducts = existingProducts.map((p: any) => 
          p.id === editingProduct.id ? product : p
        );
      } else {
        // Add new product
        updatedProducts = [product, ...existingProducts];
      }
      
      localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onProductAdded(product);
      
      // Reset form
      setAffiliateUrl('');
      setExtractedData(null);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof ExtractedProductData, value: any) => {
    if (extractedData) {
      setExtractedData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const getPlatformDisplayName = (platform: string): string => {
    const platformMap: Record<string, string> = {
      'lazada': 'Lazada',
      'shopee': 'Shopee',
      'tiktok': 'TikTok Shop',
      'amazon': 'Amazon',
      'aliexpress': 'AliExpress'
    };
    return platformMap[platform] || platform;
  };

  const getPlatformBaseUrl = (platform: string): string => {
    const urlMap: Record<string, string> = {
      'lazada': 'https://www.lazada.com.ph',
      'shopee': 'https://shopee.ph',
      'tiktok': 'https://shop.tiktok.com',
      'amazon': 'https://amazon.com',
      'aliexpress': 'https://aliexpress.com'
    };
    return urlMap[platform] || '';
  };

  const getDefaultCommission = (platform: string): number => {
    const commissionMap: Record<string, number> = {
      'lazada': 0.05,
      'shopee': 0.04,
      'tiktok': 0.15,
      'amazon': 0.08,
      'aliexpress': 0.06
    };
    return commissionMap[platform] || 0.05;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    🤖 Automatic Product Addition
                  </h1>
                  <p className="text-green-100 mt-1">
                    Paste an affiliate link and let AI extract product information
                  </p>
                </div>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-white hover:text-green-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {/* Step 1: Affiliate Link Input */}
            <div className="mb-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold">1</span>
                  </span>
                  Paste Affiliate Link
                </h3>
                <p className="text-sm text-gray-600 mt-1">Enter your affiliate link from any supported platform</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="affiliateUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                    🔗 Affiliate Link *
                  </label>
                  <input
                    type="url"
                    id="affiliateUrl"
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="https://www.lazada.com.ph/products/your-affiliate-link"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleExtractProduct}
                    disabled={isExtracting || !affiliateUrl.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isExtracting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting Product Data...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        🤖 Extract Product Info
                      </span>
                    )}
                  </button>
                </div>

                {extractError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800">{extractError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Extracted Data Form */}
            {extractedData && (
              <form onSubmit={handleSubmit}>
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">2</span>
                    </span>
                    Review & Edit Product Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Review and edit the extracted product details</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Basic Information */}
                  <div className="space-y-6">
                    {/* Product Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        📝 Product Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={extractedData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                        📄 Description *
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        value={extractedData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Price Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-3">💰 Pricing Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Price (₱) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={extractedData.price}
                            onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₱)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={extractedData.originalPrice || 0}
                            onChange={(e) => handleFieldChange('originalPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category and Brand */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">📂 Category *</label>
                        <select
                          value={extractedData.category}
                          onChange={(e) => handleFieldChange('category', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Brand</label>
                        <input
                          type="text"
                          value={extractedData.brand || ''}
                          onChange={(e) => handleFieldChange('brand', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Media & Additional Info */}
                  <div className="space-y-6">
                    {/* Image URL with Preview */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">🖼️ Product Image *</label>
                      <input
                        type="url"
                        value={extractedData.imageUrl}
                        onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {extractedData.imageUrl && (
                        <div className="mt-4 flex justify-center">
                          <div className="relative">
                            <img 
                              src={extractedData.imageUrl} 
                              alt="Product preview" 
                              className="w-32 h-32 object-cover rounded-xl shadow-lg border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Platform Display */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">🏪 Platform</label>
                      <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-gray-700 font-medium">{getPlatformDisplayName(extractedData.platform)}</span>
                      </div>
                    </div>

                    {/* Rating and Review Count */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-3">⭐ Rating & Reviews</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={extractedData.rating || 4.5}
                            onChange={(e) => handleFieldChange('rating', parseFloat(e.target.value) || 4.5)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Review Count</label>
                          <input
                            type="number"
                            min="0"
                            value={extractedData.reviewCount || 100}
                            onChange={(e) => handleFieldChange('reviewCount', parseInt(e.target.value) || 100)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Product...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Product
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
