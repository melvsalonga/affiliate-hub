import { CompetitorAnalysisService } from './competitor-analysis'
import { prisma } from '@/lib/prisma'

export class CompetitorMonitoringService {
  /**
   * Run automated competitor monitoring tasks
   * This should be called by a cron job or scheduled task
   */
  static async runAutomatedMonitoring(): Promise<void> {
    console.log('Starting automated competitor monitoring...')

    try {
      // 1. Monitor competitor prices
      await this.monitorPrices()

      // 2. Generate market intelligence
      await this.generateIntelligence()

      // 3. Update competitor analytics
      await this.updateAnalytics()

      // 4. Generate trend analysis
      await this.analyzeTrends()

      console.log('Automated competitor monitoring completed successfully')
    } catch (error) {
      console.error('Error in automated competitor monitoring:', error)
      throw error
    }
  }

  /**
   * Monitor competitor prices and detect significant changes
   */
  private static async monitorPrices(): Promise<void> {
    console.log('Monitoring competitor prices...')
    
    try {
      await CompetitorAnalysisService.monitorCompetitorPrices()
      
      // Log monitoring activity
      await this.logMonitoringActivity('PRICE_MONITORING', 'Completed price monitoring for all competitors')
    } catch (error) {
      console.error('Error monitoring prices:', error)
      await this.logMonitoringActivity('PRICE_MONITORING', `Error: ${error.message}`, 'ERROR')
    }
  }

  /**
   * Generate automated competitive intelligence
   */
  private static async generateIntelligence(): Promise<void> {
    console.log('Generating competitive intelligence...')
    
    try {
      await CompetitorAnalysisService.generateAutomatedIntelligence()
      
      // Log intelligence generation
      await this.logMonitoringActivity('INTELLIGENCE_GENERATION', 'Generated automated competitive intelligence')
    } catch (error) {
      console.error('Error generating intelligence:', error)
      await this.logMonitoringActivity('INTELLIGENCE_GENERATION', `Error: ${error.message}`, 'ERROR')
    }
  }

  /**
   * Update competitor analytics and market share calculations
   */
  private static async updateAnalytics(): Promise<void> {
    console.log('Updating competitor analytics...')
    
    try {
      const competitors = await prisma.competitor.findMany({
        where: { isActive: true },
        include: {
          products: true
        }
      })

      for (const competitor of competitors) {
        const products = competitor.products
        const totalProducts = products.length
        const prices = products.map(p => Number(p.currentPrice))
        const averagePrice = prices.length > 0 
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
          : 0

        // Calculate market share (simplified - in reality this would be more complex)
        const totalMarketProducts = await prisma.competitorProduct.count()
        const marketShare = totalMarketProducts > 0 ? (totalProducts / totalMarketProducts) : 0

        // Update or create analytics
        await prisma.competitorAnalytics.upsert({
          where: { competitorId: competitor.id },
          update: {
            totalProducts,
            averagePrice,
            priceRange: {
              min: prices.length > 0 ? Math.min(...prices) : 0,
              max: prices.length > 0 ? Math.max(...prices) : 0
            },
            marketShare,
            lastAnalyzed: new Date()
          },
          create: {
            competitorId: competitor.id,
            totalProducts,
            averagePrice,
            priceRange: {
              min: prices.length > 0 ? Math.min(...prices) : 0,
              max: prices.length > 0 ? Math.max(...prices) : 0
            },
            marketShare,
            competitiveAdvantage: [],
            weaknesses: [],
            lastAnalyzed: new Date()
          }
        })
      }

      await this.logMonitoringActivity('ANALYTICS_UPDATE', `Updated analytics for ${competitors.length} competitors`)
    } catch (error) {
      console.error('Error updating analytics:', error)
      await this.logMonitoringActivity('ANALYTICS_UPDATE', `Error: ${error.message}`, 'ERROR')
    }
  }

  /**
   * Analyze market trends and generate insights
   */
  private static async analyzeTrends(): Promise<void> {
    console.log('Analyzing market trends...')
    
    try {
      // Get recent price history for trend analysis
      const priceHistory = await prisma.competitorPriceHistory.findMany({
        where: {
          recordedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          competitor: true,
          competitorProduct: true
        },
        orderBy: { recordedAt: 'asc' }
      })

      // Analyze price trends
      const priceTrends = this.analyzePriceTrends(priceHistory)
      
      // Create market trend records
      for (const trend of priceTrends) {
        await prisma.marketTrend.create({
          data: {
            trendType: 'PRICE',
            title: trend.title,
            description: trend.description,
            impact: trend.impact,
            confidence: trend.confidence,
            dataPoints: trend.dataPoints,
            insights: trend.insights,
            recommendations: trend.recommendations,
            startDate: trend.startDate,
            endDate: trend.endDate
          }
        })
      }

      await this.logMonitoringActivity('TREND_ANALYSIS', `Analyzed trends and created ${priceTrends.length} trend records`)
    } catch (error) {
      console.error('Error analyzing trends:', error)
      await this.logMonitoringActivity('TREND_ANALYSIS', `Error: ${error.message}`, 'ERROR')
    }
  }

  /**
   * Analyze price trends from historical data
   */
  private static analyzePriceTrends(priceHistory: any[]): any[] {
    const trends = []

    // Group by competitor
    const competitorGroups = priceHistory.reduce((groups, entry) => {
      const key = entry.competitorId
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(entry)
      return groups
    }, {})

    for (const [competitorId, entries] of Object.entries(competitorGroups)) {
      const sortedEntries = (entries as any[]).sort((a, b) => 
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      )

      if (sortedEntries.length < 2) continue

      const firstPrice = Number(sortedEntries[0].price)
      const lastPrice = Number(sortedEntries[sortedEntries.length - 1].price)
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100

      if (Math.abs(priceChange) > 10) { // Significant price change
        const competitor = sortedEntries[0].competitor

        trends.push({
          title: `${competitor.name} Price ${priceChange > 0 ? 'Increase' : 'Decrease'}`,
          description: `${competitor.name} has ${priceChange > 0 ? 'increased' : 'decreased'} prices by ${Math.abs(priceChange).toFixed(1)}% over the last 30 days`,
          impact: Math.abs(priceChange) > 20 ? 'HIGH' : 'MEDIUM',
          confidence: 0.85,
          dataPoints: sortedEntries.map(entry => ({
            date: entry.recordedAt,
            value: Number(entry.price)
          })),
          insights: [
            `Average price change: ${priceChange.toFixed(1)}%`,
            `Trend started: ${sortedEntries[0].recordedAt}`,
            `Most recent update: ${sortedEntries[sortedEntries.length - 1].recordedAt}`
          ],
          recommendations: priceChange > 0 
            ? ['Consider highlighting our competitive pricing', 'Monitor for customer response to price increases']
            : ['Review our pricing strategy', 'Analyze competitor cost reduction strategies'],
          startDate: sortedEntries[0].recordedAt,
          endDate: null
        })
      }
    }

    return trends
  }

  /**
   * Log monitoring activity for audit and debugging
   */
  private static async logMonitoringActivity(
    activity: string, 
    message: string, 
    level: 'INFO' | 'ERROR' = 'INFO'
  ): Promise<void> {
    try {
      // In a real implementation, you might want to store these logs in a dedicated table
      console.log(`[${level}] ${activity}: ${message}`)
      
      // You could also send notifications for errors
      if (level === 'ERROR') {
        // Send alert to administrators
        await this.sendMonitoringAlert(activity, message)
      }
    } catch (error) {
      console.error('Error logging monitoring activity:', error)
    }
  }

  /**
   * Send monitoring alerts to administrators
   */
  private static async sendMonitoringAlert(activity: string, message: string): Promise<void> {
    try {
      // In a real implementation, this would send email/slack notifications
      console.log(`ALERT: ${activity} - ${message}`)
      
      // You could integrate with your notification system here
      // await notificationService.sendAlert({
      //   title: `Competitor Monitoring Alert: ${activity}`,
      //   message,
      //   priority: 'HIGH'
      // })
    } catch (error) {
      console.error('Error sending monitoring alert:', error)
    }
  }

  /**
   * Get monitoring status and health check
   */
  static async getMonitoringStatus(): Promise<{
    isHealthy: boolean
    lastRun?: Date
    nextRun?: Date
    activeCompetitors: number
    trackedProducts: number
    recentAlerts: number
  }> {
    try {
      const [competitors, products, recentIntelligence] = await Promise.all([
        prisma.competitor.count({ where: { isActive: true } }),
        prisma.competitorProduct.count(),
        prisma.competitiveIntelligence.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ])

      return {
        isHealthy: true,
        activeCompetitors: competitors,
        trackedProducts: products,
        recentAlerts: recentIntelligence
      }
    } catch (error) {
      console.error('Error getting monitoring status:', error)
      return {
        isHealthy: false,
        activeCompetitors: 0,
        trackedProducts: 0,
        recentAlerts: 0
      }
    }
  }
}