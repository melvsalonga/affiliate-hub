import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils'
import { generateArticleStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data'
import { StructuredData } from '@/components/seo/StructuredData'
import { calculateReadingTime } from '@/lib/seo-utils'

interface ContentPageProps {
  params: {
    slug: string
  }
}

async function getContent(slug: string) {
  const content = await prisma.content.findUnique({
    where: { 
      slug,
      status: 'PUBLISHED'
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  })

  return content
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const content = await getContent(params.slug)
  
  if (!content) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found.'
    }
  }

  const authorName = content.author.profile?.firstName && content.author.profile?.lastName
    ? `${content.author.profile.firstName} ${content.author.profile.lastName}`
    : content.author.email

  return generateSEOMetadata({
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.excerpt || '',
    keywords: content.keywords,
    canonicalUrl: `/content/${content.slug}`,
    ogType: 'article',
    publishedTime: content.publishedAt?.toISOString(),
    modifiedTime: content.updatedAt.toISOString(),
    author: authorName,
    section: content.type.toLowerCase().replace('_', ' '),
    tags: content.keywords
  })
}

export default async function ContentPage({ params }: ContentPageProps) {
  const content = await getContent(params.slug)

  if (!content) {
    notFound()
  }

  const authorName = content.author.profile?.firstName && content.author.profile?.lastName
    ? `${content.author.profile.firstName} ${content.author.profile.lastName}`
    : content.author.email

  const readingTime = calculateReadingTime(content.content)

  // Generate structured data
  const structuredDataOptions = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://linkvault-pro.com',
    siteName: 'LinkVault Pro',
    organizationName: 'LinkVault Pro',
    organizationLogo: '/images/logo.png'
  }

  const articleStructuredData = generateArticleStructuredData({
    title: content.title,
    description: content.excerpt,
    slug: content.slug,
    type: content.type.toLowerCase(),
    publishedAt: content.publishedAt,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    featuredImage: null // Add if you have featured images
  }, structuredDataOptions)

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Content', url: '/content' },
    { name: content.title, url: `/content/${content.slug}` }
  ], structuredDataOptions)

  // Parse content (assuming it's stored as JSON from rich text editor)
  let parsedContent
  try {
    parsedContent = JSON.parse(content.content)
  } catch {
    parsedContent = content.content
  }

  return (
    <>
      <StructuredData data={[articleStructuredData, breadcrumbStructuredData]} />
      
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="hover:text-blue-600">Home</a></li>
            <li className="before:content-['/'] before:mx-2">
              <a href="/content" className="hover:text-blue-600">Content</a>
            </li>
            <li className="before:content-['/'] before:mx-2 text-gray-900">
              {content.title}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
              {content.type.replace('_', ' ').toLowerCase()}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>
          
          {content.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {content.excerpt}
            </p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <span>By {authorName}</span>
            </div>
            <div>
              <time dateTime={content.publishedAt?.toISOString()}>
                {content.publishedAt?.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            <div>
              {readingTime} min read
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {typeof parsedContent === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
          ) : (
            <ContentRenderer content={parsedContent} />
          )}
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Last updated: {content.updatedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            {content.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </footer>
      </article>
    </>
  )
}

// Component to render rich text content
function ContentRenderer({ content }: { content: any }) {
  if (typeof content === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  if (Array.isArray(content)) {
    return (
      <div>
        {content.map((node, index) => (
          <NodeRenderer key={index} node={node} />
        ))}
      </div>
    )
  }

  return <NodeRenderer node={content} />
}

function NodeRenderer({ node }: { node: any }) {
  if (typeof node === 'string') {
    return <span>{node}</span>
  }

  if (!node.type) {
    return null
  }

  const children = node.children?.map((child: any, index: number) => (
    <NodeRenderer key={index} node={child} />
  ))

  switch (node.type) {
    case 'paragraph':
      return <p>{children}</p>
    case 'heading-one':
      return <h1>{children}</h1>
    case 'heading-two':
      return <h2>{children}</h2>
    case 'heading-three':
      return <h3>{children}</h3>
    case 'block-quote':
      return <blockquote>{children}</blockquote>
    case 'bulleted-list':
      return <ul>{children}</ul>
    case 'numbered-list':
      return <ol>{children}</ol>
    case 'list-item':
      return <li>{children}</li>
    case 'link':
      return <a href={node.url}>{children}</a>
    case 'image':
      return <img src={node.url} alt={node.alt} />
    case 'code-block':
      return <pre><code>{children}</code></pre>
    default:
      return <div>{children}</div>
  }
}