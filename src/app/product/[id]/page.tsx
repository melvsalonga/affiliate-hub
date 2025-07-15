'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';
import Loading from '@/components/ui/Loading';
import { productUtils } from '@/utils/productUtils';
import { Product } from '@/types/product';
import { storage } from '@/utils/localStorage';
import { cacheService } from '@/services/cacheService';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const productId = params.id as string;
    
    // Simulate API call
    setTimeout(() => {
      const foundProduct = productUtils.getProductById(productId);
      if (foundProduct) {
        setProduct(foundProduct);
        
        // Add to recent products
        storage.recentProducts.add(foundProduct.id);
        
        // Check if favorited
        setIsFavorite(storage.userFavorites.isFavorite(foundProduct.id));
        
        // Check if has price alert
        setHasAlert(storage.priceAlerts.hasAlert(foundProduct.id));
        
        // Get related products (same category, different products)
        const related = productUtils.getAllProducts()
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleFavoriteToggle = () => {
    if (!product) return;
    
    if (isFavorite) {
      storage.userFavorites.remove(product.id);
      setIsFavorite(false);
    } else {
      storage.userFavorites.add(product.id);
      setIsFavorite(true);
    }
  };

  const handlePriceAlert = () => {
    if (!product) return;
    
    if (hasAlert) {
      storage.priceAlerts.remove(product.id);
      setHasAlert(false);
    } else {
      // Set alert for 10% below current price
      const targetPrice = Math.round(product.price * 0.9);
      storage.priceAlerts.add(product.id, targetPrice);
      setHasAlert(true);
    }
  };

  const handleBuyClick = () => {
    if (!product) return;
    
    // Track click event
    storage.clickEvents.add(product.id, product.platform.id);
    
    // Open affiliate link
    window.open(product.affiliateUrl, '_blank');
  };

  if (loading) {
    return <Loading message="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const images = [product.imageUrl]; // In real app, product would have multiple images
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;
  const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>→</span>
          <Link href={`/category/${product.category}`} className="hover:text-blue-600 capitalize">
            {product.category}
          </Link>
          <span>→</span>
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {product.discount && product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                  -{product.discount}%
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Platform Badge */}
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {product.platform.displayName}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500 capitalize">{product.category}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="text-lg font-medium text-gray-900">{product.rating?.toFixed(1)}</span>
              <span className="text-gray-500">({product.reviewCount?.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold text-gray-900">
                  ₱{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-500 line-through">
                    ₱{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <div className="flex items-center space-x-4">
                  <span className="text-green-600 font-medium">
                    You save ₱{savings.toLocaleString()} ({discountPercent}%)
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">Brand:</span>
                <span className="ml-2 text-sm text-gray-900">{product.brand}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-sm text-gray-900">{product.location}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Shipping:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {product.shippingInfo.cost === 0 ? 'Free' : `₱${product.shippingInfo.cost}`}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Delivery:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {product.shippingInfo.estimatedDays} days
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleBuyClick}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                🛍️ Buy Now on {product.platform.displayName}
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleFavoriteToggle}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isFavorite
                      ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                </button>
                
                <button
                  onClick={handlePriceAlert}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    hasAlert
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {hasAlert ? '🔔 Alert Set' : '⏰ Price Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
