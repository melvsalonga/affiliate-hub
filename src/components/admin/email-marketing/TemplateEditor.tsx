'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  htmlContent: string
  variables: string[]
}

interface TemplateEditorProps {
  onClose: () => void
}

export function TemplateEditor({ onClose }: TemplateEditorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-marketing/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
        if (data.data.length > 0) {
          setSelectedTemplate(data.data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (field: string, value: string) => {
    if (!selectedTemplate) return
    
    setSelectedTemplate(prev => prev ? {
      ...prev,
      [field]: value
    } : null)
  }

  const getPreviewContent = () => {
    if (!selectedTemplate) return ''
    
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      product_name: 'Wireless Bluetooth Headphones',
      product_url: 'https://example.com/product/headphones',
      old_price: '99.99',
      new_price: '79.99',
      savings: '20.00',
      savings_percent: '20',
      currency: 'USD',
      deal_title: 'Flash Sale: Premium Headphones',
      deal_description: 'Get these amazing wireless headphones at an unbeatable price!',
      deal_url: 'https://example.com/deals/headphones',
      original_price: '99.99',
      sale_price: '79.99',
      discount_percent: '20',
      expires_at: 'December 31, 2024',
    }

    let content = selectedTemplate.htmlContent
    selectedTemplate.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g')
      content = content.replace(regex, sampleData[variable] || `[${variable}]`)
    })

    return content
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`p-3 cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {template.type.replace('_', ' ')}
                  </p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 text-xs">
                  {template.variables.length} vars
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <>
          {/* Template Editor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Template: {selectedTemplate.name}
              </h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>

            {!previewMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <Input
                    value={selectedTemplate.subject}
                    onChange={(e) => handleTemplateChange('subject', e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTML Content
                  </label>
                  <textarea
                    value={selectedTemplate.htmlContent}
                    onChange={(e) => handleTemplateChange('htmlContent', e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter HTML content"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Variables
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge
                        key={variable}
                        className="bg-blue-100 text-blue-800 cursor-pointer"
                        onClick={() => {
                          // Copy variable to clipboard
                          navigator.clipboard.writeText(`{{${variable}}}`)
                        }}
                      >
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click on a variable to copy it to clipboard
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Preview
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {selectedTemplate.subject.replace(/{{(\w+)}}/g, (match, variable) => {
                      const sampleData: Record<string, string> = {
                        product_name: 'Wireless Bluetooth Headphones',
                        new_price: '79.99',
                        currency: 'USD',
                        deal_title: 'Flash Sale: Premium Headphones',
                        discount_percent: '20',
                      }
                      return sampleData[variable] || match
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Preview
                  </label>
                  <div className="border rounded-md overflow-hidden">
                    <div
                      className="p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // Save template changes
                console.log('Saving template:', selectedTemplate)
                onClose()
              }}
            >
              Save Changes
            </Button>
          </div>
        </>
      )}
    </div>
  )
}