'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Edit,
  Share2,
  ExternalLink,
  Calendar,
  DollarSign,
  Tag,
  Eye,
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductWithRelations } from '@/types/database';
import { ProductStatus } from '@prisma/client';

interface ProductPreviewProps {
  product: ProductWithRelations;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({ product }) => {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.currentPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice! - product.currentPrice) / product.originalPrice!) * 100)
    : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const getStatusBadge = (status: ProductStatus, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Scheduled</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Product Preview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Preview how your product will appear to customers
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<Share2 className="h-4 w-4" />}
          >
            Share
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
            icon={<Edit className="h-4 w-4" />}
          >
            Edit
          </Button>
          
          <Button
            onClick={() => window.open(`/products/${product.slug}`, '_blank')}
            icon={<ExternalLink className="h-4 w-4" />}
          >
            View Live
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {(product.status !== 'ACTIVE' || !product.isActive) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Preview Mode
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This product is not live. Status: {getStatusBadge(product.status, product.isActive)}
                  </p>
                </div>
              </div>
              
              {product.status === 'DRAFT' && (
                <Button size="sm" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                  Publish Product
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group">
            {product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]?.url || primaryImage?.url}
                  alt={product.images[currentImageIndex]?.alt || primaryImage?.alt}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                {/* Zoom Button */}
                <button
                  onClick={() => setImageModalOpen(true)}
                  className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                
                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white">
                      -{discountPercentage}%
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No images available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-colors',
                    currentImageIndex === index
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Category */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">{product.category.name}</Badge>
              {getStatusBadge(product.status, product.isActive)}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.title}
            </h1>
            {product.shortDescription && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${product.currentPrice}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {hasDiscount && (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  Save ${(product.originalPrice! - product.currentPrice).toFixed(2)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Currency: {product.currency}
            </p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((productTag) => (
                  <Badge
                    key={productTag.tag.id}
                    variant="outline"
                    style={{ 
                      borderColor: productTag.tag.color || '#3b82f6',
                      color: productTag.tag.color || '#3b82f6'
                    }}
                  >
                    {productTag.tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button className="flex-1" size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                View Deals
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Affiliate Links */}
            {product.affiliateLinks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Available at:
                </h4>
                {product.affiliateLinks.slice(0, 3).map((link) => (
                  <Button
                    key={link.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(link.shortenedUrl || link.originalUrl, '_blank')}
                  >
                    <span>{link.platform.name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Preview */}
          {product.analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {product.analytics.views || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {product.analytics.clicks || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Clicks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {product.analytics.conversions || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Conversions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {product.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {product.publishedAt && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Published</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(product.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Slug</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    /{product.slug}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {imageModalOpen && product.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={product.images[currentImageIndex]?.url}
              alt={product.images[currentImageIndex]?.alt}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
            
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};