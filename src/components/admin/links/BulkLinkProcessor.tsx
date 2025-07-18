'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLinkManagement } from '@/hooks/useLinkManagement'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  BarChart3,
  Link
} from 'lucide-react'

const bulkProcessSchema = z.object({
  urls: z.string().min(1, 'Please enter at least one URL'),
  extractProductInfo: z.boolean().default(true),
  validateLink: z.boolean().default(true),
  createShortUrl: z.boolean().default(true),
  customDomain: z.string().url().optional().or(z.literal('')),
  batchSize: z.number().min(1).max(20).default(10),
  autoCreateProduct: z.boolean().default(false),
  categoryId: z.string().optional(),
})

type BulkProcessForm = z.infer<typeof bulkProcessSchema>

interface BulkLinkProcessorProps {
  categories?: Array<{ id: string; name: string }>
  onProcessingComplete?: (results: any) => void
}

export function BulkLinkProcessor({ categories = [], onProcessingComplete }: BulkLinkProcessorProps) {
  const [results, setResults] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const { bulkProcessLinks, isProcessing } = useLinkManagement()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BulkProcessForm>({
    resolver: zodResolver(bulkProcessSchema),
    defaultValues: {
      extractProductInfo: true,
      validateLink: true,
      createShortUrl: true,
      batchSize: 10,
      autoCreateProduct: false,
    }
  })

  const watchedAutoCreate = watch('autoCreateProduct')
  const watchedUrls = watch('urls')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        
        // Extract URLs from file content
        const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi
        const urls = content.match(urlPattern) || []
        
        setValue('urls', urls.join('\n'))
      }
      reader.readAsText(file)
    }
  }

  const onSubmit = async (data: BulkProcessForm) => {
    const urls = data.urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      return
    }

    const processResults = await bulkProcessLinks({
      urls,
      extractProductInfo: data.extractProductInfo,
      validateLink: data.validateLink,
      createShortUrl: data.createShortUrl,
      customDomain: data.customDomain || undefined,
      batchSize: data.batchSize,
      autoCreateProduct: data.autoCreateProduct,
      categoryId: data.categoryId || undefined,
    })

    if (processResults) {
      setResults(processResults)
      onProcessingComplete?.(processResults)
    }
  }

  const downloadResults = () => {
    if (!results) return

    const csvContent = [
      ['URL', 'Status', 'Platform', 'Title', 'Price', 'Shortened URL', 'Error'].join(','),
      ...results.results.map((result: any) => [
        result.originalUrl,
        result.error ? 'Failed' : 'Success',
        result.platformDetection?.platform || 'Unknown',
        result.productInfo?.title || '',
        result.productInfo?.price ? `${result.productInfo.price.currency} ${result.productInfo.price.current}` : '',
        result.shortenedUrl || '',
        result.error || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-link-processing-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getUrlCount = () => {
    if (!watchedUrls) return 0
    return watchedUrls.split('\n').filter(url => url.trim().length > 0).length
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

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bulk Link Processing</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload File (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".txt,.csv,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </label>
              {selectedFile && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a text file containing URLs (one per line) or paste them below
            </p>
          </div>

          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                URLs (one per line) *
              </label>
              <Badge variant="outline">
                {getUrlCount()} URLs
              </Badge>
            </div>
            <textarea
              {...register('urls')}
              rows={8}
              placeholder="https://amazon.com/dp/B123456789&#10;https://shopee.com/product/123&#10;https://lazada.com/products/456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.urls && (
              <p className="text-sm text-red-600 mt-1">{errors.urls.message}</p>
            )}
          </div>

          {/* Processing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Processing Options</h4>
              
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
                <span className="text-sm">Create shortened URLs</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('autoCreateProduct')}
                  className="rounded"
                />
                <span className="text-sm">Auto-create products</span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Domain (Optional)
                </label>
                <input
                  type="url"
                  {...register('customDomain')}
                  placeholder="https://your-domain.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.customDomain && (
                  <p className="text-sm text-red-600 mt-1">{errors.customDomain.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  {...register('batchSize', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of URLs to process simultaneously
                </p>
              </div>

              {watchedAutoCreate && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category for new products *
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
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isProcessing || getUrlCount() === 0}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing {getUrlCount()} URLs...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Process {getUrlCount()} URLs
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Results */}
      {results && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Processing Results</h3>
            <Button onClick={downloadResults} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
              <div className="text-sm text-blue-800">Total URLs</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(results.summary.platforms).length}
              </div>
              <div className="text-sm text-purple-800">Platforms</div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Platform Breakdown</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(results.summary.platforms).map(([platform, count]) => (
                <Badge key={platform} className={getPlatformBadgeColor(platform)}>
                  {platform}: {count as number}
                </Badge>
              ))}
            </div>
          </div>

          {/* Detailed Results */}
          <div>
            <h4 className="font-medium mb-3">Detailed Results</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.results.map((result: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {result.error ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className="font-medium text-sm">
                          {result.error ? 'Failed' : 'Success'}
                        </span>
                        {result.platformDetection && (
                          <Badge className={getPlatformBadgeColor(result.platformDetection.platform)}>
                            {result.platformDetection.platform}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.originalUrl}
                      </div>
                    </div>
                    {result.shortenedUrl && (
                      <a
                        href={result.shortenedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {result.error}
                    </div>
                  )}

                  {result.productInfo && (
                    <div className="text-sm space-y-1">
                      {result.productInfo.title && (
                        <div><strong>Title:</strong> {result.productInfo.title}</div>
                      )}
                      {result.productInfo.price && (
                        <div>
                          <strong>Price:</strong> {result.productInfo.price.currency} {result.productInfo.price.current}
                          {result.productInfo.price.original && (
                            <span className="text-gray-500 line-through ml-2">
                              {result.productInfo.price.original}
                            </span>
                          )}
                        </div>
                      )}
                      {result.productInfo.brand && (
                        <div><strong>Brand:</strong> {result.productInfo.brand}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}