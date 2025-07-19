'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ContentEditor } from '@/components/content/ContentEditor'
import { Plus, Search, Edit, Trash2, Eye, FileText } from 'lucide-react'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  slug: string
  excerpt: string
  type: string
  status: string
  publishedAt: string | null
  updatedAt: string
  author: {
    id: string
    email: string
    profile: {
      firstName: string | null
      lastName: string | null
    } | null
  }
}

export default function ContentManagementPage() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchContent()
  }, [page, searchTerm, typeFilter, statusFilter])

  const fetchContent = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`/api/content?${params}`)
      const data = await response.json()

      if (response.ok) {
        setContent(data.content)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContent = async (contentData: any) => {
    try {
      const url = editingContent ? `/api/content/${editingContent.id}` : '/api/content'
      const method = editingContent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentData)
      })

      if (response.ok) {
        setShowEditor(false)
        setEditingContent(null)
        fetchContent()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save content')
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('Failed to save content')
    }
  }

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) {
      return
    }

    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchContent()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete content')
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Failed to delete content')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success'
      case 'DRAFT':
        return 'secondary'
      case 'ARCHIVED':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getAuthorName = (author: Content['author']) => {
    if (author.profile?.firstName && author.profile?.lastName) {
      return `${author.profile.firstName} ${author.profile.lastName}`
    }
    return author.email
  }

  return (
    <AdminLayout title="Content Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Content Management</h1>
          </div>
          <Button onClick={() => setShowEditor(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Content
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="ARTICLE">Article</option>
              <option value="REVIEW">Review</option>
              <option value="COMPARISON">Comparison</option>
              <option value="BUYING_GUIDE">Buying Guide</option>
              <option value="PAGE">Page</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('')
                setStatusFilter('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Content List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : content.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first piece of content.</p>
              <Button onClick={() => setShowEditor(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </Card>
          ) : (
            content.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status.toLowerCase()}
                      </Badge>
                      <Badge variant="outline">
                        {item.type.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>
                    
                    {item.excerpt && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{item.excerpt}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>By {getAuthorName(item.author)}</span>
                      <span>
                        {item.publishedAt 
                          ? `Published ${new Date(item.publishedAt).toLocaleDateString()}`
                          : `Updated ${new Date(item.updatedAt).toLocaleDateString()}`
                        }
                      </span>
                      <span>/{item.slug}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {item.status === 'PUBLISHED' && (
                      <Link href={`/content/${item.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingContent(item)
                        setShowEditor(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteContent(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Content Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false)
          setEditingContent(null)
        }}
        title={editingContent ? 'Edit Content' : 'Create Content'}
        size="full"
      >
        <ContentEditor
          initialContent={editingContent}
          onSave={handleSaveContent}
        />
      </Modal>
    </AdminLayout>
  )
}