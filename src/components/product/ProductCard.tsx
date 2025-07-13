import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { storage } from '@/utils/localStorage';

interface ProductCardProps {
  product: Product;
  showPlatform?: boolean;
  showDescription?: boolean;
  className?: string;
  onFavoriteRemove?: () => void;
}

export default function ProductCard({
  product,
  showPlatform = true,
  showDescription = false,
  className = '',
  onFavoriteRemove
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    setIsFavorite(storage.userFavorites.isFavorite(product.id));
    setHasAlert(storage.priceAlerts.hasAlert(product.id));
  }, [product.id]);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      storage.userFavorites.remove(product.id);
      if (onFavoriteRemove) {
        onFavoriteRemove();
      }
    } else {
      storage.userFavorites.add(product.id);
    }
    setIsFavorite(!isFavorite);
  };

  const handleAlertToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasAlert) {
      storage.priceAlerts.remove(product.id);
    } else {
      storage.priceAlerts.add(product.id, product.price * 0.9); // 10% discount alert
    }
    setHasAlert(!hasAlert);
  };

  const handleProductClick = () => {
    storage.recentProducts.add(product.id);
    storage.clickEvents.add(product.id, product.platform.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );
    }
    return product.discount || 0;
  };

  const getPlatformColor = (platformId: string) => {
    const colors = {
      lazada: 'bg-blue-600',
      shopee: 'bg-orange-600',
      tiktok: 'bg-gray-900',
      amazon: 'bg-yellow-600',
      aliexpress: 'bg-red-600',
    };
    return colors[platformId as keyof typeof colors] || 'bg-gray-600';
  };

  const discount = calculateDiscount();

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="relative">
        <Link href={`/product/${product.id}`} onClick={handleProductClick}>
          <div className="relative w-full h-48 bg-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>

        {showPlatform && (
          <div
            className={`absolute top-2 left-2 ${getPlatformColor(
              product.platform.id
            )} text-white px-2 py-1 text-xs font-medium rounded`}
          >
            {product.platform.displayName}
          </div>
        )}

        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
            -{discount}%
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex space-x-1">
          <button
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-full shadow-md transition-colors ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            ❤️
          </button>
          <button
            onClick={handleAlertToggle}
            className={`p-2 rounded-full shadow-md transition-colors ${
              hasAlert
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            title={hasAlert ? 'Remove price alert' : 'Set price alert'}
          >
            🔔
          </button>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/product/${product.id}`} onClick={handleProductClick}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {showDescription && product.description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {product.rating && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ⭐
                </span>
              ))}
              <span className="ml-1 text-sm text-gray-600">
                {product.rating.toFixed(1)}
              </span>
            </div>
            {product.reviewCount && (
              <span className="ml-2 text-xs text-gray-500">
                ({product.reviewCount} reviews)
              </span>
            )}
          </div>
        )}

        {product.shippingInfo && (
          <div className="mt-2 text-xs text-gray-600">
            {product.shippingInfo.cost === 0 ? (
              <span className="text-green-600 font-medium">Free Shipping</span>
            ) : (
              <span>Shipping: {formatPrice(product.shippingInfo.cost)}</span>
            )}
            {product.shippingInfo.estimatedDays && (
              <span className="ml-2">• {product.shippingInfo.estimatedDays} days</span>
            )}
          </div>
        )}

        {product.location && (
          <div className="mt-1 text-xs text-gray-500">📍 {product.location}</div>
        )}

        <div className="mt-3">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              storage.clickEvents.add(product.id, product.platform.id)
            }
            className={`w-full ${getPlatformColor(product.platform.id)} text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center`}
          >
            View on {product.platform.displayName}
            <span className="ml-1">🔗</span>
          </a>
        </div>

        {!product.isAvailable && (
          <div className="mt-2 text-center">
            <span className="text-red-600 text-xs font-medium">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
