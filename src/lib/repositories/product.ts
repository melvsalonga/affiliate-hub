import { prisma } from '../prisma'
import { 
  Product, 
  ProductWithRelations, 
  Category,
  CategoryWithChildren,
  Tag,
  ProductWhereInput,
  CategoryWhereInput
} from '../../types/database'
import { 
  CreateProductWithImagesInput,
  UpdateProductWithImagesInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateTagInput,
  ProductFilterInput,
  ProductSortInput
} from '../validations/product'
import { BaseRepository, NotFoundError, ConflictError, PaginatedResult, paginate } from './base'

export class ProductRepository implements BaseRepository<Product, CreateProductWithImagesInput, UpdateProductWithImagesInput, ProductWhereInput> {
  async findById(id: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { id }
    })
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return await prisma.product.findUnique({
      where: { slug }
    })
  }

  async findWithRelations(id: string): Promise<ProductWithRelations | null> {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        creator: true,
        images: {
          orderBy: { order: 'asc' }
        },
        affiliateLinks: {
          include: {
            platform: true,
            analytics: true
          },
          where: { isActive: true },
          orderBy: { priority: 'desc' }
        },
        tags: {
          include: {
            tag: true
          }
        },
        analytics: true
      }
    })
  }

  async findMany(
    filters?: ProductFilterInput,
    sort?: ProductSortInput,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<ProductWithRelations>> {
    const where: ProductWhereInput = {}
    
    if (filters) {
      if (filters.categoryId) where.categoryId = filters.categoryId
      if (filters.status) where.status = filters.status
      if (filters.isActive !== undefined) where.isActive = filters.isActive
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { shortDescription: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
      if (filters.minPrice || filters.maxPrice) {
        where.currentPrice = {}
        if (filters.minPrice) where.currentPrice.gte = filters.minPrice
        if (filters.maxPrice) where.currentPrice.lte = filters.maxPrice
      }
      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          some: {
            tagId: { in: filters.tags }
          }
        }
      }
      if (filters.createdBy) where.createdBy = filters.createdBy
      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {}
        if (filters.createdAfter) where.createdAt.gte = filters.createdAfter
        if (filters.createdBefore) where.createdAt.lte = filters.createdBefore
      }
    }

    const orderBy: any = {}
    if (sort) {
      orderBy[sort.field] = sort.direction
    } else {
      orderBy.createdAt = 'desc'
    }

    const query = prisma.product.findMany({
      where,
      include: {
        category: true,
        creator: true,
        images: {
          orderBy: { order: 'asc' }
        },
        affiliateLinks: {
          include: {
            platform: true,
            analytics: true
          },
          where: { isActive: true },
          orderBy: { priority: 'desc' }
        },
        tags: {
          include: {
            tag: true
          }
        },
        analytics: true
      },
      orderBy
    })
    
    return await paginate<ProductWithRelations>(query, page, limit)
  }

  async create(data: CreateProductWithImagesInput): Promise<ProductWithRelations> {
    try {
      return await prisma.product.create({
        data: {
          ...data.product,
          images: {
            create: data.images
          },
          tags: data.tags ? {
            create: data.tags.map(tagId => ({ tagId }))
          } : undefined
        },
        include: {
          category: true,
          creator: true,
          images: {
            orderBy: { order: 'asc' }
          },
          affiliateLinks: {
            include: {
              platform: true,
              analytics: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          analytics: true
        }
      })
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictError('Product with this slug already exists')
      }
      throw error
    }
  }

  async update(id: string, data: UpdateProductWithImagesInput): Promise<ProductWithRelations> {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          ...data.product,
          images: data.images ? {
            deleteMany: {},
            create: data.images.map(img => ({
              url: img.url,
              alt: img.alt,
              isPrimary: img.isPrimary,
              order: img.order
            }))
          } : undefined,
          tags: data.tags ? {
            deleteMany: {},
            create: data.tags.map(tagId => ({ tagId }))
          } : undefined
        },
        include: {
          category: true,
          creator: true,
          images: {
            orderBy: { order: 'asc' }
          },
          affiliateLinks: {
            include: {
              platform: true,
              analytics: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          analytics: true
        }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Product', id)
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictError('Product with this slug already exists')
      }
      throw error
    }
  }

  async delete(id: string): Promise<Product> {
    try {
      return await prisma.product.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Product', id)
      }
      throw error
    }
  }

  async count(where?: ProductWhereInput): Promise<number> {
    return await prisma.product.count({ where })
  }

  async findPublished(page: number = 1, limit: number = 20): Promise<PaginatedResult<ProductWithRelations>> {
    return await this.findMany(
      { status: 'ACTIVE', isActive: true },
      { field: 'publishedAt', direction: 'desc' },
      page,
      limit
    )
  }

  async findByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<ProductWithRelations>> {
    return await this.findMany(
      { categoryId, status: 'ACTIVE', isActive: true },
      undefined,
      page,
      limit
    )
  }

  async findFeatured(limit: number = 10): Promise<ProductWithRelations[]> {
    const result = await this.findMany(
      { status: 'ACTIVE', isActive: true },
      { field: 'createdAt', direction: 'desc' },
      1,
      limit
    )
    return result.data
  }

  async search(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<ProductWithRelations>> {
    return await this.findMany(
      { search: query, status: 'ACTIVE', isActive: true },
      undefined,
      page,
      limit
    )
  }
}

export class CategoryRepository implements BaseRepository<Category, CreateCategoryInput, UpdateCategoryInput, CategoryWhereInput> {
  async findById(id: string): Promise<Category | null> {
    return await prisma.category.findUnique({
      where: { id }
    })
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await prisma.category.findUnique({
      where: { slug }
    })
  }

  async findWithChildren(id: string): Promise<CategoryWithChildren | null> {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        parent: true
      }
    })
  }

  async findMany(where?: CategoryWhereInput, page: number = 1, limit: number = 20): Promise<PaginatedResult<Category>> {
    const query = prisma.category.findMany({
      where,
      orderBy: { order: 'asc' }
    })
    
    return await paginate<Category>(query, page, limit)
  }

  async findHierarchy(): Promise<CategoryWithChildren[]> {
    return await prisma.category.findMany({
      where: { 
        parentId: null,
        isActive: true 
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        parent: true
      },
      orderBy: { order: 'asc' }
    })
  }

  async create(data: CreateCategoryInput): Promise<Category> {
    try {
      return await prisma.category.create({
        data
      })
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictError('Category with this slug already exists')
      }
      throw error
    }
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    try {
      return await prisma.category.update({
        where: { id },
        data
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Category', id)
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictError('Category with this slug already exists')
      }
      throw error
    }
  }

  async delete(id: string): Promise<Category> {
    try {
      return await prisma.category.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Category', id)
      }
      throw error
    }
  }

  async count(where?: CategoryWhereInput): Promise<number> {
    return await prisma.category.count({ where })
  }
}

export class TagRepository {
  async findById(id: string): Promise<Tag | null> {
    return await prisma.tag.findUnique({
      where: { id }
    })
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return await prisma.tag.findUnique({
      where: { slug }
    })
  }

  async findMany(page: number = 1, limit: number = 50): Promise<PaginatedResult<Tag>> {
    const query = prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
    
    return await paginate<Tag>(query, page, limit)
  }

  async create(data: CreateTagInput): Promise<Tag> {
    try {
      return await prisma.tag.create({
        data
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('name')) {
          throw new ConflictError('Tag with this name already exists')
        }
        if (error.meta?.target?.includes('slug')) {
          throw new ConflictError('Tag with this slug already exists')
        }
      }
      throw error
    }
  }

  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    try {
      return await prisma.tag.update({
        where: { id },
        data
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Tag', id)
      }
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('name')) {
          throw new ConflictError('Tag with this name already exists')
        }
        if (error.meta?.target?.includes('slug')) {
          throw new ConflictError('Tag with this slug already exists')
        }
      }
      throw error
    }
  }

  async delete(id: string): Promise<Tag> {
    try {
      return await prisma.tag.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Tag', id)
      }
      throw error
    }
  }

  async findPopular(limit: number = 20): Promise<Tag[]> {
    return await prisma.tag.findMany({
      take: limit,
      orderBy: {
        products: {
          _count: 'desc'
        }
      }
    })
  }
}

export const productRepository = new ProductRepository()
export const categoryRepository = new CategoryRepository()
export const tagRepository = new TagRepository()