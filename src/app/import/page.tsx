'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { TouchButton } from '@/components/mobile/TouchInteractions'
import { Upload, FileText, Download, Check, AlertCircle, X } from 'lucide-react'
import { offlineDataManager } from '@/lib/offline/sync-manager'

export default function ImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    processed?: number
    errors?: string[]
  } | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const validTypes = ['text/csv', 'application/json']
    if (!validTypes.includes(file.type)) {
      setImportResult({
        success: false,
        message: 'Please select a CSV or JSON file'
      })
      return
    }

    setSelectedFile(file)
    setImportResult(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const processFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          
          if (file.type === 'application/json') {
            const data = JSON.parse(content)
            resolve(Array.isArray(data) ? data : [data])
          } else if (file.type === 'text/csv') {
            // Simple CSV parsing (for production, use a proper CSV parser)
            const lines = content.split('\n')
            const headers = lines[0].split(',').map(h => h.trim())
            const data = lines.slice(1)
              .filter(line => line.trim())
              .map(line => {
                const values = line.split(',').map(v => v.trim())
                const obj: any = {}
                headers.forEach((header, index) => {
                  obj[header] = values[index] || ''
                })
                return obj
              })
            resolve(data)
          } else {
            reject(new Error('Unsupported file type'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      const data = await processFile(selectedFile)
      
      if (data.length === 0) {
        setImportResult({
          success: false,
          message: 'No data found in the file'
        })
        return
      }

      // Queue import data for processing
      offlineDataManager.queueAction('bulk-import', {
        data,
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        timestamp: Date.now()
      })

      setImportResult({
        success: true,
        message: `Successfully queued ${data.length} items for import`,
        processed: data.length
      })

      // Redirect to products page after a delay
      setTimeout(() => {
        router.push('/admin/products?imported=true')
      }, 2000)

    } catch (error) {
      console.error('Import error:', error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process file'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    router.push('/admin/products')
  }

  const downloadTemplate = (type: 'csv' | 'json') => {
    const template = type === 'csv' 
      ? 'title,description,price,currency,category,tags,affiliate_url\n"Sample Product","Product description",29.99,USD,"Electronics","tech,gadgets","https://example.com/product"'
      : JSON.stringify([{
          title: "Sample Product",
          description: "Product description",
          price: 29.99,
          currency: "USD",
          category: "Electronics",
          tags: ["tech", "gadgets"],
          affiliate_url: "https://example.com/product"
        }], null, 2)

    const blob = new Blob([template], { type: type === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `linkvault-template.${type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Container className="py-8 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-500 dark:bg-green-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Import Products</h1>
          <p className="text-green-100">
            Import products from CSV or JSON files
          </p>
        </div>

        <div className="p-6">
          {/* File Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              
              {selectedFile ? (
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Supports CSV and JSON files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`
              mt-4 p-4 rounded-lg flex items-start space-x-3
              ${importResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }
            `}>
              {importResult.success ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  importResult.success 
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {importResult.message}
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {selectedFile && !importResult?.success && (
              <TouchButton
                onClick={handleImport}
                disabled={isProcessing}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Import Products'}
              </TouchButton>
            )}

            <div className="flex space-x-3">
              <TouchButton
                variant="outline"
                onClick={() => downloadTemplate('csv')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Template
              </TouchButton>
              <TouchButton
                variant="outline"
                onClick={() => downloadTemplate('json')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                JSON Template
              </TouchButton>
            </div>

            <TouchButton
              variant="ghost"
              onClick={handleClose}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </TouchButton>
          </div>

          {/* Help */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Import Guidelines:
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
              <li>• CSV files should have headers in the first row</li>
              <li>• JSON files should contain an array of product objects</li>
              <li>• Required fields: title, price, currency</li>
              <li>• Optional fields: description, category, tags, affiliate_url</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  )
}