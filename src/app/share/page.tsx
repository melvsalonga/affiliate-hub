'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { TouchButton } from '@/components/mobile/TouchInteractions'
import { Share2, Link, Copy, Check, X } from 'lucide-react'
import { offlineDataManager } from '@/lib/offline/sync-manager'

export default function SharePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [shareData, setShareData] = useState<{
    title?: string
    text?: string
    url?: string
  }>({})
  const [copied, setCopied] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Get share data from URL parameters
    const title = searchParams.get('title')
    const text = searchParams.get('text')
    const url = searchParams.get('url')

    setShareData({
      title: title || undefined,
      text: text || undefined,
      url: url || undefined
    })
  }, [searchParams])

  const handleCopyLink = async () => {
    if (!shareData.url) return

    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleAddToProducts = async () => {
    if (!shareData.url) return

    setIsProcessing(true)
    try {
      // Queue the URL for processing as a new product
      offlineDataManager.queueAction('process-shared-url', {
        url: shareData.url,
        title: shareData.title,
        description: shareData.text,
        timestamp: Date.now()
      })

      // Redirect to products page
      router.push('/admin/products?shared=true')
    } catch (error) {
      console.error('Failed to process shared URL:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearchProducts = () => {
    const query = shareData.title || shareData.text || ''
    router.push(`/products?q=${encodeURIComponent(query)}`)
  }

  const handleClose = () => {
    router.push('/')
  }

  return (
    <Container className="py-8 max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 dark:bg-blue-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Shared Content</h1>
          <p className="text-blue-100">
            Content shared with LinkVault Pro
          </p>
        </div>

        <div className="p-6">
          {/* Shared Content */}
          <div className="space-y-4 mb-6">
            {shareData.title && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {shareData.title}
                </p>
              </div>
            )}

            {shareData.text && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {shareData.text}
                </p>
              </div>
            )}

            {shareData.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-900 dark:text-gray-100 text-sm break-all">
                      {shareData.url}
                    </p>
                  </div>
                  <TouchButton
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </TouchButton>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {shareData.url && (
              <TouchButton
                onClick={handleAddToProducts}
                disabled={isProcessing}
                className="w-full"
              >
                <Link className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Add as Product'}
              </TouchButton>
            )}

            {(shareData.title || shareData.text) && (
              <TouchButton
                variant="outline"
                onClick={handleSearchProducts}
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Search Similar Products
              </TouchButton>
            )}

            <TouchButton
              variant="ghost"
              onClick={handleClose}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </TouchButton>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              💡 <strong>Tip:</strong> You can share product URLs, deals, or any content 
              with LinkVault Pro to quickly add them to your affiliate product collection.
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}