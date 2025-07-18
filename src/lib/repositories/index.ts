// Export all repositories
export * from './base'
export * from './user'
export * from './product'

// Re-export commonly used repository instances
export { userRepository } from './user'
export { productRepository, categoryRepository, tagRepository } from './product'

// Database utilities
export { prisma } from '../prisma'
export { withTransaction } from './base'