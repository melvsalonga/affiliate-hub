// Advanced pagination utilities for optimal performance

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

export interface CursorPaginationResult<T> {
  data: T[]
  pagination: {
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

// Offset-based pagination (traditional)
export class OffsetPagination {
  static calculate(params: PaginationParams & { total: number }) {
    const { page = 1, limit = 20, total } = params
    const offset = (page - 1) * limit
    const pages = Math.ceil(total / limit)

    return {
      offset,
      limit,
      page,
      pages,
      total,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  }

  static createResult<T>(
    data: T[],
    params: PaginationParams,
    total: number
  ): PaginationResult<T> {
    const pagination = this.calculate({ ...params, total })
    
    return {
      data,
      pagination
    }
  }
}

// Cursor-based pagination (for better performance on large datasets)
export class CursorPagination {
  static encodeCursor(value: any): string {
    return Buffer.from(JSON.stringify(value)).toString('base64')
  }

  static decodeCursor(cursor: string): any {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString())
    } catch {
      return null
    }
  }

  static createResult<T extends Record<string, any>>(
    data: T[],
    params: PaginationParams,
    cursorField: keyof T = 'id'
  ): CursorPaginationResult<T> {
    const { limit = 20 } = params
    const hasNext = data.length > limit
    const actualData = hasNext ? data.slice(0, limit) : data

    let nextCursor: string | undefined
    let prevCursor: string | undefined

    if (actualData.length > 0) {
      if (hasNext) {
        nextCursor = this.encodeCursor(actualData[actualData.length - 1][cursorField])
      }
      prevCursor = this.encodeCursor(actualData[0][cursorField])
    }

    return {
      data: actualData,
      pagination: {
        limit,
        hasNext,
        hasPrev: !!params.cursor,
        nextCursor,
        prevCursor
      }
    }
  }

  static buildCursorWhere(
    cursor: string | undefined,
    cursorField: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): any {
    if (!cursor) return {}

    const cursorValue = this.decodeCursor(cursor)
    if (!cursorValue) return {}

    return {
      [cursorField]: sortOrder === 'desc' 
        ? { lt: cursorValue }
        : { gt: cursorValue }
    }
  }
}

// Keyset pagination (most efficient for large datasets)
export class KeysetPagination {
  static createWhereClause(
    cursor: string | undefined,
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): any {
    if (!cursor) return {}

    const decodedCursor = CursorPagination.decodeCursor(cursor)
    if (!decodedCursor) return {}

    const operator = sortOrder === 'desc' ? 'lt' : 'gt'
    
    return {
      [sortBy]: { [operator]: decodedCursor }
    }
  }

  static async paginate<T extends Record<string, any>>(
    queryFn: (where: any, take: number) => Promise<T[]>,
    params: PaginationParams,
    sortBy: string = 'createdAt'
  ): Promise<CursorPaginationResult<T>> {
    const { cursor, limit = 20, sortOrder = 'desc' } = params
    
    const where = this.createWhereClause(cursor, sortBy, sortOrder)
    const take = limit + 1 // Fetch one extra to check if there's a next page
    
    const data = await queryFn(where, take)
    
    return CursorPagination.createResult(data, params, sortBy as keyof T)
  }
}

// Search pagination with full-text search optimization
export class SearchPagination {
  static async paginateSearch<T>(
    searchFn: (query: string, offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
    query: string,
    params: PaginationParams
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 20 } = params
    const offset = (page - 1) * limit

    const { data, total } = await searchFn(query, offset, limit)
    
    return OffsetPagination.createResult(data, params, total)
  }

  // Elasticsearch-style search pagination
  static createSearchQuery(
    searchTerm: string,
    params: PaginationParams,
    fields: string[] = ['title', 'description']
  ) {
    const { page = 1, limit = 20, sortBy = '_score', sortOrder = 'desc' } = params
    const from = (page - 1) * limit

    return {
      query: {
        multi_match: {
          query: searchTerm,
          fields,
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      sort: [
        { [sortBy]: { order: sortOrder } }
      ],
      from,
      size: limit,
      highlight: {
        fields: fields.reduce((acc, field) => ({ ...acc, [field]: {} }), {})
      }
    }
  }
}

// Infinite scroll pagination
export class InfiniteScrollPagination {
  static createResult<T>(
    data: T[],
    params: PaginationParams,
    hasMore: boolean
  ) {
    const { page = 1, limit = 20 } = params

    return {
      data,
      page,
      limit,
      hasMore,
      nextPage: hasMore ? page + 1 : null
    }
  }

  static async paginate<T>(
    queryFn: (offset: number, limit: number) => Promise<T[]>,
    params: PaginationParams
  ) {
    const { page = 1, limit = 20 } = params
    const offset = (page - 1) * limit
    const take = limit + 1 // Fetch one extra to check if there are more items

    const data = await queryFn(offset, take)
    const hasMore = data.length > limit
    const actualData = hasMore ? data.slice(0, limit) : data

    return this.createResult(actualData, params, hasMore)
  }
}

// Pagination middleware for API routes
export function withPagination<T>(
  handler: (params: PaginationParams) => Promise<{ data: T[]; total?: number }>
) {
  return async (request: Request) => {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    const params: PaginationParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 items
      cursor: searchParams.get('cursor') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    try {
      const result = await handler(params)
      
      if (result.total !== undefined) {
        // Offset-based pagination
        const paginatedResult = OffsetPagination.createResult(
          result.data,
          params,
          result.total
        )
        return Response.json(paginatedResult)
      } else {
        // Cursor-based pagination
        const paginatedResult = CursorPagination.createResult(result.data, params)
        return Response.json(paginatedResult)
      }
    } catch (error) {
      console.error('Pagination error:', error)
      return Response.json(
        { error: 'Failed to paginate results' },
        { status: 500 }
      )
    }
  }
}

import { useState } from 'react'

// Pagination hooks for React components
export function usePagination(initialParams: PaginationParams = {}) {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    ...initialParams
  })

  const updatePage = (page: number) => {
    setParams(prev => ({ ...prev, page }))
  }

  const updateLimit = (limit: number) => {
    setParams(prev => ({ ...prev, limit, page: 1 }))
  }

  const updateSort = (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }

  const updateCursor = (cursor: string | undefined) => {
    setParams(prev => ({ ...prev, cursor }))
  }

  const reset = () => {
    setParams({ page: 1, limit: 20, ...initialParams })
  }

  return {
    params,
    updatePage,
    updateLimit,
    updateSort,
    updateCursor,
    reset
  }
}

// Performance monitoring for pagination
export class PaginationMetrics {
  private static metrics: Array<{
    type: 'offset' | 'cursor' | 'keyset'
    duration: number
    itemCount: number
    timestamp: Date
  }> = []

  static recordMetric(
    type: 'offset' | 'cursor' | 'keyset',
    duration: number,
    itemCount: number
  ) {
    this.metrics.push({
      type,
      duration,
      itemCount,
      timestamp: new Date()
    })

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  static getAveragePerformance() {
    const byType = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = { totalDuration: 0, count: 0, totalItems: 0 }
      }
      acc[metric.type].totalDuration += metric.duration
      acc[metric.type].count += 1
      acc[metric.type].totalItems += metric.itemCount
      return acc
    }, {} as Record<string, { totalDuration: number; count: number; totalItems: number }>)

    return Object.entries(byType).reduce((acc, [type, stats]) => {
      acc[type] = {
        averageDuration: stats.totalDuration / stats.count,
        averageItemCount: stats.totalItems / stats.count,
        totalQueries: stats.count
      }
      return acc
    }, {} as Record<string, any>)
  }

  static clearMetrics() {
    this.metrics = []
  }
}