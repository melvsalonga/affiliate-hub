import { prisma } from '../prisma'
import { PaginationInput } from '../validations'

// Base repository interface
export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  findById(id: string): Promise<T | null>
  findMany(where?: WhereInput, pagination?: PaginationInput): Promise<T[]>
  create(data: CreateInput): Promise<T>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<T>
  count(where?: WhereInput): Promise<number>
}

// Pagination helper
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export async function paginate<T>(
  query: any,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit
  
  const [data, total] = await Promise.all([
    query.skip(skip).take(limit),
    query.count ? query.count() : prisma[query.model].count(query.where ? { where: query.where } : {})
  ])
  
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// Error handling
export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class NotFoundError extends RepositoryError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND')
  }
}

export class ConflictError extends RepositoryError {
  constructor(message: string) {
    super(message, 'CONFLICT')
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback)
}