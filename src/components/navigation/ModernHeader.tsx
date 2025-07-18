'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Menu, X, ShoppingBag, Heart, Bell, User, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { brandConfig } from '@/config/brand';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { storage } from '@/utils/localStorage';

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

export default function ModernHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const pathname = usePathname();

  const isSearchPage = pathname === '/search';

  useEffect(() => {
    const clicks = storage.clickEvents.get();
    const savings = clicks.length * 150;
    setTotalSavings(savings);
    setFavoriteCount(storage.userFavorites.get().length);
    setAlertCount(storage.priceAlerts.get().filter(alert => alert.isActive).length);
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

  const selectTrendingKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    setShowSuggestions(false);
  };

  const navigationItems = [
    { href: '/', label: 'Home', icon: '🏠' as const },
    { href: '/categories', label: 'Categories', icon: '📱' as const },
    { href: '/favorites', label: 'Favorites', icon: Heart, count: favoriteCount },
    { href: '/alerts', label: 'Alerts', icon: Bell, count: alertCount },
    { href: '/admin', label: 'Admin', icon: '⚙️' as const },
  ];

  return (
    <>
      {/* Trust Bar */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>₱{new Intl.NumberFormat('en-PH').format(totalSavings)}+ saved by users</span>
              </span>
              <span className="hidden sm:flex items-center space-x-2">
                <span>🛡️</span>
                <span>100% Secure & Trusted</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <span>🎯</span>
              <span>Best Price Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-warning-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  {brandConfig.name}
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  {brandConfig.tagline}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = typeof item.icon === 'string' ? null : item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                      "text-foreground/80 hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <span>{item.icon}</span>}
                    <span className="hidden xl:inline">{item.label}</span>
                    {item.count && item.count > 0 && (
                      <span className="ml-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs rounded-full px-2 py-1 animate-bounce">
                        {item.count}
                      </span>
                    )}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <User className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 lg:hidden">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="h-9 w-9 p-0"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Enhanced Search Bar - Hidden on search page */}
          {!isSearchPage && (
            <div className="pb-6 relative">
              <form onSubmit={handleSearch} className="flex space-x-3">
                <div className="flex-1 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Search millions of products..."
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border-2 border-input bg-background",
                        "focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500",
                        "placeholder:text-muted-foreground transition-all duration-300 text-lg shadow-sm"
                      )}
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-2xl border border-border z-50 overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h4 className="text-sm font-semibold text-card-foreground mb-3 flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>Trending Searches</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {trendingKeywords.map((keyword) => (
                            <button
                              key={keyword}
                              onClick={() => selectTrendingKeyword(keyword)}
                              className="px-3 py-2 bg-muted hover:bg-accent text-sm text-muted-foreground hover:text-foreground rounded-full transition-all duration-200 hover:scale-105"
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
                  className="hidden sm:block px-4 py-4 bg-background border-2 border-input rounded-2xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-300 font-medium"
                >
                  <option value="all">🌟 All Platforms</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.icon} {platform.name}
                    </option>
                  ))}
                </select>
                
                {/* Search Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <span className="hidden sm:inline">Search</span>
                  <Search className="h-5 w-5" />
                </Button>
              </form>

              {/* Platform Toggle Buttons - Mobile */}
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-2 sm:hidden">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1",
                      selectedPlatform === platform.id
                        ? "bg-primary-500 text-white shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <span>{platform.icon}</span>
                    <span>{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-card border-t border-border shadow-lg animate-fade-in-up">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = typeof item.icon === 'string' ? null : item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                      "text-card-foreground hover:bg-accent"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="text-lg">{item.icon}</span>}
                      <span>{item.label}</span>
                    </div>
                    {item.count && item.count > 0 && (
                      <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs rounded-full px-2 py-1">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              {/* Mobile Trust Indicators */}
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">₱{new Intl.NumberFormat('en-PH').format(totalSavings)}+ saved</span>
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
    </>
  );
}