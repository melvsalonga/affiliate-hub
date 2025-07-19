// Image optimization utilities for better performance

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  blur?: number
  sharpen?: boolean
  progressive?: boolean
}

export interface ResponsiveImageConfig {
  breakpoints: number[]
  sizes: string
  formats: string[]
  quality: number
}

// Image optimization service
export class ImageOptimizer {
  private static readonly DEFAULT_QUALITY = 80
  private static readonly DEFAULT_FORMAT = 'webp'
  
  static generateSrcSet(
    baseUrl: string,
    widths: number[],
    options: ImageOptimizationOptions = {}
  ): string {
    return widths
      .map(width => {
        const optimizedUrl = this.optimizeUrl(baseUrl, { ...options, width })
        return `${optimizedUrl} ${width}w`
      })
      .join(', ')
  }

  static generateSizes(breakpoints: { width: number; size: string }[]): string {
    return breakpoints
      .map(bp => `(max-width: ${bp.width}px) ${bp.size}`)
      .join(', ')
  }

  static optimizeUrl(url: string, options: ImageOptimizationOptions = {}): string {
    const {
      quality = this.DEFAULT_QUALITY,
      format = this.DEFAULT_FORMAT,
      width,
      height,
      fit = 'cover',
      blur,
      sharpen,
      progressive = true
    } = options

    // For Next.js Image Optimization API
    const params = new URLSearchParams()
    
    params.set('url', url)
    params.set('q', quality.toString())
    params.set('f', format)
    
    if (width) params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    if (fit !== 'cover') params.set('fit', fit)
    if (blur) params.set('blur', blur.toString())
    if (sharpen) params.set('sharpen', 'true')
    if (!progressive) params.set('progressive', 'false')

    return `/_next/image?${params.toString()}`
  }

  static getResponsiveConfig(type: 'hero' | 'card' | 'thumbnail' | 'gallery'): ResponsiveImageConfig {
    const configs = {
      hero: {
        breakpoints: [640, 768, 1024, 1280, 1920],
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px',
        formats: ['avif', 'webp', 'jpeg'],
        quality: 85
      },
      card: {
        breakpoints: [300, 400, 600, 800],
        sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
        formats: ['avif', 'webp', 'jpeg'],
        quality: 80
      },
      thumbnail: {
        breakpoints: [100, 150, 200, 300],
        sizes: '(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 15vw',
        formats: ['avif', 'webp', 'jpeg'],
        quality: 75
      },
      gallery: {
        breakpoints: [400, 600, 800, 1200],
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
        formats: ['avif', 'webp', 'jpeg'],
        quality: 85
      }
    }

    return configs[type]
  }

  static async preloadCriticalImages(urls: string[]): Promise<void> {
    if (typeof window === 'undefined') return

    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        link.onload = () => resolve()
        link.onerror = () => reject(new Error(`Failed to preload ${url}`))
        document.head.appendChild(link)
      })
    })

    try {
      await Promise.all(promises)
      console.log('Critical images preloaded successfully')
    } catch (error) {
      console.warn('Some critical images failed to preload:', error)
    }
  }

  static createBlurDataURL(width: number = 10, height: number = 10): string {
    // Create a simple blur placeholder
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    return canvas.toDataURL()
  }

  static async generatePlaceholder(imageUrl: string): Promise<string> {
    try {
      // Generate a low-quality placeholder
      const placeholderUrl = this.optimizeUrl(imageUrl, {
        width: 20,
        height: 20,
        quality: 10,
        blur: 5
      })
      
      return placeholderUrl
    } catch (error) {
      console.warn('Failed to generate placeholder:', error)
      return this.createBlurDataURL()
    }
  }
}

// Lazy loading utilities
export class LazyImageLoader {
  private static observer: IntersectionObserver | null = null
  private static loadedImages = new Set<string>()

  static initialize() {
    if (typeof window === 'undefined' || this.observer) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            this.loadImage(img)
            this.observer?.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )
  }

  static observe(img: HTMLImageElement) {
    if (!this.observer) this.initialize()
    this.observer?.observe(img)
  }

  static unobserve(img: HTMLImageElement) {
    this.observer?.unobserve(img)
  }

  private static loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    const srcset = img.dataset.srcset
    
    if (src && !this.loadedImages.has(src)) {
      img.src = src
      if (srcset) img.srcset = srcset
      
      img.onload = () => {
        img.classList.add('loaded')
        this.loadedImages.add(src)
      }
      
      img.onerror = () => {
        img.classList.add('error')
        console.warn('Failed to load image:', src)
      }
    }
  }

  static disconnect() {
    this.observer?.disconnect()
    this.observer = null
    this.loadedImages.clear()
  }
}

// Image format detection
export class ImageFormatDetector {
  private static supportCache = new Map<string, boolean>()

  static async supportsFormat(format: 'webp' | 'avif' | 'jpeg2000'): Promise<boolean> {
    if (this.supportCache.has(format)) {
      return this.supportCache.get(format)!
    }

    const support = await this.checkFormatSupport(format)
    this.supportCache.set(format, support)
    return support
  }

  private static checkFormatSupport(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=',
        jpeg2000: 'data:image/jp2;base64,/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/2AAEQK//'
      }

      const img = new Image()
      img.onload = () => resolve(img.width > 0 && img.height > 0)
      img.onerror = () => resolve(false)
      img.src = testImages[format as keyof typeof testImages]
    })
  }

  static async getBestFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
    if (await this.supportsFormat('avif')) return 'avif'
    if (await this.supportsFormat('webp')) return 'webp'
    return 'jpeg'
  }
}

// Image compression utilities
export class ImageCompressor {
  static async compressFile(
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: string
    } = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/webp'
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: format,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          format,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  static async resizeImage(
    file: File,
    targetWidth: number,
    targetHeight: number
  ): Promise<File> {
    return this.compressFile(file, {
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      quality: 0.9
    })
  }
}

// Performance monitoring for images
export class ImagePerformanceMonitor {
  private static metrics: Array<{
    url: string
    loadTime: number
    size: number
    format: string
    timestamp: Date
  }> = []

  static recordImageLoad(
    url: string,
    loadTime: number,
    size: number,
    format: string
  ) {
    this.metrics.push({
      url,
      loadTime,
      size,
      format,
      timestamp: new Date()
    })

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  static getSlowImages(threshold: number = 1000): typeof this.metrics {
    return this.metrics.filter(metric => metric.loadTime > threshold)
  }

  static getLargeImages(threshold: number = 500000): typeof this.metrics {
    return this.metrics.filter(metric => metric.size > threshold)
  }

  static getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0)
    return total / this.metrics.length
  }

  static getFormatUsage(): Record<string, number> {
    const usage: Record<string, number> = {}
    
    this.metrics.forEach(metric => {
      usage[metric.format] = (usage[metric.format] || 0) + 1
    })
    
    return usage
  }

  static clearMetrics() {
    this.metrics = []
  }
}