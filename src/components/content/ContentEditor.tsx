'use client'

import { useState, useEffect } from 'react'
import { ContentTemplate, generateSEOFromTemplate } from '@/lib/content-templates'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { ContentTemplateSelector } from '@/components/content/ContentTemplateSelector'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { generateSEOSlug, generateMetaDescription } from '@/lib/seo-utils'
import { FileText, Eye, Save, Settings } from 'lucide-react'

interface ContentEditorProps {
  initialContent?: any
  onSave: (content: any) => Promise<void>
  onPreview?: (content: any) => void
}

export function ContentEditor({ initialContent, onSave, onPreview }: ContentEditorProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)
  const [content, setContent] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    keywords: [] as string[],
    type: 'ARTICLE' as const,
    status: 'DRAFT' as const,
    ...initialContent
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSEOSettings, setShowSEOSettings] = useState(false)

  // Auto-generate slug from title
  useEffect(() => {
    if (content.title && !content.slug) {
      setContent(prev => ({
        ...prev,
        slug: generateSEOSlug(content.title)
      }))
    }
  }, [content.title])

  // Auto-generate meta description from excerpt or content
  useEffect(() => {
    if ((content.excerpt || content.content) && !content.metaDescription) {
      const sourceText = content.excerpt || content.content
      setContent(prev => ({
        ...prev,
        metaDescription: generateMetaDescription(sourceText)
      }))
    }
  }, [content.excerpt, content.content])

  const handleTemplateSelect = (template: ContentTemplate) => {
    setSelectedTemplate(template)
    
    // Generate initial content structure based on template
    const templateContent = template.structure.map(section => {
      switch (section.type) {
        case 'heading':
          return `# ${section.title}\n\n`
        case 'paragraph':
          return `## ${section.title}\n\n${section.placeholder || 'Write your content here...'}\n\n`
        case 'list':
          return `## ${section.title}\n\n- Item 1\n- Item 2\n- Item 3\n\n`
        case 'pros-cons':
          return `## ${section.title}\n\n### Pros\n- Pro 1\n- Pro 2\n\n### Cons\n- Con 1\n- Con 2\n\n`
        default:
          return `## ${section.title}\n\n${section.placeholder || 'Content goes here...'}\n\n`
      }
    }).join('')

    // Generate SEO data from template
    const seoData = generateSEOFromTemplate(template, {
      productName: 'Product Name',
      category: 'Category',
      year: new Date().getFullYear().toString()
    })

    setContent(prev => ({
      ...prev,
      content: templateContent,
      type: template.type.toUpperCase().replace('-', '_') as any,
      metaTitle: seoData.title,
      metaDescription: seoData.description,
      keywords: seoData.keywords
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(content)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Content Editor</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateSelector(true)}
          >
            Use Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSEOSettings(!showSEOSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            SEO Settings
          </Button>
          {onPreview && (
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} loading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Basic Content Fields */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={content.title}
              onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter content title..."
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={content.slug}
                onChange={(e) => setContent(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-friendly-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={content.type}
                onChange={(e) => setContent(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ARTICLE">Article</option>
                <option value="REVIEW">Review</option>
                <option value="COMPARISON">Comparison</option>
                <option value="BUYING_GUIDE">Buying Guide</option>
                <option value="PAGE">Page</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              value={content.excerpt}
              onChange={(e) => setContent(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary of the content..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* SEO Settings */}
      {showSEOSettings && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Title</label>
              <Input
                value={content.metaTitle}
                onChange={(e) => setContent(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="SEO optimized title..."
                maxLength={60}
              />
              <div className="text-xs text-gray-500 mt-1">
                {content.metaTitle.length}/60 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <textarea
                value={content.metaDescription}
                onChange={(e) => setContent(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="SEO optimized description..."
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                {content.metaDescription.length}/160 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Keywords</label>
              <Input
                value={content.keywords.join(', ')}
                onChange={(e) => setContent(prev => ({ 
                  ...prev, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                }))}
                placeholder="keyword1, keyword2, keyword3..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Separate keywords with commas
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rich Text Editor */}
      <Card className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content</label>
        </div>
        <RichTextEditor
          value={content.content}
          onChange={(value) => setContent(prev => ({ ...prev, content: value }))}
          placeholder="Start writing your content..."
          className="min-h-[400px]"
        />
      </Card>

      {/* Template Selector Modal */}
      <ContentTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  )
}