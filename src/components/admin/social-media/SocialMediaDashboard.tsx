'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SchedulePostModal } from './SchedulePostModal'
import { 
  PlusIcon, 
  ShareIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface SocialMediaStats {
  totalPosts: number
  totalEngagement: number
  averageEngagement: number
  topPerformingPost: {
    id: string
    content: string
    platform: string
    engagement: number
    date: string
  }
  platformStats: {
    [key: string]: {
      posts: number
      followers: number
      engagement: number
      growthRate: number
    }
  }
}

export function SocialMediaDashboard() {
  const [stats, setStats] = useState<SocialMediaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/social-media/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching social media stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return '🐦'
      case 'facebook':
        return '📘'
      case 'linkedin':
        return '💼'
      case 'instagram':
        return '📷'
      case 'pinterest':
        return '📌'
      default:
        return '📱'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return 'bg-blue-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'linkedin':
        return 'bg-blue-700'
      case 'instagram':
        return 'bg-pink-500'
      case 'pinterest':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center">
              <ShareIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                <p className="text-xs text-gray-500">Across all platforms</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEngagement.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Likes, shares, comments</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageEngagement}</p>
                <p className="text-xs text-gray-500">Per post</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Top Platform</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.entries(stats.platformStats).reduce((a, b) => 
                    stats.platformStats[a[0]].engagement > stats.platformStats[b[0]].engagement ? a : b
                  )[0]}
                </p>
                <p className="text-xs text-gray-500">By engagement</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media</h2>
          <p className="text-gray-600">Manage your social media presence and engagement</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              // Open social media settings
              console.log('Open social media settings')
            }}
          >
            Settings
          </Button>
          <Button
            onClick={() => setShowScheduleModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Schedule Post
          </Button>
        </div>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(stats.platformStats).map(([platform, platformStats]) => (
            <Card key={platform} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${getPlatformColor(platform)} flex items-center justify-center text-white text-lg`}>
                    {getPlatformIcon(platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{platform}</h3>
                    <p className="text-sm text-gray-500">{platformStats.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <Badge className={`${platformStats.growthRate > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {platformStats.growthRate > 0 ? '+' : ''}{platformStats.growthRate}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Posts</p>
                  <p className="font-semibold text-gray-900">{platformStats.posts}</p>
                </div>
                <div>
                  <p className="text-gray-500">Engagement</p>
                  <p className="font-semibold text-gray-900">{platformStats.engagement.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // View platform details
                    console.log(`View ${platform} details`)
                  }}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Top Performing Post */}
      {stats?.topPerformingPost && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Post</h3>
          <div className="flex items-start space-x-4">
            <div className={`w-10 h-10 rounded-full ${getPlatformColor(stats.topPerformingPost.platform)} flex items-center justify-center text-white text-lg`}>
              {getPlatformIcon(stats.topPerformingPost.platform)}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 mb-2">{stats.topPerformingPost.content}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="capitalize">{stats.topPerformingPost.platform}</span>
                <span>{stats.topPerformingPost.engagement} engagements</span>
                <span>{new Date(stats.topPerformingPost.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {/* Mock recent activity */}
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
              🐦
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Posted to Twitter</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Posted</Badge>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
              📘
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Scheduled Facebook post</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm">
              💼
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Posted to LinkedIn</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Posted</Badge>
          </div>
        </div>
      </Card>

      {/* Schedule Post Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Social Media Post"
        size="lg"
      >
        <SchedulePostModal
          onClose={() => setShowScheduleModal(false)}
          onScheduled={() => {
            setShowScheduleModal(false)
            // Refresh data if needed
          }}
        />
      </Modal>
    </div>
  )
}