import { prisma } from '@/lib/prisma'

export interface SlugOptions {
  maxLength?: number
  allowDuplicates?: boolean
  suffix?: string
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string, options: SlugOptions = {}): string {
  const { maxLength = 100, suffix = '' } = options
  
  let slug = text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
  
  // Add suffix if provided
  if (suffix) {
    slug = `${slug}-${suffix}`
  }
  
  // Truncate if too long
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-[^-]*$/, '')
  }
  
  return slug
}

/**
 * Ensure slug is unique by checking database and adding number suffix if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string, 
  tableName: 'product' | 'category' | 'content',
  excludeId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (await isSlugTaken(slug, tableName, excludeId)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * Check if a slug is already taken in the specified table
 */
async function isSlugTaken(
  slug: string, 
  tableName: 'product' | 'category' | 'content',
  excludeId?: string
): Promise<boolean> {
  const whereClause: any = { slug }
  
  if (excludeId) {
    whereClause.id = { not: excludeId }
  }
  
  let result
  switch (tableName) {
    case 'product':
      result = await prisma.product.findFirst({ where: whereClause })
      break
    case 'category':
      result = await prisma.category.findFirst({ where: whereClause })
      break
    case 'content':
      // Assuming we have a content table
      result = await prisma.content?.findFirst({ where: whereClause })
      break
    default:
      throw new Error(`Unknown table: ${tableName}`)
  }
  
  return !!result
}

/**
 * Create a redirect entry for old slug to new slug
 */
export async function createRedirect(
  oldSlug: string,
  newSlug: string,
  type: 'product' | 'category' | 'content' = 'product',
  permanent: boolean = true
): Promise<void> {
  try {
    await prisma.redirect.create({
      data: {
        fromPath: `/${type}s/${oldSlug}`,
        toPath: `/${type}s/${newSlug}`,
        statusCode: permanent ? 301 : 302,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error creating redirect:', error)
    // Don't throw error as redirects are not critical
  }
}

/**
 * Get redirect destination for a given path
 */
export async function getRedirect(path: string): Promise<{ toPath: string; statusCode: number } | null> {
  try {
    const redirect = await prisma.redirect.findFirst({
      where: { fromPath: path },
      orderBy: { createdAt: 'desc' }
    })
    
    if (redirect) {
      return {
        toPath: redirect.toPath,
        statusCode: redirect.statusCode
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting redirect:', error)
    return null
  }
}

/**
 * Update product slug and create redirect if needed
 */
export async function updateProductSlug(
  productId: string,
  newTitle: string
): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true }
  })
  
  if (!product) {
    throw new Error('Product not found')
  }
  
  const newSlug = generateSlug(newTitle)
  const uniqueSlug = await ensureUniqueSlug(newSlug, 'product', productId)
  
  // Create redirect if slug is changing
  if (product.slug !== uniqueSlug) {
    await createRedirect(product.slug, uniqueSlug, 'product')
  }
  
  // Update product with new slug
  await prisma.product.update({
    where: { id: productId },
    data: { slug: uniqueSlug }
  })
  
  return uniqueSlug
}

/**
 * Batch update slugs for existing records
 */
export async function batchUpdateSlugs(
  tableName: 'product' | 'category',
  dryRun: boolean = true
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = []
  let updated = 0
  
  try {
    let records: any[] = []
    
    switch (tableName) {
      case 'product':
        records = await prisma.product.findMany({
          select: { id: true, title: true, slug: true }
        })
        break
      case 'category':
        records = await prisma.category.findMany({
          select: { id: true, name: true, slug: true }
        })
        break
    }
    
    for (const record of records) {
      try {
        const title = record.title || record.name
        const newSlug = generateSlug(title)
        const uniqueSlug = await ensureUniqueSlug(newSlug, tableName, record.id)
        
        if (record.slug !== uniqueSlug) {
          if (!dryRun) {
            // Create redirect
            await createRedirect(record.slug, uniqueSlug, tableName)
            
            // Update record
            switch (tableName) {
              case 'product':
                await prisma.product.update({
                  where: { id: record.id },
                  data: { slug: uniqueSlug }
                })
                break
              case 'category':
                await prisma.category.update({
                  where: { id: record.id },
                  data: { slug: uniqueSlug }
                })
                break
            }
          }
          updated++
        }
      } catch (error) {
        errors.push(`Error updating ${record.id}: ${error}`)
      }
    }
  } catch (error) {
    errors.push(`Batch operation failed: ${error}`)
  }
  
  return { updated, errors }
}

/**
 * Clean up old redirects (older than specified days)
 */
export async function cleanupOldRedirects(olderThanDays: number = 365): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
  
  try {
    const result = await prisma.redirect.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })
    
    return result.count
  } catch (error) {
    console.error('Error cleaning up redirects:', error)
    return 0
  }
}