'use client';

import { useState } from 'react';
import { Product } from '@/types/product';
import { productAffiliateService } from '@/services/productAffiliateService';

interface ManualProductAdditionProps {
  onProductAdded: (product: Product) => void;
  onCancel?: () => void;
  editingProduct?: Product | null;
}

interface ProductFormData {
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
  affiliateUrl: string;
  isAvailable: boolean;
  location: string;
}

export function ManualProductAddition({ onProductAdded, onCancel, editingProduct }: ManualProductAdditionProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: editingProduct?.name || '',
    description: editingProduct?.description || '',
    price: editingProduct?.price || 0,
    originalPrice: editingProduct?.originalPrice || 0,
    imageUrl: editingProduct?.imageUrl || '',
    category: editingProduct?.category || 'Electronics',
    brand: editingProduct?.brand || '',
    rating: editingProduct?.rating || 4.5,
    reviewCount: editingProduct?.reviewCount || 100,
    platform: editingProduct?.platform?.id || 'manual',
    affiliateUrl: editingProduct?.affiliateUrl || '',
    isAvailable: editingProduct?.isAvailable !== undefined ? editingProduct.isAvailable : true,
    location: editingProduct?.location || 'Philippines'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platforms = [
    { id: 'manual', name: 'Manual Entry' },
    { id: 'lazada', name: 'Lazada' },
    { id: 'shopee', name: 'Shopee' },
    { id: 'tiktok', name: 'TikTok Shop' },
    { id: 'amazon', name: 'Amazon' },
    { id: 'aliexpress', name: 'AliExpress' }
  ];

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

  const getPlatformBaseUrl = (platform: string) => {
    const urls = {
      'lazada': 'https://lazada.com.ph',
      'shopee': 'https://shopee.ph',
      'tiktok': 'https://shop.tiktok.com',
      'amazon': 'https://amazon.com',
      'aliexpress': 'https://aliexpress.com',
      'manual': ''
    };
    return urls[platform as keyof typeof urls] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Product description is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (!formData.imageUrl.trim()) {
        throw new Error('Product image URL is required');
      }
      if (!formData.affiliateUrl.trim()) {
        throw new Error('Affiliate URL is required');
      }

      // Create or update product with localStorage persistence
      const product = {
        id: editingProduct?.id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        originalPrice: formData.originalPrice,
        currency: 'PHP',
        imageUrl: formData.imageUrl,
        platform: {
          id: formData.platform,
          name: formData.platform === 'manual' ? 'Manual Entry' : formData.platform,
          displayName: formData.platform === 'manual' ? 'Manual Entry' : formData.platform,
          baseUrl: getPlatformBaseUrl(formData.platform),
          logoUrl: `/logos/${formData.platform}.png`,
          commission: 0.05,
          currency: 'PHP'
        },
        affiliateUrl: formData.affiliateUrl,
        category: formData.category,
        brand: formData.brand,
        rating: formData.rating || 4.5,
        reviewCount: formData.reviewCount || 100,
        discount: formData.originalPrice ? 
          Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100) : 0,
        isAvailable: formData.isAvailable,
        location: formData.location,
        shippingInfo: {
          cost: 0,
          estimatedDays: 3,
          freeShippingMinimum: 500
        },
        createdAt: editingProduct?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      // Save to localStorage for persistence and sharing with frontend
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
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        imageUrl: '',
        category: 'Electronics',
        brand: '',
        rating: 4.5,
        reviewCount: 100,
        platform: 'manual',
        affiliateUrl: '',
        isAvailable: true,
        location: 'Philippines'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {editingProduct ? '✏️ Edit Product' : '✨ Add New Product'}
                  </h1>
                  <p className="text-blue-100 mt-1">
                    {editingProduct ? 'Update your product information' : 'Create a new product for your affiliate showcase'}
                  </p>
                </div>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
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

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Basic Information
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Essential product details and description</p>
                </div>
                
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter an engaging product name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
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
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the product features and benefits"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                  />
                </div>

                {/* Price Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    💰 Pricing Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Price (₱) *
                      </label>
                      <input
                        type="number"
                        id="price"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (₱)
                      </label>
                      <input
                        type="number"
                        id="originalPrice"
                        min="0"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Platform and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="platform" className="block text-sm font-semibold text-gray-700 mb-2">
                      🏪 Platform *
                    </label>
                    <select
                      id="platform"
                      value={formData.platform}
                      onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {platforms.map(platform => (
                        <option key={platform.id} value={platform.id}>{platform.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                      📂 Category *
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Media & Additional Info */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    Media & Links
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Product images and affiliate links</p>
                </div>

                {/* Image URL with Preview */}
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                    🖼️ Product Image URL *
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/product-image.jpg"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {formData.imageUrl && (
                    <div className="mt-4 flex justify-center">
                      <div className="relative">
                        <img 
                          src={formData.imageUrl} 
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

                {/* Affiliate URL */}
                <div>
                  <label htmlFor="affiliateUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                    🔗 Affiliate URL *
                  </label>
                  <input
                    type="url"
                    id="affiliateUrl"
                    required
                    value={formData.affiliateUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, affiliateUrl: e.target.value }))}
                    placeholder="https://affiliate-link.com/product"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label htmlFor="brand" className="block text-sm font-semibold text-gray-700 mb-2">
                    🏷️ Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Enter brand name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Rating and Review Count */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
                    ⭐ Rating & Reviews
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                        Rating (1-5)
                      </label>
                      <input
                        type="number"
                        id="rating"
                        min="1"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 4.5 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="reviewCount" className="block text-sm font-medium text-gray-700 mb-2">
                        Review Count
                      </label>
                      <input
                        type="number"
                        id="reviewCount"
                        min="0"
                        value={formData.reviewCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, reviewCount: parseInt(e.target.value) || 100 }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Location and Availability */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                      📍 Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Philippines"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isAvailable" className="ml-3 text-sm font-medium text-gray-700 flex items-center">
                      ✅ Product is available
                    </label>
                  </div>
                </div>
              </div>
            </div>

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
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingProduct ? 'Updating Product...' : 'Adding Product...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
