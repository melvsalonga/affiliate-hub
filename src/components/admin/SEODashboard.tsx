'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Globe, 
  FileText,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface SEOAudit {
  issues: string[]
  recommendations: string[]
  score: number
}

interface SEOStats {
  totalPages: number
  indexedPages: number
  avgLoadTime: number
  mobileScore: number
  desktopScore: number
}

export function SEODashboard() {
  const [audit, setAudit] = useState<SEOAudit | null>(null)
  const [stats, setStats] = useState<SEOStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [auditing, setAuditing] = useState(false)

  useEffect(() => {
    fetchSEOData()
  }, [])

  const fetchSEOData = async () => {
    try {
      setLoading(true)
      
      // Fetch SEO audit
      const auditResponse = await fetch('/api/admin/seo/audit')
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAudit(auditData.audit)
      }

      // Fetch SEO stats (mock data for now)
      setStats({
        totalPages: 150,
        indexedPages: 142,
        avgLoadTime: 2.3,
        mobileScore: 85,
        desktopScore: 92
      })
    } catch (error) {
      console.error('Error fetching SEO data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runAudit = async () => {
    setAuditing(true)
    await fetchSEOData()
    setAuditing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">SEO Dashboard</h2>
        </div>
        <div className="text-center py-8">Loading SEO data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SEO Dashboard</h2>
          <p className="text-gray-600">Monitor and optimize your site's search engine performance</p>
        </div>
        <Button 
          onClick={runAudit} 
          disabled={auditing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
          {auditing ? 'Running Audit...' : 'Run SEO Audit'}
        </Button>
      </div>

      {/* SEO Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall SEO Score</p>
              <p className={`text-3xl font-bold ${audit ? getScoreColor(audit.score) : 'text-gray-400'}`}>
                {audit ? audit.score : '--'}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${audit && audit.score >= 80 ? 'bg-green-100' : audit && audit.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <Search className={`w-6 h-6 ${audit && audit.score >= 80 ? 'text-green-600' : audit && audit.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Indexed Pages</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats ? `${stats.indexedPages}/${stats.totalPages}` : '--'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Load Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats ? `${stats.avgLoadTime}s` : '--'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mobile Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats ? stats.mobileScore : '--'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Issues and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">SEO Issues</h3>
            {audit && (
              <Badge variant={audit.issues.length > 0 ? 'destructive' : 'success'}>
                {audit.issues.length} issues
              </Badge>
            )}
          </div>
          
          {audit && audit.issues.length > 0 ? (
            <ul className="space-y-2">
              {audit.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p>No SEO issues found!</p>
            </div>
          )}
        </Card>

        {/* Recommendations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Recommendations</h3>
            {audit && (
              <Badge variant="outline">
                {audit.recommendations.length} suggestions
              </Badge>
            )}
          </div>
          
          {audit && audit.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {audit.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recommendations at this time.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick SEO Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 justify-start"
            onClick={() => window.open('/sitemap.xml', '_blank')}
          >
            <FileText className="w-4 h-4" />
            View Sitemap
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 justify-start"
            onClick={() => window.open('/robots.txt', '_blank')}
          >
            <Globe className="w-4 h-4" />
            View Robots.txt
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 justify-start"
            onClick={() => window.open('https://search.google.com/search-console', '_blank')}
          >
            <Search className="w-4 h-4" />
            Google Search Console
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        </div>
      </Card>

      {/* Performance Metrics */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Desktop Score</span>
                <span className={`font-semibold ${getScoreColor(stats.desktopScore)}`}>
                  {stats.desktopScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${stats.desktopScore >= 80 ? 'bg-green-500' : stats.desktopScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${stats.desktopScore}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Mobile Score</span>
                <span className={`font-semibold ${getScoreColor(stats.mobileScore)}`}>
                  {stats.mobileScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${stats.mobileScore >= 80 ? 'bg-green-500' : stats.mobileScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${stats.mobileScore}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}