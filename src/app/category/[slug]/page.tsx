'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import Loading from '@/components/ui/Loading';
import { mockProducts } from '@/data/mockProducts';
import { Product } from '@/types/product';

const categoryInfo = {
  electronics: {
    name: 'Electronics',
    icon: '📱',
    description: 'Discover the latest smartphones, laptops, tablets, gadgets, and tech accessories from top brands. Find the best deals on cutting-edge technology.',
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  fashion: {
    name: 'Fashion',
    icon: '👗',
    description: 'Explore trendy clothing, stylish shoes, accessories, and fashion essentials for men, women, and kids. Stay fashionable with the latest styles.',
    color: 'bg-pink-600',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  home: {
    name: 'Home & Living',
    icon: '🏠',
    description: 'Transform your living space with furniture, home decor, appliances, and essential household items. Create your perfect home environment.',
    color: 'bg-green-600',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  beauty: {
    name: 'Beauty & Health',
    icon: '💄',
    description: 'Pamper yourself with skincare products, makeup, health supplements, and wellness items. Look and feel your best every day.',
    color: 'bg-purple-600',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  sports: {
    name: 'Sports & Outdoors',
    icon: '⚽',
    description: 'Gear up for adventure with fitness equipment, outdoor gear, sportswear, and athletic accessories. Stay active and healthy.',
    color: 'bg-orange-600',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  automotive: {
    name: 'Automotive',
    icon: '🚗',
    description: 'Keep your vehicle in top condition with car accessories, replacement parts, tools, and automotive maintenance products.',
    color: 'bg-gray-600',
    lightColor: 'bg-gray-50',
    textColor: 'text-gray-600',
  },
  toys: {
    name: 'Toys & Games',
    icon: '🎮',
    description: 'Discover fun toys, engaging games, educational activities, and entertainment products for kids and adults of all ages.',
    color: 'bg-yellow-600',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  books: {
    name: 'Books & Media',
    icon: '📚',
    description: 'Expand your knowledge with books, magazines, digital media, and educational content across various subjects and genres.',
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
};

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'discount', label: 'Best Deals' },
  { value: 'newest', label: 'Newest First' },
];

const platforms = [
  { id: 'all', name: 'All Platforms' },
  { id: 'lazada', name: 'Lazada' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'tiktok', name: 'TikTok Shop' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'aliexpress', name: 'AliExpress' },
];

export default function CategoryPage() {
  const params = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSort, setSelectedSort] = useState('popular');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });

  const categorySlug = params.slug as string;
  const category = categoryInfo[categorySlug as keyof typeof categoryInfo];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const categoryProducts = mockProducts.filter(product => product.category === categorySlug);
      setProducts(categoryProducts);
      setLoading(false);
    }, 500);
  }, [categorySlug]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(product => product.platform.id === selectedPlatform);
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Sort products
    switch (selectedSort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      default:
        // Keep original order for popular
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedPlatform, selectedSort, priceRange]);

  if (loading) {
    return <Loading message="Loading category products..." />;
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
          <Link
            href="/categories"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Browse Categories
          </Link>
        </div>
      </div>
    );
  }

  const avgPrice = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
    : 0;
  
  const dealsCount = products.filter(p => p.discount && p.discount > 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className={`${category.color} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-white/80 mb-8">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>→</span>
              <Link href="/categories" className="hover:text-white">Categories</Link>
              <span>→</span>
              <span className="text-white">{category.name}</span>
            </nav>

            {/* Category Info */}
            <div className="text-6xl mb-6">{category.icon}</div>
            <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {category.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">{products.length}</div>
                <div className="text-white/80">Products Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">₱{avgPrice.toLocaleString()}</div>
                <div className="text-white/80">Average Price</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{dealsCount}</div>
                <div className="text-white/80">Active Deals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Platform Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Platform:</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              >
                {platforms.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Price Range:</label>
              <select
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange({ min, max: max || 100000 });
                }}
                className="px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="0-100000">All Prices</option>
                <option value="0-1000">₱0 - ₱1,000</option>
                <option value="1000-5000">₱1,000 - ₱5,000</option>
                <option value="5000-10000">₱5,000 - ₱10,000</option>
                <option value="10000-50000">₱10,000 - ₱50,000</option>
                <option value="50000-100000">₱50,000+</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {category.name} Products
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or browse other categories
            </p>
            <Link
              href="/categories"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Browse All Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
