'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { storage } from '@/utils/localStorage';
import ThemeToggle from '@/components/ui/ThemeToggle';

const platforms = [
  { id: 'lazada', name: 'Lazada', color: 'bg-blue-600', icon: '🛍️' },
  { id: 'shopee', name: 'Shopee', color: 'bg-orange-600', icon: '🛒' },
  { id: 'tiktok', name: 'TikTok Shop', color: 'bg-gray-900', icon: '🎵' },
  { id: 'amazon', name: 'Amazon', color: 'bg-yellow-600', icon: '📦' },
  { id: 'aliexpress', name: 'AliExpress', color: 'bg-red-600', icon: '🚀' },
];

const trendingKeywords = [
  'iPhone 15', 'Samsung Galaxy', 'AirPods', 'Gaming Chair', 'LED Lights', 'Makeup Set'
];

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-PH').format(num);
};

export default function Header() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  
  // Hide search bar on search page to avoid redundancy
  const isSearchPage = pathname === '/search';

  useEffect(() => {
    const clicks = storage.clickEvents.get();
    const savings = clicks.length * 150;
    setTotalSavings(savings);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      storage.searchHistory.add(searchQuery.trim());
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        ...(selectedPlatform !== 'all' && { platform: selectedPlatform }),
      });
      window.location.href = `/search?${params.toString()}`;
      setShowSuggestions(false);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const selectTrendingKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    setShowSuggestions(false);
  };

  const favoriteCount = storage.userFavorites.get().length;
  const alertCount = storage.priceAlerts.get().filter(alert => alert.isActive).length;

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      {/* Top Bar with Trust Indicators */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-1">
                <span className="animate-pulse">💰</span>
                <span>₱{formatNumber(totalSavings)}+ saved by users</span>
              </span>
              <span className="hidden sm:flex items-center space-x-1">
                <span>🛡️</span>
                <span>100% Secure & Trusted</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden md:flex items-center space-x-1">
                <span>🎯</span>
                <span>Best Price Guaranteed</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Premium Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">🏪</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DealFinder
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Your Smart Shopping Companion</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <nav className="flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/deals" className="text-gray-700 hover:text-orange-600 transition-all duration-200 font-medium relative group">
                🔥 Hot Deals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-purple-600 transition-all duration-200 font-medium relative group">
                Categories
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/favorites" className="text-gray-700 hover:text-pink-600 transition-all duration-200 font-medium relative group flex items-center">
                Wishlist
                {favoriteCount > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full px-2 py-1 animate-bounce">
                    {favoriteCount}
                  </span>
                )}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link 
                href="/alerts" 
                className="relative p-2 text-gray-700 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50 rounded-lg group"
                title="Price Alerts"
              >
                <div className="text-xl">🔔</div>
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse">
                    {alertCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/account" 
                className="p-2 text-gray-700 hover:text-green-600 transition-all duration-200 hover:bg-green-50 rounded-lg"
                title="My Account"
              >
                <div className="text-xl">👤</div>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            <span className="sr-only">Open menu</span>
            <div className="w-6 h-6">
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Enhanced Search Bar - Hidden on search page to avoid redundancy */}
        {!isSearchPage && (
          <div className="pb-6 relative">
            <form onSubmit={handleSearch} className="flex space-x-3">
              <div className="flex-1 relative">
                <div className={`relative transition-all duration-300 ${isSearchFocused ? 'transform scale-105' : ''}`}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder="Search millions of products..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-300 text-lg placeholder-gray-400 shadow-sm"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Search Suggestions */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">🔥 Trending Searches</h4>
                      <div className="flex flex-wrap gap-2">
                        {trendingKeywords.map((keyword) => (
                          <button
                            key={keyword}
                            onClick={() => selectTrendingKeyword(keyword)}
                            className="px-3 py-2 bg-gray-100 hover:bg-blue-100 text-sm text-gray-700 hover:text-blue-700 rounded-full transition-all duration-200 hover:scale-105"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Platform Selector */}
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="hidden sm:block px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-300 font-medium"
              >
                <option value="all">🌟 All Platforms</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>
              
              {/* Search Button */}
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span className="hidden sm:inline">Search</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Platform Toggle Buttons - Mobile */}
            <div className="mt-4 flex space-x-2 overflow-x-auto pb-2 sm:hidden">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                    selectedPlatform === platform.id
                      ? `${platform.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <Link 
              href="/" 
              className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3">🏠</span>
              Home
            </Link>
            <Link 
              href="/deals" 
              className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3">🔥</span>
              Hot Deals
            </Link>
            <Link 
              href="/categories" 
              className="flex items-center px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3">📱</span>
              Categories
            </Link>
            <Link 
              href="/favorites" 
              className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <span className="mr-3">❤️</span>
                Wishlist
              </div>
              {favoriteCount > 0 && (
                <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full px-2 py-1">
                  {favoriteCount}
                </span>
              )}
            </Link>
            <Link 
              href="/alerts" 
              className="flex items-center justify-between px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <span className="mr-3">🔔</span>
                Price Alerts
              </div>
              {alertCount > 0 && (
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full px-2 py-1">
                  {alertCount}
                </span>
              )}
            </Link>
            <Link 
              href="/account" 
              className="flex items-center px-4 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-3">👤</span>
              My Account
            </Link>
            
            {/* Mobile Trust Indicators */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>💰</span>
                  <span className="font-medium">₱{formatNumber(totalSavings)}+ saved</span>
                </span>
                <span className="flex items-center space-x-2">
                  <span>🛡️</span>
                  <span className="font-medium">100% Secure</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
