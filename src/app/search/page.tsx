'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import Loading from '@/components/ui/Loading';
import { mockProducts } from '@/data/mockProducts';
import { Product } from '@/types/product';
import { storage } from '@/utils/localStorage';

const platforms = [
  { id: 'all', name: 'All Platforms' },
  { id: 'lazada', name: 'Lazada' },
  { id: 'shopee', name: 'Shopee' },
  { id: 'tiktok', name: 'TikTok Shop' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'aliexpress', name: 'AliExpress' },
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');

  useEffect(() => {
    const query = searchParams.get('q') || '';
    const platform = searchParams.get('platform') || 'all';
    
    setSearchQuery(query);
    setSelectedPlatform(platform);
    
    // Save search to history
    if (query) {
      storage.searchHistory.add(query);
    }
    
    // Simulate API call
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, [searchParams]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by platform
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(product => product.platform.id === selectedPlatform);
    }

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
      case 'newest':
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedPlatform, selectedSort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('q', searchQuery);
    if (selectedPlatform !== 'all') {
      params.set('platform', selectedPlatform);
    }
    window.history.pushState({}, '', `/search?${params.toString()}`);
  };

  if (loading) {
    return <Loading message="Searching products..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>

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
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Results Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or try a different platform
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading message="Loading search..." />}>
      <SearchContent />
    </Suspense>
  );
}
