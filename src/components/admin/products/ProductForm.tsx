'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { 
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Tag,
  DollarSign,
  FileText,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Form, FormField, FormLabel, FormMessage, Select, Checkbox } from '@/components/ui/Form';
import { ProductWithRelations, Category, Tag as TagType } from '@/types/database';
import { ProductStatus } from '@prisma/client';
import { createProductWithImagesSchema, updateProductWithImagesSchema } from '@/lib/validations/product';
import { z } from 'zod';

interface ProductFormProps {
  product?: ProductWithRelations;
  categories: Category[];
  tags: TagType[];
  mode: 'create' | 'edit';
}

type FormData = z.infer<typeof createProductWithImagesSchema>;

interface ImageUpload {
  id?: string;
  file?: File;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
  preview?: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  tags,
  mode
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Form setup
  const schema = mode === 'create' ? createProductWithImagesSchema : updateProductWithImagesSchema;
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product: {
        title: product?.title || '',
        description: product?.description || '',
        shortDescription: product?.shortDescription || '',
        currentPrice: product?.currentPrice || 0,
        originalPrice: product?.originalPrice || undefined,
        currency: product?.currency || 'USD',
        metaTitle: product?.metaTitle || '',
        metaDescription: product?.metaDescription || '',
        slug: product?.slug || '',
        status: product?.status || ProductStatus.DRAFT,
        isActive: product?.isActive ?? true,
        categoryId: product?.categoryId || '',
        publishedAt: product?.publishedAt || undefined,
      },
      images: [],
      tags: []
    }
  });

  // Initialize form data
  useEffect(() => {
    if (product && mode === 'edit') {
      // Set images
      const productImages: ImageUpload[] = product.images.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        order: img.order
      }));
      setImages(productImages);

      // Set tags
      const productTags = product.tags.map(pt => pt.tag.id);
      setSelectedTags(productTags);
      setValue('tags', productTags);
    }
  }, [product, mode, setValue]);

  // Generate slug from title
  const title = watch('product.title');
  useEffect(() => {
    if (title && mode === 'create') {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('product.slug', slug);
    }
  }, [title, mode, setValue]);

  // Image handling
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageUpload = {
          file,
          url: '', // Will be set after upload
          alt: file.name,
          isPrimary: images.length === 0 && index === 0,
          order: images.length + index,
          preview: e.target?.result as string
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first one primary
      if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const updateImageAlt = (index: number, alt: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, alt } : img
    ));
  };

  // Tag handling
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const updated = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      setValue('tags', updated);
      return updated;
    });
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Upload images first
      const uploadedImages = await Promise.all(
        images.map(async (img, index) => {
          if (img.file) {
            // Upload new image
            const formData = new FormData();
            formData.append('file', img.file);
            formData.append('alt', img.alt);
            
            const uploadResponse = await fetch('/api/products/images', {
              method: 'POST',
              body: formData
            });
            
            if (!uploadResponse.ok) {
              throw new Error('Failed to upload image');
            }
            
            const uploadResult = await uploadResponse.json();
            return {
              url: uploadResult.url,
              alt: img.alt,
              isPrimary: img.isPrimary,
              order: index
            };
          } else {
            // Existing image
            return {
              url: img.url,
              alt: img.alt,
              isPrimary: img.isPrimary,
              order: index
            };
          }
        })
      );

      // Submit product data
      const productData = {
        ...data,
        images: uploadedImages,
        tags: selectedTags
      };

      const url = mode === 'create' 
        ? '/api/products'
        : `/api/products/${product!.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      // Redirect to product list or detail
      router.push('/admin/products');
      
    } catch (error) {
      console.error('Failed to save product:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'seo', label: 'SEO', icon: Settings },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const statusOptions = [
    { value: ProductStatus.DRAFT, label: 'Draft' },
    { value: ProductStatus.ACTIVE, label: 'Active' },
    { value: ProductStatus.SCHEDULED, label: 'Scheduled' },
    { value: ProductStatus.INACTIVE, label: 'Inactive' }
  ];

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
              {mode === 'create' ? 'Create Product' : 'Edit Product'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'create' 
                ? 'Add a new product to your catalog'
                : 'Update product information and settings'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {mode === 'edit' && (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/products/${product!.id}`)}
              icon={<Eye className="h-4 w-4" />}
            >
              Preview
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!isDirty}
            icon={<Save className="h-4 w-4" />}
          >
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium transition-colors',
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-500'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Controller
                    name="product.title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Product Title"
                        placeholder="Enter product title"
                        error={errors.product?.title?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="product.slug"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="URL Slug"
                        placeholder="product-url-slug"
                        helperText="This will be used in the product URL"
                        error={errors.product?.slug?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="product.shortDescription"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Short Description"
                        placeholder="Brief product description for listings"
                        rows={3}
                        error={errors.product?.shortDescription?.message}
                      />
                    )}
                  />

                  <Controller
                    name="product.description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Full Description"
                        placeholder="Detailed product description"
                        rows={8}
                        error={errors.product?.description?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name="product.categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Category"
                        options={categoryOptions}
                        placeholder="Select a category"
                        error={errors.product?.categoryId?.message}
                        required
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="product.currentPrice"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          label="Current Price"
                          placeholder="0.00"
                          leftIcon={<DollarSign className="h-4 w-4" />}
                          error={errors.product?.currentPrice?.message}
                          required
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />

                    <Controller
                      name="product.originalPrice"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          label="Original Price"
                          placeholder="0.00"
                          leftIcon={<DollarSign className="h-4 w-4" />}
                          helperText="Leave empty if no discount"
                          error={errors.product?.originalPrice?.message}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      )}
                    />
                  </div>

                  <Controller
                    name="product.currency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Currency"
                        options={[
                          { value: 'USD', label: 'USD - US Dollar' },
                          { value: 'EUR', label: 'EUR - Euro' },
                          { value: 'GBP', label: 'GBP - British Pound' },
                          { value: 'CAD', label: 'CAD - Canadian Dollar' },
                          { value: 'AUD', label: 'AUD - Australian Dollar' }
                        ]}
                        error={errors.product?.currency?.message}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload images
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB each
                      </span>
                    </label>
                  </div>

                  {/* Image List */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className={cn(
                            'relative border-2 rounded-lg overflow-hidden',
                            image.isPrimary 
                              ? 'border-primary-500' 
                              : 'border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                            <img
                              src={image.preview || image.url}
                              alt={image.alt}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Image Controls */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            {!image.isPrimary && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPrimaryImage(index)}
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-primary-500 text-white">
                                Primary
                              </Badge>
                            </div>
                          )}
                          
                          {/* Alt Text Input */}
                          <div className="p-3">
                            <Input
                              value={image.alt}
                              onChange={(e) => updateImageAlt(index, e.target.value)}
                              placeholder="Alt text"
                              size="sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Controller
                    name="product.metaTitle"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Meta Title"
                        placeholder="SEO title for search engines"
                        helperText="Recommended: 50-60 characters"
                        error={errors.product?.metaTitle?.message}
                      />
                    )}
                  />

                  <Controller
                    name="product.metaDescription"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Meta Description"
                        placeholder="SEO description for search engines"
                        rows={3}
                        helperText="Recommended: 150-160 characters"
                        error={errors.product?.metaDescription?.message}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className={cn(
                          'flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors',
                          selectedTags.includes(tag.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center"
                          style={{ 
                            backgroundColor: selectedTags.includes(tag.id) ? tag.color || '#3b82f6' : 'transparent',
                            borderColor: tag.color || '#3b82f6'
                          }}
                        >
                          {selectedTags.includes(tag.id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {tag.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Controller
                    name="product.status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Status"
                        options={statusOptions}
                        error={errors.product?.status?.message}
                      />
                    )}
                  />

                  <Controller
                    name="product.isActive"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        label="Active"
                        description="Whether this product is active and visible"
                      />
                    )}
                  />

                  <Controller
                    name="product.publishedAt"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        label="Publish Date"
                        helperText="Leave empty to publish immediately"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
};