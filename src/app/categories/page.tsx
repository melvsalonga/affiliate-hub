'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockProducts } from '@/data/mockProducts';
import { Product } from '@/types/product';

const categoryInfo = {
  electronics: {
    name: 'Electronics',
    icon: '📱',
    description: 'Smartphones, laptops, gadgets, and tech accessories',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  fashion: {
    name: 'Fashion',
    icon: '👗',
    description: 'Clothing, shoes, accessories, and style essentials',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  home: {
    name: 'Home & Living',
    icon: '🏠',
    description: 'Furniture, decor, appliances, and home essentials',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  beauty: {
    name: 'Beauty & Health',
    icon: '💄',
    description: 'Skincare, makeup, health products, and wellness',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  sports: {
    name: 'Sports & Outdoors',
    icon: '⚽',
    description: 'Fitness equipment, outdoor gear, and sportswear',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  automotive: {
    name: 'Automotive',
    icon: '🚗',
    description: 'Car accessories, parts, and automotive tools',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  toys: {
    name: 'Toys & Games',
    icon: '🎮',
    description: 'Toys, games, hobbies, and entertainment',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  books: {
    name: 'Books & Media',
    icon: '📚',
    description: 'Books, magazines, music, and digital media',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
};

export default function CategoriesPage() {
  const [categoryStats, setCategoryStats] = useState<Record<string, { count: number; avgPrice: number; deals: number }>>({});

  useEffect(() => {
    // Calculate statistics for each category
    const stats: Record<string, { count: number; totalPrice: number; deals: number }> = {};
    
    mockProducts.forEach(product => {
      if (!stats[product.category]) {
        stats[product.category] = { count: 0, totalPrice: 0, deals: 0 };
      }
      
      stats[product.category].count++;
      stats[product.category].totalPrice += product.price;
      
      if (product.discount && product.discount > 0) {
        stats[product.category].deals++;
      }
    });

    // Convert to final format with average prices
    const finalStats: Record<string, { count: number; avgPrice: number; deals: number }> = {};
    Object.keys(stats).forEach(category => {
      finalStats[category] = {
        count: stats[category].count,
        avgPrice: Math.round(stats[category].totalPrice / stats[category].count),
        deals: stats[category].deals,
      };
    });

    setCategoryStats(finalStats);
  }, []);

  const getCategoryData = (categoryKey: string) => {
    return categoryInfo[categoryKey as keyof typeof categoryInfo] || {
      name: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      icon: '📦',
      description: 'Various products and items',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
    };
  };

  const categories = Object.keys(categoryStats).map(key => ({
    key,
    ...getCategoryData(key),
    ...categoryStats[key],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing deals across all your favorite product categories from top platforms
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {categories.map(category => (
            <Link
              key={category.key}
              href={`/category/${category.key}`}
              className="group block"
            >
              <div className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${category.color}`}>
                {/* Category Icon */}
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>

                {/* Category Info */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{category.name}</h3>
                  <p className="text-sm opacity-80 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 pt-2 border-t border-current opacity-50">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Products:</span>
                      <span>{category.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Avg Price:</span>
                      <span>₱{category.avgPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Deals:</span>
                      <span>{category.deals} active</span>
                    </div>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-sm font-medium">
                    <span>Browse Category</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular Categories Spotlight */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories This Week</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Products */}
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Electronics</h3>
              <p className="text-blue-700 text-sm">Most products available</p>
              <div className="mt-3">
                <span className="text-2xl font-bold text-blue-900">
                  {categoryStats.electronics?.count || 0}
                </span>
                <span className="text-blue-700 text-sm ml-1">items</span>
              </div>
            </div>

            {/* Best Deals */}
            <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Hot Deals</h3>
              <p className="text-red-700 text-sm">Most active discounts</p>
              <div className="mt-3">
                <span className="text-2xl font-bold text-red-900">
                  {Object.values(categoryStats).reduce((total, cat) => total + cat.deals, 0)}
                </span>
                <span className="text-red-700 text-sm ml-1">deals</span>
              </div>
            </div>

            {/* Trending */}
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">Trending</h3>
              <p className="text-green-700 text-sm">Most viewed category</p>
              <div className="mt-3">
                <span className="text-2xl font-bold text-green-900">Home</span>
                <span className="text-green-700 text-sm ml-1">& Living</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Access Links */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/search?q=sale"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="text-2xl mb-2">💰</div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                All Sales
              </span>
            </Link>
            
            <Link
              href="/search?q=free%20shipping"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="text-2xl mb-2">🚚</div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                Free Shipping
              </span>
            </Link>
            
            <Link
              href="/search?platform=tiktok"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="text-2xl mb-2">🎵</div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                TikTok Viral
              </span>
            </Link>
            
            <Link
              href="/search?q=new"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="text-2xl mb-2">✨</div>
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                New Arrivals
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
