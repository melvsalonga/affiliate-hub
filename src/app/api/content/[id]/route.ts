import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateSEOSlug, ensureUniqueSlug, updateProductSlug } from '@/lib/slug-management'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
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

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if content exists and user has permission
    const existingContent = await prisma.content.findUnique({
      where: { id: params.id }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Check if user is author or has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingContent.authorId !== user.id && userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug: providedSlug,
      content,
      excerpt,
      type,
      status,
      metaTitle,
      metaDescription,
      keywords
    } = body

    // Handle slug update if title changed
    let uniqueSlug = existingContent.slug
    if (title && title !== existingContent.title) {
      const baseSlug = providedSlug || generateSEOSlug(title)
      if (baseSlug !== existingContent.slug) {
        uniqueSlug = await ensureUniqueSlug(baseSlug, 'content', params.id)
        
        // Create redirect from old slug to new slug
        if (existingContent.slug !== uniqueSlug) {
          await prisma.redirect.create({
            data: {
              fromPath: `/content/${existingContent.slug}`,
              toPath: `/content/${uniqueSlug}`,
              statusCode: 301
            }
          }).catch(console.error) // Don't fail if redirect creation fails
        }
      }
    }

    const updatedContent = await prisma.content.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(uniqueSlug !== existingContent.slug && { slug: uniqueSlug }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(type && { type }),
        ...(status && { 
          status,
          publishedAt: status === 'PUBLISHED' && !existingContent.publishedAt 
            ? new Date() 
            : existingContent.publishedAt
        }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(keywords && { keywords })
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

    return NextResponse.json(updatedContent)
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if content exists and user has permission
    const existingContent = await prisma.content.findUnique({
      where: { id: params.id }
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Check if user is author or has admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingContent.authorId !== user.id && userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.content.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}