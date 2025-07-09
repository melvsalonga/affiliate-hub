'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storage } from '@/utils/localStorage';

const platforms = [
  { id: 'lazada', name: 'Lazada', color: 'bg-blue-600' },
  { id: 'shopee', name: 'Shopee', color: 'bg-orange-600' },
  { id: 'tiktok', name: 'TikTok Shop', color: 'bg-black' },
  { id: 'amazon', name: 'Amazon', color: 'bg-yellow-600' },
  { id: 'aliexpress', name: 'AliExpress', color: 'bg-red-600' },
];

const categories = [
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'toys', name: 'Toys', icon: '🧸' },
  { id: 'automotive', name: 'Automotive', icon: '🚗' },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to search history
      storage.searchHistory.add(searchQuery.trim());
      
      // Navigate to search results
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        ...(selectedPlatform !== 'all' && { platform: selectedPlatform }),
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  const favoriteCount = storage.userFavorites.get().length;
  const alertCount = storage.priceAlerts.get().filter(alert => alert.isActive).length;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span>🔥 Best Deals from Multiple Platforms</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Free Price Alerts</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/favorites" className="hover:text-gray-300">
                ❤️ Favorites ({favoriteCount})
              </Link>
              <Link href="/alerts" className="hover:text-gray-300">
                🔔 Alerts ({alertCount})
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Affiliate Hub</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex">
                {/* Platform Filter */}
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="border border-gray-300 rounded-l-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
                
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-t border-b border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  🔍
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-blue-600 font-medium">
              Today's Deals
            </Link>
            <Link href="/trending" className="text-gray-700 hover:text-blue-600 font-medium">
              Trending
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-blue-600 font-medium">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
          </nav>
        </div>
      </div>

      {/* Platform Pills */}
      <div className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-3 overflow-x-auto">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Shop from:</span>
            {platforms.map(platform => (
              <Link
                key={platform.id}
                href={`/platform/${platform.id}`}
                className={`${platform.color} text-white px-3 py-1 rounded-full text-xs font-medium hover:opacity-90 whitespace-nowrap`}
              >
                {platform.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-2 overflow-x-auto">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-blue-600 whitespace-nowrap"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link href="/deals" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
              Today's Deals
            </Link>
            <Link href="/trending" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
              Trending
            </Link>
            <Link href="/categories" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
              Categories
            </Link>
            <Link href="/about" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
