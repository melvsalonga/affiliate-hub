'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { featuredProducts, trendingProducts, dealsProducts } from '@/data/mockProducts';

const heroProducts = featuredProducts.slice(0, 5);
const platforms = [
  { id: 'lazada', name: 'Lazada', logo: '🛍️', color: 'text-blue-600' },
  { id: 'shopee', name: 'Shopee', logo: '🛒', color: 'text-orange-600' },
  { id: 'tiktok', name: 'TikTok Shop', logo: '🎵', color: 'text-black' },
  { id: 'amazon', name: 'Amazon', logo: '📦', color: 'text-yellow-600' },
  { id: 'aliexpress', name: 'AliExpress', logo: '🚀', color: 'text-red-600' },
];

const trendingKeywords = [
  'iPhone 15 Pro', 'Samsung Galaxy S24', 'Gaming Chair', 'Wireless Earbuds', 'Smart Watch', 'LED Lights'
];

const stats = [
  { label: 'Products Tracked', value: '2.5M+', icon: '📊' },
  { label: 'Money Saved', value: '₱125M+', icon: '💰' },
  { label: 'Happy Users', value: '500K+', icon: '😊' },
  { label: 'Price Alerts', value: '1M+', icon: '🔔' },
];

export default function Home() {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % heroProducts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const selectTrendingKeyword = (keyword: string) => {
    setSearchQuery(keyword);
  };

  return (
    <div className="">
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`space-y-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Find the Best
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Deals
                  </span>
                  <span className="block">Across All Platforms</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg">
                  Compare prices from Lazada, Shopee, TikTok Shop, Amazon, AliExpress and more. 
                  Save money with smart shopping powered by AI.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <form onSubmit={handleSearch} className="flex">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products, brands, or categories..."
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-l-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-r-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Search
                  </button>
                </form>
                
                {/* Trending Keywords */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">🔥 Trending:</p>
                  <div className="flex flex-wrap gap-2">
                    {trendingKeywords.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => selectTrendingKeyword(keyword)}
                        className="px-3 py-1 bg-white text-gray-700 text-sm border border-gray-200 rounded-full hover:bg-gray-50 hover:border-blue-300 transition-all duration-200"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={stat.label} className={`text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#products"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl text-center"
                >
                  🛍️ Start Shopping
                </Link>
                <Link
                  href="/alerts"
                  className="flex-1 bg-white text-gray-900 px-8 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all duration-300 text-center"
                >
                  🔔 Set Price Alerts
                </Link>
              </div>
            </div>

            {/* Right Content - Product Showcase */}
            <div className="relative">
              <div className="relative w-full h-96 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden">
                {/* Animated Product Cards */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {heroProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`absolute w-64 h-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-700 transform ${
                        index === currentProductIndex
                          ? 'scale-100 opacity-100 z-10'
                          : index === (currentProductIndex + 1) % heroProducts.length
                          ? 'scale-95 opacity-50 translate-x-8 z-5'
                          : 'scale-90 opacity-25 translate-x-16 z-0'
                      }`}
                    >
                      <div className="relative h-48">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs font-medium rounded">
                          {product.platform.displayName}
                        </div>
                        {product.discount && product.discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            ₱{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₱{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < Math.floor(product.rating || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {product.rating?.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Navigation Dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {heroProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProductIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentProductIndex
                          ? 'bg-blue-600 w-8'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg animate-bounce">
                💰
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg animate-pulse">
                🎯
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Partners Section */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-600 mb-6 font-medium">🤝 Trusted Partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <span className="text-2xl">{platform.logo}</span>
                  <span className={`font-semibold ${platform.color}`}>{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured products */}
        <section id="products" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">✨ Featured Products</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>

        {/* Trending */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">🔥 Trending Now</h2>
            <Link href="/trending" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <ProductGrid products={trendingProducts} />
        </section>

        {/* Deals */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">🎯 Hot Deals</h2>
            <Link href="/deals" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
          <ProductGrid products={dealsProducts} />
        </section>
      </div>
    </div>
  );
}
