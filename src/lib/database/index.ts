// Database optimization exports
export { QueryOptimizer, indexingRecommendations, QueryAnalyzer } from './optimization'
export {
  OffsetPagination,
  CursorPagination,
  KeysetPagination,
  SearchPagination,
  InfiniteScrollPagination,
  withPagination,
  usePagination,
  PaginationMetrics
} from './pagination'

// Re-export types
export type {
  PaginationParams,
  PaginationResult,
  CursorPaginationResult
} from './pagination'