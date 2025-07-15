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

      // Create product with localStorage persistence
      const product = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to localStorage for persistence and sharing with frontend
      const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
      const updatedProducts = [product, ...existingProducts];
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
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add Product Manually</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter product name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter product description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Price and Original Price */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Platform and Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
              Platform *
            </label>
            <select
              id="platform"
              value={formData.platform}
              onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id}>{platform.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Product Image URL *
          </label>
          <input
            type="url"
            id="imageUrl"
            required
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/product-image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <img 
                src={formData.imageUrl} 
                alt="Product preview" 
                className="w-20 h-20 object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Affiliate URL */}
        <div>
          <label htmlFor="affiliateUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Affiliate URL *
          </label>
          <input
            type="url"
            id="affiliateUrl"
            required
            value={formData.affiliateUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, affiliateUrl: e.target.value }))}
            placeholder="https://affiliate-link.com/product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="Enter brand name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Rating and Review Count */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Location and Availability */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Philippines"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAvailable"
              checked={formData.isAvailable}
              onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
              Product is available
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
