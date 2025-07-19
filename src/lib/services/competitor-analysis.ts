import { prisma } from '@/lib/prisma'
import { Competitor, CompetitorProduct, MarketTrend, CompetitiveIntelligence } from '@prisma/client'

export interface CompetitorAnalysisResult {
  competitor: Competitor
  priceComparison: {
    ourAveragePrice: number
    competitorAveragePrice: number
    priceDifference: number
    priceAdvantage: 'HIGHER' | 'LOWER' | 'SIMILAR'
  }
  marketPosition: {
    marketShare: number
    competitiveAdvantage: string[]
    weaknesses: string[]
  }
  recommendations: string[]
}

export interface MarketIntelligenceReport {
  overview: {
    totalCompetitors: number
    totalProducts: number
    averageMarketPrice: number
    priceRange: { min: number; max: number }
  }
  trends: MarketTrend[]
  opportunities: string[]
  threats: string[]
  keyInsights: string[]
}

export class CompetitorAnalysisService {
  /**
   * Analyze a specific competitor against our products
   */
  static async analyzeCompetitor(competitorId: string): Promise<CompetitorAnalysisResult> {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        products: {
          include: {
            product: true,
            priceHistory: {
              take: 30,
              orderBy: { recordedAt: 'desc' }
            }
          }
        },
        analytics: true
      }
    })

    if (!competitor) {
      throw new Error('Competitor not found')
    }

    // Calculate price comparison
    const competitorPrices = competitor.products.map(p => Number(p.currentPrice))
    const competitorAveragePrice = competitorPrices.length > 0 
      ? competitorPrices.reduce((sum, price) => sum + price, 0) / competitorPrices.length 
      : 0

    // Get our products in similar categories
    const ourProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        competitorProducts: {
          some: {
            competitorId: competitorId
          }
        }
      }
    })

    const ourPrices = ourProducts.map(p => Number(p.currentPrice))
    const ourAveragePrice = ourPrices.length > 0 
      ? ourPrices.reduce((sum, price) => sum + price, 0) / ourPrices.length 
      : 0

    const priceDifference = ((competitorAveragePrice - ourAveragePrice) / ourAveragePrice) * 100
    let priceAdvantage: 'HIGHER' | 'LOWER' | 'SIMILAR' = 'SIMILAR'
    
    if (Math.abs(priceDifference) > 5) {
      priceAdvantage = priceDifference > 0 ? 'HIGHER' : 'LOWER'
    }

    // Generate recommendations based on analysis
    const recommendations = this.generateCompetitorRecommendations(
      competitor,
      priceAdvantage,
      priceDifference
    )

    // Update competitor analytics
    await this.updateCompetitorAnalytics(competitorId, {
      totalProducts: competitor.products.length,
      averagePrice: competitorAveragePrice,
      priceRange: {
        min: Math.min(...competitorPrices),
        max: Math.max(...competitorPrices)
      }
    })

    return {
      competitor,
      priceComparison: {
        ourAveragePrice,
        competitorAveragePrice,
        priceDifference,
        priceAdvantage
      },
      marketPosition: {
        marketShare: competitor.analytics?.marketShare ? Number(competitor.analytics.marketShare) : 0,
        competitiveAdvantage: competitor.analytics?.competitiveAdvantage || [],
        weaknesses: competitor.analytics?.weaknesses || []
      },
      recommendations
    }
  }

  /**
   * Generate comprehensive market intelligence report
   */
  static async generateMarketIntelligenceReport(categoryId?: string): Promise<MarketIntelligenceReport> {
    const whereClause = categoryId ? { categoryId } : {}

    // Get market overview
    const [competitors, competitorProducts, trends] = await Promise.all([
      prisma.competitor.count({ where: { isActive: true } }),
      prisma.competitorProduct.findMany({
        include: {
          competitor: true
        }
      }),
      prisma.marketTrend.findMany({
        where: {
          ...whereClause,
          isActive: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ])

    const prices = competitorProducts.map(p => Number(p.currentPrice))
    const averageMarketPrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0

    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    }

    // Analyze market opportunities and threats
    const opportunities = await this.identifyMarketOpportunities(competitorProducts)
    const threats = await this.identifyMarketThreats(competitorProducts)
    const keyInsights = await this.generateKeyInsights(competitorProducts, trends)

    return {
      overview: {
        totalCompetitors: competitors,
        totalProducts: competitorProducts.length,
        averageMarketPrice,
        priceRange
      },
      trends,
      opportunities,
      threats,
      keyInsights
    }
  }

  /**
   * Monitor competitor prices and detect changes
   */
  static async monitorCompetitorPrices(): Promise<void> {
    const competitors = await prisma.competitor.findMany({
      where: { isActive: true },
      include: {
        products: true
      }
    })

    for (const competitor of competitors) {
      for (const product of competitor.products) {
        try {
          // In a real implementation, this would scrape the competitor's website
          // For now, we'll simulate price changes
          const newPrice = await this.fetchCompetitorPrice(product.url)
          
          if (newPrice && newPrice !== Number(product.currentPrice)) {
            // Update product price
            await prisma.competitorProduct.update({
              where: { id: product.id },
              data: {
                currentPrice: newPrice,
                lastChecked: new Date()
              }
            })

            // Record price history
            await prisma.competitorPriceHistory.create({
              data: {
                competitorId: competitor.id,
                competitorProductId: product.id,
                price: newPrice,
                originalPrice: product.originalPrice,
                currency: product.currency,
                availability: product.availability
              }
            })

            // Generate price change intelligence
            await this.generatePriceChangeIntelligence(product, newPrice)
          }
        } catch (error) {
          console.error(`Error monitoring price for product ${product.id}:`, error)
        }
      }
    }
  }

  /**
   * Generate automated competitive intelligence insights
   */
  static async generateAutomatedIntelligence(): Promise<void> {
    // Analyze price trends
    await this.analyzePriceTrends()
    
    // Identify market opportunities
    await this.identifyNewMarketOpportunities()
    
    // Monitor competitive landscape changes
    await this.monitorCompetitiveLandscape()
  }

  private static generateCompetitorRecommendations(
    competitor: any,
    priceAdvantage: 'HIGHER' | 'LOWER' | 'SIMILAR',
    priceDifference: number
  ): string[] {
    const recommendations: string[] = []

    if (priceAdvantage === 'HIGHER') {
      recommendations.push(`${competitor.name} prices are ${Math.abs(priceDifference).toFixed(1)}% higher - consider highlighting our price advantage`)
      recommendations.push('Emphasize value proposition in marketing materials')
    } else if (priceAdvantage === 'LOWER') {
      recommendations.push(`${competitor.name} prices are ${Math.abs(priceDifference).toFixed(1)}% lower - review pricing strategy`)
      recommendations.push('Focus on quality and unique features to justify premium pricing')
    }

    recommendations.push('Monitor competitor product launches and feature updates')
    recommendations.push('Track competitor marketing campaigns and messaging')

    return recommendations
  }

  private static async updateCompetitorAnalytics(competitorId: string, data: any): Promise<void> {
    await prisma.competitorAnalytics.upsert({
      where: { competitorId },
      update: {
        ...data,
        lastAnalyzed: new Date()
      },
      create: {
        competitorId,
        ...data,
        lastAnalyzed: new Date()
      }
    })
  }

  private static async identifyMarketOpportunities(products: any[]): Promise<string[]> {
    const opportunities: string[] = []

    // Analyze price gaps
    const priceGaps = this.findPriceGaps(products)
    if (priceGaps.length > 0) {
      opportunities.push(`Price gaps identified in ${priceGaps.join(', ')} segments`)
    }

    // Identify underserved categories
    const categoryDistribution = this.analyzeCategoryDistribution(products)
    opportunities.push('Expand into underrepresented product categories')

    return opportunities
  }

  private static async identifyMarketThreats(products: any[]): Promise<string[]> {
    const threats: string[] = []

    // Identify aggressive pricing
    const aggressivePricers = products.filter(p => Number(p.currentPrice) < 50) // Example threshold
    if (aggressivePricers.length > 0) {
      threats.push('Aggressive pricing detected from multiple competitors')
    }

    // Market saturation analysis
    if (products.length > 100) { // Example threshold
      threats.push('High market saturation - increased competition expected')
    }

    return threats
  }

  private static async generateKeyInsights(products: any[], trends: MarketTrend[]): Promise<string[]> {
    const insights: string[] = []

    // Price trend insights
    const avgPrice = products.reduce((sum, p) => sum + Number(p.currentPrice), 0) / products.length
    insights.push(`Average competitor price: $${avgPrice.toFixed(2)}`)

    // Trend insights
    const highImpactTrends = trends.filter(t => t.impact === 'HIGH')
    if (highImpactTrends.length > 0) {
      insights.push(`${highImpactTrends.length} high-impact market trends identified`)
    }

    return insights
  }

  private static async fetchCompetitorPrice(url: string): Promise<number | null> {
    // In a real implementation, this would use web scraping
    // For demo purposes, simulate price changes
    return Math.random() > 0.8 ? Math.random() * 100 + 50 : null
  }

  private static async generatePriceChangeIntelligence(product: any, newPrice: number): Promise<void> {
    const priceChange = ((newPrice - Number(product.currentPrice)) / Number(product.currentPrice)) * 100

    if (Math.abs(priceChange) > 10) { // Significant price change
      await prisma.competitiveIntelligence.create({
        data: {
          title: `Significant Price Change Detected`,
          summary: `${product.name} price changed by ${priceChange.toFixed(1)}%`,
          analysisType: 'PRICE_ANALYSIS',
          keyFindings: [
            `Price changed from $${product.currentPrice} to $${newPrice}`,
            `Change percentage: ${priceChange.toFixed(1)}%`
          ],
          opportunities: priceChange > 0 ? ['Highlight our competitive pricing'] : [],
          threats: priceChange < 0 ? ['Competitor reduced prices significantly'] : [],
          recommendations: [
            'Review our pricing strategy',
            'Monitor competitor response to price change'
          ],
          dataSource: 'Automated Price Monitoring',
          confidenceLevel: 0.9,
          impactScore: Math.abs(priceChange) > 20 ? 8 : 6,
          priority: Math.abs(priceChange) > 20 ? 'HIGH' : 'MEDIUM'
        }
      })
    }
  }

  private static async analyzePriceTrends(): Promise<void> {
    // Implementation for price trend analysis
    // This would analyze historical price data and identify trends
  }

  private static async identifyNewMarketOpportunities(): Promise<void> {
    // Implementation for identifying new market opportunities
    // This would analyze market gaps and emerging trends
  }

  private static async monitorCompetitiveLandscape(): Promise<void> {
    // Implementation for monitoring competitive landscape changes
    // This would track new competitors and market changes
  }

  private static findPriceGaps(products: any[]): string[] {
    // Implementation for finding price gaps
    return []
  }

  private static analyzeCategoryDistribution(products: any[]): any {
    // Implementation for analyzing category distribution
    return {}
  }
}