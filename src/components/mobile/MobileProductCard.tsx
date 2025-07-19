'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Share2, ShoppingCart, ExternalLink, Star, TrendingUp } from 'lucide-react'
import { SwipeableCard, TouchButton } from './TouchInteractions'
import { useLongPress } from '@/hooks/useSwipeGesture'
import { cn } from '@/lib/utils'
import { offlineDataManager } from '@/lib/offline/sync-manager'

interface MobileProductCardProps {
  product: {
    id: string
    title: string
    description?: string
    currentPrice: number
    originalPrice?: number
    currency: string
    images: Array<{ url: string; alt: string }>
    category?: { name: string }
    tags?: Array<{ name: string }>
    affiliateLinks: Array<{
      platform: string
      url: string
      isActive: boolean
    }>
    analytics?: {
      clicks: number
      conversions: number
      rating?: number
    }
  }
  variant?: 'grid' | 'list' | 'featured'
  showAnalytics?: boolean
  onAddToWishlist?: (productId: string) => void
  onShare?: (product: any) => void
  onQuickView?: (product: any) => void
  className?: string
}

export function MobileProductCard({
  product,
  variant = 'grid',
  showAnalytics = false,
  onAddToWishlist,
  onShare,
  onQuickView,
  className
}: MobileProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)
    : 0

  const primaryImage = product.images?.[0]
  const activeAffiliateLink = product.affiliateLinks?.find(link => link.isActive)

  // Long press for quick actions
  const longPressHandlers = useLongPress(
    () => {
      if (onQuickView) {
        onQuickView(product)
      }
    },
    { threshold: 500 }
  )

  const handleAddToWishlist = async () => {
    setIsWishlisted(!isWishlisted)
    
    if (onAddToWishlist) {
      onAddToWishlist(product.id)
    }

    // Queue for offline sync
    offlineDataManager.queueAction('wishlist', {
      action: isWishlisted ? 'remove' : 'add',
      productId: product.id
    })

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this deal: ${product.title}`,
          url: `/products/${product.id}`
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else if (onShare) {
      onShare(product)
    }
  }

  const handleAffiliateClick = () => {
    // Track click for analytics
    offlineDataManager.queueAction('analytics', {
      type: 'click',
      productId: product.id,
      timestamp: Date.now(),
      source: 'mobile-card'
    })

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }

  if (variant === 'list') {
    return (
      <SwipeableCard
        className={cn('mb-3', className)}
        onSwipeLeft={() => handleAddToWishlist()}
        onSwipeRight={() => handleShare()}
        leftAction={{
          icon: <Share2 className="w-5 h-5" />,
          label: 'Share',
          color: 'bg-blue-500'
        }}
        rightAction={{
          icon: <Heart className="w-5 h-5" />,
          label: 'Save',
          color: 'bg-red-500'
        }}
      >
        <div className="flex p-4 space-x-4" {...longPressHandlers.handlers}>
          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            {primaryImage && (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt}
                fill
                className={cn(
                  'object-cover rounded-lg transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                sizes="80px"
              />
            )}
            {!imageLoaded && (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            )}
            {discount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                -{discount}%
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/products/${product.id}`} className="block">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm mb-1">
                {product.title}
              </h3>
              {product.category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {product.category.name}
                </p>
              )}
            </Link>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {product.currency}{product.currentPrice}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-500 line-through">
                    {product.currency}{product.originalPrice}
                  </span>
                )}
              </div>

              {showAnalytics && product.analytics && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{product.analytics.clicks} clicks</span>
                  {product.analytics.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.analytics.rating}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <TouchButton
              size="sm"
              variant="ghost"
              onClick={handleAddToWishlist}
              className="p-2"
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-red-500 text-red-500')} />
            </TouchButton>
            
            {activeAffiliateLink && (
              <TouchButton
                size="sm"
                variant="ghost"
                asChild
                onClick={handleAffiliateClick}
                className="p-2"
              >
                <a href={activeAffiliateLink.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </TouchButton>
            )}
          </div>
        </div>
      </SwipeableCard>
    )
  }

  if (variant === 'featured') {
    return (
      <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white', className)}>
        <div className="absolute inset-0 bg-black/20" />
        
        {primaryImage && (
          <div className="absolute inset-0">
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        <div className="relative p-6" {...longPressHandlers.handlers}>
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}% OFF
            </div>
          )}

          <div className="mb-4">
            {product.category && (
              <p className="text-white/80 text-sm mb-2">{product.category.name}</p>
            )}
            <Link href={`/products/${product.id}`}>
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{product.title}</h3>
            </Link>
            {product.description && (
              <p className="text-white/90 text-sm line-clamp-2 mb-4">{product.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                {product.currency}{product.currentPrice}
              </span>
              {product.originalPrice && (
                <span className="text-white/70 line-through">
                  {product.currency}{product.originalPrice}
                </span>
              )}
            </div>

            {showAnalytics && product.analytics && (
              <div className="flex items-center space-x-2 text-white/80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{product.analytics.clicks} clicks</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            {activeAffiliateLink && (
              <TouchButton
                className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                onClick={handleAffiliateClick}
                asChild
              >
                <a href={activeAffiliateLink.url} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Shop Now
                </a>
              </TouchButton>
            )}
            
            <TouchButton
              variant="outline"
              onClick={handleAddToWishlist}
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
            </TouchButton>
            
            <TouchButton
              variant="outline"
              onClick={handleShare}
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              <Share2 className="w-4 h-4" />
            </TouchButton>
          </div>
        </div>
      </div>
    )
  }

  // Default grid variant
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      <div className="relative" {...longPressHandlers.handlers}>
        {/* Image */}
        <div className="relative aspect-square">
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          )}
          {!imageLoaded && (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              -{discount}%
            </div>
          )}

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col space-y-2">
            <TouchButton
              size="sm"
              variant="ghost"
              onClick={handleAddToWishlist}
              className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm"
            >
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-red-500 text-red-500')} />
            </TouchButton>
            
            <TouchButton
              size="sm"
              variant="ghost"
              onClick={handleShare}
              className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm"
            >
              <Share2 className="w-4 h-4" />
            </TouchButton>
          </div>

          {/* Rating */}
          {product.analytics?.rating && (
            <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.analytics.rating}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm mb-2">
              {product.title}
            </h3>
          </Link>

          {product.category && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {product.category.name}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {product.currency}{product.currentPrice}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-500 line-through">
                  {product.currency}{product.originalPrice}
                </span>
              )}
            </div>

            {showAnalytics && product.analytics && (
              <div className="text-xs text-gray-500">
                {product.analytics.clicks} clicks
              </div>
            )}
          </div>

          {/* CTA Button */}
          {activeAffiliateLink && (
            <TouchButton
              size="sm"
              className="w-full"
              onClick={handleAffiliateClick}
              asChild
            >
              <a href={activeAffiliateLink.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Deal
              </a>
            </TouchButton>
          )}
        </div>
      </div>
    </div>
  )
}