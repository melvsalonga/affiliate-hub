import { lazy } from 'react'
import { ComponentType } from 'react'

// Lazy loading wrapper with error boundary
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFn)
  
  return LazyComponent
}

// Admin components - loaded only when needed
export const LazyProductForm = createLazyComponent(
  () => import('../admin/products/ProductForm')
)

export const LazyProductList = createLazyComponent(
  () => import('../admin/products/ProductList')
)

export const LazyBulkOperations = createLazyComponent(
  () => import('../admin/products/BulkOperations')
)

export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('../admin/analytics/AnalyticsDashboard')
)

export const LazyLinkHealthMonitor = createLazyComponent(
  () => import('../admin/links/LinkHealthMonitor')
)

export const LazyLinkRotationManager = createLazyComponent(
  () => import('../admin/links/LinkRotationManager')
)

export const LazySEODashboard = createLazyComponent(
  () => import('../admin/SEODashboard')
)

// Content components
export const LazyContentEditor = createLazyComponent(
  () => import('../content/ContentEditor')
)

export const LazyRichTextEditor = createLazyComponent(
  () => import('../editor/RichTextEditor')
)

// Chart components - heavy dependencies
export const LazyAnalyticsChart = createLazyComponent(
  () => import('../charts/AnalyticsChart')
)

export const LazyPerformanceChart = createLazyComponent(
  () => import('../charts/PerformanceChart')
)

export const LazyRevenueChart = createLazyComponent(
  () => import('../charts/RevenueChart')
)

// Public components
export const LazyProductCatalog = createLazyComponent(
  () => import('../public/ProductCatalog')
)

export const LazyProductComparison = createLazyComponent(
  () => import('../public/ProductComparison')
)

export const LazyAdvancedSearch = createLazyComponent(
  () => import('../public/AdvancedSearch')
)

// Feature-specific components
export const LazyImageUploader = createLazyComponent(
  () => import('../upload/ImageUploader')
)

export const LazyCSVImporter = createLazyComponent(
  () => import('../import/CSVImporter')
)

export const LazyDataExporter = createLazyComponent(
  () => import('../export/DataExporter')
)

// Settings and configuration
export const LazyUserSettings = createLazyComponent(
  () => import('../settings/UserSettings')
)

export const LazySystemSettings = createLazyComponent(
  () => import('../settings/SystemSettings')
)

export const LazyIntegrationSettings = createLazyComponent(
  () => import('../settings/IntegrationSettings')
)