'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLinkManagement } from '@/hooks/useLinkManagement'
import { ExternalLink, Link, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

const linkProcessorSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  extractProductInfo: z.boolean().default(true),
  validateLink: z.boolean().default(true),
  createShortUrl: z.boolean().default(true),
  autoCreateProduct: z.boolean().default(false),
  customDomain: z.string().url().optional().or(z.literal('')),
})

type LinkProcessorForm = z.infer<typeof linkProcessorSchema>

interface LinkProcessorProps {
  categories?: Array<{ id: string; name: string }>
  products?: Array<{ id: string; title: string }>
  onLinkProcessed?: (result: any) => void
}

export function LinkProcessor({ categories = [], products = [], onLinkProcessed }: LinkProcessorProps) {
  const [result, setResult] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const { processLink, analyzeUrl, isProcessing } = useLinkManagement()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<LinkProcessorForm>({
    resolver: zodResolver(linkProcessorSchema),
    defaultValues: {
      extractProductInfo: true,
      validateLink: true,
      createShortUrl: true,
      autoCreateProduct: false,
    }
  })

  const watchedUrl = watch('url')
  const watchedAutoCreate = watch('autoCreateProduct')

  const handleAnalyzeUrl = async () => {
    if (!watchedUrl) return

    const analysisResult = await analyzeUrl(watchedUrl)
    if (analysisResult) {
      setAnalysis(analysisResult)
    }
  }

  const onSubmit = async (data: LinkProcessorForm) => {
    const processResult = await processLink({
      ...data,
      customDomain: data.customDomain || undefined,
      productId: data.productId || undefined,
      categoryId: data.categoryId || undefined,
    })

    if (processResult) {
      setResult(processResult)
      onLinkProcessed?.(processResult)
    }
  }

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      amazon: 'bg-orange-100 text-orange-800',
      shopee: 'bg-red-100 text-red-800',
      lazada: 'bg-blue-100 text-blue-800',
      aliexpress: 'bg-yellow-100 text-yellow-800',
      ebay: 'bg-green-100 text-green-800',
      unknown: 'bg-gray-100 text-gray-800',
    }
    return colors[platform] || colors.unknown
  }

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Process Affiliate Link</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Affiliate URL *
            </label>
            <div className="flex gap-2">
              <Input
                {...register('url')}
                placeholder="https://amazon.com/dp/B123456789?tag=your-tag"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeUrl}
                disabled={!watchedUrl || isProcessing}
              >
                Analyze
              </Button>
            </div>
            {errors.url && (
              <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
            )}
          </div>

          {analysis && (
            <Card className="p-4 bg-blue-50">
              <h4 className="font-medium mb-2">URL Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>Platform:</span>
                  <Badge className={getPlatformBadgeColor(analysis.platformDetection.platform)}>
                    {analysis.platformDetection.platform}
                  </Badge>
                  {analysis.platformDetection.isAffiliate && (
                    <Badge className="bg-green-100 text-green-800">Affiliate Link</Badge>
                  )}
                </div>
                {analysis.validation && (
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    {getValidationIcon(analysis.validation.isValid)}
                    <span className={analysis.validation.isValid ? 'text-green-600' : 'text-red-600'}>
                      {analysis.validation.isValid ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="text-gray-500">
                      ({analysis.validation.responseTime}ms)
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Existing Product (Optional)
              </label>
              <select
                {...register('productId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Domain (Optional)
              </label>
              <Input
                {...register('customDomain')}
                placeholder="https://your-domain.com"
              />
              {errors.customDomain && (
                <p className="text-sm text-red-600 mt-1">{errors.customDomain.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('extractProductInfo')}
                className="rounded"
              />
              <span className="text-sm">Extract product information</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('validateLink')}
                className="rounded"
              />
              <span className="text-sm">Validate link accessibility</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('createShortUrl')}
                className="rounded"
              />
              <span className="text-sm">Create shortened URL</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('autoCreateProduct')}
                className="rounded"
              />
              <span className="text-sm">Auto-create product from extracted info</span>
            </label>

            {watchedAutoCreate && (
              <div className="ml-6">
                <label className="block text-sm font-medium mb-2">
                  Category for new product *
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Link'
            )}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Processing Results</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Platform Detection</h4>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getPlatformBadgeColor(result.platformDetection.platform)}>
                  {result.platformDetection.platform}
                </Badge>
                <span className="text-sm text-gray-600">
                  Confidence: {Math.round(result.platformDetection.confidence * 100)}%
                </span>
              </div>
            </div>

            {result.validation && (
              <div>
                <h4 className="font-medium mb-2">Link Validation</h4>
                <div className="flex items-center gap-2">
                  {getValidationIcon(result.validation.isValid)}
                  <span className={result.validation.isValid ? 'text-green-600' : 'text-red-600'}>
                    {result.validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                  <span className="text-gray-500">
                    (HTTP {result.validation.status}, {result.validation.responseTime}ms)
                  </span>
                </div>
              </div>
            )}

            {result.shortenedUrl && (
              <div>
                <h4 className="font-medium mb-2">Shortened URL</h4>
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-blue-500" />
                  <a
                    href={result.shortenedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {result.shortenedUrl}
                  </a>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            )}

            {result.productInfo && (
              <div>
                <h4 className="font-medium mb-2">Extracted Product Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {result.productInfo.title && (
                    <div>
                      <span className="font-medium">Title:</span> {result.productInfo.title}
                    </div>
                  )}
                  {result.productInfo.price && (
                    <div>
                      <span className="font-medium">Price:</span> {result.productInfo.price.currency} {result.productInfo.price.current}
                      {result.productInfo.price.original && (
                        <span className="text-gray-500 line-through ml-2">
                          {result.productInfo.price.original}
                        </span>
                      )}
                    </div>
                  )}
                  {result.productInfo.brand && (
                    <div>
                      <span className="font-medium">Brand:</span> {result.productInfo.brand}
                    </div>
                  )}
                  {result.productInfo.rating && (
                    <div>
                      <span className="font-medium">Rating:</span> {result.productInfo.rating}/5
                      {result.productInfo.reviewCount && (
                        <span className="text-gray-500 ml-1">
                          ({result.productInfo.reviewCount} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.affiliateLink && (
              <div>
                <h4 className="font-medium mb-2">Created Affiliate Link</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span>Affiliate link created successfully!</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    Link ID: {result.affiliateLink.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}